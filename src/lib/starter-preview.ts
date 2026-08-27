import { createServerFn } from "@tanstack/react-start";
import { buildStarter } from "@/lib/generate/build-starter";
import { type TreeNode, toFileTree } from "@/lib/generate/file-tree";
import {
	optionsFor,
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
	const chosen: StarterAnswers = { framework, database, ...HELD };

	for (const question of STARTER_QUESTIONS) {
		if (question.kind === "text") continue;
		/* Fixed by the caller, or already pinned above. */
		if (chosen[question.id]) continue;

		const option = optionsFor(question, chosen)[0];

		if (option) chosen[question.id] = option.id;
	}

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
