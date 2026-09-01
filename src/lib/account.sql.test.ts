import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Self-service account deletion, held to the shape every other definer
 * function in this codebase is held to — and to one rule specific to this
 * one: it may only ever delete the caller's own row.
 */
const SQL = readFileSync(
	"supabase/migrations/0008_delete_own_account.sql",
	"utf8",
);

describe("deleting your own account", () => {
	it("only ever deletes the row auth.uid() resolves to", () => {
		/* Not just "contains auth.uid()" — the delete's own WHERE clause has to
		   be scoped by it, or a caller-any row is one dropped guard away. */
		expect(SQL).toMatch(/delete from auth\.users where id = v_user/);
		expect(SQL).toContain("v_user uuid := auth.uid()");
	});

	it("refuses to run without a session", () => {
		expect(SQL).toContain("if v_user is null then");
		expect(SQL).toContain("raise exception 'not signed in'");
	});

	it("pins the search path, like every other definer here", () => {
		const body = SQL.slice(SQL.indexOf("delete_own_account()"));

		expect(body).toContain("security definer");
		expect(body).toContain("set search_path = public");
	});

	it("keeps the function away from the anonymous key", () => {
		expect(SQL).toMatch(
			/revoke all on function public\.delete_own_account\(\) from public, anon;/,
		);
		expect(SQL).toMatch(
			/grant execute on function public\.delete_own_account\(\) to authenticated;/,
		);
	});
});
