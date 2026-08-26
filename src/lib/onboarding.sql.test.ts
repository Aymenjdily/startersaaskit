import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./onboarding";

/**
 * The wizard renders from `QUESTIONS`; the database checks against the values
 * written into the migration. Nothing in TypeScript can see the second one, so
 * adding an option would compile, render, and then fail at save time with a
 * constraint violation the reader cannot act on.
 *
 * Reading the SQL back is the only check that catches that before they hit it.
 */
const MIGRATION = readFileSync(
	resolve(process.cwd(), "supabase/migrations/0001_profiles.sql"),
	"utf8",
);

/** The quoted values inside the one `check` clause guarding `column`. */
function allowedInSql(column: string): Set<string> {
	const start = MIGRATION.indexOf(`\n\t${column} text`);
	expect(start, `no column "${column}" in the migration`).toBeGreaterThan(-1);

	const clause = MIGRATION.slice(start, MIGRATION.indexOf("),", start));
	const quoted = clause.matchAll(/'([a-z0-9_]+)'/g);

	return new Set([...quoted].map((match) => match[1]));
}

describe("the profiles migration", () => {
	it.each(
		QUESTIONS.map((question) => [question.id, question] as const),
	)("constrains %s to exactly the options the wizard offers", (_id, question) => {
		const offered = question.options.map((option) => option.id).sort();

		expect([...allowedInSql(question.id)].sort()).toEqual(offered);
	});

	it("stores every question as its own column", () => {
		for (const question of QUESTIONS) {
			expect(MIGRATION).toContain(`\n\t${question.id} text`);
		}
	});

	/**
	 * Row level security is off by default on a new table, and this one is read
	 * and written by the browser with the publishable key. Without it every
	 * account's answers are readable by anyone who opens the console.
	 */
	it("turns on row level security", () => {
		expect(MIGRATION).toMatch(
			/alter table public\.profiles enable row level security/,
		);
	});

	it.each([
		"select",
		"insert",
		"update",
	])("scopes %s to the row's owner", (action) => {
		const policy = MIGRATION.slice(
			MIGRATION.indexOf(`for ${action}`),
			MIGRATION.indexOf(";", MIGRATION.indexOf(`for ${action}`)),
		);

		expect(policy).toMatch(/auth\.uid\(\) = id/);
	});

	/** Nothing may hand out a blanket policy alongside the scoped ones. */
	it("has no policy open to everyone", () => {
		expect(MIGRATION).not.toMatch(/using \(true\)|with check \(true\)/);
	});
});
