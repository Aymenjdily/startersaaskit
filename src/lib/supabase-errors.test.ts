import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { explain, MIGRATION_PATH, NO_ROW, NO_TABLE } from "./supabase-errors";

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
});
