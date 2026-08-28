import { getSupabase } from "@/lib/supabase";

/**
 * The allowance a new account starts with, duplicated from the `default 5` on
 * `profiles.generation_limit` in `0006_feedback_reward.sql`.
 *
 * Postgres is the rule — `create_starter` spends the token atomically against
 * that account's own ceiling and cannot be talked out of it. This constant is
 * the courtesy: the copy on the marketing and legal pages can say what an
 * account gets without a round trip. `quota.sql.test.ts` fails if the two
 * disagree.
 */
export const DEFAULT_GENERATION_LIMIT = 5;

/**
 * What leaving feedback is worth, from the same migration.
 *
 * Once per account, not once per report. See the function's own comment.
 */
export const FEEDBACK_REWARD = 10;

/** What the quota check says when it refuses, verbatim from the migration. */
export const QUOTA_EXHAUSTED_MESSAGE = "generation quota exhausted";

/** What `claim_feedback_reward` says when the reward is already spent. */
export const REWARD_CLAIMED_MESSAGE = "reward already claimed";

/** What it says when there is no report to pay for. */
export const NO_FEEDBACK_MESSAGE = "no feedback to reward";

export type Quota = {
	/** Generations spent. */
	used: number;
	/** This account's ceiling, which the reward raises. */
	limit: number;
	/** Whether the feedback reward has already been taken. */
	rewarded: boolean;
};

/** What is left to spend, never below zero. */
export function remaining(quota: Quota): number {
	return Math.max(0, quota.limit - quota.used);
}

/**
 * This account's balance, or `null` when it could not be read — the console
 * shows nothing rather than claim a wrong number.
 *
 * Read through the owner-only policy on `profiles`, so there is no filter here:
 * the policy is what scopes it.
 */
export async function generationQuota(): Promise<Quota | null> {
	const { data, error } = await getSupabase()
		.from("profiles")
		.select("generations_used, generation_limit, feedback_reward_at")
		.maybeSingle();

	if (error) return null;

	/* No row yet means an account that skipped onboarding: nothing spent, and
	   the column defaults are what it will get when the row is written. */
	return {
		used: (data?.generations_used as number | undefined) ?? 0,
		limit:
			(data?.generation_limit as number | undefined) ??
			DEFAULT_GENERATION_LIMIT,
		rewarded: Boolean(data?.feedback_reward_at),
	};
}

/**
 * Takes the feedback reward, returning the account's new ceiling.
 *
 * Every condition is the database's to check — that there is a session, that a
 * report exists, that it has not already been claimed — so this only has to
 * translate the refusals into something a reader can act on.
 */
export async function claimFeedbackReward(): Promise<number> {
	const { data, error } = await getSupabase().rpc("claim_feedback_reward");

	if (error) {
		if (error.message.includes(REWARD_CLAIMED_MESSAGE)) {
			throw new Error("You have already claimed that one.");
		}
		if (error.message.includes(NO_FEEDBACK_MESSAGE)) {
			throw new Error("Send us the feedback first, then claim it.");
		}
		throw new Error("Could not add those generations.");
	}

	return data as number;
}
