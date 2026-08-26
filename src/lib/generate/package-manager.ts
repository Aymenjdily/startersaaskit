import type { StarterAnswers } from "@/lib/starter-questions";

/**
 * How each package manager spells the two things a guide ever asks for.
 *
 * One place, because the alternative is the README saying `npm install` while
 * the console guide says `pnpm install` for the same starter — and whichever
 * the reader tried first is the one they will believe.
 *
 * ## Why every script is run with `run`
 *
 * `bun test` does not run the `test` script. It runs *Bun's own test runner*,
 * which then tries to execute a Vitest suite it does not understand, and the
 * failure looks like the starter is broken rather than like the command was
 * wrong. `bun run test` is the one that does what the reader means.
 *
 * npm, pnpm and yarn all have their own shorthands with their own reserved
 * names, and none of them loses anything by being explicit. So the rule is
 * uniform: `<manager> run <script>`, always. It is one word longer and it is
 * right for every manager and every script name.
 */

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

type Spelling = {
	/** Resolves and installs from `package.json`. */
	install: string;
	/** The prefix a script name is appended to. */
	run: string;
	/** Runs a package without installing it first. */
	exec: string;
	/** The file the install writes, which the starter does not ship. */
	lockfile: string;
};

const SPELLINGS: Record<PackageManager, Spelling> = {
	npm: {
		install: "npm install",
		run: "npm run",
		exec: "npx",
		lockfile: "package-lock.json",
	},
	pnpm: {
		install: "pnpm install",
		run: "pnpm run",
		exec: "pnpm dlx",
		lockfile: "pnpm-lock.yaml",
	},
	yarn: {
		install: "yarn install",
		run: "yarn run",
		exec: "yarn dlx",
		lockfile: "yarn.lock",
	},
	bun: {
		install: "bun install",
		run: "bun run",
		exec: "bunx",
		lockfile: "bun.lock",
	},
};

export const PACKAGE_MANAGERS = Object.keys(SPELLINGS) as PackageManager[];

/**
 * The spellings for a set of answers.
 *
 * Falls back to npm rather than throwing: a stored record written before the
 * question existed has no answer here, and `backfillAnswers` already reads
 * that as npm. Agreeing with it keeps the two from disagreeing if one is ever
 * called without the other.
 */
export function packageManager(answers: StarterAnswers): Spelling & {
	id: PackageManager;
} {
	const id = (answers.packageManager ?? "npm") as PackageManager;
	const spelling = SPELLINGS[id] ?? SPELLINGS.npm;

	return { id: spelling === SPELLINGS[id] ? id : "npm", ...spelling };
}

/** `pnpm run db:push`, for whichever manager was chosen. */
export const runScript = (answers: StarterAnswers, script: string) =>
	`${packageManager(answers).run} ${script}`;
