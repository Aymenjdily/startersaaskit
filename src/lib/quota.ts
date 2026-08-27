import { getSupabase } from "@/lib/supabase";

/**
 * How many starters an account may generate, duplicated from
 * `supabase/migrations/0004_generation_quota.sql` on purpose.
 *
 * Postgres is the rule — the `create_starter` function spends the token
 * atomically and cannot be talked out of it. This constant is the courtesy:
 * the console says "3 of 5 left" before anyone clicks generate rather than
 * after. `quota.sql.test.ts` fails if the two disagree.
 */
export const GENERATION_LIMIT = 5;

/** What the quota check says when it refuses, verbatim from the migration. */
export const QUOTA_EXHAUSTED_MESSAGE = "generation quota exhausted";

/**
 * How many generations this account has spent. `null` when the count could
 * not be read — the console shows nothing rather than claim a wrong number.
 *
 * Read through the owner-only policy on `profiles`, so there is no filter
 * here: the policy is what scopes it.
 */
export async function generationsUsed(): Promise<number | null> {
	const { data, error } = await getSupabase()
		.from("profiles")
		.select("generations_used")
		.maybeSingle();

	if (error) return null;

	/* No row yet means an account that skipped onboarding — nothing spent. */
	return (data?.generations_used as number | undefined) ?? 0;
}
