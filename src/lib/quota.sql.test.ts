import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { QUESTIONS as ONBOARDING_QUESTIONS } from "./onboarding";
import {
	DEFAULT_GENERATION_LIMIT,
	FEEDBACK_REWARD,
	NO_FEEDBACK_MESSAGE,
	QUOTA_EXHAUSTED_MESSAGE,
	REWARD_CLAIMED_MESSAGE,
} from "./quota";

/**
 * The migration and the TypeScript have to agree, and the bypass has to stay
 * closed.
 *
 * The quota only means something if creation goes through the function that
 * spends a token. A leftover insert policy on `starters` — or a `profiles`
 * update policy, which has existed since 0001 — would be a door around it, so
 * the shape of the rule is asserted here rather than trusted to review.
 */
const SQL = readFileSync(
	"supabase/migrations/0004_generation_quota.sql",
	"utf8",
);

/**
 * The migration that actually defines `create_starter` today.
 *
 * Not always 0004. A later migration may `create or replace` it — 0005 does,
 * to fix an ambiguity that made every non-admin call throw — and once one has,
 * 0004's copy is history rather than the rule in force. Asserting against 0004
 * alone would have gone on passing while the live function said something else,
 * which is the exact shape of failure these tests exist to catch.
 */
/** The migration that adds the balance, the reward, and the column grants. */
const REWARD = readFileSync(
	"supabase/migrations/0006_feedback_reward.sql",
	"utf8",
);

const DIR = "supabase/migrations";
const DEFINES = /create or replace function public\.create_starter/;

const LIVE = (() => {
	const defining = readdirSync(DIR)
		.filter((file) => file.endsWith(".sql"))
		.sort()
		.filter((file) => DEFINES.test(readFileSync(`${DIR}/${file}`, "utf8")));

	if (defining.length === 0) throw new Error("nothing defines create_starter");

	return readFileSync(`${DIR}/${defining[defining.length - 1]}`, "utf8");
})();

describe("the generation quota migration", () => {
	/**
	 * The ceiling is a column now rather than a literal, so what has to agree
	 * is the column's default and the constant the copy is written from.
	 */
	it("spends against the account's own ceiling", () => {
		expect(LIVE).toMatch(/generations_used < generation_limit\b/);
		/* Bounded, because "default 50" contains "default 5". */
		expect(REWARD).toMatch(
			new RegExp(
				`generation_limit integer not null default ${DEFAULT_GENERATION_LIMIT}\\b`,
			),
		);
	});

	it("says what the client says when the tokens run out", () => {
		expect(LIVE).toContain(`raise exception '${QUOTA_EXHAUSTED_MESSAGE}'`);
	});

	it("pins the search path on its security definer function", () => {
		const definers = [...LIVE.matchAll(/security definer([\s\S]*?)\$\$/g)];

		expect(definers.length).toBeGreaterThan(0);
		for (const [, body] of definers) {
			expect(body).toContain("set search_path = public");
		}
	});

	it("keeps the function away from the anonymous key", () => {
		expect(LIVE).toMatch(
			/revoke all on function public\.create_starter\(jsonb, text\) from public, anon/,
		);
	});

	/** The one UPDATE both checks and spends — two at once cannot both pass. */
	it("checks and increments in a single statement", () => {
		expect(LIVE).toMatch(
			/update public\.profiles\s+set generations_used = generations_used \+ 1[\s\S]*?and generations_used < generation_limit/,
		);
	});

	/**
	 * 0002 shipped an insert policy on `starters`; left in place it is a quota
	 * bypass one PostgREST call wide. 0004 has to remove it, and nothing may
	 * bring it back.
	 */
	it("closes the direct-insert path the original migration opened", () => {
		expect(SQL).toContain(
			'drop policy if exists "starters are insertable by their owner"',
		);
		expect(SQL).not.toMatch(
			/create policy[\s\S]*?on public\.starters[\s\S]*?for insert/,
		);
	});

	/**
	 * The bug 0005 fixes, kept fixed.
	 *
	 * `returns table (id uuid, project text)` declares PL/pgSQL variables named
	 * after columns. An `on conflict (id)` target is substituted into, so `id`
	 * matched both and Postgres raised 42702 at runtime — after 0004 had
	 * applied perfectly cleanly. Every non-admin generation failed.
	 *
	 * Either the pragma or a qualified target keeps it unambiguous; what must
	 * not happen is a bare `on conflict (id)` with neither.
	 */
	it("leaves no ambiguous column reference for plpgsql to refuse", () => {
		const risky = /on conflict \(\s*id\s*\)/.test(LIVE);
		/* Anchored to a line of its own. The migration explains the pragma in a
		   comment directly above it, and a plain substring test was satisfied by
		   that prose after the pragma itself had been deleted. */
		const guarded = /^#variable_conflict use_column/m.test(LIVE);

		expect(risky && !guarded).toBe(false);
	});

	it("never counts backwards", () => {
		expect(SQL).toContain("check (generations_used >= 0)");
		expect(SQL).not.toMatch(/generations_used = generations_used -/);
	});
});

/**
 * The feedback reward, which is the only thing that raises an account's
 * ceiling. Every condition it enforces is one a forged request would otherwise
 * get for free, so each is pinned here.
 */
describe("the feedback reward", () => {
	it("pays what the console offers", () => {
		/* Bounded, because "+ 100" contains "+ 10". */
		expect(REWARD).toMatch(
			new RegExp(`generation_limit \\+ ${FEEDBACK_REWARD}\\b`),
		);
	});

	/* Without this it is a refund button: file, claim, file, claim. */
	it("can only be claimed once", () => {
		expect(REWARD).toContain("feedback_reward_at is null");
		expect(REWARD).toContain("feedback_reward_at = now()");
		expect(REWARD).toContain(`raise exception '${REWARD_CLAIMED_MESSAGE}'`);
	});

	/* The claim and the stamp are one UPDATE, so two requests racing cannot
	   both find it unclaimed. */
	it("stamps and pays in a single statement", () => {
		const update = REWARD.match(
			/update public\.profiles\s+set generation_limit[\s\S]*?;/,
		);

		expect(update).not.toBeNull();
		expect(update?.[0]).toContain("feedback_reward_at = now()");
		expect(update?.[0]).toContain("feedback_reward_at is null");
	});

	it("refuses to pay for feedback nobody sent", () => {
		expect(REWARD).toContain("from public.bug_reports");
		expect(REWARD).toContain(`raise exception '${NO_FEEDBACK_MESSAGE}'`);
	});

	it("keeps itself away from the anonymous key", () => {
		expect(REWARD).toMatch(
			/revoke all on function public\.claim_feedback_reward\(\) from public, anon;/,
		);
		expect(REWARD).toMatch(
			/grant execute on function public\.claim_feedback_reward\(\) to authenticated;/,
		);
	});

	it("pins the search path, like every other definer here", () => {
		const body = REWARD.slice(REWARD.indexOf("claim_feedback_reward()"));

		expect(body).toContain("security definer");
		expect(body).toContain("set search_path = public");
	});
});

/**
 * The column privileges that make the balance mean anything.
 *
 * RLS chooses rows, not columns, and `authenticated` held UPDATE on all of
 * `profiles` — so the owner policy from 0001 let any browser reset its own
 * `generations_used`. These assert the grant is narrowed and stays narrow.
 */
describe("what a browser may write to its own profile", () => {
	const GRANTED = (() => {
		const clause = REWARD.match(
			/grant update \(([\s\S]*?)\) on public\.profiles/,
		);
		return (clause?.[1] ?? "")
			.split(",")
			.map((one) => one.trim())
			.filter(Boolean);
	})();

	it("takes the blanket grant away first", () => {
		expect(REWARD).toMatch(
			/revoke insert, update on public\.profiles from authenticated;/,
		);
	});

	it("finds the narrowed grant", () => {
		expect(GRANTED.length).toBeGreaterThan(3);
	});

	it.each([
		"generations_used",
		"generation_limit",
		"feedback_reward_at",
	])("never lets the client write %s", (column) => {
		expect(GRANTED).not.toContain(column);
	});

	/**
	 * The other direction: the onboarding wizard upserts every question's
	 * column, so a question added without widening this grant would break
	 * onboarding with a permission error rather than a missing column.
	 */
	it("covers every column the onboarding wizard writes", () => {
		for (const question of ONBOARDING_QUESTIONS) {
			expect(GRANTED).toContain(question.id);
		}
		for (const column of ["id", "display_name", "notes", "onboarded_at"]) {
			expect(GRANTED).toContain(column);
		}
	});
});
