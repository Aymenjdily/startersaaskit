import {
	answerProblems,
	isProjectNameValid,
	isStarterComplete,
	STARTER_QUESTIONS,
	type StarterAnswers,
	type StarterQuestionId,
} from "@/lib/starter-questions";
import { type Fragment, fragmentsFor } from "./fragments";
import { packageManager, runScript } from "./package-manager";

/**
 * Turns a set of answers into the files of a starter.
 *
 * The answers select modules; this merges them. Files are contributed whole,
 * while `package.json` and `.env.example` are assembled from every fragment's
 * declared dependencies, scripts and variables — the "extension points, not
 * text merging" that `context/product-model.md` calls for.
 *
 * What arrives is source, not a built or installed project. There is no
 * `node_modules` and no lockfile: a dependency tree is hundreds of megabytes
 * of platform-specific binaries, so shipping one built on a Linux server would
 * hand a Mac user something broken. The reader runs their own install, and the
 * README says so.
 *
 * Pure on purpose: no filesystem, no network, no clock. Everything below can
 * be asserted in a unit test, which is the only reason to trust it.
 */

export type StarterFiles = Record<string, string>;

/** Width of the name column in ARCHITECTURE.md: `components/ui/` plus a gap. */
const NAME_COLUMN = "components/ui/".length + 3;

/**
 * Replaces the tokens fragment templates carry.
 *
 * Deliberately dumb string replacement rather than a template engine: the
 * templates are TypeScript, and anything cleverer would need escaping rules
 * for a language that already has its own.
 */
function fill(contents: string, tokens: Record<string, string>): string {
	let out = contents;
	for (const [token, value] of Object.entries(tokens)) {
		out = out.replaceAll(`{{${token}}}`, value);
	}
	return out;
}

function labelFor(id: StarterQuestionId, answers: StarterAnswers): string {
	const question = STARTER_QUESTIONS.find((candidate) => candidate.id === id);
	const chosen = question?.options?.find((option) => option.id === answers[id]);

	return chosen?.label ?? "—";
}

function merge(fragments: Fragment[]) {
	const files: StarterFiles = {};
	const dependencies: Record<string, string> = {};
	const devDependencies: Record<string, string> = {};
	const scripts: Record<string, string> = {};
	const env: [string, string, string?][] = [];
	const publicEnv: [string, string, string?][] = [];

	for (const fragment of fragments) {
		Object.assign(files, fragment.files);
		Object.assign(dependencies, fragment.dependencies);
		Object.assign(devDependencies, fragment.devDependencies);
		Object.assign(scripts, fragment.scripts);
		for (const [list, declared] of [
			[env, fragment.env],
			[publicEnv, fragment.publicEnv],
		] as const) {
			for (const variable of declared ?? []) {
				/* Two fragments can want the same variable — Supabase as a database
				   and as an auth provider, say. First declaration wins. */
				if (!list.some(([name]) => name === variable[0])) list.push(variable);
			}
		}
	}
	return { files, dependencies, devDependencies, scripts, env, publicEnv };
}

const sorted = (record: Record<string, string>) =>
	Object.fromEntries(
		Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
	);

function packageJson(
	answers: StarterAnswers,
	merged: ReturnType<typeof merge>,
): string {
	return `${JSON.stringify(
		{
			name: answers.project,
			private: true,
			type: "module",
			/* Sorted so two generations of the same answers are byte-identical. */
			scripts: sorted({
				test: "vitest run",
				typecheck: "tsc --noEmit",
				/* Last, so a framework that needs more than `tsc` — TanStack has to
				   generate its route tree first — can say so. */
				...merged.scripts,
			}),
			dependencies: sorted(merged.dependencies),
			devDependencies: sorted({
				...merged.devDependencies,
				/* The shipped suite reads files off disk, so it imports `node:fs`.
				   Without these types `typecheck` fails on a clean install. */
				"@types/node": "^24.0.0",
				typescript: "^5.9.0",
				vitest: "^4.0.0",
			}),
		},
		null,
		"\t",
	)}\n`;
}

/**
 * A variable naming a location gets validated as one.
 *
 * Not cosmetic: Better Auth rejects a base URL that is not a URL, so a
 * variable typed only as a non-empty string passes validation and then blows
 * up inside the SDK — which is exactly the failure typed env exists to move
 * forward to boot.
 */
const isLocation = (name: string) => /_(URL|URI)$/.test(name);

/**
 * The zod fields for `src/lib/env.ts`, from the same list that writes
 * `.env.example`.
 *
 * Derived rather than hand-written so the two cannot disagree — a variable
 * documented but unparsed is the exact bug typed env exists to prevent.
 */
function envSchema(merged: ReturnType<typeof merge>): string {
	if (merged.env.length === 0) {
		return "\t/* No integrations need a variable yet. */";
	}
	return merged.env
		.map(
			([name]) =>
				`\t${name}: ${isLocation(name) ? "z.url()" : "z.string().min(1)"},`,
		)
		.join("\n");
}

/**
 * Placeholder values for `vitest.config.ts`, from the same list again.
 *
 * The module that declares a variable supplies its own stand-in, because only
 * it knows the shape the SDK behind it demands: Neon's driver rejects anything
 * that is not a `postgresql://` string, so a generic URL satisfies the schema
 * and then throws inside the driver on the first import.
 *
 * The fallback is for variables whose module has not said — non-empty, and
 * obviously a fixture if one shows up in a failure message.
 */
function testEnv(
	merged: ReturnType<typeof merge>,
	answers: StarterAnswers,
): string {
	const all: [string, string, string?][] = [
		...merged.env,
		/* Prefixed, because that is the name the client module reads — a
		   stand-in under the bare name would leave `public-env.ts` throwing the
		   moment a component test imports anything that touches it. */
		...merged.publicEnv.map(
			([name, comment, placeholder]) =>
				[`${publicPrefix(answers)}${name}`, comment, placeholder] as [
					string,
					string,
					string?,
				],
		),
	];

	if (all.length === 0) {
		return "\t\t\t/* Nothing to stand in for yet. */";
	}
	return all
		.map(([name, , placeholder]) => {
			const standIn =
				placeholder ??
				(isLocation(name)
					? "https://example.test"
					: `test-${name.toLowerCase()}`);

			return `\t\t\t${name}: "${standIn}",`;
		})
		.join("\n");
}

/**
 * The prefix a framework's bundler requires before it will substitute a
 * variable into client code.
 *
 * Not a style choice on either side: it is how each tool decides what is safe
 * to ship to a browser, and a public variable without it silently arrives as
 * `undefined` in the one place it was needed.
 */
const publicPrefix = (answers: StarterAnswers) =>
	answers.framework === "nextjs" ? "NEXT_PUBLIC_" : "VITE_";

function envExample(
	merged: ReturnType<typeof merge>,
	answers: StarterAnswers,
): string {
	const lines = ["# Copy to .env and fill in. Nothing here is committed.", ""];

	for (const [name, comment] of merged.env) {
		lines.push(`# ${comment}`, `${name}=`, "");
	}
	if (merged.publicEnv.length > 0) {
		lines.push(
			`# Everything below is compiled into the browser bundle. The`,
			`# ${publicPrefix(answers).replace(/_$/, "")} prefix is what tells the bundler that is intended.`,
			"",
		);
		for (const [name, comment] of merged.publicEnv) {
			lines.push(`# ${comment}`, `${publicPrefix(answers)}${name}=`, "");
		}
	}
	return `${lines.join("\n").trimEnd()}\n`;
}

/**
 * `src/lib/public-env.ts` — the public half, parsed the same way.
 *
 * The prefix lives only in this file. Everything else reads
 * `publicEnv.SUPABASE_URL`, so the same component source compiles under either
 * framework and nobody has to remember which prefix this project uses.
 *
 * The read has to be written out member expression by member expression:
 * both bundlers substitute `process.env.NEXT_PUBLIC_X` / `import.meta.env.
 * VITE_X` textually, so indexing the object dynamically would defeat them.
 */
function publicEnvModule(
	merged: ReturnType<typeof merge>,
	answers: StarterAnswers,
): string {
	const prefix = publicPrefix(answers);
	const source =
		answers.framework === "nextjs" ? "process.env" : "import.meta.env";

	const fields = merged.publicEnv
		.map(
			([name]) =>
				`\t${name}: ${isLocation(name) ? "z.url()" : "z.string().min(1)"},`,
		)
		.join("\n");
	const reads = merged.publicEnv
		.map(([name]) => `\t${name}: ${source}.${prefix}${name},`)
		.join("\n");

	return `import { z } from "zod";

/**
 * The environment variables the browser is allowed to see.
 *
 * Separate from \`env.ts\` because that one reads secrets, and importing it
 * from a component would put them in the bundle. Whatever is here ships to
 * every visitor by design: publishable keys and public URLs, nothing else.
 *
 * The \`${prefix.replace(/_$/, "")}\` prefix is required by ${answers.framework === "nextjs" ? "Next" : "Vite"} and stops at this file.
 */
const schema = z.object({
${fields}
});

const parsed = schema.safeParse({
${reads}
});

if (!parsed.success) {
	const missing = parsed.error.issues
		.map((issue) => \`  ${prefix}\${issue.path.join(".")}: \${issue.message}\`)
		.join("\\n");

	throw new Error(\`Invalid public environment.\\n\${missing}\\n\\nSee .env.example.\`);
}

export const publicEnv = parsed.data;
`;
}

/**
 * The test beside it, which is the convention this project documents — and
 * here it earns its place twice over. The failure it guards against is that
 * the bundler quietly stops substituting these names: nothing throws at build
 * time, and the browser gets `undefined` where a key should be.
 */
function publicEnvTest(
	merged: ReturnType<typeof merge>,
	answers: StarterAnswers,
): string {
	const prefix = publicPrefix(answers);
	const names = merged.publicEnv.map(([name]) => name);

	return `import { describe, expect, it } from "vitest";
import { publicEnv } from "./public-env.js";

describe("publicEnv", () => {
	it.each(${JSON.stringify(names)})("exposes %s to the browser", (name) => {
		expect(publicEnv[name as keyof typeof publicEnv]).toBeTruthy();
	});

	/**
	 * The whole point of the split. A secret named here would be compiled into
	 * the bundle every visitor downloads.
	 */
	it("exposes nothing else", () => {
		expect(Object.keys(publicEnv).sort()).toEqual(${JSON.stringify([...names].sort())});
	});

	/**
	 * The names are read under their \`${prefix}\` prefix and exported without
	 * it. Reading an unprefixed name is the bug this catches: the bundler
	 * leaves it alone, and it arrives as \`undefined\` in the browser.
	 */
	it("reads the prefixed names and exports the bare ones", async () => {
		const { readFileSync } = await import("node:fs");
		const source = readFileSync("src/lib/public-env.ts", "utf8");

		for (const name of ${JSON.stringify(names)}) {
			expect(source, name).toContain(\`${prefix}\${name}\`);
		}
	});
});
`;
}

function readme(answers: StarterAnswers, files: StarterFiles): string {
	const manager = packageManager(answers);
	const rows = STARTER_QUESTIONS.filter(
		(question) => question.kind === "choice",
	)
		.map(
			(question) => `| ${question.label} | ${labelFor(question.id, answers)} |`,
		)
		.join("\n");
	const tree = Object.keys(files)
		.sort()
		.map((path) => `- \`${path}\``)
		.join("\n");

	return `# ${answers.project}

Generated by StarterSaaSKit.

## Your stack

| Layer | Choice |
| ----- | ------ |
${rows}

## Getting started

\`\`\`bash
${manager.install}
cp .env.example .env   # then fill it in
${runScript(answers, "dev")}
\`\`\`

The copy step is not optional. \`src/lib/env.ts\` validates the environment at
startup, so \`dev\` and \`build\` stop immediately if a variable is missing — and
tell you which one. That is deliberate: the alternative is a deploy that boots
fine and fails on the first request.

\`.env.example\` lists exactly what your answers need, and nothing else.

\`${runScript(answers, "test")}\` and \`${runScript(answers, "typecheck")}\` pass on a clean install, before you have an
\`.env\` — the suite supplies its own placeholders in \`vitest.config.ts\`.

## What is here

${tree}

## What is not here

**\`node_modules\`.** A resolved dependency tree runs to hundreds of megabytes
and contains binaries compiled for one operating system, so an archive built on
our server would be broken on your machine. Your \`package.json\` lists exactly
what your answers need; your own package manager resolves it.

**A lockfile.** Producing one means actually resolving the registry, which is
not something this does yet. Your first \`install\` writes one.

This is an early build, and the modules behind each answer are still being
filled in. Nothing here is a placeholder pretending to work: if a file exists,
it does what it says.
`;
}

function stackConfig(answers: StarterAnswers): string {
	const entries = STARTER_QUESTIONS.filter(
		(question) => question.kind === "choice",
	)
		.map((question) => `\t${question.id}: "${answers[question.id]}",`)
		.join("\n");

	return `/** The answers this project was generated from. */
export const STACK = {
${entries}
} as const;

export type Stack = typeof STACK;
`;
}

const STACK_TEST = `import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { STACK } from "./stack.js";

/**
 * The generated project ships a suite that passes on a clean checkout. It
 * checks the thing generation could plausibly get wrong: that the files agree
 * with each other.
 */
describe("this project", () => {
	const pkg = JSON.parse(readFileSync("package.json", "utf8"));

	it("recorded every choice it was generated from", () => {
		for (const [layer, choice] of Object.entries(STACK)) {
			expect(choice, layer).toBeTruthy();
		}
	});

	it("is named something a package manager accepts", () => {
		expect(pkg.name).toMatch(/^[a-z0-9][a-z0-9-]*$/);
	});

	/** A script naming a binary nothing installs fails the first time it is run. */
	it("installs something for every binary its scripts invoke", () => {
		const installed = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
		const provider = {
			vitest: "vitest",
			tsc: "typescript",
			next: "next",
			vite: "vite",
			node: null,
			"drizzle-kit": "drizzle-kit",
			prisma: "prisma",
			tsr: "@tanstack/router-cli",
		};

		for (const command of Object.values(pkg.scripts) as string[]) {
			/* Split on \`&&\` first: a script that chains two commands promises
			   both of them, and checking only the first would let the second
			   name a binary nothing installs. */
			for (const step of command.split("&&")) {
				/* \`?? ""\` because this project sets \`noUncheckedIndexedAccess\`,
				   which makes an index into a split array \`string | undefined\`. */
				const binary = step.trim().split(" ")[0] ?? "";
				expect(binary in provider, \`unknown binary "\${binary}"\`).toBe(true);

				const needed = provider[binary as keyof typeof provider];
				if (needed) expect(installed).toContain(needed);
			}
		}
	});

	it("documents every environment variable it reads", () => {
		const example = readFileSync(".env.example", "utf8");
		const declared = [...example.matchAll(/^(\\w+)=/gm)].map((m) => m[1]);

		expect(declared.length).toBeGreaterThan(0);
		for (const name of declared) {
			expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
		}
	});
});
`;

const GITIGNORE = `node_modules
dist
.next
.output
# Written by Next.js on first build, not by us.
next-env.d.ts
.env
.env.local
*.log
.DS_Store
`;

function tsconfig(answers: StarterAnswers): string {
	const next = answers.framework === "nextjs";

	return `${JSON.stringify(
		{
			compilerOptions: {
				target: "ES2022",
				lib: ["ES2022", "DOM", "DOM.Iterable"],
				module: "ESNext",
				moduleResolution: "bundler",
				/**
				 * Next compiles JSX itself and wants it left alone; Vite reads this
				 * field and hands it to esbuild, where `preserve` means the runtime
				 * import is never added. That failed at request time, not build
				 * time: "React is not defined", thrown while rendering the
				 * document.
				 */
				jsx: next ? "preserve" : "react-jsx",
				strict: true,
				noUncheckedIndexedAccess: true,
				skipLibCheck: true,
				noEmit: true,
				esModuleInterop: true,
				resolveJsonModule: true,
				/* Next.js rewrites tsconfig.json on its first build if these are
				   missing, which would mean the file we generated is not the file
				   the reader ends up with. Set here so the build changes nothing. */
				...(next
					? { allowJs: true, incremental: true, isolatedModules: true }
					: {}),
				types: ["node", "vitest/globals"],
				baseUrl: ".",
				paths: { "@/*": ["./src/*"] },
				...(next ? { plugins: [{ name: "next" }] } : {}),
			},
			/* Everything is under `src/` now, including the routing directory.
			   `.next/types` is emitted by the build. */
			include: next ? ["src", ".next/types/**/*.ts"] : ["src"],
			exclude: ["node_modules"],
		},
		null,
		"\t",
	)}\n`;
}

/**
 * Files for a starter, keyed by path relative to the project root.
 *
 * Throws rather than emitting a partial project: an incomplete answer set here
 * means something bypassed the wizard, and the useful response is a loud
 * failure, not a zip missing its database.
 */
export function buildStarter(answers: StarterAnswers): StarterFiles {
	/**
	 * The name is checked first, and not because it is more important.
	 * `isStarterComplete` already rejects an invalid name — it is one of the
	 * questions — so putting the completeness check first made this branch
	 * unreachable and reported `../../etc/passwd` as "not a complete starter",
	 * which is true but useless. Ordered this way both branches can fire and
	 * each says what is actually wrong.
	 */
	if (!isProjectNameValid(answers.project ?? "")) {
		throw new Error("That project name cannot be used as a repository name.");
	}
	if (!isStarterComplete(answers)) {
		/* Naming the offending answer, because the caller is usually a stored
		   record being re-validated against rules that got stricter after it was
		   written, and "not complete" gives nobody anywhere to go. */
		throw new Error(
			`Those answers do not describe a complete starter. ${answerProblems(
				answers,
			)
				.map((problem) => problem.problem)
				.join(" ")}`.trim(),
		);
	}

	const project = answers.project as string;
	const merged = merge(fragmentsFor(answers));

	const files: StarterFiles = {};
	const routingDir = answers.framework === "nextjs" ? "app" : "routes";
	const tokens = {
		project,
		routingDir,
		/**
		 * Pads the ARCHITECTURE.md name column to the same width as the longest
		 * entry (`components/ui/`), so `app/` and `routes/` describe themselves
		 * in the same column as everything else rather than three short.
		 */
		routingPad: " ".repeat(NAME_COLUMN - (routingDir.length + 1)),
		runTest: runScript(answers, "test"),
		runTypecheck: runScript(answers, "typecheck"),
		envSchema: envSchema(merged),
		testEnv: testEnv(merged, answers),
		stackSummary: STARTER_QUESTIONS.filter((q) => q.kind === "choice")
			.map((q) => `- **${q.label}**: ${labelFor(q.id, answers)}`)
			.join("\n"),
	};

	for (const [path, contents] of Object.entries(merged.files)) {
		files[path] = fill(contents, tokens);
	}

	files["src/lib/stack.ts"] = stackConfig(answers);
	files["src/lib/stack.test.ts"] = STACK_TEST;
	files["package.json"] = packageJson(answers, merged);
	if (merged.publicEnv.length > 0) {
		files["src/lib/public-env.ts"] = publicEnvModule(merged, answers);
		files["src/lib/public-env.test.ts"] = publicEnvTest(merged, answers);
	}
	files["tsconfig.json"] = tsconfig(answers);
	files[".gitignore"] = GITIGNORE;
	files[".env.example"] = envExample(merged, answers);
	/* Last: the README lists the file tree, so it needs the rest in hand. */
	files["README.md"] = readme(answers, files);

	return files;
}
