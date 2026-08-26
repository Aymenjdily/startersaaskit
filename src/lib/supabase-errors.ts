/** PostgREST's code for "that row is not there", which is a normal first visit. */
export const NO_ROW = "PGRST116";

/** PostgREST's code for "that table is not there", which is a setup step. */
export const NO_TABLE = "PGRST205";

export const MIGRATION_PATH = "supabase/migrations/0001_profiles.sql";

/**
 * What to show for a failed Supabase call.
 *
 * A missing table is the one failure whose own message actively misleads —
 * PostgREST says "Could not find the table 'public.profiles' in the schema
 * cache", which reads like a caching bug and sends people looking for a reload
 * button. It is almost always a migration that has not been run yet, and that
 * is a fix nobody can guess from the original wording.
 *
 * Every other error is passed through untouched: Supabase's own messages are
 * better than anything we would invent, and rewriting them hides real causes.
 */
export function explain(failure: { code?: string; message: string }): string {
	if (failure.code === NO_TABLE) {
		return `The database is not set up yet. Run ${MIGRATION_PATH} in the Supabase SQL editor, then reload this page.`;
	}
	return failure.message;
}
