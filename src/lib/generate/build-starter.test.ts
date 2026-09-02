import { describe, expect, it } from "vitest";
import { LOOKUPS, TREE } from "@/components/landing/ai-optimized";
import {
	optionsFor,
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";
import {
	everyGeneratedStarter,
	everyLegalCombination,
} from "@/test/starter-matrix";
import { buildStarter } from "./build-starter";

const answers: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "neon",
	orm: "drizzle",
	auth: "better_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

const build = (overrides: StarterAnswers = {}) =>
	buildStarter({ ...answers, ...overrides });

/**
 * The default set is Neon and Better Auth, which needs nothing in the browser.
 * Supabase is the case where public variables exist at all: its client signs
 * people in from the browser and has to be handed a URL and a key there.
 */
const withPublicEnv: StarterAnswers = {
	database: "supabase",
	auth: "supabase_auth",
};

describe("buildStarter", () => {
	it("refuses an incomplete answer set rather than emitting half a project", () => {
		expect(() => build({ database: undefined })).toThrow(/complete starter/);
	});

	/**
	 * The name becomes a directory inside the zip and the download filename.
	 * The wizard already checks it, which is exactly why this checks it again —
	 * a request that skipped the wizard is the case that matters.
	 *
	 * Asserting the *message*, not merely that it throws: a bad name failing as
	 * "not a complete starter" would pass a bare `toThrow()` while telling the
	 * caller nothing they can act on.
	 */
	it.each([
		"../../etc/passwd",
		"My App",
		"",
		'x" onload="',
	])("refuses %p as a project name, and says why", (project) => {
		expect(() => build({ project })).toThrow(/project name/);
	});

	describe("the files it emits", () => {
		it("includes everything needed to install and test", () => {
			const paths = Object.keys(build());

			for (const required of [
				".env.example",
				".gitignore",
				"README.md",
				"package.json",
				"tsconfig.json",
				"src/lib/stack.ts",
				"src/lib/stack.test.ts",
			]) {
				expect(paths).toContain(required);
			}
		});

		/**
		 * The complaint that produced this: a zip of config files is not a
		 * starter. Whatever else changes, the output has to contain application
		 * source for the framework and a database client — not just manifests.
		 */
		it("emits real application source, not only configuration", () => {
			const next = Object.keys(build({ framework: "nextjs" }));
			const tanstack = Object.keys(build({ framework: "tanstack_start" }));

			expect(next).toContain("src/app/layout.tsx");
			expect(next).toContain("src/app/(marketing)/page.tsx");
			expect(next).toContain("next.config.ts");

			expect(tanstack).toContain("src/routes/index.tsx");
			expect(tanstack).toContain("src/routes/__root.tsx");
			expect(tanstack).toContain("vite.config.ts");

			expect(next).toContain("src/db/client.ts");
		});

		/**
		 * The `src/` vs `app/` split this replaced was the complaint that started
		 * the rewrite: no senior ships both. Everything that is source now lives
		 * under `src/`, and only config and docs sit at the root.
		 */
		it("keeps every source file under src/", () => {
			for (const framework of ["nextjs", "tanstack_start"]) {
				const stray = Object.keys(build({ framework })).filter(
					(path) =>
						/\.(ts|tsx|css)$/.test(path) &&
						!path.startsWith("src/") &&
						/* Config, not source: each is read from the repository root
						   by the tool that owns it and cannot move into `src/`. */
						!/^(next|vite|vitest|drizzle)\.config\.ts$/.test(path),
				);

				expect(stray, `${framework} put source outside src/`).toEqual([]);
			}
		});

		/**
		 * `@/` resolves to `src/`, so a routing directory outside it would give
		 * two ways to spell the same import. Both frameworks keep routing inside.
		 */
		it("puts the routing directory inside src/, whichever framework", () => {
			expect(
				Object.keys(build({ framework: "nextjs" })).some((p) =>
					p.startsWith("src/app/"),
				),
			).toBe(true);
			expect(
				Object.keys(build({ framework: "tanstack_start" })).some((p) =>
					p.startsWith("src/routes/"),
				),
			).toBe(true);
		});

		/**
		 * React + Vite has no server, and that is a security property rather than
		 * a missing feature. Everything in a bundle is readable by everyone who
		 * loads the page, so the generator must not emit the machinery that
		 * assumes otherwise — and must not ask for a credential the project has
		 * no way to hide.
		 */
		describe("the browser-only starter", () => {
			const spa = build({
				framework: "react_vite",
				database: "supabase",
				orm: "none",
				auth: "supabase_auth",
				billing: "none",
				email: "none",
			});

			it("ships no server directory and no server-only tripwire", () => {
				const paths = Object.keys(spa);

				expect(paths.filter((path) => path.startsWith("src/server/"))).toEqual(
					[],
				);
				expect(
					JSON.parse(spa["package.json"] as string).dependencies,
				).not.toHaveProperty("server-only");
			});

			/**
			 * `env.ts` parses *private* variables. In a SPA there are none, and a
			 * file implying otherwise invites someone to add one.
			 */
			it("ships public-env.ts and no private env module", () => {
				expect(Object.keys(spa)).toContain("src/lib/public-env.ts");
				expect(Object.keys(spa)).not.toContain("src/lib/env.ts");
			});

			it("asks for no secret in .env.example", () => {
				const declared = [
					...(spa[".env.example"] as string).matchAll(/^([A-Z][A-Z0-9_]*)=/gm),
				].map((match) => match[1] as string);

				expect(declared.length).toBeGreaterThan(0);
				/* Every one of them is prefixed, which is the bundler's own word
				   for "this is compiled in and therefore public". */
				for (const name of declared) {
					expect(name, `${name} is not marked public`).toMatch(/^VITE_/);
				}
				expect(declared.join(" ")).not.toMatch(/DATABASE_URL|SECRET|SERVICE/);
			});

			it("is a real app: an entry, a router and a page", () => {
				for (const required of [
					"index.html",
					"src/main.tsx",
					"src/routes/router.tsx",
					"src/routes/home.tsx",
				]) {
					expect(Object.keys(spa)).toContain(required);
				}
			});

			/** No connection, so no schema and no migration story. */
			it("ships no database directory", () => {
				expect(
					Object.keys(spa).filter((path) => path.startsWith("src/db/")),
				).toEqual([]);
			});

			/**
			 * The guard in the generated dashboard is a convenience, and the file
			 * has to say so — someone who mistakes it for a security boundary will
			 * write their row level security policies accordingly.
			 */
			it("says in the code that its route guard is not a security boundary", () => {
				expect(spa["src/routes/dashboard.tsx"]).toMatch(
					/not a lock|row level security/i,
				);
			});
		});

		/**
		 * The "configured only" tier is gone, and this is what keeps it gone.
		 *
		 * Three providers used to generate an eight-line module exporting a key
		 * object: the project built, the console said "Auth: Clerk", the guide
		 * implied only env vars were missing, and there was no way to sign in.
		 * A starter that looks finished and is not is worse than one that says
		 * it is unfinished, so every option the wizard offers is checked here
		 * against every framework it is offered on.
		 */
		describe("every auth option the wizard offers", () => {
			/** Each legal (framework, auth) pair, taken from the question set. */
			const pairs = STARTER_QUESTIONS.flatMap((question) => {
				if (question.id !== "framework") return [];

				return (question.options ?? []).flatMap((framework) => {
					const database = framework.id === "react_vite" ? "supabase" : "neon";
					const context = { framework: framework.id, database };
					const auths = optionsFor(
						STARTER_QUESTIONS.find((q) => q.id === "auth") as never,
						context,
					);

					return auths.map((auth) => ({
						framework: framework.id,
						auth: auth.id,
						answers: {
							...context,
							auth: auth.id,
							orm: framework.id === "react_vite" ? "none" : "drizzle",
							billing: "none",
							email: "none",
						} as StarterAnswers,
					}));
				});
			});

			it("checks every pair the wizard can produce", () => {
				expect(pairs.length).toBeGreaterThan(6);
			});

			it.each(pairs)("gives $auth on $framework a way to sign in", ({
				answers,
			}) => {
				const files = build(answers);
				const paths = Object.keys(files);

				/* Either a form this project renders, or a page mounting the
					   provider's hosted one. Both count; neither being present
					   means the reader has nowhere to type a password. */
				const hasEntry = paths.some(
					(path) =>
						/sign-in/.test(path) &&
						(path.endsWith(".tsx") || path.endsWith(".ts")),
				);

				expect(hasEntry, `${answers.auth} has no sign-in anywhere`).toBe(true);
			});

			it.each(pairs)("lets $auth on $framework answer who is signed in", ({
				framework,
				answers,
			}) => {
				const files = build(answers);

				/* The SPA has no server, so its answer is a hook rather than a
					   server helper — but it must still exist. */
				const session =
					framework === "react_vite"
						? (files["src/lib/use-session.ts"] ??
							files["src/routes/dashboard.tsx"])
						: files["src/server/session.ts"];

				expect(session, `${answers.auth} has no session lookup`).toBeTruthy();
				/* And it has to consult the provider, not return a constant —
					   the stub version of this file returned `null` forever. */
				expect(session).toMatch(
					/currentUser|getUser|getSession|useUser|useSession|auth\(/,
				);
			});

			/**
			 * The specific shape of the old stub: `auth.ts` exported an object of
			 * keys and nothing imported it. A module that only names its own
			 * configuration is configuration, not a feature.
			 */
			it.each(pairs)("wires $auth on $framework into the app", ({
				answers,
			}) => {
				const files = build(answers);
				const importers = Object.entries(files).filter(
					([path, contents]) =>
						path !== "src/lib/auth.ts" &&
						!path.endsWith(".test.ts") &&
						/from "@\/lib\/auth"|from "@\/server\/session"/.test(contents),
				);

				expect(
					importers.length,
					`nothing in the ${answers.auth} starter uses its auth module`,
				).toBeGreaterThan(0);
			});
		});

		/**
		 * The CSS pipeline, which was broken in all three frameworks and in a way
		 * nothing else here would have noticed.
		 *
		 * `@import "tailwindcss"` resolves whether or not the engine is mounted —
		 * the package ships a CSS file — so generation succeeded, the build
		 * succeeded, and the app rendered with every class name inert. Twice
		 * over, in fact: the adapter was missing from every framework, and a
		 * circular import between `fragments.ts` and `landing.ts` replaced the
		 * import line itself with the string "undefined".
		 */
		describe("the CSS pipeline", () => {
			/**
			 * React + Vite cannot take the default fixture's stack — it has no
			 * server to hold a connection string — so each framework is built with
			 * a set the wizard would actually allow.
			 */
			const legal = (framework: string): StarterAnswers =>
				framework === "react_vite"
					? {
							framework,
							database: "supabase",
							orm: "none",
							auth: "supabase_auth",
							billing: "none",
							email: "none",
						}
					: { framework };

			it.each([
				"nextjs",
				"tanstack_start",
				"react_vite",
			])("imports Tailwind ahead of any rule in %s's stylesheet", (framework) => {
				for (const landing of ["none", "editorial", "gallery"]) {
					const css = build({ ...legal(framework), landing })[
						"src/styles.css"
					] as string;

					expect(css, `${framework}/${landing}`).toContain(
						'@import "tailwindcss";',
					);
					/* The exact shape of the circular-import bug. */
					expect(css, `${framework}/${landing}`).not.toContain("undefined");

					/**
					 * Position, not line number.
					 *
					 * This asserted the file *began* with the Tailwind import, which
					 * was true until a webfont had to be imported too. The rule CSS
					 * actually enforces is looser and stricter at once: an `@import`
					 * is honoured only while nothing but other imports and comments
					 * precede it, and any number may share that space.
					 *
					 * So strip the comments, then require every `@import` to come
					 * before the first real rule. A font import placed after the
					 * Tailwind one is silently dropped from the build — which is how
					 * this was found — and so is a Tailwind import placed after a
					 * declaration.
					 */
					const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
					const firstRule = stripped.search(/^[^@\s]/m);
					const lastImport = stripped.lastIndexOf("@import");

					expect(
						firstRule === -1 || lastImport < firstRule,
						`${framework}/${landing}: an @import follows the first rule, so the browser will ignore it`,
					).toBe(true);
				}
			});

			/**
			 * And the engine has to be mounted in whichever tool compiles the CSS.
			 * Next reads PostCSS, Vite reads its own plugin list, and neither
			 * looks at the other's configuration.
			 */
			it("mounts the engine in Next's PostCSS", () => {
				const files = build({ framework: "nextjs" });
				const pkg = JSON.parse(files["package.json"] as string);

				expect(Object.keys(files)).toContain("postcss.config.mjs");
				expect(files["postcss.config.mjs"]).toContain("@tailwindcss/postcss");
				expect(pkg.devDependencies).toHaveProperty("@tailwindcss/postcss");
			});

			it.each([
				"tanstack_start",
				"react_vite",
			])("mounts the engine in %s's Vite config", (framework) => {
				const files = build(legal(framework));
				const pkg = JSON.parse(files["package.json"] as string);

				expect(files["vite.config.ts"]).toContain('from "@tailwindcss/vite"');
				expect(files["vite.config.ts"]).toMatch(
					/plugins:\s*\[\s*tailwindcss\(\)/,
				);
				expect(pkg.devDependencies).toHaveProperty("@tailwindcss/vite");
			});

			/** Declared and never mounted is what the bug looked like. */
			it("never declares an adapter the config does not use", () => {
				for (const framework of ["nextjs", "tanstack_start", "react_vite"]) {
					const files = build(legal(framework));
					const declared = Object.keys(
						JSON.parse(files["package.json"] as string).devDependencies,
					);
					const config =
						(files["postcss.config.mjs"] ?? "") +
						(files["vite.config.ts"] ?? "");

					for (const adapter of ["@tailwindcss/postcss", "@tailwindcss/vite"]) {
						if (declared.includes(adapter)) {
							expect(
								config,
								`${framework} declares ${adapter} unused`,
							).toContain(adapter);
						}
					}
				}
			});
		});

		/** Two rules the architecture doc states, and the output has to keep. */
		describe("the conventions it documents", () => {
			it("names one module per integration", () => {
				const paths = Object.keys(build());

				expect(paths).toContain("src/lib/auth.ts");
				expect(paths).toContain("src/lib/checkout.ts");
			});

			/**
			 * A script is a promise that a command works. `db:push` shipped for a
			 * while with no `drizzle.config.ts`, so the first thing anyone ran
			 * after generating failed on a missing file.
			 */
			it("ships the config every script it declares needs", () => {
				const files = build({ orm: "drizzle" });
				const pkg = JSON.parse(files["package.json"]);

				expect(Object.keys(pkg.scripts)).toContain("db:push");
				expect(Object.keys(files)).toContain("drizzle.config.ts");
				expect(files["drizzle.config.ts"]).toContain("./src/db/schema.ts");

				const prisma = build({ orm: "prisma" });
				expect(Object.keys(prisma)).toContain("prisma/schema.prisma");
			});

			it.each([
				{},
				withPublicEnv,
			])("puts a test beside every module in src/lib and src/db", (overrides) => {
				const paths = Object.keys(build(overrides));
				const modules = paths.filter(
					(path) =>
						/^src\/(lib|db)\/[^/]+\.ts$/.test(path) &&
						!path.endsWith(".test.ts") &&
						/* The client is a configured instance, specified by the schema
						   test rather than by one of its own. */
						path !== "src/db/client.ts",
				);

				expect(modules.length).toBeGreaterThan(2);
				for (const module of modules) {
					expect(paths, `${module} has no test beside it`).toContain(
						module.replace(/\.ts$/, ".test.ts"),
					);
				}
			});

			/**
			 * Typed env is the point of `src/lib/env.ts`. Any other file reading
			 * the raw environment skips the validation and reintroduces the bug.
			 *
			 * `public-env.ts` is the one sanctioned second reader: it parses the
			 * public half the same way, and it exists because a bundler will not
			 * substitute an unprefixed name into browser code at all.
			 */
			it("reads the raw environment in the two env modules and nowhere else", () => {
				/**
				 * Every stack, not one fixture.
				 *
				 * This used to build a single Supabase/Better Auth combination,
				 * which pinned the ORM to Drizzle — so the Prisma client, which
				 * read `process.env.NODE_ENV` directly to decide whether to cache
				 * itself across hot reloads, was never generated here and the
				 * violation shipped. Every starter with Prisma in it failed its
				 * own `src/lib/env.test.ts` on a clean checkout.
				 *
				 * The matrix is already built and cached for the suites below, so
				 * covering all of it costs nothing but this loop.
				 */
				for (const { answers, files } of everyGeneratedStarter()) {
					const readers = Object.entries(files)
						.filter(
							([path, contents]) =>
								path.startsWith("src/") &&
								/\.tsx?$/.test(path) &&
								!path.endsWith(".test.ts") &&
								/* Application code only. `vite.config.ts` touches
								   `process.env` to *fill* it from `.env`, which is the
								   job Next does for itself. */
								/(process|import\.meta)\.env/.test(contents),
						)
						.map(([path]) => path)
						.sort();

					/* A browser-only app has no server half, so it gets the public
					   module and nothing else. */
					const sanctioned = files["src/lib/env.ts"]
						? ["src/lib/env.ts", "src/lib/public-env.ts"]
						: ["src/lib/public-env.ts"];

					expect(readers, JSON.stringify(answers)).toEqual(
						sanctioned.filter((path) => files[path]),
					);
				}
			});

			/**
			 * The public half is compiled into the bundle every visitor downloads,
			 * so the line between the two modules is a security boundary rather
			 * than an organising one. Nothing secret may cross it.
			 */
			it("keeps secrets out of the module the browser gets", () => {
				const client = build(withPublicEnv)["src/lib/public-env.ts"];

				expect(client).toContain("SUPABASE_ANON_KEY");
				for (const secret of [
					"DATABASE_URL",
					"STRIPE_SECRET_KEY",
					"STRIPE_WEBHOOK_SECRET",
				]) {
					expect(client, `${secret} reaches the browser`).not.toContain(secret);
				}
			});

			/**
			 * A public variable without its framework's prefix is not substituted
			 * by the bundler, so it arrives in the browser as `undefined` — the
			 * failure looks like a wrong key rather than a missing one.
			 */
			it.each([
				["nextjs", "NEXT_PUBLIC_", "process.env"],
				["tanstack_start", "VITE_", "import.meta.env"],
			])("prefixes public variables the way %s requires", (fw, prefix, from) => {
				const files = build({ ...withPublicEnv, framework: fw });

				expect(files[".env.example"]).toContain(`${prefix}SUPABASE_URL=`);
				expect(files["src/lib/public-env.ts"]).toContain(
					`SUPABASE_URL: ${from}.${prefix}SUPABASE_URL`,
				);
				/* And the stand-in the suite runs against carries it too, or every
				   test that imports a component throws on a missing variable. */
				expect(files["vitest.config.ts"]).toContain(`${prefix}SUPABASE_URL:`);
			});

			it("declares every documented variable in one of the env schemas", () => {
				for (const [framework, prefix] of [
					["nextjs", "NEXT_PUBLIC_"],
					["tanstack_start", "VITE_"],
				]) {
					const files = build({ ...withPublicEnv, framework });
					const declared = [
						...files[".env.example"].matchAll(/^([A-Z][A-Z0-9_]*)=/gm),
					].map((match) => match[1] as string);

					expect(declared.length).toBeGreaterThan(0);
					for (const name of declared) {
						/* The prefix stops at `public-env.ts`; the schema field inside
						   it is the bare name, which is what every consumer reads. */
						const isPublic = name.startsWith(prefix);
						const field = isPublic ? name.slice(prefix.length) : name;
						const module = isPublic
							? "src/lib/public-env.ts"
							: "src/lib/env.ts";

						expect(files[module], `${name} is not parsed`).toMatch(
							new RegExp(`${field}: z\\.(url\\(\\)|string\\(\\))`),
						);
					}
				}
			});

			/**
			 * Better Auth rejects a base URL that is not a URL, so typing one as a
			 * plain string passes validation and then throws inside the SDK. The
			 * placeholder the suite runs against has to satisfy the same rule.
			 */
			it("validates location variables as URLs", () => {
				const files = build(withPublicEnv);
				const locations = [
					...files[".env.example"].matchAll(
						/^([A-Z][A-Z0-9_]*_(?:URL|URI))=/gm,
					),
				].map((match) => match[1] as string);

				expect(locations.length).toBeGreaterThan(0);
				for (const name of locations) {
					const field = name.replace(/^NEXT_PUBLIC_/, "");
					const schemas =
						files["src/lib/env.ts"] + files["src/lib/public-env.ts"];

					expect(schemas, name).toContain(`${field}: z.url()`);
				}
			});

			/**
			 * A stand-in has to be valid for the driver behind it, not merely for
			 * the schema. Neon's driver refuses anything that is not
			 * `postgresql://`, so a generic URL passed validation and then threw on
			 * the first import — which is how this test came to exist.
			 */
			it.each([
				["neon", "drizzle", "DATABASE_URL", /^postgresql:\/\//],
				["planetscale", "drizzle", "DATABASE_URL", /^mysql:\/\//],
				["turso", "drizzle", "TURSO_DATABASE_URL", /^libsql:\/\//],
				["mongodb", "mongoose", "MONGODB_URI", /^mongodb:\/\//],
			])("stands in for %s's connection string with a %s-shaped URL", (database, orm, variable, shape) => {
				const files = build({ database, orm, auth: "better_auth" });
				const line = files["vitest.config.ts"]
					.split("\n")
					.find((row) => row.includes(`${variable}:`));

				expect(line, `${variable} has no placeholder`).toBeDefined();
				expect(line?.match(/"([^"]+)"/)?.[1]).toMatch(shape);
			});
		});

		/**
		 * `ai-optimized.tsx` shows a visitor a question and the file that answers
		 * it — "where is authentication configured?" → `src/lib/auth.ts`. Those are
		 * promises about the repo they receive, so the generator has to keep them.
		 *
		 * Checked against a combination that selects every module the section
		 * mentions; a starter without billing legitimately has no `checkout.ts`.
		 */
		describe("what the landing page tells visitors to expect", () => {
			const complete = build({
				database: "neon",
				orm: "drizzle",
				auth: "better_auth",
				billing: "stripe",
				email: "resend",
				packageManager: "pnpm",
				landing: "editorial",
			});

			it.each(LOOKUPS)("answers '$ask' at $path", ({ path }) => {
				expect(Object.keys(complete)).toContain(path);
			});

			it.each(
				TREE.filter((node) => node.path),
			)("emits $path, which the advertised tree shows", ({ path }) => {
				expect(Object.keys(complete)).toContain(path as string);
			});
		});

		/** A model reading the repo cold needs somewhere to start. */
		it("ships the documents an assistant is told to read", () => {
			const files = build();

			expect(files["ARCHITECTURE.md"]).toContain("One module per integration");
			expect(files["AGENTS.md"]).toContain("ARCHITECTURE.md");
			expect(files["AGENTS.md"]).toContain("npm run typecheck");
		});

		/**
		 * Checked across the source rather than in one file: with a landing
		 * template the home page is three lines rendering `<Landing />`, and the
		 * name lives in `content.ts` where a buyer edits it. Naming the file
		 * here would mean this test moves every time the page does.
		 */
		it.each([
			["without a landing page", { landing: "none" }],
			["with the Editorial one", { landing: "editorial" }],
			["with the Gallery one", { landing: "gallery" }],
		])("puts the project name into the source %s", (_case, overrides) => {
			const files = build({ ...overrides, project: "ada-app" });
			const source = Object.entries(files)
				.filter(([path]) => path.startsWith("src/") && /\.tsx?$/.test(path))
				.map(([, contents]) => contents)
				.join("\n");

			expect(source).toContain("ada-app");
			expect(source).not.toContain("{{project}}");
		});

		/** A stray token means a template placeholder shipped unfilled. */
		it("leaves no unreplaced template tokens anywhere", () => {
			for (const contents of Object.values(build())) {
				expect(contents).not.toMatch(/\{\{\w+\}\}/);
			}
		});

		it("writes a package.json that parses", () => {
			const pkg = JSON.parse(build()["package.json"]);

			expect(pkg.name).toBe("my-app");
			expect(pkg.scripts.test).toBe("vitest run");
		});

		/** Two runs of the same answers must be byte-identical, or nothing below holds. */
		it("is deterministic", () => {
			expect(build()).toEqual(build());
		});

		/**
		 * Every script in the generated package.json has to work on a clean
		 * install. `typecheck` shipped broken once: the suite imports `node:fs`
		 * and `@types/node` was missing, so a fresh `install && typecheck`
		 * failed on a project we had just told the reader was green.
		 */
		it("types the node builtins its own files import", () => {
			const files = build();
			const usesNodeBuiltins = Object.values(files).some((contents) =>
				/from "node:/.test(contents),
			);
			const pkg = JSON.parse(files["package.json"]);
			const tsconfig = JSON.parse(files["tsconfig.json"]);

			expect(usesNodeBuiltins).toBe(true);
			expect(pkg.devDependencies).toHaveProperty("@types/node");
			expect(tsconfig.compilerOptions.types).toContain("node");
		});

		/**
		 * A script naming a binary nothing installs fails the first time someone
		 * runs it — which, for `dev`, is immediately.
		 */
		it("installs a package for every binary its scripts invoke", () => {
			const providers: Record<string, string | null> = {
				vitest: "vitest",
				tsc: "typescript",
				next: "next",
				vite: "vite",
				/* Ships with the runtime rather than a package. */
				node: null,
				"drizzle-kit": "drizzle-kit",
				tsr: "@tanstack/router-cli",
				prisma: "prisma",
			};

			for (const { files } of everyGeneratedStarter()) {
				const pkg = JSON.parse(files["package.json"]);
				const installed = Object.keys({
					...pkg.dependencies,
					...pkg.devDependencies,
				});

				for (const command of Object.values(pkg.scripts) as string[]) {
					/* A chained script promises every step, so each is checked. */
					for (const step of command.split("&&")) {
						const binary = step.trim().split(" ")[0] as string;
						expect(binary in providers, `unknown binary "${binary}"`).toBe(
							true,
						);

						const needed = providers[binary];
						if (needed) {
							expect(installed, `"${binary}" needs ${needed}`).toContain(
								needed,
							);
						}
					}
				}
			}
		});
	});

	describe("what the answers actually change", () => {
		it("pulls in the dependency for the chosen framework, and not the other", () => {
			const next = JSON.parse(build({ framework: "nextjs" })["package.json"]);
			const tanstack = JSON.parse(
				build({ framework: "tanstack_start" })["package.json"],
			);

			expect(next.dependencies).toHaveProperty("next");
			expect(next.dependencies).not.toHaveProperty("@tanstack/react-start");
			expect(tanstack.dependencies).toHaveProperty("@tanstack/react-start");
			expect(tanstack.dependencies).not.toHaveProperty("next");
		});

		/**
		 * Anchored to line starts: `TURSO_DATABASE_URL` contains the literal
		 * `DATABASE_URL`, so a substring check reports the wrong variable as
		 * present and passes when it should not.
		 */
		it("documents the environment variables that stack needs", () => {
			const neon = build({ database: "neon" })[".env.example"];
			const turso = build({ database: "turso", orm: "drizzle" })[
				".env.example"
			];

			expect(neon).toMatch(/^DATABASE_URL=$/m);
			expect(turso).toMatch(/^TURSO_DATABASE_URL=$/m);
			expect(turso).not.toMatch(/^DATABASE_URL=$/m);
		});

		it("leaves billing variables out when billing was declined", () => {
			expect(build({ billing: "stripe" })[".env.example"]).toContain(
				"STRIPE_SECRET_KEY=",
			);
			expect(build({ billing: "none" })[".env.example"]).not.toContain(
				"STRIPE",
			);
		});

		it("names every choice in the README", () => {
			const readme = build()["README.md"];

			expect(readme).toContain("# my-app");
			for (const label of [
				"Next.js",
				"shadcn/ui",
				"Neon",
				"Drizzle",
				"Stripe",
			]) {
				expect(readme).toContain(label);
			}
		});

		it("records the answers in the project itself", () => {
			const stack = build()["src/lib/stack.ts"];

			expect(stack).toContain('framework: "nextjs"');
			expect(stack).toContain('database: "neon"');
		});
	});

	/**
	 * The product's whole claim is that what arrives is honest. A zip that looks
	 * like a finished starter while shipping only its skeleton would be the one
	 * unrecoverable thing to get wrong, so the README has to say so out loud.
	 */
	it("tells the reader what is not built yet", () => {
		const readme = build()["README.md"];

		expect(readme).toMatch(/early build/i);
		expect(readme).toContain("What is not here");
	});

	/**
	 * "Where is the installation of the picked libraries?" is a fair question
	 * with an unwelcome answer, so the README has to answer it rather than
	 * leaving someone to discover the omission by unzipping.
	 */
	it("explains why node_modules is not in the archive", () => {
		const readme = build()["README.md"];

		expect(readme).toContain("node_modules");
		expect(readme).toMatch(/lockfile/i);
	});

	/**
	 * Every combination the wizard can produce has to build. This is the cheap
	 * half of the matrix `product-model.md` describes — it proves generation
	 * never throws and never emits an empty file, not that the output compiles.
	 */
	describe("across every combination the wizard allows", () => {
		it("has combinations to check", () => {
			expect(everyLegalCombination().length).toBeGreaterThan(100);
		});

		it("builds all of them without throwing", () => {
			for (const combination of everyLegalCombination()) {
				expect(() => buildStarter(combination)).not.toThrow();
			}
		});

		it("emits no empty files, in any of them", () => {
			for (const { files } of everyGeneratedStarter()) {
				for (const [path, contents] of Object.entries(files)) {
					expect(contents.length, `${path} was empty`).toBeGreaterThan(0);
				}
			}
		});

		it("writes valid JSON in all of them", () => {
			for (const { files } of everyGeneratedStarter()) {
				expect(() => JSON.parse(files["package.json"])).not.toThrow();
				expect(() => JSON.parse(files["tsconfig.json"])).not.toThrow();
			}
		});
	});
});
