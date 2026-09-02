/**
 * The questions the generator asks, and the only place they are written
 * down for the console.
 *
 * These are not free invention. The landing page already tells visitors which
 * options exist — `SEAMS` in `swap-anything.tsx` names the framework, database,
 * ORM and auth choices, and `ANSWERS` in `how-it-works.tsx` names the
 * questions themselves. A console that offered a different menu would make the
 * storefront a lie, so `starter-questions.test.ts` asserts the two agree.
 *
 * Nothing here talks to a server yet. This is the shape of the answer the
 * generator will eventually be handed.
 */

import type { BrandIcon } from "@/components/landing/brand-icons";

export type StarterQuestionId =
	| "framework"
	| "components"
	| "database"
	| "orm"
	| "auth"
	| "billing"
	| "email"
	| "packageManager"
	| "landing"
	| "project";

export type StarterAnswers = Partial<Record<StarterQuestionId, string>>;

export type StarterOption = {
	id: string;
	label: string;
	/**
	 * The vendor's own mark, from `brand-icons.ts`. `null` where the choice is
	 * not a product — "Not yet" has no logo because it is not a thing anyone
	 * ships — and those get a neutral glyph instead of a borrowed one.
	 */
	icon: BrandIcon | null;
	/**
	 * What this choice *is*, for later questions to filter on. Tags rather than
	 * ids so that adding a database does not mean revisiting every ORM: a new
	 * Postgres host tagged `sql` is understood by Drizzle without touching it.
	 */
	tags?: readonly string[];
	/**
	 * Question id → a tag the answer to that question must carry. The landing
	 * page promises a pairing that cannot work "is never offered in the first
	 * place", and this is the mechanism behind that sentence.
	 *
	 * An unanswered question satisfies nothing, so a dependent option stays
	 * hidden until the thing it depends on has been chosen.
	 */
	requires?: Partial<Record<StarterQuestionId, string>>;
};

export type StarterQuestion = {
	id: StarterQuestionId;
	/** The short noun the landing page uses for this seam. */
	label: string;
	prompt: string;
	kind: "choice" | "text";
	options?: readonly StarterOption[];
	placeholder?: string;
	hint?: string;
	/**
	 * What a record written before this question existed should be read as.
	 *
	 * Adding a question invalidates every starter already in the database: the
	 * answers were complete when they were saved and are not complete now. That
	 * is not the reader's problem to fix, so a question that can honestly say
	 * what its absence *meant* says so here, and stored records are backfilled
	 * on the way in.
	 *
	 * Only questions with a truthful answer to "what did the old starters do?"
	 * get one. Email and billing did nothing, and `none` says exactly that.
	 * Framework has no such answer — a starter without one never existed — so it
	 * stays required and a record missing it is genuinely broken.
	 */
	whenMissing?: string;
};

export const STARTER_QUESTIONS: readonly StarterQuestion[] = [
	{
		id: "framework",
		label: "Framework",
		prompt: "Which framework should it be built on?",
		kind: "choice",
		hint: "React + Vite is a browser-only app, which rules some later answers out.",
		options: [
			/**
			 * `server` is the tag that matters most here, and it is not about
			 * preference. Next and TanStack Start run code on a server, so they can
			 * hold a database URL, a Stripe secret and a session cookie. A Vite SPA
			 * is only ever a bundle in someone's browser: anything it can read,
			 * every visitor can read. Later questions filter on this tag, which is
			 * why choosing React + Vite quietly removes Drizzle, Stripe and Resend
			 * rather than letting someone generate a project that leaks its keys.
			 */
			{
				id: "nextjs",
				label: "Next.js",
				icon: "nextdotjs",
				tags: ["nextjs", "server"],
			},
			{
				id: "tanstack_start",
				label: "TanStack Start",
				icon: "tanstack",
				tags: ["tanstack", "server"],
			},
			{
				id: "react_vite",
				label: "React + Vite",
				icon: "vite",
				tags: ["vite", "spa"],
			},
		],
	},
	{
		id: "components",
		label: "Components",
		prompt: "What should the interface be built from?",
		kind: "choice",
		options: [
			{ id: "shadcn", label: "shadcn/ui", icon: "shadcnui" },
			{ id: "mantine", label: "Mantine", icon: "mantine" },
			{ id: "chakra", label: "Chakra UI", icon: "chakraui" },
			{ id: "mui", label: "MUI", icon: "mui" },
			{ id: "heroui", label: "HeroUI", icon: "heroui" },
			/* Not a library, and deliberately offered: plenty of people want the
			   utility classes and none of the components. */
			{ id: "tailwind_only", label: "Tailwind only", icon: "tailwindcss" },
		],
	},
	{
		id: "database",
		label: "Database",
		prompt: "Where should the data live?",
		kind: "choice",
		options: [
			/* `neon` is a tag as well as an id, because Neon Auth depends on this
			   exact host rather than on Postgres generally. */
			/* Everything except Supabase speaks a wire protocol that needs a
			   server to hold the credentials, so each requires one. */
			{
				id: "neon",
				label: "Neon",
				icon: "neon",
				tags: ["sql", "postgres", "neon"],
				requires: { framework: "server" },
			},
			{
				id: "supabase",
				label: "Supabase",
				icon: "supabase",
				/* `supabase` is a tag as well as an id, because Supabase Auth
				   depends on this exact product rather than on Postgres.
				   The only option here with a browser client: row level security
				   is what protects the data, so the anon key is publishable and a
				   SPA can talk to it directly. */
				tags: ["sql", "postgres", "supabase"],
			},
			{
				id: "planetscale",
				label: "PlanetScale",
				icon: "planetscale",
				tags: ["sql", "mysql"],
				requires: { framework: "server" },
			},
			{
				id: "turso",
				label: "Turso",
				icon: "turso",
				tags: ["sql", "sqlite"],
				requires: { framework: "server" },
			},
			{
				id: "mongodb",
				label: "MongoDB",
				icon: "mongodb",
				tags: ["document"],
				requires: { framework: "server" },
			},
		],
	},
	{
		id: "orm",
		label: "ORM",
		prompt: "How should it talk to the database?",
		kind: "choice",
		hint: "Filtered by your database answer.",
		options: [
			/* Drizzle is SQL-only; Mongoose is MongoDB-only. Prisma spans both
			   databases. All three open a connection with a credential, which is
			   why all three also need a server to hold it. */
			{
				id: "drizzle",
				label: "Drizzle",
				icon: "drizzle",
				requires: { database: "sql", framework: "server" },
			},
			{
				id: "prisma",
				label: "Prisma",
				icon: "prisma",
				requires: { framework: "server" },
			},
			{
				id: "mongoose",
				label: "Mongoose",
				icon: "mongoose",
				requires: { database: "document", framework: "server" },
			},
			/**
			 * The honest answer for a browser-only app, and the reason this
			 * question is never empty: a SPA reaches Supabase through its own
			 * client over HTTP, with row level security doing the work an ORM's
			 * connection string would otherwise do. There is no ORM in the
			 * picture, and pretending otherwise would generate a project that
			 * cannot run.
			 */
			{
				id: "none",
				label: "Supabase client",
				icon: "supabase",
				requires: { framework: "spa" },
			},
		],
	},
	{
		id: "auth",
		label: "Auth",
		prompt: "How should people sign in?",
		kind: "choice",
		hint: "Some options depend on your database or framework.",
		options: [
			/* Self-hosted, which means it *is* the server: it mounts a route
			   handler and signs cookies with a secret. Neither exists in a SPA. */
			{
				id: "better_auth",
				label: "Better Auth",
				icon: "betterauth",
				requires: { framework: "server" },
			},
			/* These two are parts of their host, not libraries you can bolt on.
			   Offering Supabase Auth beside Neon would be offering a combination
			   that cannot be generated. */
			{
				id: "supabase_auth",
				label: "Supabase Auth",
				icon: "supabase",
				requires: { database: "supabase" },
			},
			/**
			 * Neon *and* Next, and the second half is the same reason as Auth0's.
			 * Neon Auth is Stack Auth: `@stackframe/react` is framework-agnostic
			 * but client-only, and the server-side user lookup lives in
			 * `@stackframe/stack` behind a `nextjs-cookie` token store. On
			 * TanStack Start that would be client-only auth on a framework with a
			 * server, unable to answer during SSR.
			 */
			{
				id: "neon_auth",
				label: "Neon Auth",
				icon: "neon",
				requires: { database: "neon", framework: "nextjs" },
			},
			/* Hosted, so they hold their own users and work with any database. */
			{ id: "clerk", label: "Clerk", icon: "clerk" },
			/**
			 * Next-only, and not by preference. `@auth0/nextjs-auth0` is the only
			 * Auth0 SDK with a server session; `@auth0/auth0-react` is a
			 * browser-side SPA library, so `currentUser()` on the server would
			 * have nothing to read. Offering it beside TanStack Start would be
			 * offering something that cannot be built.
			 */
			{
				id: "auth0",
				label: "Auth0",
				icon: "auth0",
				requires: { framework: "nextjs" },
			},
		],
	},
	{
		id: "billing",
		label: "Billing",
		prompt: "Should it come with billing wired up?",
		kind: "choice",
		whenMissing: "none",
		options: [
			/* A restricted key is still a secret, and creating a Checkout session
			   is a server call. A SPA has nowhere to put either. */
			{
				id: "stripe",
				label: "Stripe",
				icon: "stripe",
				requires: { framework: "server" },
			},
			{ id: "none", label: "Not yet", icon: null },
		],
	},
	{
		id: "email",
		label: "Email",
		prompt: "How should it send transactional email?",
		kind: "choice",
		/* Every starter generated before this question existed sent no email,
		   which is precisely what "Not yet" means. */
		whenMissing: "none",
		options: [
			/* Every one of these authenticates with an API key that can send mail
			   as you. Shipping it in a bundle is handing that away. */
			{
				id: "resend",
				label: "Resend",
				icon: "resend",
				requires: { framework: "server" },
			},
			{
				id: "mailgun",
				label: "Mailgun",
				icon: "mailgun",
				requires: { framework: "server" },
			},
			{
				id: "brevo",
				label: "Brevo",
				icon: "brevo",
				requires: { framework: "server" },
			},
			{ id: "none", label: "Not yet", icon: null },
		],
	},
	{
		id: "landing",
		label: "Landing page",
		prompt: "Should it come with a landing page?",
		kind: "choice",
		hint: "A real marketing page, with the copy in one file to replace.",
		/* Every starter generated before this question existed booted to the
		   stack list, which is what "Not yet" means. */
		whenMissing: "none",
		options: [
			{
				id: "editorial",
				label: "Editorial",
				icon: null,
			},
			{
				id: "gallery",
				label: "Gallery",
				icon: null,
			},
			{ id: "none", label: "Not yet", icon: null },
		],
	},
	{
		id: "packageManager",
		label: "Package manager",
		prompt: "Which package manager do you use?",
		kind: "choice",
		/**
		 * Every starter generated before this question was asked documented npm,
		 * because that is what the guide and the README said. `none` would be a
		 * lie here — those projects do have a package manager, and it is this one.
		 */
		whenMissing: "npm",
		options: [
			{ id: "npm", label: "npm", icon: "npm" },
			{ id: "pnpm", label: "pnpm", icon: "pnpm" },
			{ id: "yarn", label: "Yarn", icon: "yarn" },
			{ id: "bun", label: "Bun", icon: "bun" },
		],
	},
	{
		id: "project",
		label: "Project",
		prompt: "What should the repository be called?",
		kind: "text",
		placeholder: "my-app",
		hint: "Lowercase letters, numbers and dashes.",
	},
] as const;

export const QUESTION_COUNT = STARTER_QUESTIONS.length;

const NUMBER_WORDS = [
	"zero",
	"one",
	"two",
	"three",
	"four",
	"five",
	"six",
	"seven",
	"eight",
	"nine",
	"ten",
	"eleven",
	"twelve",
] as const;

/**
 * How many questions there are, spelled out, for copy that says so.
 *
 * The count used to be typed into eight places — "Answer six questions", "Six
 * answers and the repo is in your GitHub", and so on. Adding a question left
 * every one of them lying, and the only thing that caught it was a test
 * asserting the literal word. Deriving it means the page cannot disagree with
 * the wizard in the first place.
 *
 * Beyond twelve it falls back to digits, on the grounds that a wizard asking
 * thirteen questions has a bigger problem than its prose style.
 */
export const QUESTION_COUNT_WORD: string =
	NUMBER_WORDS[QUESTION_COUNT] ?? String(QUESTION_COUNT);

/** The same word where a sentence starts with it. */
export const QUESTION_COUNT_WORD_CAPITALISED =
	QUESTION_COUNT_WORD[0].toUpperCase() + QUESTION_COUNT_WORD.slice(1);

export const PROJECT_NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38})$/;

/**
 * The options open to someone given what they have answered so far. An option
 * whose requirement is not met is left out entirely rather than disabled — a
 * greyed row invites a click and then explains nothing.
 */
export function optionsFor(
	question: StarterQuestion,
	answers: StarterAnswers,
): readonly StarterOption[] {
	return (question.options ?? []).filter((option) =>
		Object.entries(option.requires ?? {}).every(([id, tag]) =>
			tagsOf(id as StarterQuestionId, answers).includes(tag),
		),
	);
}

/** The tags carried by whatever was chosen for `id`, or none if unanswered. */
function tagsOf(
	id: StarterQuestionId,
	answers: StarterAnswers,
): readonly string[] {
	const question = STARTER_QUESTIONS.find((candidate) => candidate.id === id);
	const chosen = question?.options?.find((option) => option.id === answers[id]);

	return chosen?.tags ?? [];
}

/**
 * Answers that became impossible after an earlier one changed.
 *
 * Picking Supabase, then Supabase Auth, then going back to Neon would
 * otherwise leave a selection that is no longer on offer — invisible in the
 * UI, still in the payload.
 */
export function pruneAnswers(answers: StarterAnswers): StarterAnswers {
	const kept: StarterAnswers = {};

	for (const question of STARTER_QUESTIONS) {
		const answer = answers[question.id];
		if (answer === undefined) continue;

		if (question.kind === "text") {
			kept[question.id] = answer;
			continue;
		}
		if (optionsFor(question, kept).some((option) => option.id === answer)) {
			kept[question.id] = answer;
		}
	}
	return kept;
}

/**
 * A stored answer set, read as what it meant when it was written.
 *
 * Questions get added. The moment one is, every starter already in the database
 * is missing an answer to it and stops validating — which is how a page that
 * had been working started saying "those answers do not describe a complete
 * starter" about a record nobody had touched.
 *
 * Rewriting the rows would be the other way to fix it, and is worse: it needs a
 * migration for every question ever added, and it destroys the evidence of what
 * was actually generated. Reading them forward costs one function and keeps the
 * row exactly as it was written.
 *
 * Only fills what is *absent*. An answer that is present and no longer legal —
 * Auth0 beside TanStack Start, say — is left alone to fail, because that one is
 * a real incompatibility rather than a question that did not exist yet.
 */
export function backfillAnswers(answers: StarterAnswers): StarterAnswers {
	const filled = { ...answers };

	for (const question of STARTER_QUESTIONS) {
		if (question.whenMissing === undefined) continue;
		if (filled[question.id] !== undefined) continue;

		filled[question.id] = question.whenMissing;
	}
	return filled;
}

export function isProjectNameValid(name: string): boolean {
	return PROJECT_NAME_PATTERN.test(name);
}

/** What is wrong with one answer, in words a reader can act on. */
export type AnswerProblem = {
	id: StarterQuestionId;
	/** The question's short noun, for a heading. */
	label: string;
	/** A full sentence naming the answer and what it needs. */
	problem: string;
};

/**
 * Why an answer set is not a complete starter.
 *
 * `isStarterComplete` answers yes or no, which is all the wizard needs because
 * the wizard is standing next to the question. Everywhere else — a stored
 * record opened months later, a request that skipped the wizard — the useful
 * answer names the offending choice.
 *
 * The reason this is not hypothetical: the rules get *stricter* over time. Auth0
 * was offered beside TanStack Start until it turned out `@auth0/nextjs-auth0` is
 * the only SDK of theirs with a server session. Every starter generated in the
 * meantime is still in the database, and re-validating it today fails. A reader
 * looking at one deserves to be told that, rather than "those answers do not
 * describe a complete starter".
 *
 * The requirement is spelled out from the tags themselves, so a rule added
 * later explains itself without anyone writing new prose for it.
 */
export function answerProblems(answers: StarterAnswers): AnswerProblem[] {
	const problems: AnswerProblem[] = [];

	for (const question of STARTER_QUESTIONS) {
		if (isStarterAnswered(question, answers)) continue;

		const answer = answers[question.id];
		const say = (problem: string) =>
			problems.push({ id: question.id, label: question.label, problem });

		if (question.kind === "text") {
			say(
				answer === undefined || answer === ""
					? `${question.label} is missing.`
					: `“${answer}” cannot be used as a repository name.`,
			);
			continue;
		}

		if (answer === undefined) {
			say(`${question.label} was never answered.`);
			continue;
		}

		/* Present in the catalogue but filtered out: something it depends on is
		   answered with a choice that does not satisfy it. */
		const known = question.options?.find((option) => option.id === answer);

		if (!known) {
			say(
				`${question.label} is set to “${answer}”, which is no longer offered.`,
			);
			continue;
		}

		const unmet = Object.entries(known.requires ?? {}).filter(
			([id, tag]) => !tagsOf(id as StarterQuestionId, answers).includes(tag),
		);

		if (unmet.length === 0) {
			/* Answered with something real that nothing rules out — so the only
			   way to be here is a question whose own rules changed shape. */
			say(`${known.label} can no longer be used for ${question.label}.`);
			continue;
		}

		for (const [id, tag] of unmet) {
			say(
				`${known.label} needs ${describeRequirement(id as StarterQuestionId, tag)}.`,
			);
		}
	}

	return problems;
}

/** "Framework to be Next.js", derived from which options carry the tag. */
function describeRequirement(id: StarterQuestionId, tag: string): string {
	const question = STARTER_QUESTIONS.find((candidate) => candidate.id === id);
	const satisfying = (question?.options ?? [])
		.filter((option) => option.tags?.includes(tag))
		.map((option) => option.label);

	if (satisfying.length === 0) return `a different ${question?.label ?? id}`;

	const list =
		satisfying.length === 1
			? satisfying[0]
			: `${satisfying.slice(0, -1).join(", ")} or ${satisfying.at(-1)}`;

	return `${question?.label ?? id} to be ${list}`;
}

export function isStarterAnswered(
	question: StarterQuestion,
	answers: StarterAnswers,
): boolean {
	const answer = answers[question.id];

	if (question.kind === "text") {
		return typeof answer === "string" && isProjectNameValid(answer);
	}
	return optionsFor(question, answers).some((option) => option.id === answer);
}

export function isStarterComplete(answers: StarterAnswers): boolean {
	return STARTER_QUESTIONS.every((question) =>
		isStarterAnswered(question, answers),
	);
}
