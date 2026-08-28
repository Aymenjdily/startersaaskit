/** PostgREST's code for "that row is not there", which is a normal first visit. */
export const NO_ROW = "PGRST116";

/** PostgREST's code for "that table is not there", which is a setup step. */
export const NO_TABLE = "PGRST205";

/**
 * Postgres' code for "that column is not there", which is also a setup step —
 * a table created by an early migration and widened by a later one that has
 * not been run.
 */
export const NO_COLUMN = "42703";

export const MIGRATION_PATH = "supabase/migrations/0001_profiles.sql";

/** Where the rest of them live, for a database that is merely behind. */
export const MIGRATIONS_DIR = "supabase/migrations";

/**
 * What to show for a failed Supabase call.
 *
 * A missing table is the one failure whose own message actively misleads —
 * PostgREST says "Could not find the table 'public.profiles' in the schema
 * cache", which reads like a caching bug and sends people looking for a reload
 * button. It is almost always a migration that has not been run yet, and that
 * is a fix nobody can guess from the original wording.
 *
 * A missing column is the same failure one migration later: the table is there,
 * so the "not set up" wording above would be wrong, but "column
 * profiles.generation_limit does not exist" still leaves the reader guessing
 * which file to run. It is worth naming the folder.
 *
 * Every other error is passed through untouched: Supabase's own messages are
 * better than anything we would invent, and rewriting them hides real causes.
 */
export function explain(failure: { code?: string; message: string }): string {
	if (failure.code === NO_TABLE) {
		return `The database is not set up yet. Run ${MIGRATION_PATH} in the Supabase SQL editor, then reload this page.`;
	}
	if (failure.code === NO_COLUMN) {
		return `The database is behind the app — ${failure.message}. Run the outstanding files in ${MIGRATIONS_DIR} in the Supabase SQL editor, then reload this page.`;
	}
	return failure.message;
}
