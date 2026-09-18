import { createServerFn } from "@tanstack/react-start";
import { buildStarter } from "@/lib/generate/build-starter";
import { type TreeNode, toFileTree } from "@/lib/generate/file-tree";
import {
	isProjectNameValid,
	optionsFor,
	pruneAnswers,
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";

/**
 * The generator, run on the server so the hero can show its real output.
 *
 * ## Why this is not just called in the component
 *
 * `buildStarter` is a pure function and would run perfectly well in a browser.
 * It also pulls in every template string the generator owns — 412KB of source
 * for three frameworks, five auth providers and a landing page — which is more
 * than the whole rest of this site. Importing it from a client component puts
 * all of that in the bundle to draw a file tree.
 *
 * `createServerFn` keeps it on the server. The route calls this once, the
 * result is serialised into the page with the rest of the HTML, and the
 * browser gets a few kilobytes of file paths instead of the machine that
 * produced them.
 *
 * ## Every combination at once, rather than one per click
 *
 * There are only a handful, and a round trip per toggle would put a spinner in
 * front of the one interaction the page is built around. Computing them all
 * costs milliseconds here and makes the panel instant there.
 */

/** What the hero lets a visitor change. Everything else is held at a default. */
const HERO_QUESTIONS = ["framework", "database"] as const;

/**
 * The answers the preview holds fixed.
 *
 * Chosen to be the least surprising middle of the road rather than the most
 * impressive: no billing, no email, no landing page. The panel is showing the
 * *shape* of a repo, and a visitor toggling frameworks should see the framework
 * change, not a hundred extra files arriving from some other answer.
 */
const HELD: StarterAnswers = {
	components: "shadcn",
	billing: "none",
	email: "none",
	jobs: "none",
	landing: "none",
	packageManager: "pnpm",
	project: "my-app",
};

export type StarterPreview = {
	framework: string;
	database: string;
	tree: TreeNode[];
	/** Counted from the generated paths, never typed by hand. */
	files: number;
	tests: number;
	/**
	 * One file, shipped with the page so the viewer has something to show
	 * before anyone clicks. Without it the panel opens on an empty pane and the
	 * first impression of the feature is a blank rectangle.
	 */
	opening: StarterFile;
};

export type StarterFile = { path: string; source: string };

/** `nextjs:neon` — the key a component looks up without rebuilding anything. */
export function previewKey(framework: string, database: string): string {
	return `${framework}:${database}`;
}

/**
 * Fills in every question the hero does not ask.
 *
 * Walks the questions in order and takes the first option still legal given
 * what has been chosen so far — which is exactly what the wizard does, through
 * the same `optionsFor`. Hand-written rules were the first attempt and were
 * wrong within a minute: Supabase on a server framework still needs an ORM,
 * because the "Supabase client" option is a SPA-only answer. Deriving it means
 * a rule added to `starter-questions.ts` is honoured here for free.
 */
function completeAnswers(framework: string, database: string): StarterAnswers {
	return sanitiseAnswers({ framework, database, ...HELD });
}

/**
 * Any answer set, reduced to one this generator will actually build.
 *
 * The hero asks two questions and fills in the rest. `/build` lets a visitor
 * answer all nine, and those answers arrive over the network from someone who
 * never had to pass through the wizard — so "the wizard would not have offered
 * that" has to be enforced here rather than assumed.
 *
 * Three steps, in this order:
 *
 * 1. **Prune.** `pruneAnswers` walks the questions and keeps an answer only if
 *    `optionsFor` still offers it given the answers before it. Auth0 beside
 *    TanStack Start is dropped here, exactly as it is dropped in the dialog,
 *    through the same function — so a rule added to `starter-questions.ts` is
 *    honoured on this path without anyone remembering to come back.
 * 2. **Complete.** Whatever pruning removed, and whatever was never sent, is
 *    filled with the first still-legal option. A half-answered request
 *    previews a whole starter rather than failing.
 * 3. **Name.** The project name is the one free-text answer, and it is
 *    interpolated into `package.json`. Anything that is not a valid repository
 *    name is replaced rather than rejected, because a bad name is not a reason
 *    to refuse someone a preview.
 *
 * What this guarantees to its callers: the result is complete, every answer in
 * it is one the wizard would have offered, and it is safe to hand to
 * `buildStarter`.
 */
export function sanitiseAnswers(requested: StarterAnswers): StarterAnswers {
	/* Arrives from the network, so it is not necessarily an object at all. */
	const given: StarterAnswers =
		typeof requested === "object" && requested !== null ? requested : {};

	const chosen = pruneAnswers(given);

	for (const question of STARTER_QUESTIONS) {
		if (question.kind === "text") continue;
		if (chosen[question.id]) continue;

		const option = optionsFor(question, chosen)[0];

		if (option) chosen[question.id] = option.id;
	}

	chosen.project = isProjectNameValid(chosen.project ?? "")
		? chosen.project
		: "my-app";

	return chosen;
}

/**
 * Which framework and database pairings the wizard would actually allow.
 *
 * Derived from `STARTER_QUESTIONS` through the same `optionsFor` the dialog
 * uses, not from a list written here. That is the point being demonstrated —
 * React + Vite has no server, so it cannot hold a Neon connection string, and
 * the hero should show that seam rather than describe it. A hand-written list
 * would drift the first time a database is added.
 */
export function heroCombinations(): { framework: string; database: string }[] {
	const [frameworkQuestion, databaseQuestion] = HERO_QUESTIONS.map((id) => {
		const question = STARTER_QUESTIONS.find((candidate) => candidate.id === id);

		if (!question) throw new Error(`no "${id}" question to preview`);

		return question;
	});

	if (!frameworkQuestion || !databaseQuestion) return [];

	const pairs: { framework: string; database: string }[] = [];

	for (const framework of frameworkQuestion.options ?? []) {
		const legal = optionsFor(databaseQuestion, { framework: framework.id });

		for (const database of legal) {
			pairs.push({ framework: framework.id, database: database.id });
		}
	}

	return pairs;
}

/**
 * Which file to open on, in order of preference.
 *
 * The point is to land on something that *shows the answers mattering* — a
 * schema differs between Drizzle and the Supabase client, a test proves the
 * suite is real. Alphabetical order would open on `.env.example`, which is the
 * least interesting file in any repository.
 */
const OPENS_ON = [
	/\/schema\.ts$/,
	/\/auth\.ts$/,
	/\.test\.ts$/,
	/^src\/lib\//,
	/^src\//,
];

function openingFile(files: Record<string, string>): StarterFile {
	const paths = Object.keys(files);

	for (const pattern of OPENS_ON) {
		const match = paths.find((path) => pattern.test(path));

		if (match) return { path: match, source: files[match] ?? "" };
	}

	const first = paths[0] ?? "";

	return { path: first, source: files[first] ?? "" };
}

/**
 * Builds every offered combination and returns just what the panel draws.
 *
 * The file *contents* are thrown away deliberately. They are the bulk of the
 * payload and the tree never shows them, so sending them would be shipping a
 * megabyte to render a list of names.
 */
export const starterPreviews = createServerFn().handler((): StarterPreview[] =>
	heroCombinations().map(({ framework, database }) => {
		const files = buildStarter(completeAnswers(framework, database));

		const paths = Object.keys(files);

		return {
			framework,
			database,
			tree: toFileTree(paths),
			files: paths.length,
			tests: paths.filter((path) => /\.(test|spec)\.[jt]sx?$/.test(path))
				.length,
			opening: openingFile(files),
		};
	}),
);

/**
 * One file's source, fetched when somebody clicks it.
 *
 * Shipping every file with the page was the alternative: eleven combinations of
 * forty-odd files is roughly a megabyte of source to render a panel most
 * visitors never open. This costs a round trip per click and keeps the document
 * small.
 *
 * The path is validated against the generated set rather than trusted. It
 * arrives from the client, and a handler that reads whatever it is given is how
 * a preview becomes a way to read files off the server.
 */
export const starterFile = createServerFn()
	.inputValidator(
		(input: { framework: string; database: string; path: string }) => input,
	)
	.handler(({ data }): StarterFile => {
		const legal = heroCombinations().some(
			(combination) =>
				combination.framework === data.framework &&
				combination.database === data.database,
		);

		if (!legal) throw new Error("No such starter.");

		const files = buildStarter(completeAnswers(data.framework, data.database));
		const source = files[data.path];

		if (source === undefined) throw new Error("No such file in that starter.");

		return { path: data.path, source };
	});

/* ------------------------------------------------------------------ /build */

/**
 * A whole starter described, for the public builder.
 *
 * Carries the answers back. What was asked for and what was built are not
 * always the same set — a request naming Auth0 beside TanStack Start is
 * pruned to something legal — and the page has to render the stack it
 * actually got rather than the one it asked for.
 */
export type BuiltStarter = {
	answers: StarterAnswers;
	tree: TreeNode[];
	files: number;
	tests: number;
	opening: StarterFile;
};

const TEST_FILE = /\.(test|spec)\.[jt]sx?$/;

/**
 * One starter, built to order.
 *
 * The hero precomputes its eleven combinations because it has eleven. The
 * builder offers 450 and lets someone change any of nine answers, so this
 * builds the one that was asked for — a few milliseconds of pure function,
 * against a round trip that was going to happen anyway.
 *
 * File *contents* are dropped, as in `starterPreviews`: the tree draws from
 * paths, and shipping every source would be a megabyte to render a list of
 * names. `starterSource` fetches the one file somebody clicks.
 */
export const starterBuild = createServerFn()
	.inputValidator((input: { answers: StarterAnswers }) => input)
	.handler(({ data }): BuiltStarter => {
		const answers = sanitiseAnswers(data.answers);
		const files = buildStarter(answers);
		const paths = Object.keys(files);

		return {
			answers,
			tree: toFileTree(paths),
			files: paths.length,
			tests: paths.filter((path) => TEST_FILE.test(path)).length,
			opening: openingFile(files),
		};
	});

/**
 * One file out of a built starter.
 *
 * The path is a key into the map the generator just returned in memory, never
 * a path on disk, and a miss is an error rather than an empty string. That is
 * the same property `starterFile` protects, and it matters more here: this
 * handler takes a whole answer set from the caller instead of a pair drawn
 * from a fixed list, so `sanitiseAnswers` is what stands between a request and
 * the generator.
 */
export const starterSource = createServerFn()
	.inputValidator((input: { answers: StarterAnswers; path: string }) => input)
	.handler(({ data }): StarterFile => {
		const files = buildStarter(sanitiseAnswers(data.answers));
		const source = files[data.path];

		if (source === undefined) throw new Error("No such file in that starter.");

		return { path: data.path, source };
	});
