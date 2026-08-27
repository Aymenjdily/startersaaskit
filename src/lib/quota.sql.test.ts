import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GENERATION_LIMIT, QUOTA_EXHAUSTED_MESSAGE } from "./quota";

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
	it("spends tokens at the same limit the console promises", () => {
		/* Bounded, because `toContain` is a substring test and "< 50" contains
		   "< 5" — raising the limit tenfold would have passed silently. */
		expect(LIVE).toMatch(
			new RegExp(`generations_used < ${GENERATION_LIMIT}\\b`),
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
			/update public\.profiles\s+set generations_used = generations_used \+ 1[\s\S]*?and generations_used < \d+/,
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
