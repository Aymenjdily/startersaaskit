import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
	DETAIL_MAX,
	REPORT_KINDS,
	REPORT_STATUSES,
	SUMMARY_MAX,
	SUMMARY_MIN,
} from "./feedback";

/**
 * The migration and the TypeScript have to agree.
 *
 * Every value below is written down twice — once as a check constraint and once
 * as a union — and the failure when they drift is silent in the worst way: the
 * form offers a choice the database rejects, and the person filing a bug report
 * gets a constraint violation for their trouble.
 *
 * The SQL is the rule. These tests read it and hold the TypeScript to it.
 */
const SQL = readFileSync("supabase/migrations/0003_feedback.sql", "utf8");

/**
 * The values inside a `check (col in ('a', 'b'))`, in order.
 *
 * Tolerant of a newline between the column and its constraint — `status`
 * carries a default, so its check wraps onto the next line, and a line-bound
 * pattern found nothing rather than failing for a reason anyone could act on.
 */
function allowed(column: string): string[] {
	const match = SQL.match(
		new RegExp(`${column}\\s[\\s\\S]*?check \\(${column} in \\(([^)]*)\\)`),
	);

	if (!match?.[1]) throw new Error(`no check constraint for "${column}"`);

	return [...match[1].matchAll(/'([^']+)'/g)].map((one) => one[1] as string);
}

describe("the feedback migration", () => {
	it("allows exactly the report kinds the app offers", () => {
		expect(allowed("kind").sort()).toEqual([...REPORT_KINDS].sort());
	});

	it("allows exactly the statuses the admin view can set", () => {
		expect(allowed("status").sort()).toEqual([...REPORT_STATUSES].sort());
	});

	it("bounds the summary at the same length the form does", () => {
		expect(SQL).toContain(
			`char_length(trim(summary)) between ${SUMMARY_MIN} and ${SUMMARY_MAX}`,
		);
	});

	it("bounds the detail at the same length the form does", () => {
		expect(SQL).toContain(`char_length(detail) <= ${DETAIL_MAX}`);
	});

	/**
	 * The security design, asserted rather than trusted to review.
	 *
	 * `admins` is the reason an ordinary account cannot read every bug report or
	 * every user. If it ever gains a write policy, any signed-in browser can
	 * make itself an admin — so the absence of one is worth a test.
	 */
	describe("the admin role", () => {
		it("locks every table it adds", () => {
			for (const table of ["admins", "bug_reports"]) {
				expect(SQL).toContain(
					`alter table public.${table} enable row level security`,
				);
			}
		});

		it("lets nobody write to the admins table", () => {
			const policies = [
				...SQL.matchAll(/create policy[^;]*?on public\.admins[^;]*;/gs),
			];

			expect(policies.length).toBeGreaterThan(0);
			for (const [policy] of policies) {
				expect(policy).toMatch(/for select/);
			}
		});

		/** A definer function on an unpinned `search_path` runs the caller's tables. */
		it("pins the search path on every security definer function", () => {
			const definers = [...SQL.matchAll(/security definer([\s\S]*?)\$\$/g)];

			expect(definers.length).toBeGreaterThan(1);
			for (const [, body] of definers) {
				expect(body).toContain("set search_path = public");
			}
		});

		it("refuses the user list to anyone who is not an admin", () => {
			expect(SQL).toMatch(/if not public\.is_admin\(\)[\s\S]*?raise exception/);
		});

		it("keeps the user list away from the anonymous key", () => {
			expect(SQL).toContain(
				"revoke all on function public.admin_user_rows() from public, anon",
			);
		});

		/** Reports outlive the accounts that filed them. */
		it("keeps a report when its author is deleted", () => {
			expect(SQL).toContain(
				"user_id uuid references auth.users on delete set null",
			);
		});
	});
});
