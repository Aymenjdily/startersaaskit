/**
 * What we ask a new account, and the only place it is written down.
 *
 * The wizard renders from this, the migration's CHECK constraints are asserted
 * against it, and the answers are stored one column per question rather than as
 * a blob — the whole point is to be able to ask "how many agencies pick Next?"
 * later, and a jsonb column makes that a chore.
 *
 * Adding an option here without widening the constraint in
 * `supabase/migrations/0001_profiles.sql` would let the wizard offer an answer
 * the database rejects on save. `onboarding.sql.test.ts` fails when they drift.
 */

export const ONBOARDING_HREF = "/onboarding";

export type QuestionId =
	| "role"
	| "team_size"
	| "building"
	| "timeline"
	| "friction"
	| "framework"
	| "heard_from";

export type Question = {
	/** Doubles as the column name in `public.profiles`. */
	id: QuestionId;
	prompt: string;
	/** Why we ask, shown to the reader. Nobody owes us an answer blindly. */
	because: string;
	multiple: boolean;
	options: readonly { id: string; label: string; hint?: string }[];
};

export const QUESTIONS: readonly Question[] = [
	{
		id: "role",
		prompt: "What best describes you?",
		because: "It decides which examples we put in front of you first.",
		multiple: false,
		options: [
			{ id: "solo_founder", label: "Solo founder" },
			{ id: "startup_team", label: "On a startup team" },
			{ id: "freelancer", label: "Freelancer or consultant" },
			{ id: "agency", label: "At an agency" },
			{ id: "employee", label: "Engineer at a larger company" },
			{ id: "learning", label: "Learning or building for fun" },
		],
	},
	{
		id: "team_size",
		prompt: "How many people will touch this codebase?",
		because: "Team size changes what conventions are worth generating.",
		multiple: false,
		options: [
			{ id: "just_me", label: "Just me" },
			{ id: "2_5", label: "2–5" },
			{ id: "6_20", label: "6–20" },
			{ id: "20_plus", label: "More than 20" },
		],
	},
	{
		id: "building",
		prompt: "What are you building?",
		because: "This is the single most useful thing we can know about you.",
		multiple: false,
		options: [
			{ id: "b2b_saas", label: "A B2B SaaS product" },
			{ id: "consumer", label: "Something consumer-facing" },
			{ id: "internal", label: "An internal tool" },
			{ id: "client_work", label: "Client work" },
			{ id: "ai_app", label: "An AI app" },
			{ id: "side_project", label: "A side project" },
		],
	},
	{
		id: "timeline",
		prompt: "When do you need it running?",
		because: "It tells us whether to optimise for speed or for the long haul.",
		multiple: false,
		options: [
			{ id: "this_week", label: "This week" },
			{ id: "this_month", label: "Within a month" },
			{ id: "this_quarter", label: "This quarter" },
			{ id: "exploring", label: "Just exploring" },
		],
	},
	{
		id: "friction",
		prompt: "What usually eats the first week?",
		because: "Whatever you pick here is what we work hardest to remove.",
		multiple: true,
		options: [
			{ id: "auth", label: "Auth and sessions" },
			{ id: "billing", label: "Billing and subscriptions" },
			{ id: "database", label: "Database and schema" },
			{ id: "testing", label: "Test setup" },
			{ id: "ci_deploy", label: "CI and deploys" },
			{ id: "design_system", label: "Design system and components" },
			{ id: "emails", label: "Transactional email" },
		],
	},
	{
		id: "framework",
		prompt: "Which framework do you reach for?",
		because: "Nothing here is locked in — the generator asks again each time.",
		multiple: false,
		options: [
			{ id: "nextjs", label: "Next.js" },
			{ id: "tanstack_start", label: "TanStack Start" },
			{ id: "either", label: "Either is fine" },
			{ id: "something_else", label: "Something else" },
		],
	},
	{
		id: "heard_from",
		prompt: "How did you find us?",
		because: "It tells us where to spend the little time we have.",
		multiple: false,
		options: [
			{ id: "search", label: "Search" },
			{ id: "social", label: "X, LinkedIn, or Bluesky" },
			{ id: "video", label: "YouTube or a stream" },
			{ id: "friend", label: "Someone told me" },
			{ id: "ai_assistant", label: "An AI assistant suggested it" },
			{ id: "other", label: "Somewhere else" },
		],
	},
] as const;

/** Every answer the wizard collects, keyed by question. */
export type Answers = {
	[K in QuestionId]?: string | string[];
};

export function questionById(id: QuestionId): Question {
	const found = QUESTIONS.find((question) => question.id === id);

	if (!found) throw new Error(`No onboarding question called "${id}".`);
	return found;
}

/**
 * A question is answered when it holds a value the question actually offers.
 * A multi-select needs at least one; an empty array is not an answer, and
 * treating it as one is how a "required" step gets silently skipped.
 */
export function isAnswered(question: Question, answer: unknown): boolean {
	const allowed = new Set(question.options.map((option) => option.id));

	if (question.multiple) {
		return (
			Array.isArray(answer) &&
			answer.length > 0 &&
			answer.every((value) => allowed.has(value))
		);
	}
	return typeof answer === "string" && allowed.has(answer);
}

export function isComplete(answers: Answers): boolean {
	return QUESTIONS.every((question) =>
		isAnswered(question, answers[question.id]),
	);
}

/** Which step to open on: the first unanswered one, or the last if all are done. */
export function firstUnansweredStep(answers: Answers): number {
	const index = QUESTIONS.findIndex(
		(question) => !isAnswered(question, answers[question.id]),
	);

	return index === -1 ? QUESTIONS.length - 1 : index;
}

/**
 * The label(s) an answer resolves to, for anywhere that reads an answer back
 * rather than rendering the picker that collected it — Settings' "your
 * answers" summary is the one caller today. An id the question no longer
 * offers (a menu that has since narrowed) is dropped rather than shown raw,
 * since a stored value like `"b2b_saas"` means nothing to the person reading
 * it back.
 */
export function answerLabels(question: Question, answer: unknown): string[] {
	const given = Array.isArray(answer) ? answer : answer ? [answer] : [];

	return given
		.map((value) => question.options.find((option) => option.id === value))
		.filter((option): option is Question["options"][number] => Boolean(option))
		.map((option) => option.label);
}
