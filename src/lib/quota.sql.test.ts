import { readFileSync } from "node:fs";
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

describe("the generation quota migration", () => {
	it("spends tokens at the same limit the console promises", () => {
		expect(SQL).toContain(`generations_used < ${GENERATION_LIMIT}`);
	});

	it("says what the client says when the tokens run out", () => {
		expect(SQL).toContain(`raise exception '${QUOTA_EXHAUSTED_MESSAGE}'`);
	});

	it("pins the search path on its security definer function", () => {
		const definers = [...SQL.matchAll(/security definer([\s\S]*?)\$\$/g)];

		expect(definers.length).toBeGreaterThan(0);
		for (const [, body] of definers) {
			expect(body).toContain("set search_path = public");
		}
	});

	it("keeps the function away from the anonymous key", () => {
		expect(SQL).toMatch(
			/revoke all on function public\.create_starter\(jsonb, text\) from public, anon/,
		);
	});

	/** The one UPDATE both checks and spends — two at once cannot both pass. */
	it("checks and increments in a single statement", () => {
		expect(SQL).toMatch(
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

	it("never counts backwards", () => {
		expect(SQL).toContain("check (generations_used >= 0)");
		expect(SQL).not.toMatch(/generations_used = generations_used -/);
	});
});
