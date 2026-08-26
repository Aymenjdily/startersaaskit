import { describe, expect, it } from "vitest";
import type { StarterAnswers } from "@/lib/starter-questions";
import { everyGeneratedStarter } from "@/test/starter-matrix";
import { buildStarter } from "./build-starter";
import { parseEnvExample, starterGuide, starterTour } from "./guide";

const answers: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "supabase",
	orm: "drizzle",
	auth: "supabase_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

const guideFor = (overrides: StarterAnswers = {}) => {
	const merged = { ...answers, ...overrides };
	return starterGuide(buildStarter(merged), merged);
};

const commandsIn = (steps: ReturnType<typeof starterGuide>) =>
	steps.flatMap((step) => (step.commands ?? []).map((c) => c.command));

describe("parseEnvExample", () => {
	it("reads each variable with the comment above it", () => {
		const parsed = parseEnvExample(
			"# Copy to .env\n\n# Postgres connection string\nDATABASE_URL=\n",
		);

		expect(parsed).toEqual([
			{
				name: "DATABASE_URL",
				comment: "Postgres connection string",
				isPublic: false,
			},
		]);
	});

	it.each([
		"NEXT_PUBLIC_SUPABASE_URL",
		"VITE_SUPABASE_URL",
	])("knows %s reaches the browser", (name) => {
		expect(parseEnvExample(`# A URL\n${name}=\n`)[0]?.isPublic).toBe(true);
	});

	it("does not treat the section banner as a variable's comment", () => {
		const files = buildStarter(answers);
		const parsed = parseEnvExample(files[".env.example"] as string);
		const supabase = parsed.find((v) => v.name.endsWith("SUPABASE_URL"));

		expect(supabase?.comment).not.toMatch(/prefix/);
		expect(supabase?.comment).toMatch(/Project URL/);
	});
});

describe("starterGuide", () => {
	/**
	 * The whole reason this is derived rather than written: a guide that names
	 * a command the project does not have is worse than no guide. Checked
	 * across the whole matrix, because the wrong steps only appear for some
	 * stacks.
	 */
	it("never names a script the starter does not ship", () => {
		for (const { answers: combination, files } of everyGeneratedStarter()) {
			const scripts = Object.keys(
				(JSON.parse(files["package.json"] as string) as { scripts: object })
					.scripts,
			);

			for (const command of commandsIn(starterGuide(files, combination))) {
				const script = /^npm run ([\w:-]+)$/.exec(command)?.[1];
				if (script) {
					expect(scripts, `${command} is not a script`).toContain(script);
				}
			}
		}
	});

	it("documents every variable the starter declares, and no others", () => {
		const files = buildStarter(answers);
		const declared = [
			...(files[".env.example"] as string).matchAll(/^([A-Z][A-Z0-9_]*)=/gm),
		].map((match) => match[1]);

		const step = guideFor().find((s) => s.variables);

		expect(step?.variables?.map((v) => v.name)).toEqual(declared);
	});

	/** Every step has to tell the reader why, not only what to type. */
	it("explains each step rather than only listing commands", () => {
		for (const step of guideFor()) {
			expect(step.title.length, step.title).toBeGreaterThan(0);
			expect(step.body.length, step.title).toBeGreaterThan(20);
		}
	});

	it("starts by opening the folder the download actually makes", () => {
		expect(commandsIn(guideFor({ project: "ada-app" }))).toContain(
			"cd ada-app",
		);
	});

	/**
	 * The reason the question exists at all. `bun test` is the trap: it runs
	 * Bun's *own* test runner rather than the `test` script, so the Vitest suite
	 * the starter ships never executes and the failure reads as a broken
	 * starter. Every manager is given `run`, which is correct for all four.
	 */
	describe("the package manager it was told to use", () => {
		it.each([
			["npm", "npm install", "npm run test"],
			["pnpm", "pnpm install", "pnpm run test"],
			["yarn", "yarn install", "yarn run test"],
			["bun", "bun install", "bun run test"],
		])("spells the commands the %s way", (id, install, test) => {
			const commands = commandsIn(guideFor({ packageManager: id }));

			expect(commands).toContain(install);
			expect(commands).toContain(test);
		});

		it("never tells anyone to run `bun test`", () => {
			expect(commandsIn(guideFor({ packageManager: "bun" }))).not.toContain(
				"bun test",
			);
		});

		it("names the lockfile the install will write", () => {
			const step = guideFor({ packageManager: "pnpm" }).find(
				(step) => step.title === "Install",
			);

			expect(step?.body).toContain("pnpm-lock.yaml");
		});

		/** Whatever the manager, the guide only ever names real scripts. */
		it("keeps every command runnable for each of them", () => {
			for (const id of ["npm", "pnpm", "yarn", "bun"]) {
				const files = buildStarter({ ...answers, packageManager: id });
				const scripts = Object.keys(
					(JSON.parse(files["package.json"] as string) as { scripts: object })
						.scripts,
				);

				for (const command of commandsIn(guideFor({ packageManager: id }))) {
					const script = new RegExp(`^${id} run ([\\\\w:-]+)$`).exec(
						command,
					)?.[1];

					if (script) expect(scripts, command).toContain(script);
				}
			}
		});
	});

	describe("the steps that only some stacks need", () => {
		it("says how to create the tables when there is a schema to push", () => {
			expect(
				commandsIn(guideFor({ orm: "drizzle", packageManager: "pnpm" })),
			).toContain("pnpm run db:push");
		});

		it("names the database it is pushing to", () => {
			const step = guideFor({ database: "supabase", orm: "drizzle" }).find(
				(s) => s.title === "Create the tables",
			);

			expect(step?.body).toContain("Supabase");
		});

		/**
		 * Prisma generates a client and migrates rather than pushing, so the
		 * Drizzle step must not appear — this is the exact "telling someone to
		 * run a command that does not exist" case.
		 */
		it("leaves it out when the ORM has no such script", () => {
			const prisma = buildStarter({ ...answers, orm: "prisma" });
			const scripts = Object.keys(
				(JSON.parse(prisma["package.json"] as string) as { scripts: object })
					.scripts,
			);

			if (!scripts.includes("db:push")) {
				expect(commandsIn(guideFor({ orm: "prisma" }))).not.toContain(
					"npm run db:push",
				);
			}
		});

		it("skips the environment step when nothing needs configuring", () => {
			/* Not reachable through the wizard today — every stack needs at least
			   a connection string — so this asserts the branch rather than a
			   combination, and stays honest if one ever appears. */
			expect(
				starterGuide({ "package.json": "{}" }, answers),
			).not.toContainEqual(
				expect.objectContaining({ title: "Fill in your environment" }),
			);
		});
	});
});

describe("starterTour", () => {
	it("points only at files the starter contains", () => {
		for (const { files } of everyGeneratedStarter().slice(0, 40)) {
			for (const entry of starterTour(files)) {
				expect(Object.keys(files), entry.path).toContain(entry.path);
			}
		}
	});

	it("always opens with the documents meant to be read first", () => {
		const paths = starterTour(buildStarter(answers)).map((e) => e.path);

		expect(paths.slice(0, 3)).toEqual([
			"README.md",
			"ARCHITECTURE.md",
			"AGENTS.md",
		]);
	});

	/** A stack without billing has no `checkout.ts` to point at. */
	it("drops an entry the stack did not generate", () => {
		const withBilling = starterTour(buildStarter(answers)).map((e) => e.path);
		const without = starterTour(
			buildStarter({ ...answers, billing: "none" }),
		).map((e) => e.path);

		expect(withBilling).toContain("src/lib/checkout.ts");
		expect(without).not.toContain("src/lib/checkout.ts");
	});
});
