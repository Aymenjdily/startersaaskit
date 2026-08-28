import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	explain,
	MIGRATION_PATH,
	MIGRATIONS_DIR,
	NO_COLUMN,
	NO_ROW,
	NO_TABLE,
} from "./supabase-errors";

describe("explain", () => {
	/**
	 * The real response, copied from a live request against a project where the
	 * migration had not been run. Its wording sends people looking for a cache
	 * to clear; the fix is a SQL file nobody would guess at from this text.
	 */
	it("turns a missing table into the step that fixes it", () => {
		const message = explain({
			code: NO_TABLE,
			message: "Could not find the table 'public.profiles' in the schema cache",
		});

		expect(message).toContain(MIGRATION_PATH);
		expect(message).not.toContain("schema cache");
	});

	it("leaves every other message alone", () => {
		expect(
			explain({
				code: "42501",
				message: "new row violates row-level security",
			}),
		).toBe("new row violates row-level security");
	});

	it("copes with an error carrying no code", () => {
		expect(explain({ message: "Failed to fetch" })).toBe("Failed to fetch");
	});

	/** A rewritten message pointing at a file that is not there is worse than none. */
	it("names a migration that exists on disk", () => {
		expect(existsSync(resolve(process.cwd(), MIGRATION_PATH))).toBe(true);
	});

	it("does not confuse a missing row with a missing table", () => {
		expect(NO_ROW).not.toBe(NO_TABLE);
	});

	/**
	 * A database one migration behind.
	 *
	 * "column profiles.generation_limit does not exist" is accurate and useless:
	 * it names the column and not the fix. This happened for real — the balance
	 * panel read a column that 0006 adds, against a database still on 0005, and
	 * rendered an empty space.
	 */
	describe("a column the app has and the database does not", () => {
		const failure = {
			code: NO_COLUMN,
			message: "column profiles.generation_limit does not exist",
		};

		it("keeps the original wording, which says which column", () => {
			expect(explain(failure)).toContain("generation_limit");
		});

		it("adds the part the reader cannot guess", () => {
			expect(explain(failure)).toContain(MIGRATIONS_DIR);
		});

		it("names a directory that exists on disk", () => {
			expect(existsSync(resolve(process.cwd(), MIGRATIONS_DIR))).toBe(true);
		});

		/* The table is there, so the 0001 wording would send them to a file they
		   have already run. */
		it("does not claim the database is unset", () => {
			expect(explain(failure)).not.toContain(MIGRATION_PATH);
		});
	});
});
