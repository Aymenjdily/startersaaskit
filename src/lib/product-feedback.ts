import { getSupabase } from "@/lib/supabase";
import { explain } from "@/lib/supabase-errors";

/**
 * Product feedback: what somebody thinks, as opposed to what is broken.
 *
 * Separate from `feedback.ts`, which files bug reports. The two look similar
 * from a distance and behave differently in every way that matters — a defect
 * has a lifecycle and gets closed, an opinion has a date and a rating and
 * never does.
 */

/** The limits, duplicated from the check constraints in 0007 on purpose. */
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;
export const BUILDING_MAX = 300;

/** The scale, low to high. Bounded in the database as `between 1 and 5`. */
export const RATINGS = [1, 2, 3, 4, 5] as const;
export type Rating = (typeof RATINGS)[number];

/** What each point on the scale means, so the number is not asked cold. */
export const RATING_LABELS: Record<Rating, string> = {
	1: "Not useful",
	2: "Some use",
	3: "Useful",
	4: "Very useful",
	5: "Exactly what I needed",
};

export type ProductFeedback = {
	id: string;
	user_id: string | null;
	rating: Rating;
	message: string;
	building: string | null;
	path: string | null;
	user_agent: string | null;
	created_at: string;
};

const COLUMNS =
	"id, user_id, rating, message, building, path, user_agent, created_at";

/** What is wrong with a message, or nothing if it is fine. */
export function messageProblem(message: string): string | null {
	const trimmed = message.trim();

	if (trimmed.length < MESSAGE_MIN) {
		return `A sentence or two — at least ${MESSAGE_MIN} characters.`;
	}
	if (trimmed.length > MESSAGE_MAX) {
		return `Keep it under ${MESSAGE_MAX} characters.`;
	}
	return null;
}

/**
 * Leaves feedback.
 *
 * `path` and `user_agent` are read here rather than passed in, for the same
 * reason a bug report captures them: they are the two questions nobody answers
 * accurately about themselves.
 */
export async function leaveFeedback(input: {
	rating: Rating;
	message: string;
	building?: string;
}): Promise<void> {
	const problem = messageProblem(input.message);

	if (problem) throw new Error(problem);

	const supabase = getSupabase();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	/* The insert policy checks `auth.uid() = user_id`, so a missing session is
	   a row the database will refuse. Saying so here beats surfacing that as a
	   policy violation. */
	if (!user) throw new Error("You need to be signed in to leave feedback.");

	const building = input.building?.trim();

	const { error } = await supabase.from("product_feedback").insert({
		building: building || null,
		message: input.message.trim(),
		path: window.location.pathname,
		rating: input.rating,
		user_agent: window.navigator.userAgent,
		user_id: user.id,
	});

	if (error) throw new Error(explain(error));
}

/**
 * Everything anyone has left, newest first.
 *
 * Scoped by policy rather than by a filter here: an admin sees all of it, and
 * anyone else sees only their own.
 */
export async function listFeedback(): Promise<ProductFeedback[]> {
	const { data, error } = await getSupabase()
		.from("product_feedback")
		.select(COLUMNS)
		.order("created_at", { ascending: false });

	if (error) throw new Error(explain(error));

	return (data ?? []) as ProductFeedback[];
}
