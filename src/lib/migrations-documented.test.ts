import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The README lists every migration.
 *
 * It listed 0001 to 0003. `0004_generation_quota.sql` was written, committed,
 * and never mentioned — so it was never run against production, and every
 * generation there failed with "Built it, but could not save the record":
 * `create_starter()` did not exist, and 0004 is also what drops the direct
 * insert policy, so there was no fallback path either.
 *
 * Nothing could have caught that. The migration was correct, its own SQL tests
 * passed, and the app was right to call the function. The only defect was a
 * list in a document, and a document is exactly what nobody diffs against the
 * filesystem. So this does.
 */

const DIR = "supabase/migrations";
const README = readFileSync("README.md", "utf8");

const MIGRATIONS = readdirSync(DIR)
	.filter((file) => file.endsWith(".sql"))
	.sort();

describe("the setup instructions", () => {
	it("finds migrations to check", () => {
		/* Without this the assertion below passes on an empty directory. */
		expect(MIGRATIONS.length).toBeGreaterThan(3);
	});

	it.each(MIGRATIONS)("README tells the reader to run %s", (file) => {
		expect(README).toContain(`${DIR}/${file}`);
	});

	/**
	 * The reverse direction: a migration renamed or deleted leaves the README
	 * naming a file that no longer exists, which sends the reader looking for
	 * it. Cheap to check while the list is already in hand.
	 */
	it("names no migration that is not there", () => {
		const listed = [...README.matchAll(/supabase\/migrations\/([\w.-]+\.sql)/g)]
			.map(([, file]) => file)
			.filter((file, at, all) => all.indexOf(file) === at);

		expect(listed.sort()).toEqual(MIGRATIONS);
	});
});
