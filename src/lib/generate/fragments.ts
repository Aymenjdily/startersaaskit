import type { StarterAnswers } from "@/lib/starter-questions";
import { auth0Fragment } from "./auth-auth0";
import { betterAuthFragment } from "./auth-better";
import { clerkAuthFragment } from "./auth-clerk";
import { neonAuthFragment } from "./auth-neon";
import { supabaseAuthFragment } from "./auth-supabase";
import { claudeSkill } from "./claude-skill";
import { inngestJobsFragment } from "./jobs-inngest";
import { qstashJobsFragment } from "./jobs-qstash";
import { triggerJobsFragment } from "./jobs-trigger";
import { landingFragment } from "./landing";
import { BASE_STYLES } from "./styles";

/**
 * The modules a starter is assembled from.
 *
 * `context/product-model.md` calls for extension points rather than text
 * merging: each answer contributes files, dependencies, environment variables
 * and scripts, and generation is a structured merge. This is that.
 *
 * ## The shape of what comes out
 *
 * Everything lives under `src/`. The only thing that differs between the two
 * frameworks is the routing directory — `src/app` for Next, `src/routes` for
 * TanStack Start — and every other folder is identical. That is the whole
 * reason a second framework costs one adapter rather than a second catalogue.
 *
 *     src/
 *       app/ | routes/   routing only, thin: read params, call a service, render
 *       components/ui/   presentational primitives, no data fetching
 *       db/              schema and client. The only place SQL is written
 *       lib/             one module per integration, named after the integration
 *       server/          server-only. Importing it from a client component fails
 *       styles.css
 *
 * Two rules make it legible to a person and to a model reading it cold:
 * **one module per integration, named after the thing it integrates**, and
 * **the test sits beside the module**. Asked "where is auth configured?", both
 * answer `src/lib/auth.ts` without searching. `src/components/landing/
 * ai-optimized.tsx` advertises exactly this, and a test holds the generator to
 * it.
 *
 * What is deliberately *not* here: `node_modules`. A dependency tree for a
 * Next.js app is hundreds of megabytes and contains platform-specific native
 * binaries, so an archive built on a Linux server would be broken on the
 * reader's Mac.
 */

export type Fragment = {
	files?: Record<string, string>;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	/**
	 * `[name, comment, testPlaceholder?]`, written into `.env.example`.
	 *
	 * The placeholder is what the suite runs against. It belongs to the module
	 * that declares the variable because only that module knows the shape:
	 * Neon's driver rejects anything that is not a `postgresql://` string, so a
	 * generic URL passes validation and then throws inside the driver.
	 */
	env?: [string, string, string?][];
	/**
	 * The same shape, for variables the *browser* reads.
	 *
	 * They are declared separately because a bundler will not hand a secret to
	 * client code by accident: Next only inlines `NEXT_PUBLIC_*` and Vite only
	 * inlines `VITE_*`. The generator adds whichever prefix the chosen framework
	 * uses, so a fragment names the variable once — `SUPABASE_ANON_KEY` — and
	 * both starters get a name their bundler will actually substitute.
	 *
	 * Anything listed here is shipped to every visitor. Publishable keys and
	 * project URLs belong here; nothing else does.
	 */
	publicEnv?: [string, string, string?][];
	scripts?: Record<string, string>;
};

const REACT = { react: "^19.1.0", "react-dom": "^19.1.0" };
const REACT_TYPES = {
	"@types/react": "^19.1.0",
	"@types/react-dom": "^19.1.0",
};

/* --------------------------------------------------------------------- base */

/** Everything neither framework nor module: config, docs, the shared helpers. */
const BASE: Fragment = {
	/**
	 * `server-only` is declared even though Next bundles a copy: TanStack Start
	 * does not, so relying on the framework to provide it makes `src/server/`
	 * fail to resolve on one of the two paths.
	 */
	dependencies: { zod: "^4.0.0", "server-only": "^0.0.1" },
	devDependencies: { "@vitejs/plugin-react": "^5.0.0" },
	files: {
		"vitest.config.ts": `import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "node",
		globals: true,
		/**
		 * Placeholders, so the suite runs on a clean checkout with no .env.
		 *
		 * \`src/lib/env.ts\` throws when a variable is missing — which is the
		 * point of it — and without these, every test that transitively imports
		 * an integration would fail before reaching a single assertion. None of
		 * these values reach a real service; a test that needs one should mock
		 * the module rather than talk to it.
		 */
		env: {
{{testEnv}}
		},
	},
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
});
`,
		"src/lib/seo.ts": `/**
 * One description of this site, read by every framework's document shell.
 *
 * Metadata rots because it is written three times — a title in the layout, an
 * \`og:title\` in a partial, a \`twitter:title\` somebody added later — and only
 * one of them gets updated. Everything here is derived from four constants, so
 * a rename cannot leave two thirds of the tags describing the old product.
 *
 * ## Set \`url\` before you launch
 *
 * It is the one value that cannot be guessed. Canonical links, Open Graph and
 * the sitemap all resolve against it, and a relative \`og:image\` is simply
 * ignored by every crawler — they fetch metadata out of band, with no page to
 * resolve against.
 */
export const SITE = {
	name: "{{project}}",
	/** Used as the tab title on the home page and after the dash elsewhere. */
	tagline: "Design and engineering studio",
	description:
		"We design and build the software your roadmap keeps postponing — in your stack, alongside your team, shipped to production.",
	/** No trailing slash: everything below joins onto it directly. */
	url: "https://example.com",
	locale: "en_GB",
	/** Leave empty to omit the Twitter creator tag rather than emit an empty one. */
	twitter: "",
	/**
	 * A 1200x630 PNG or JPEG, absolute URL.
	 *
	 * Deliberately empty. An \`og:image\` pointing at a file that 404s is worse
	 * than none: the major crawlers cache the failure, and the link keeps
	 * previewing blank long after you upload the artwork. Fill this in when the
	 * image exists — SVG will not do, none of them render it.
	 */
	image: "",
} as const;

/** \`https://example.com/about\` from \`/about\`. */
export function canonical(path = "/"): string {
	return new URL(path, \`\${SITE.url}/\`).toString();
}

/** The page title: bare on the home page, suffixed everywhere else. */
export function pageTitle(title?: string): string {
	return title ? \`\${title} — \${SITE.name}\` : \`\${SITE.name} — \${SITE.tagline}\`;
}

type Tag = { name?: string; property?: string; content: string };

/**
 * The meta tags, for the shells that want raw ones.
 *
 * Open Graph uses \`property\`, Twitter and the rest use \`name\`. They are not
 * interchangeable: Facebook's parser ignores \`name="og:title"\` outright, which
 * is the most common reason a link preview comes back empty.
 *
 * Empty values are dropped rather than emitted blank — a crawler treats
 * \`<meta property="og:image" content="">\` as a declared image it cannot
 * fetch.
 */
export function metaTags(options: { title?: string; path?: string } = {}): Tag[] {
	const title = pageTitle(options.title);
	const url = canonical(options.path ?? "/");

	return [
		{ name: "description", content: SITE.description },
		{ property: "og:type", content: "website" },
		{ property: "og:site_name", content: SITE.name },
		{ property: "og:title", content: title },
		{ property: "og:description", content: SITE.description },
		{ property: "og:url", content: url },
		{ property: "og:locale", content: SITE.locale },
		{ property: "og:image", content: SITE.image },
		{
			name: "twitter:card",
			content: SITE.image ? "summary_large_image" : "summary",
		},
		{ name: "twitter:title", content: title },
		{ name: "twitter:description", content: SITE.description },
		{ name: "twitter:image", content: SITE.image },
		{ name: "twitter:creator", content: SITE.twitter },
	].filter((tag) => tag.content.length > 0);
}

/**
 * Structured data, as an Organization that also publishes a WebSite.
 *
 * A \`@graph\` with two nodes rather than two separate scripts: it lets the
 * WebSite point at the Organization by id, so a search engine understands they
 * are the same entity instead of guessing from a matching name.
 *
 * Return the object, and let the shell stringify it into the script tag — see
 * the note there about why it is not interpolated as a template string.
 */
export function jsonLd() {
	return {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "Organization",
				"@id": \`\${SITE.url}/#organization\`,
				name: SITE.name,
				url: SITE.url,
				description: SITE.description,
			},
			{
				"@type": "WebSite",
				"@id": \`\${SITE.url}/#website\`,
				url: SITE.url,
				name: SITE.name,
				publisher: { "@id": \`\${SITE.url}/#organization\` },
				inLanguage: SITE.locale.replace("_", "-"),
			},
		],
	};
}
`,
		"src/lib/seo.test.ts": `import { describe, expect, it } from "vitest";
import { canonical, jsonLd, metaTags, pageTitle, SITE } from "./seo";

describe("seo", () => {
	it("titles the home page without a suffix and inner pages with one", () => {
		expect(pageTitle()).toBe(\`\${SITE.name} — \${SITE.tagline}\`);
		expect(pageTitle("Pricing")).toBe(\`Pricing — \${SITE.name}\`);
	});

	it("builds absolute canonicals whatever the path looks like", () => {
		expect(canonical("/")).toBe(\`\${SITE.url}/\`);
		expect(canonical("/about")).toBe(\`\${SITE.url}/about\`);
		/* Without a trailing slash on the base, \`new URL\` would replace the last
		   segment rather than append to it. */
		expect(canonical("about")).toBe(\`\${SITE.url}/about\`);
	});

	/**
	 * The rule that makes link previews work. Facebook's parser ignores
	 * \`name="og:*"\` and Twitter ignores \`property="twitter:*"\`, and both
	 * failures look identical from the outside: an empty preview.
	 */
	it("puts Open Graph on property and everything else on name", () => {
		for (const tag of metaTags()) {
			if (tag.property) expect(tag.property.startsWith("og:")).toBe(true);
			if (tag.name) expect(tag.name.startsWith("og:")).toBe(false);
		}
	});

	/** An empty tag is a promise of content the crawler cannot fetch. */
	it("omits tags with nothing in them", () => {
		expect(metaTags().every((tag) => tag.content.length > 0)).toBe(true);

		if (!SITE.image) {
			const names = metaTags().map((tag) => tag.property ?? tag.name);

			expect(names).not.toContain("og:image");
			expect(names).not.toContain("twitter:image");
		}
	});

	it("falls back to a small card when there is no image to show", () => {
		const card = metaTags().find((tag) => tag.name === "twitter:card");

		expect(card?.content).toBe(SITE.image ? "summary_large_image" : "summary");
	});

	it("links the website node to the organisation by id", () => {
		const graph = jsonLd()["@graph"];
		const org = graph.find((node) => node["@type"] === "Organization");
		const site = graph.find((node) => node["@type"] === "WebSite");

		expect(site?.publisher).toEqual({ "@id": org?.["@id"] });
	});
});
`,
		/**
		 * The favicon, drawn rather than downloaded.
		 *
		 * One SVG at every size: modern browsers prefer it over a .ico and it
		 * stays sharp on a 4K tab strip. Safari still wants a PNG for a pinned
		 * tab and iOS wants one for the home screen — add \`apple-touch-icon.png\`
		 * when you have the artwork rather than shipping a link to a file that
		 * is not there.
		 *
		 * \`prefers-color-scheme\` inside the file, so the mark inverts with the
		 * browser chrome instead of disappearing into a dark tab bar. An
		 * embedded \`<style>\` is the only way to reach it — a favicon gets no
		 * cascade from the page that references it.
		 */
		"public/icon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
	<style>
		path { fill: #1a1716; }
		@media (prefers-color-scheme: dark) {
			path { fill: #efedeb; }
		}
	</style>
	<path
		fill-rule="evenodd"
		d="M5 1.5h14A3.5 3.5 0 0 1 22.5 5v14a3.5 3.5 0 0 1-3.5 3.5H5A3.5 3.5 0 0 1 1.5 19V5A3.5 3.5 0 0 1 5 1.5Zm8.5 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"
	/>
</svg>
`,
		"src/lib/utils.ts": `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges class names, with later Tailwind utilities winning conflicts. */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
`,
		"src/lib/utils.test.ts": `import { describe, expect, it } from "vitest";
import { cn } from "./utils.js";

describe("cn", () => {
	it("joins class names", () => {
		expect(cn("a", "b")).toBe("a b");
	});

	it("drops falsy values rather than printing them", () => {
		expect(cn("a", false && "b", undefined, "c")).toBe("a c");
	});

	/** The reason this exists rather than plain \`clsx\`: later wins. */
	it("resolves conflicting Tailwind utilities in favour of the last", () => {
		expect(cn("p-2", "p-4")).toBe("p-4");
	});
});
`,
		/**
		 * Typed env is the single highest-value thing a starter can ship. The
		 * alternative — `process.env.DATABASE_URL!` scattered around — fails at
		 * 3am in production with "cannot read property of undefined" instead of
		 * at boot with the name of the variable you forgot.
		 */
		"src/lib/env.ts": `import { z } from "zod";

/**
 * Environment variables, parsed once at boot.
 *
 * Every value this project reads is declared here and nowhere else. Reaching
 * for \`process.env\` anywhere else is a bug: it skips validation, and a typo
 * becomes \`undefined\` at the moment it is used rather than a clear failure at
 * startup.
 *
 * Add a variable here and to \`.env.example\` in the same commit.
 */
const schema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
{{envSchema}}
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
	/* Printed as a list of names, not a stack trace: the reader needs to know
	   which variables are missing, and nothing else. */
	const missing = parsed.error.issues
		.map((issue) => \`  \${issue.path.join(".")}: \${issue.message}\`)
		.join("\\n");

	throw new Error(\`Invalid environment.\\n\${missing}\\n\\nSee .env.example.\`);
}

export const env = parsed.data;

export type Env = typeof env;
`,
		"src/lib/env.test.ts": `import { describe, expect, it } from "vitest";

/**
 * The contract, not the values: this asserts that a missing variable is a loud
 * failure rather than a silent \`undefined\`, which is the property the rest of
 * the codebase depends on when it imports \`env\`.
 */
describe("env", () => {
	it("is parsed and exported as a typed object", async () => {
		const { env } = await import("./env.js");

		expect(env.NODE_ENV).toBeDefined();
	});

	it("reads the environment only in env.ts and public-env.ts", async () => {
		const { readFileSync, readdirSync, statSync } = await import("node:fs");
		const { join } = await import("node:path");

		const offenders: string[] = [];
		const walk = (dir: string) => {
			for (const entry of readdirSync(dir)) {
				const full = join(dir, entry);
				if (statSync(full).isDirectory()) {
					walk(full);
					continue;
				}
				if (!/\\.(ts|tsx)$/.test(entry)) continue;
				/* Skip the two modules that are allowed to, and every test — this
				   file names \`process.env\` in order to search for it.
				   \`public-env.ts\` is the browser's half: the prefix its bundler
				   requires lives there and stops there. */
				if (
					entry === "env.ts" ||
					entry === "public-env.ts" ||
					entry.endsWith(".test.ts")
				) {
					continue;
				}
				const source = readFileSync(full, "utf8");
				if (/(process|import\\.meta)\\.env/.test(source)) {
					offenders.push(full);
				}
			}
		};
		walk("src");

		expect(offenders).toEqual([]);
	});
});
`,
		"src/server/session.ts": `import "server-only";

/**
 * Server-only helpers.
 *
 * The \`server-only\` import at the top is a build-time tripwire: importing
 * anything from this folder into a client component fails the build with a
 * clear message, rather than shipping secrets to the browser and finding out
 * from a security report.
 */

export type SessionUser = {
	id: string;
	email: string;
};

/**
 * The signed-in user, or null.
 *
 * Wired to your auth choice in \`src/lib/auth.ts\`. Everything that needs to
 * know who is asking calls this, so swapping the provider is one file.
 */
export async function currentUser(): Promise<SessionUser | null> {
	return null;
}
`,
		"src/styles.css": BASE_STYLES,
		"src/components/ui/button.tsx": `import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * A primitive. Presentational only — no data fetching, no server imports — so
 * it can be rendered anywhere and tested without a database.
 */
export function Button({ className, ...props }: ComponentProps<"button">) {
	return (
		<button
			className={cn(
				"inline-flex h-10 items-center justify-center rounded-md bg-neutral-900 px-4",
				"font-medium text-sm text-white transition-colors hover:bg-neutral-700",
				"focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
				className,
			)}
			type="button"
			{...props}
		/>
	);
}
`,
		"ARCHITECTURE.md": `# Architecture

A map of this repository. Read this before adding a file, and add to it when
you add a folder.

## Layout

    src/
      {{routingDir}}/{{routingPad}}routing only. Read params, call a service, render
      components/ui/   presentational primitives. No data fetching
      db/              schema and client. The only place queries are written
      lib/             one module per integration, named after it
      server/          server-only. Importing from a client component fails the build
      styles.css

## The two rules

**One module per integration, named after the thing it integrates.** Auth lives
in \`src/lib/auth.ts\`. Billing lives in \`src/lib/checkout.ts\`. Nothing else
reaches for the provider's SDK, so replacing one is a single file.

**The test sits beside the module.** \`src/lib/auth.ts\` is specified by
\`src/lib/auth.test.ts\`. Intent is executable rather than described in a comment
that drifted two refactors ago.

## Where things go

| You are adding | It goes in |
| -------------- | ---------- |
| A page or route | \`src/{{routingDir}}/\` |
| A reusable visual component | \`src/components/ui/\` |
| A table or a query | \`src/db/\` |
| A third-party service | \`src/lib/<service>.ts\` |
| Something that must never reach the browser | \`src/server/\` |
| An environment variable | \`src/lib/env.ts\` **and** \`.env.example\` |

## Boundaries that are enforced, not suggested

- \`src/server/\` imports \`server-only\`, so leaking it into a client component
  is a build error.
- \`src/lib/env.ts\` is the only file permitted to read \`process.env\`. A test
  fails if another one does.
- \`@/\` resolves to \`src/\`. There are no relative imports that climb out of a
  folder.
`,
		"AGENTS.md": `# Working in this repository

Notes for an AI assistant, and for anyone new. Kept short on purpose — a file
nobody can hold in their head gets ignored.

## Before you write code

Read \`ARCHITECTURE.md\`. It says where each kind of file goes, and the table
near the bottom answers most "where should this live?" questions directly.

Then check \`.claude/skills/\`. Every library this project was generated with —
its framework, database, ORM, auth provider, and any billing or email
provider — has its own skill there, named after it. Each one exists because
the library has a rule that is easy to get wrong and does not show up in its
own error messages: a plugin that has to be registered or sessions quietly
stop persisting, a route tree that has to be generated before the type
checker can see it. Read the skill for whatever you are about to touch before
you touch it, not after something breaks.

## Conventions

- \`@/\` resolves to \`src/\`. Prefer it over relative paths that climb.
- One module per integration, named after the integration: \`src/lib/auth.ts\`,
  \`src/lib/checkout.ts\`. Do not reach for a provider SDK anywhere else.
- The test sits beside the module: \`foo.ts\` is specified by \`foo.test.ts\`.
- Environment variables are declared in \`src/lib/env.ts\` and \`.env.example\`,
  and read from \`env\` — never from \`process.env\`. A test enforces this.
- Anything that must not reach the browser goes in \`src/server/\`, which imports
  \`server-only\`.

## Before you say you are done

\`\`\`bash
{{runTypecheck}}
{{runTest}}
\`\`\`

Both pass on a clean checkout. If your change breaks one, the change is not
finished.

## What this project is

{{stackSummary}}

Generated by StarterSaaSKit. The stack above was chosen at generation time and
is recorded in \`src/lib/stack.ts\`.
`,
	},
};

/* --------------------------------------------------------------- frameworks */

/**
 * Tailwind's CSS pipeline, which is framework-specific and easy to leave out.
 *
 * `src/styles.css` starts with `@import "tailwindcss"` in every starter, and
 * that import on its own does nothing: the engine has to be mounted in
 * whichever build tool is compiling the CSS. Next compiles it through PostCSS,
 * Vite through a Vite plugin, and neither reads the other's configuration.
 *
 * This was missing for both, and the failure is quiet in exactly the wrong
 * way. `@import "tailwindcss"` resolves — the package ships a CSS file — so
 * nothing errors. It simply emits no utilities, and every `className` in the
 * project becomes decoration. A page of plain text still renders, which is why
 * it survived until a designed landing page made it obvious.
 */
const TAILWIND_POSTCSS = {
	tailwindcss: "^4.1.0",
	"@tailwindcss/postcss": "^4.1.0",
};

const TAILWIND_POSTCSS_FILES = {
	"postcss.config.mjs": `/**
 * The one line that makes every Tailwind class in this project real.
 *
 * Next compiles CSS through PostCSS, so this is where the engine mounts.
 * Without it \`@import "tailwindcss"\` still resolves and still emits nothing,
 * and the app renders unstyled with no error to explain why.
 */
export default {
	plugins: { "@tailwindcss/postcss": {} },
};
`,
};

const TAILWIND_VITE = { tailwindcss: "^4.1.0", "@tailwindcss/vite": "^4.1.0" };

const NEXTJS: Fragment = {
	dependencies: { next: "^15.5.0", ...REACT },
	devDependencies: { ...REACT_TYPES, ...TAILWIND_POSTCSS },
	scripts: { dev: "next dev", build: "next build", start: "next start" },
	files: {
		...claudeSkill(
			"nextjs",
			"Next.js App Router conventions for this project — routing, metadata, route handlers. Use when adding a page, a layout, or an API route.",
			`
## Where routes live

Every route is under \`src/app/\`, not \`app/\` at the repository root — this
project keeps all source inside \`src/\`. Two route groups split the app
without splitting the URL: \`(marketing)\` for the public pages and \`(app)\`
for the signed-in ones. A route group's parentheses are never part of the
URL, so \`src/app/(marketing)/page.tsx\` serves \`/\`.

## Metadata comes from one place

\`src/lib/seo.ts\` exports \`SITE\`, \`canonical()\`, \`pageTitle()\`, \`metaTags()\`
and \`jsonLd()\`. \`src/app/layout.tsx\` builds its \`Metadata\` object from these.
Add a new page's title through \`pageTitle("Pricing")\`, not by writing a
string — the template in the root layout's \`metadata.title.template\` applies
to it automatically. Never hand-write an Open Graph or Twitter tag; that is
exactly the duplication \`lib/seo.ts\` exists to prevent.

\`metadataBase\` is set in the root layout for a reason: without it, every
Open Graph and Twitter URL Next emits is relative, and crawlers — which fetch
metadata without a page to resolve it against — drop them silently.

## Route handlers, not pages, for anything that returns data

An API route is a \`route.ts\` file exporting \`GET\`, \`POST\`, etc. — see
\`src/app/api/health/route.ts\`. It runs on the server, so it may import
\`@/server/*\` and \`@/lib/env\`; a page component under \`(marketing)\` or
\`(app)\` may not import \`@/server/*\` unless it is itself an \`async\` Server
Component, and never as a Client Component (\`"use client"\`).

## Before you say a change works

\`next build\` also runs the type checker and lint over every route, so a
route that fails \`npm run typecheck\` will fail the build too — check it
locally first, that feedback loop is faster.
`,
		),
		...TAILWIND_POSTCSS_FILES,
		"next.config.ts": `import type { NextConfig } from "next";

const config: NextConfig = {};

export default config;
`,
		"src/app/layout.tsx": `import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { canonical, jsonLd, pageTitle, SITE } from "@/lib/seo";
import "@/styles.css";

/**
 * Everything here is derived from \`lib/seo.ts\` rather than typed out again.
 *
 * \`metadataBase\` is the one that catches people: without it Next emits your
 * Open Graph and Twitter URLs relative, and every crawler drops them, because
 * they fetch metadata with no page context to resolve against. The symptom is
 * a link preview that is blank for no visible reason.
 *
 * The title \`template\` applies to child routes that set their own \`title\`;
 * \`default\` is what the home page gets. Both come from the same helper the
 * other two frameworks call, so they cannot drift apart.
 */
export const metadata: Metadata = {
	metadataBase: new URL(SITE.url),
	title: {
		default: pageTitle(),
		template: \`%s — \${SITE.name}\`,
	},
	description: SITE.description,
	applicationName: SITE.name,
	alternates: { canonical: canonical("/") },
	openGraph: {
		type: "website",
		siteName: SITE.name,
		title: pageTitle(),
		description: SITE.description,
		url: canonical("/"),
		locale: SITE.locale,
		...(SITE.image ? { images: [{ url: SITE.image, width: 1200, height: 630 }] } : {}),
	},
	twitter: {
		card: SITE.image ? "summary_large_image" : "summary",
		title: pageTitle(),
		description: SITE.description,
		...(SITE.twitter ? { creator: SITE.twitter } : {}),
		...(SITE.image ? { images: [SITE.image] } : {}),
	},
	icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
	robots: {
		index: true,
		follow: true,
		/* Let Google show a full text snippet and a large image rather than the
		   truncated default, and never auto-translate the page. */
		googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
	},
};

/**
 * Split from \`metadata\` because Next requires it: viewport and theme colour
 * moved out in Next 14 and warn loudly if you leave them behind.
 *
 * Two theme colours so the browser chrome follows the page rather than fighting
 * it — the site is paper in light mode and near-black in dark.
 */
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#efedeb" },
		{ media: "(prefers-color-scheme: dark)", color: "#1a1716" },
	],
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				{children}

				{/**
				 * Structured data, stringified rather than written as a template.
				 *
				 * \`JSON.stringify\` escapes what needs escaping. Hand-writing this
				 * block is how a stray quote in a company name turns the script into
				 * a parse error, and how a \`</script>\` inside any string becomes an
				 * XSS hole — the browser ends the script at that text regardless of
				 * where the JSON thinks it is.
				 */}
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has to be inline, and the content is generated rather than user input
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd()) }}
					type="application/ld+json"
				/>
			</body>
		</html>
	);
}
`,
		/**
		 * Both generated rather than shipped as static files, so they follow
		 * \`SITE.url\` instead of hard-coding a domain that will be wrong in
		 * staging.
		 */
		"src/app/robots.ts": `import type { MetadataRoute } from "next";
import { canonical } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [{ userAgent: "*", allow: "/" }],
		sitemap: canonical("/sitemap.xml"),
	};
}
`,
		"src/app/sitemap.ts": `import type { MetadataRoute } from "next";
import { canonical } from "@/lib/seo";

/**
 * One entry for now. Add a route here when you add a page — nothing crawls
 * your app looking for them, and a sitemap that lists a third of the site is
 * the usual reason the rest takes weeks to appear.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: canonical("/"),
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
	];
}
`,

		/* Route groups: `(marketing)` and `(app)` share a URL space but not a
		   layout, which is the split every SaaS grows into by week two. */
		"src/app/(marketing)/page.tsx": `import { STACK } from "@/lib/stack";

export default function Home() {
	return (
		<main className="mx-auto max-w-2xl p-12">
			<h1 className="font-semibold text-3xl">{{project}}</h1>
			<p className="mt-2 text-neutral-500">
				Generated by StarterSaaSKit. Your stack:
			</p>
			<ul className="mt-6 space-y-1">
				{Object.entries(STACK).map(([layer, choice]) => (
					<li key={layer}>
						<span className="text-neutral-500">{layer}</span> — {choice}
					</li>
				))}
			</ul>
		</main>
	);
}
`,
		"src/app/(app)/layout.tsx": `import type { ReactNode } from "react";
import { currentUser } from "@/server/session";

/**
 * The signed-in half of the app. Everything under \`(app)\` is behind this,
 * so the check lives in one place rather than at the top of every page.
 */
export default async function AppLayout({
	children,
}: {
	children: ReactNode;
}) {
	const user = await currentUser();

	if (!user) {
		return (
			<main className="mx-auto max-w-2xl p-12">
				<h1 className="font-semibold text-2xl">Sign in required</h1>
				<p className="mt-2 text-neutral-500">
					Wire this up in <code>src/lib/auth.ts</code>.
				</p>
			</main>
		);
	}

	return <div className="min-h-screen">{children}</div>;
}
`,
		"src/app/(app)/dashboard/page.tsx": `export default function Dashboard() {
	return (
		<main className="mx-auto max-w-2xl p-12">
			<h1 className="font-semibold text-2xl">Dashboard</h1>
			<p className="mt-2 text-neutral-500">Start here.</p>
		</main>
	);
}
`,
		"src/app/api/health/route.ts": `import { env } from "@/lib/env";

/** Liveness. Reads env so a misconfigured deploy fails here, loudly. */
export function GET() {
	return Response.json({ ok: true, environment: env.NODE_ENV });
}
`,
	},
};

const TANSTACK_START: Fragment = {
	dependencies: {
		"@tanstack/react-router": "^1.132.0",
		"@tanstack/react-start": "^1.132.0",
		...REACT,
	},
	devDependencies: {
		...REACT_TYPES,
		...TAILWIND_VITE,
		"@tanstack/nitro-v2-vite-plugin": "^1.155.0",
		"@tanstack/router-cli": "^1.132.0",
		vite: "^7.0.0",
	},
	scripts: {
		dev: "vite dev --port 3000",
		build: "vite build",
		/**
		 * `--env-file-if-exists` because a deployed process gets its variables
		 * from the platform and has no `.env` to read, while a local `pnpm
		 * start` has one and nothing else would load it. Without this the
		 * built server starts, listens, and 500s on the first request.
		 */
		start: "node --env-file-if-exists=.env .output/server/index.mjs",
		/* The route tree is generated, not written. `dev` and `build` produce it
		   via the Vite plugin, but `typecheck` on a clean checkout runs before
		   either — so it generates its own first. */
		"generate-routes": "tsr generate",
		typecheck: "tsr generate && tsc --noEmit",
	},
	files: {
		...claudeSkill(
			"tanstack_start",
			"TanStack Start file-based routing, the generated route tree, and server functions. Use when adding a route or anything that must run only on the server.",
			`
## The route tree is generated, not written

\`src/routeTree.gen.ts\`, imported by \`src/router.tsx\`, does not exist until
\`tsr generate\` has run. \`dev\` and \`build\` regenerate it through the Vite
plugin automatically; \`typecheck\` does not go through Vite at all, which is
why the \`typecheck\` script is \`tsr generate && tsc --noEmit\` rather than
plain \`tsc\`. If you run the type checker any other way — an editor's "check
this file" command, a bare \`tsc\`, a CI step copied from a different
project — run \`npm run generate-routes\` first, or it fails on a file it
insists does not exist.

## Where routes live

Every route file is under \`src/routes/\`. \`src/routes/__root.tsx\` is the
document shell — it renders \`<html>\` itself, because unlike Next, TanStack
Start has no implicit one. A new top-level page is a new file directly under
\`src/routes/\`; \`createFileRoute\` reads its own URL from the file's path, so
renaming the file changes the route.

A pathless layout route (a leading underscore, like \`_authed.tsx\`) applies
\`beforeLoad\` or \`component\` to everything nested under it without adding a
path segment — that is how the signed-in area is guarded in one place rather
than at the top of every page.

## Server-only code

\`createServerFn()\` marks a function as server-only; calling it from a
component compiles to a fetch instead of inlining the body into the client
bundle. Anything importing \`@/server/*\` (which carries the \`server-only\`
import) must be reached through a server function or a route's own
\`server.handlers\`, never called directly from client code.

## The metadata pattern

\`__root.tsx\`'s \`head()\` returns \`meta\`, \`links\` and \`scripts\` arrays built
from \`src/lib/seo.ts\` — \`metaTags()\`, \`canonical()\`, \`jsonLd()\`. Add a page's
title through that module's helpers rather than a literal string, so it stays
in step with the Next starter's metadata, which is built from the same file.
`,
		),
		/**
		 * `import appCss from "./styles.css?url"` is a Vite feature, not a
		 * TypeScript one. Without this reference `typecheck` fails on the query
		 * suffix — the compiler has no idea what `?url` means.
		 */
		"src/vite-env.d.ts": `/// <reference types="vite/client" />\n`,
		"vite.config.ts": `import { fileURLToPath } from "node:url";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	/* Vite reads \`.env\` into \`import.meta.env\`, and only the \`VITE_\` half of
	   it. Server code reads \`process.env\`, so without this line \`dev\` starts
	   with no DATABASE_URL and \`src/lib/env.ts\` throws — Next loads \`.env\`
	   for you, and this is the same courtesy. */
	Object.assign(process.env, loadEnv(mode, process.cwd(), ""));

	return {
		/* \`@/\` is declared in tsconfig.json, but that only teaches the
		   compiler. Vite does not read tsconfig paths, so the bundler is told
		   separately — without this, \`typecheck\` passes and \`build\` fails to
		   resolve \`@/lib\`. */
		resolve: {
			alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
		},
		/* \`tanstackStart\` compiles the app to a fetch handler and stops there;
		   Nitro is what wraps it in a server that listens. Without it \`build\`
		   succeeds and \`start\` exits silently, having served nothing. */
		/* \`tailwindcss()\` is what makes \`@import "tailwindcss"\` in
		   \`src/styles.css\` emit anything. Without it the import still resolves
		   and every class name in the project is inert. */
		plugins: [tailwindcss(), tanstackStart(), nitroV2Plugin()],
	};
});
`,
		/**
		 * The router entry. TanStack Start looks for `src/router.tsx` by
		 * convention and fails the build outright without it — "Could not
		 * resolve entry for router entry: router".
		 */
		"src/router.tsx": `import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
	return createTanStackRouter({
		routeTree,
		scrollRestoration: true,
		/* Fetch a route's data when the pointer touches its link, not when it
		   is clicked. The wait is spent before anyone notices it. */
		defaultPreload: "intent",
	});
}

/** Teaches \`Link\` and \`useParams\` about this app's routes. */
declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
`,
		/**
		 * The document. Unlike Next, TanStack Start has no implicit HTML shell —
		 * this route renders `<html>` itself, and the stylesheet is registered as
		 * a link rather than imported, so SSR emits it in the first response
		 * instead of after hydration.
		 */
		"src/routes/__root.tsx": `import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { canonical, jsonLd, metaTags, pageTitle } from "@/lib/seo";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: pageTitle() },
			...metaTags(),
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
			{ rel: "canonical", href: canonical("/") },
		],
		scripts: [
			/**
			 * Structured data, stringified rather than written out.
			 *
			 * \`JSON.stringify\` escapes what needs escaping. Hand-writing this is
			 * how a stray quote in a company name turns the script into a parse
			 * error, and how a \`</script>\` inside any string becomes an XSS hole —
			 * the browser ends the script at that text wherever the JSON thinks it
			 * is.
			 */
			{
				type: "application/ld+json",
				children: JSON.stringify(jsonLd()),
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

export function RouteComponent() {
	return <Outlet />;
}
`,
		"src/routes/index.tsx": `import { createFileRoute } from "@tanstack/react-router";
import { STACK } from "@/lib/stack";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<main className="mx-auto max-w-2xl p-12">
			<h1 className="font-semibold text-3xl">{{project}}</h1>
			<p className="mt-2 text-neutral-500">
				Generated by StarterSaaSKit. Your stack:
			</p>
			<ul className="mt-6 space-y-1">
				{Object.entries(STACK).map(([layer, choice]) => (
					<li key={layer}>
						<span className="text-neutral-500">{layer}</span> — {choice}
					</li>
				))}
			</ul>
		</main>
	);
}
`,
		"src/routes/api/health.ts": `import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/lib/env";

/** Liveness. Reads env so a misconfigured deploy fails here, loudly. */
export const Route = createFileRoute("/api/health")({
	server: {
		handlers: {
			GET: () => Response.json({ ok: true, environment: env.NODE_ENV }),
		},
	},
});
`,
	},
};

/* --------------------------------------------------------------- components */

/* ---------------------------------------------------------------- react+vite */

/**
 * A browser-only React app on Vite.
 *
 * The difference from the other two frameworks is not the bundler, it is that
 * there is no server. Nothing here can hold a secret, so `src/server/` and
 * `src/lib/env.ts` are both absent by construction rather than left empty —
 * see `baseFor`. Everything the app reads comes from `src/lib/public-env.ts`,
 * which is the honest name for values compiled into a public bundle.
 *
 * Routing is React Router, in `src/routes/`, so the folder means the same
 * thing it does in the TanStack starter and `ARCHITECTURE.md` stays true.
 */
const REACT_VITE: Fragment = {
	dependencies: { "react-router-dom": "^7.1.0", ...REACT },
	devDependencies: { ...REACT_TYPES, ...TAILWIND_VITE, vite: "^7.0.0" },
	scripts: {
		dev: "vite --port 3000",
		build: "vite build",
		preview: "vite preview",
	},
	files: {
		...claudeSkill(
			"react_vite",
			"A browser-only React + Vite app: no server, no secrets, public env only. Use when adding a route, reading configuration, or reaching for data.",
			`
## There is no server

This is the one framework choice with nothing behind it but a static bundle.
\`src/server/\` and \`src/lib/env.ts\` do not exist in this project — not
because they were left out, but because everything shipped to the browser is
readable by every visitor, so there is nowhere to put a secret. Do not add
either back. If a feature seems to need a server (a secret API key, a
privileged database write), it needs a real backend this generator does not
provide, not a workaround inside this app.

## Configuration comes from \`public-env.ts\`, always

\`src/lib/public-env.ts\` is the only environment module. Every value in it is
compiled into the bundle at build time and is public by definition — that is
why nothing in it is a secret and everything in it must stay that way.
Reading \`import.meta.env\` anywhere outside this file skips the validation it
does and reintroduces the bug it exists to prevent; \`src/lib/env.test.ts\`'s
sibling check enforces this on the server-backed frameworks, and the same
rule applies here even without that test.

## Routing

\`src/routes/router.tsx\` builds one \`createBrowserRouter\` table; a new page
is a new entry there and a new file beside \`home.tsx\`, not a nested
\`<Routes>\` inside a component.

## If the database is Supabase

Data access goes through \`src/lib/supabase.ts\`, built from the publishable
anon key. Row Level Security policies on the database — not the secrecy of
that key — are what protect a table; a table with RLS off is world-readable
and world-writable the moment this app can reach it.
`,
		),
		"src/vite-env.d.ts": `/// <reference types="vite/client" />
`,
		"vite.config.ts": `import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { canonical, jsonLd, metaTags, pageTitle } from "./src/lib/seo";

/**
 * Writes the site's metadata into \`index.html\` at build time.
 *
 * A single-page app has one document, and a crawler reads it before any
 * JavaScript runs — so the tags have to be *in* the HTML, not added by React on
 * mount. Most link-preview bots never execute scripts at all.
 *
 * Injecting them here rather than typing them into \`index.html\` keeps one
 * source of truth: the same \`lib/seo.ts\` the Next and TanStack shells read.
 * Two copies of a description is how one of them ends up a year out of date.
 *
 * \`transformIndexHtml\` runs for the dev server and the production build
 * alike, so what you inspect locally is what ships.
 */
function seoTags(): Plugin {
	return {
		name: "seo-tags",
		transformIndexHtml() {
			return [
				{ tag: "title", children: pageTitle(), injectTo: "head" },
				...metaTags().map((tag) => ({
					tag: "meta",
					attrs: tag as Record<string, string>,
					injectTo: "head" as const,
				})),
				{
					tag: "link",
					attrs: { rel: "canonical", href: canonical("/") },
					injectTo: "head" as const,
				},
				{
					tag: "link",
					attrs: { rel: "icon", type: "image/svg+xml", href: "/icon.svg" },
					injectTo: "head" as const,
				},
				{
					/* Stringified, never hand-written: \`JSON.stringify\` escapes what
					   needs escaping, and a \`</script>\` inside any string would
					   otherwise end the block early wherever the JSON thinks it is. */
					tag: "script",
					attrs: { type: "application/ld+json" },
					children: JSON.stringify(jsonLd()),
					injectTo: "head" as const,
				},
			];
		},
	};
}

export default defineConfig({
	/* \`tailwindcss()\` is what makes \`@import "tailwindcss"\` in
	   \`src/styles.css\` emit anything. Without it the import still resolves and
	   every class name in the project is inert. */
	plugins: [tailwindcss(), react(), seoTags()],
	/* \`@/\` is declared in tsconfig.json for the compiler; Vite does not read
	   tsconfig paths, so the bundler is told the same thing separately. */
	resolve: {
		alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
	},
	server: { port: 3000 },
});
`,
		/* Vite's entry point, and the one file that has to sit at the root: it
		   is the document the dev server serves and the build rewrites.

		   Deliberately bare — the title, description, Open Graph, canonical,
		   icon and structured data are injected by the \`seoTags\` plugin in
		   \`vite.config.ts\` so they stay in step with the other frameworks. */
		"index.html": `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta name="theme-color" content="#efedeb" media="(prefers-color-scheme: light)" />
		<meta name="theme-color" content="#1a1716" media="(prefers-color-scheme: dark)" />
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
`,
		"public/robots.txt": `User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
`,
		"src/main.tsx": `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/router";
import "@/styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("index.html has no #root to mount into.");

createRoot(root).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
`,
		"src/routes/router.tsx": `import { createBrowserRouter } from "react-router-dom";
import { Home } from "./home";

/**
 * Every route in one place.
 *
 * \`createBrowserRouter\` rather than \`<Routes>\` inside a component: the route
 * table is data, so a page can be added without touching a render tree, and
 * lazy loading is a property of the entry rather than a wrapper.
 */
export const router = createBrowserRouter([
	{ path: "/", element: <Home /> },
]);
`,
		"src/routes/home.tsx": `import { STACK } from "@/lib/stack";

export function Home() {
	return (
		<main className="mx-auto max-w-2xl p-12">
			<h1 className="font-semibold text-3xl">{{project}}</h1>
			<p className="mt-2 text-neutral-500">
				Generated by StarterSaaSKit. Your stack:
			</p>
			<ul className="mt-6 space-y-1">
				{Object.entries(STACK).map(([layer, choice]) => (
					<li key={layer}>
						<span className="text-neutral-500">{layer}</span> — {choice}
					</li>
				))}
			</ul>
		</main>
	);
}
`,
	},
};

/* ------------------------------------------------------------- components */

const COMPONENTS: Record<string, Fragment> = {
	shadcn: {
		dependencies: {
			"class-variance-authority": "^0.7.1",
			clsx: "^2.1.1",
			"tailwind-merge": "^3.3.1",
		},
		files: {
			...claudeSkill(
				"shadcn",
				"shadcn/ui conventions — components are copied into the repo, not imported from a package. Use when adding or styling a UI primitive.",
				`
## There is no \`shadcn\` package to import from

Every component is source you own, copied under \`src/components/ui/\`, not a
dependency in \`package.json\`. \`src/components/ui/button.tsx\` is already one,
built with \`class-variance-authority\` and merged with \`cn()\` from
\`src/lib/utils.ts\` — follow its shape for a new primitive rather than
inventing a different pattern.

To add one from the shadcn registry rather than writing it by hand, run
\`npx shadcn@latest add <component>\` after installing dependencies; it reads
\`components.json\` (already generated here) to know the style, the alias for
\`@/components\`, and which file is the Tailwind entry point (\`src/styles.css\`).

## Styling

Compose with \`cn(...)\` (\`clsx\` + \`tailwind-merge\`) so a later utility class
wins a conflict instead of both landing in the class list — see
\`src/lib/utils.ts\`. Colour and radius tokens follow the "new-york" style and
the \`neutral\` base colour declared in \`components.json\`; keep new
components consistent with that palette rather than introducing another one.
`,
			),
			"components.json": `${JSON.stringify(
				{
					$schema: "https://ui.shadcn.com/schema.json",
					style: "new-york",
					rsc: true,
					tsx: true,
					tailwind: { config: "", css: "src/styles.css", baseColor: "neutral" },
					aliases: { components: "@/components", utils: "@/lib/utils" },
				},
				null,
				"\t",
			)}\n`,
		},
	},
	mantine: {
		dependencies: { "@mantine/core": "^8.0.0", "@mantine/hooks": "^8.0.0" },
		files: claudeSkill(
			"mantine",
			"Mantine UI conventions — the provider it needs to be wrapped in, and its own stylesheet. Use when adding or styling a component.",
			`
## It needs a provider, and it is not wired up yet

Mantine components read theme and colour scheme from context. Wrap the app
in \`MantineProvider\` from \`@mantine/core\` — in the root layout for Next,
\`__root.tsx\` for TanStack Start, or around the router in \`main.tsx\` for
React + Vite — before using any component from the library. Without it,
components render with broken or missing styles rather than failing loudly.

## Its stylesheet is not Tailwind

\`import "@mantine/core/styles.css"\` once, near the provider. Mantine ships
its own CSS rather than Tailwind utility classes, so \`src/styles.css\`'s
\`@import "tailwindcss"\` does not style Mantine's own components — Tailwind
classes still work on your own markup around them.

## Hooks

\`@mantine/hooks\` (already a dependency) is the idiomatic source for the
small utilities — \`useDisclosure\`, \`useMediaQuery\`, \`useLocalStorage\` — that
a hand-rolled \`useState\`/\`useEffect\` pair would otherwise reimplement.
`,
		),
	},
	chakra: {
		dependencies: { "@chakra-ui/react": "^3.0.0" },
		files: claudeSkill(
			"chakra",
			"Chakra UI conventions — the provider it needs, and where its own token system lives. Use when adding or styling a component.",
			`
## It needs a provider, and it is not wired up yet

Every Chakra component reads its theme through \`ChakraProvider\` (Chakra UI
v3) from \`@chakra-ui/react\`. Wrap the app in it — root layout for Next,
\`__root.tsx\` for TanStack Start, around the router in \`main.tsx\` for React
+ Vite — before rendering any component from the library.

## Styling is a prop system, not utility classes

Chakra components take style props directly (\`<Box p={4} bg="gray.100">\`)
resolved against its own token scale, which is separate from Tailwind's.
\`src/styles.css\`'s Tailwind classes still work on your own \`className\`
props; they do not affect a Chakra component's internal styling, and a
Chakra component's style props have no effect on the rest of the page.

## v3, not v2

Chakra UI v3 restructured composite components (\`Menu\`, \`Modal\`, \`Select\`)
into anatomy-based subcomponents rather than the monolithic v2 API — read the
version actually installed in \`package.json\` before writing against
remembered v2 patterns.
`,
		),
	},
	mui: {
		dependencies: { "@mui/material": "^7.0.0", "@emotion/react": "^11.14.0" },
		files: claudeSkill(
			"mui",
			"MUI (Material UI) conventions — the theme provider and baseline it needs, and its Emotion-based styling. Use when adding or styling a component.",
			`
## It needs two things wrapped around the app, not one

\`ThemeProvider\` from \`@mui/material/styles\` supplies the theme every
component reads; \`CssBaseline\` resets the page to Material's own baseline
styles. Both belong near the root — Next's root layout, TanStack Start's
\`__root.tsx\`, or around the router in \`main.tsx\` for React + Vite — and
skipping \`CssBaseline\` is the usual reason MUI components render with the
browser's default spacing and font rather than Material's.

## Server-rendered frameworks need an Emotion cache

On Next.js specifically, MUI's \`sx\` prop and \`styled()\` generate class names
through Emotion at render time; without an Emotion cache configured for App
Router (\`@mui/material-nextjs\`'s \`AppRouterCacheProvider\`), styles can flash
unstyled on first paint because the server-generated class names do not match
the client's. This project's generated \`layout.tsx\` does not include it —
add it if that flash shows up.

## Styling

\`sx={{ ... }}\` and \`styled()\` are Emotion, resolved against the MUI theme's
tokens — a separate system from the Tailwind classes already in
\`src/styles.css\`. Both can coexist on the same page; neither reads the
other's scale.
`,
		),
	},
	heroui: {
		dependencies: { "@heroui/react": "^2.7.0" },
		files: claudeSkill(
			"heroui",
			"HeroUI conventions — the provider and Tailwind plugin it needs. Use when adding or styling a component.",
			`
## It needs a provider, and it is built on Tailwind

HeroUI components read their theme through \`HeroUIProvider\` from
\`@heroui/react\`. Wrap the app in it — root layout for Next, \`__root.tsx\` for
TanStack Start, around the router in \`main.tsx\` for React + Vite.

Unlike Mantine, Chakra and MUI, HeroUI is a Tailwind-based library: its
components are styled with Tailwind classes and need its plugin registered
wherever \`@import "tailwindcss"\` lives in \`src/styles.css\`
(\`@plugin "@heroui/react/tailwind-plugin"\` or the config-based equivalent
for the version installed) — without it, the classes HeroUI generates
internally resolve to nothing, the same silent-no-styles failure the
project's own Tailwind pipeline setup guards against for the framework CSS.

## Routing for navigation-aware components

Some HeroUI components (\`Link\`, \`Tabs\` used for navigation) accept a router
integration so they navigate via the framework's client-side router instead
of a full page load — wire it to \`next/link\`, \`@tanstack/react-router\`'s
\`Link\`, or \`react-router-dom\`'s, matching whichever framework this project
uses.
`,
		),
	},
	/**
	 * Not a library, and it needs no dependency of its own: Tailwind itself is
	 * wired by the framework fragment, because `src/styles.css` imports it
	 * whichever component library sits on top.
	 */
	tailwind_only: {},
};

/* ------------------------------------------------------------------ database */

const DATABASES: Record<string, Fragment> = {
	neon: {
		dependencies: { "@neondatabase/serverless": "^1.0.0" },
		env: [
			[
				"DATABASE_URL",
				"Neon connection string, from the project dashboard",
				"postgresql://user:pass@localhost:5432/app",
			],
		],
		files: claudeSkill(
			"neon",
			"Neon Postgres — the serverless HTTP driver this project uses, and why it is not a normal connection pool. Use when writing a query or debugging one that hangs.",
			`
## The driver speaks HTTP, not a TCP connection pool

\`src/db/client.ts\` builds its client with \`neon()\` from
\`@neondatabase/serverless\` over \`drizzle-orm/neon-http\` — each query is a
single HTTP request, not a checkout from a long-lived pool. There is no
"connection" to leak or exhaust the way there is with a traditional Postgres
driver, and there is also no session state: multi-statement transactions
behave differently than they would over a raw TCP connection, and
session-level settings (\`SET search_path\`, temp tables) do not persist
between queries the way they would with \`pg\`.

## The connection string is the only credential

\`DATABASE_URL\` is read once, in \`src/lib/env.ts\`, and passed to \`neon()\` in
\`src/db/client.ts\` — nowhere else should construct a client or read this
variable directly.

## Schema and migrations

The table definitions live in \`src/db/schema.ts\` (Drizzle) or
\`prisma/schema.prisma\` (Prisma), never written by hand against the database.
Push a schema change with \`npm run db:push\`; do not hand-run \`CREATE TABLE\`
against the Neon dashboard's SQL editor and let the schema file drift out of
sync with what actually exists.
`,
		),
	},
	supabase: {
		dependencies: { "@supabase/supabase-js": "^2.57.0" },
		env: [
			[
				"DATABASE_URL",
				"Postgres connection string, from Project Settings",
				"postgresql://user:pass@localhost:5432/app",
			],
		],
		/* Both reach the browser: the client that signs people in runs there.
		   The anon key is meant to be public — row level security is what
		   protects the data, not the secrecy of this value. */
		publicEnv: [
			[
				"SUPABASE_URL",
				"Project URL, from Project Settings → API",
				"https://example.supabase.co",
			],
			["SUPABASE_ANON_KEY", "Publishable key. Never the service-role key"],
		],
		files: claudeSkill(
			"supabase",
			"Supabase — the two ways this project can reach it (a server ORM, or the browser client with Row Level Security), and which one this stack uses. Use when writing a query or a policy.",
			`
## Which mode this project is in

There are two entirely different shapes, chosen by the framework:

- **A server framework (Next.js, TanStack Start)**: reached over the
  Postgres wire protocol through \`DATABASE_URL\`, with the ORM you chose
  (Drizzle or Prisma) in \`src/db/client.ts\`. Query it exactly like Neon or
  any other Postgres — the fact that it is Supabase underneath is close to
  incidental here.
- **React + Vite (no server)**: reached at \`src/lib/supabase.ts\`, a client
  built from \`SUPABASE_URL\` and the **publishable anon key** — never the
  service-role key, which has no business in a browser bundle. Check which
  file exists in this project before assuming the other pattern applies.

## Row Level Security is not optional in the browser-only mode

If \`src/lib/supabase.ts\` exists, the anon key is compiled into the bundle by
design and reaches every visitor. RLS policies on each table are the entire
security boundary — a table with RLS disabled is world-readable and
world-writable the moment this app can reach it. Never suggest disabling RLS
"to get it working"; that is the vulnerability, not a workaround for one.

## Auth, if this project chose Supabase Auth

Supabase owns the \`auth.users\` table; your own tables reference its \`id\` and
nothing else. There is no schema to generate for users. Sessions live in
cookies that expire — Next refreshes them in middleware, TanStack Start's
server client refreshes on read — and skipping that step is the specific bug
where everyone gets silently signed out after about an hour.
`,
		),
	},
	planetscale: {
		dependencies: { "@planetscale/database": "^1.19.0" },
		env: [
			[
				"DATABASE_URL",
				"PlanetScale connection string",
				"mysql://user:pass@localhost:3306/app",
			],
		],
		files: claudeSkill(
			"planetscale",
			"PlanetScale MySQL — the serverless HTTP driver, and the missing foreign keys that trip people coming from other MySQL hosts. Use when writing a query or a schema.",
			`
## No foreign key constraints

PlanetScale does not support \`FOREIGN KEY\` constraints — its underlying
sharding (Vitess) cannot enforce them across shards. \`src/db/schema.ts\` and
any migration must express relationships without one: an indexed column
referencing another table's id, with the application enforcing integrity
rather than the database. Do not add a \`.references()\` call expecting
Postgres-style enforcement; Drizzle will happily generate the SQL and
PlanetScale will reject it.

## The driver is HTTP, not a TCP pool

\`@planetscale/database\` talks over HTTP the same way Neon's serverless
driver does — no persistent connection to size a pool around, and no session
state carried between queries.

## Schema changes

Push with \`npm run db:push\` (Drizzle) or \`npm run db:push\` (Prisma) rather
than editing tables through the PlanetScale dashboard directly — otherwise
\`src/db/schema.ts\` or \`prisma/schema.prisma\` stops describing what is
actually there.
`,
		),
	},
	turso: {
		dependencies: { "@libsql/client": "^0.15.0" },
		env: [
			[
				"TURSO_DATABASE_URL",
				"libSQL URL for the database",
				"libsql://example.turso.io",
			],
			["TURSO_AUTH_TOKEN", "Token with read/write on that database"],
		],
		files: claudeSkill(
			"turso",
			"Turso (libSQL) — two credentials instead of one connection string, and SQLite's type affinity. Use when writing a query or a schema.",
			`
## Two environment variables, not one

Unlike every other database this generator supports, Turso needs
\`TURSO_DATABASE_URL\` **and** \`TURSO_AUTH_TOKEN\` — the URL alone
authenticates nothing. Both are read in \`src/lib/env.ts\` and passed to
\`createClient()\` in \`src/db/client.ts\`; a query failing with an auth error
almost always means one of the two is missing or stale, not that the query
itself is wrong.

## It is SQLite, with SQLite's typing rules

\`src/db/schema.ts\` uses \`drizzle-orm/sqlite-core\` — columns have type
affinity rather than a strict type, timestamps are stored as integers
(\`{ mode: "timestamp" }\`), and there is no native boolean (stored as
0/1 integers with \`{ mode: "boolean" }\`). Writing a column the way you would
for Postgres or MySQL is the usual source of a schema that "works" until a
value comes back the wrong shape.

## Local vs. remote

Turso can run as an embedded local file for development and sync to the
remote database — this starter is generated pointed at the remote URL by
default. Do not assume a local \`.db\` file exists unless one was explicitly
set up.
`,
		),
	},
	mongodb: {
		dependencies: { mongodb: "^6.10.0" },
		env: [
			[
				"MONGODB_URI",
				"Connection string including the database name",
				"mongodb://localhost:27017/app",
			],
		],
		files: claudeSkill(
			"mongodb",
			"MongoDB — a document store with no fixed schema at the database level, and how this project imposes one anyway. Use when adding a field or a query.",
			`
## The schema lives in the ORM, not the database

MongoDB itself does not enforce a document shape. Whatever structure this
project has comes entirely from the ORM layer: a Mongoose \`Schema\` in
\`src/db/schema.ts\`, or a Prisma \`model\` in \`prisma/schema.prisma\`. Adding a
field means adding it there first — writing an extra key onto a document
directly will "work" (Mongo will store it) while leaving the ORM's types and
the rest of the schema unaware it exists.

## Connections are cached across hot reloads

\`src/db/client.ts\` (Mongoose) or the shared Prisma client memoises the
connection on \`globalThis\`. Every development save that re-imports the
module reuses it instead of opening a new one — removing that caching is
the specific bug where a dev server run for an afternoon exhausts the
connection pool.

## Ids

Mongo's native id is an ObjectId, not a string. Mongoose exposes it as
\`_id\`; Prisma's schema here maps it to \`id\` with \`@map("_id") @db.ObjectId\`.
Compare and query with the type the ORM expects — a raw string comparison
against an ObjectId field silently matches nothing.
`,
		),
	},
};

/* ----------------------------------------------------------------------- ORM */

const DB_CLIENT: Record<string, string> = {
	"drizzle:neon": `import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "@/lib/env";
import * as schema from "./schema";

export const db = drizzle(neon(env.DATABASE_URL), { schema });
`,
	"drizzle:supabase": `import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

export const db = drizzle(postgres(env.DATABASE_URL), { schema });
`,
	"drizzle:planetscale": `import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { env } from "@/lib/env";
import * as schema from "./schema";

export const db = drizzle(new Client({ url: env.DATABASE_URL }), { schema });
`,
	"drizzle:turso": `import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";
import * as schema from "./schema";

export const db = drizzle(
	createClient({
		url: env.TURSO_DATABASE_URL,
		authToken: env.TURSO_AUTH_TOKEN,
	}),
	{ schema },
);
`,
	"prisma:mongodb": `import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Cached across hot reloads. Without this, every save in development opens
 * another connection pool until the database refuses new ones.
 *
 * The mode comes from \`env\` rather than the raw environment. This file is
 * application code, and the rule the rest of the project follows is that the
 * environment is parsed in \`src/lib/env.ts\` and read from there everywhere
 * else — reading it directly here skipped that validation and tripped this
 * project's own \`src/lib/env.test.ts\` on a clean checkout.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
`,
	"mongoose:mongodb": `import mongoose from "mongoose";
import { env } from "@/lib/env";

/** Cached across hot reloads, or every save opens another connection pool. */
let connection: Promise<typeof mongoose> | undefined;

export function db() {
	connection ??= mongoose.connect(env.MONGODB_URI);
	return connection;
}
`,
};

const PRISMA_SQL_CLIENT = DB_CLIENT["prisma:mongodb"];

const DRIZZLE_SCHEMA: Record<string, string> = {
	postgres: `import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * The only place tables are defined. Every query goes through \`db\` in
 * \`./client.ts\`, so the shape of the data has exactly one source of truth.
 */
export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: text("email").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
	mysql: `import { mysqlTable, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
	id: varchar("id", { length: 36 }).primaryKey(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
	sqlite: `import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`,
};

const DRIZZLE_SCHEMA_TEST = `import { describe, expect, it } from "vitest";
import { users } from "./schema.js";

/**
 * The schema is data, so it can be asserted without a database. This catches
 * the changes that break everything downstream — a renamed column, a dropped
 * uniqueness constraint — at the point they are made.
 */
describe("the users table", () => {
	it("has the columns the app reads", () => {
		expect(Object.keys(users)).toEqual(
			expect.arrayContaining(["id", "email", "createdAt"]),
		);
	});

	it("keeps email unique, which the auth flow relies on", () => {
		expect(users.email.isUnique).toBe(true);
	});
});
`;

const MONGOOSE_SCHEMA = `import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
	email: { type: String, required: true, unique: true },
	createdAt: { type: Date, default: Date.now },
});

export const User = models.User ?? model("User", userSchema);
`;

const MONGOOSE_SCHEMA_TEST = `import { describe, expect, it } from "vitest";
import { User } from "./schema.js";

describe("the User model", () => {
	it("has the fields the app reads", () => {
		expect(Object.keys(User.schema.paths)).toEqual(
			expect.arrayContaining(["email", "createdAt"]),
		);
	});

	it("keeps email unique, which the auth flow relies on", () => {
		expect(User.schema.path("email").options.unique).toBe(true);
	});
});
`;

const ORMS: Record<string, Fragment> = {
	drizzle: {
		dependencies: { "drizzle-orm": "^0.44.0" },
		devDependencies: { "drizzle-kit": "^0.31.0" },
		scripts: {
			"db:generate": "drizzle-kit generate",
			"db:push": "drizzle-kit push",
		},
	},
	prisma: {
		dependencies: { "@prisma/client": "^6.0.0" },
		devDependencies: { prisma: "^6.0.0" },
		scripts: {
			"db:generate": "prisma generate",
			"db:push": "prisma db push",
		},
	},
	mongoose: { dependencies: { mongoose: "^8.8.0" } },
};

/* ---------------------------------------------------------------------- auth */

/* ------------------------------------------------------------------- billing */

const BILLING: Record<string, Fragment> = {
	stripe: {
		dependencies: { stripe: "^18.0.0" },
		env: [
			["STRIPE_SECRET_KEY", "Restricted key is enough to start"],
			["STRIPE_WEBHOOK_SECRET", "From `stripe listen`, or the dashboard"],
		],
		files: {
			...claudeSkill(
				"stripe",
				"Stripe billing — checkout sessions and webhook verification as this project wires them. Use when touching src/lib/checkout.ts or any billing flow.",
				`
## Everything goes through \`src/lib/checkout.ts\`

Nothing else in the app should import \`stripe\` directly. Starting a
checkout is \`startCheckout(priceId, returnTo)\`; verifying a webhook is
\`verifyWebhook(rawBody, signature)\`. Extend this module rather than reaching
for the SDK from a route handler.

## Webhook signatures need the raw body

\`verifyWebhook\` checks the payload against \`STRIPE_WEBHOOK_SECRET\` using
the **unparsed** request body. Running the request through \`request.json()\`
or any body parser before this call changes the bytes the signature was
computed over, and verification fails even for a genuine event from Stripe —
this is the single most common way a Stripe webhook integration breaks, and
it looks like a Stripe problem rather than a body-parsing order problem.

## Keys

\`STRIPE_SECRET_KEY\` is read only in \`src/lib/checkout.ts\`, server-side —
never exposed through \`public-env.ts\`. A restricted key scoped to Checkout
and webhooks is enough for everything this module does; there is no need to
request a fully-privileged key for local development.

## Local webhook testing

\`stripe listen --forward-to localhost:3000/api/webhooks/stripe\` (adjust the
path to wherever a webhook route is mounted) prints a signing secret for
\`STRIPE_WEBHOOK_SECRET\` that is different from the one in the dashboard —
use the CLI's secret while testing locally, not the dashboard's.
`,
			),
			"src/lib/checkout.ts": `import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Billing, configured once. Named for what it does rather than who provides
 * it, because the rest of the app cares about checkout, not about Stripe.
 */
const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export type CheckoutSession = { id: string; url: string | null };

/** Starts a checkout and returns where to send the customer. */
export async function startCheckout(
	priceId: string,
	returnTo: string,
): Promise<CheckoutSession> {
	const session = await stripe.checkout.sessions.create({
		mode: "subscription",
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: returnTo,
		cancel_url: returnTo,
	});

	return { id: session.id, url: session.url };
}

/**
 * Verifies a webhook against the **raw** body.
 *
 * Parsing the body before this runs breaks the signature, which is the single
 * most common way a Stripe integration goes wrong.
 */
export function verifyWebhook(rawBody: string, signature: string) {
	return stripe.webhooks.constructEvent(
		rawBody,
		signature,
		env.STRIPE_WEBHOOK_SECRET,
	);
}
`,
			"src/lib/checkout.test.ts": `import { describe, expect, it } from "vitest";
import { startCheckout, verifyWebhook } from "./checkout.js";

/**
 * The contract this module guarantees, without reaching Stripe: that both
 * entry points exist and that webhook verification refuses a bad signature
 * rather than trusting the payload.
 */
describe("checkout", () => {
	it("offers a way to start a subscription", () => {
		expect(typeof startCheckout).toBe("function");
	});

	it("refuses a webhook whose signature does not match", () => {
		expect(() => verifyWebhook("{}", "not-a-signature")).toThrow();
	});
});
`,
		},
	},
	none: {},
};

/* --------------------------------------------------------------------- email */

/**
 * The test every provider gets, unchanged.
 *
 * It is the same file for all three on purpose: the point of this seam is that
 * `sendEmail` means the same thing whoever delivers it, and a suite that had to
 * be rewritten per provider would be evidence the seam had leaked.
 */
const EMAIL_TEST = `import { describe, expect, it } from "vitest";
import { sendEmail } from "./email.js";

/**
 * The contract, without sending anything: one function, taking an address, a
 * subject and a body. Which service is behind it is this module's business and
 * nobody else's — that is the whole reason it exists.
 */
describe("email", () => {
	it("offers one way to send", () => {
		expect(typeof sendEmail).toBe("function");
	});

	it("refuses an address that is not one, before calling out", async () => {
		await expect(
			sendEmail({ to: "not-an-address", subject: "Hi", html: "<p>Hi</p>" }),
		).rejects.toThrow(/address/i);
	});
});
`;

/**
 * Shared by all three providers: the type the rest of the app sees, and the
 * check that runs before any of them are called.
 *
 * The validation is here rather than in each provider because a bad address
 * should fail the same way whoever is delivering — and because a provider
 * that rejects it remotely costs a network round trip to learn what a regular
 * expression knows for free.
 */
const EMAIL_PRELUDE = `export type Email = {
	to: string;
	subject: string;
	html: string;
};

export type Sent = { id: string };

/** Deliberately loose: the provider is the authority, this catches typos. */
const ADDRESS = /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/;

function assertAddress(to: string): void {
	if (!ADDRESS.test(to)) {
		throw new Error(\`Not an email address: \${to}\`);
	}
}
`;

const EMAILS: Record<string, Fragment> = {
	resend: {
		dependencies: { resend: "^6.0.0" },
		env: [
			["RESEND_API_KEY", "From resend.com/api-keys"],
			[
				"EMAIL_FROM",
				"The verified sender, e.g. `Acme <hello@acme.com>`",
				"test@example.test",
			],
		],
		files: {
			...claudeSkill(
				"resend",
				"Resend transactional email — the shared sendEmail contract this project exposes, and Resend's own failure-reporting quirk. Use when touching src/lib/email.ts or sending mail.",
				`
## Everything goes through \`sendEmail\` in \`src/lib/email.ts\`

The rest of the app calls \`sendEmail({ to, subject, html })\` and nothing
imports \`resend\` directly anywhere else — that is what makes switching
providers later a one-file change.

## Resend reports failure in the payload, not by throwing

\`resend.emails.send()\` resolves successfully even when the send failed; the
failure is in \`{ data, error }\`. \`src/lib/email.ts\` already checks
\`error\` and throws itself — do not \`await\` the raw SDK call elsewhere and
assume a resolved promise means the email went out.

## The sender must be a verified domain

\`EMAIL_FROM\` has to be an address on a domain verified in the Resend
dashboard, in the \`Name <address@domain>\` shape. An unverified sender fails
at send time with an error naming the domain, not a generic auth failure.
`,
			),
			"src/lib/email.ts": `import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Transactional email, configured once.
 *
 * Named for what it does rather than who provides it: everything else in the
 * app calls \`sendEmail\`, so changing provider is this file and one key.
 */
const resend = new Resend(env.RESEND_API_KEY);

${EMAIL_PRELUDE}
export async function sendEmail({ to, subject, html }: Email): Promise<Sent> {
	assertAddress(to);

	const { data, error } = await resend.emails.send({
		from: env.EMAIL_FROM,
		to,
		subject,
		html,
	});

	/* Resend reports failure in the payload rather than by throwing, so an
	   unchecked call looks like it succeeded and silently sends nothing. */
	if (error) throw new Error(\`Email not sent: \${error.message}\`);
	if (!data) throw new Error("Email not sent: no id returned");

	return { id: data.id };
}
`,
			"src/lib/email.test.ts": EMAIL_TEST,
		},
	},
	mailgun: {
		dependencies: { "mailgun.js": "^14.0.0", "form-data": "^4.0.0" },
		env: [
			["MAILGUN_API_KEY", "From the Mailgun dashboard"],
			["MAILGUN_DOMAIN", "The sending domain you verified"],
			[
				"EMAIL_FROM",
				"The verified sender, e.g. `Acme <hello@acme.com>`",
				"test@example.test",
			],
		],
		files: {
			...claudeSkill(
				"mailgun",
				"Mailgun transactional email — the shared sendEmail contract, and the form-data dependency the SDK needs at construction. Use when touching src/lib/email.ts or sending mail.",
				`
## Everything goes through \`sendEmail\` in \`src/lib/email.ts\`

The rest of the app calls \`sendEmail({ to, subject, html })\`; nothing else
imports \`mailgun.js\` directly.

## \`form-data\` is a required construction argument, not an unused import

\`new Mailgun(formData)\` is passed the \`form-data\` package explicitly
because \`mailgun.js\` builds multipart request bodies itself rather than
assuming the runtime provides a \`FormData\` implementation it can use. Do not
remove the \`form-data\` dependency or the import while it still looks unused
by anything else — the client construction is the thing using it.

## The domain is separate from the API key

\`MAILGUN_DOMAIN\` (the verified sending domain) is passed as an argument to
\`client.messages.create()\`, distinct from \`MAILGUN_API_KEY\` used to build
the client. A request failing with a domain-not-found error means the
domain variable, not the key, is wrong.
`,
			),
			"src/lib/email.ts": `import formData from "form-data";
import Mailgun from "mailgun.js";
import { env } from "@/lib/env";

/**
 * Transactional email, configured once.
 *
 * Named for what it does rather than who provides it: everything else in the
 * app calls \`sendEmail\`, so changing provider is this file and one key.
 *
 * \`mailgun.js\` is given \`form-data\` at construction because it builds
 * multipart bodies itself rather than depending on the runtime having one.
 */
const client = new Mailgun(formData).client({
	username: "api",
	key: env.MAILGUN_API_KEY,
});

${EMAIL_PRELUDE}
export async function sendEmail({ to, subject, html }: Email): Promise<Sent> {
	assertAddress(to);

	const sent = await client.messages.create(env.MAILGUN_DOMAIN, {
		from: env.EMAIL_FROM,
		to: [to],
		subject,
		html,
	});

	if (!sent.id) throw new Error("Email not sent: no id returned");

	return { id: sent.id };
}
`,
			"src/lib/email.test.ts": EMAIL_TEST,
		},
	},
	brevo: {
		dependencies: { "@getbrevo/brevo": "^6.0.0" },
		env: [
			["BREVO_API_KEY", "From Brevo → SMTP & API → API keys"],
			[
				"EMAIL_FROM",
				"The verified sender, e.g. `Acme <hello@acme.com>`",
				"test@example.test",
			],
		],
		files: {
			...claudeSkill(
				"brevo",
				"Brevo transactional email — the shared sendEmail contract, and Brevo's split sender format. Use when touching src/lib/email.ts or sending mail.",
				`
## Everything goes through \`sendEmail\` in \`src/lib/email.ts\`

The rest of the app calls \`sendEmail({ to, subject, html })\`; nothing else
imports \`@getbrevo/brevo\` directly.

## Brevo wants the sender split, unlike the other two providers

\`EMAIL_FROM\` is stored as one string (\`Name <address@domain>\`) so every
provider's \`.env\` looks the same, but Brevo's API takes \`{ name, email }\`
separately. \`sender()\` in \`src/lib/email.ts\` does that split locally — if a
send is going out with the wrong or missing display name, check that
parser before assuming the environment variable itself is wrong.

## A missing \`messageId\` is treated as a failure

Unlike Resend's explicit \`error\` field, a Brevo response with no
\`messageId\` is the failure signal this module checks — a response object
that exists but carries no id did not send anything.
`,
			),
			"src/lib/email.ts": `import { BrevoClient } from "@getbrevo/brevo";
import { env } from "@/lib/env";

/**
 * Transactional email, configured once.
 *
 * Named for what it does rather than who provides it: everything else in the
 * app calls \`sendEmail\`, so changing provider is this file and one key.
 */
const client = new BrevoClient({ apiKey: env.BREVO_API_KEY });

${EMAIL_PRELUDE}
/**
 * Brevo wants the sender split into a name and an address, while every other
 * provider here takes one string. Splitting it locally keeps \`EMAIL_FROM\`
 * spelled the same way in every \`.env\`, whichever provider is behind it.
 */
function sender(from: string): { name?: string; email: string } {
	const match = from.match(/^s*(.*?)s*<(.+)>s*$/);
	if (!match) return { email: from };

	return { name: match[1], email: match[2] as string };
}

export async function sendEmail({ to, subject, html }: Email): Promise<Sent> {
	assertAddress(to);

	const sent = await client.transactionalEmails.sendTransacEmail({
		sender: sender(env.EMAIL_FROM),
		to: [{ email: to }],
		subject,
		htmlContent: html,
	});

	/* \`messageId\` is optional on the response type — a send that produced no
	   id did not produce an email either, so it is treated as a failure. */
	if (!sent.messageId) throw new Error("Email not sent: no id returned");

	return { id: sent.messageId };
}
`,
			"src/lib/email.test.ts": EMAIL_TEST,
		},
	},
	none: {},
};

/* ---------------------------------------------------------------------- pick */

function dialectOf(database: string | undefined): string | null {
	if (database === "planetscale") return "mysql";
	if (database === "turso") return "sqlite";
	if (database === "neon" || database === "supabase") return "postgres";
	return null;
}

function prismaSchema(database: string | undefined): string {
	const provider =
		database === "mongodb"
			? "mongodb"
			: database === "planetscale"
				? "mysql"
				: database === "turso"
					? "sqlite"
					: "postgresql";
	const id =
		provider === "mongodb"
			? 'String @id @default(auto()) @map("_id") @db.ObjectId'
			: "String @id @default(cuid())";
	const urlVar =
		database === "turso"
			? "TURSO_DATABASE_URL"
			: database === "mongodb"
				? "MONGODB_URI"
				: "DATABASE_URL";

	return `generator client {
	provider = "prisma-client-js"
}

datasource db {
	provider = "${provider}"
	url      = env("${urlVar}")
}

model User {
	id        ${id}
	email     String   @unique
	createdAt DateTime @default(now())
}
`;
}

const ORM_SKILLS: Record<string, Record<string, string>> = {
	drizzle: claudeSkill(
		"drizzle",
		"Drizzle ORM — where the schema lives, how to push it, and the dialect-specific column types this project already chose. Use when writing a query or changing the schema.",
		`
## The schema is the one source of truth

\`src/db/schema.ts\` is the only place tables are defined; \`src/db/client.ts\`
is a configured instance, never a place to inline a second definition of a
table. After changing the schema, run \`npm run db:push\` to apply it — there
is no migrations directory generated here, so \`db:push\` (not a
\`drizzle-kit generate\` + a manual migration run) is the workflow this
project's \`db:push\` script commits to.

## \`drizzle.config.ts\` is what makes the scripts work at all

\`drizzle-kit\` reads its dialect and its credentials from
\`drizzle.config.ts\`, not from the schema file. If \`db:push\` or
\`db:generate\` fails claiming it cannot find a database, check that file's
\`dialect\` and \`dbCredentials\` before suspecting the connection string
itself.

## Column types follow the database, not habit

The generated schema already uses the column module for this project's
actual database — \`drizzle-orm/pg-core\` for Postgres-family databases
(Neon, Supabase), \`drizzle-orm/mysql-core\` for PlanetScale,
\`drizzle-orm/sqlite-core\` for Turso. Import from the same module a new
table needs to match; mixing dialects in one schema file does not error at
write time and fails only when \`db:push\` runs against the real database.

## Querying

Use the query builder (\`db.select()...\`, \`db.insert()...\`) or the relational
API against the exported tables — never a raw SQL string for something the
builder already expresses, which is what keeps queries type-checked against
the schema.
`,
	),
	prisma: claudeSkill(
		"prisma",
		"Prisma — schema.prisma as the source of truth, generating the client, and the cached-instance pattern already in this project. Use when writing a query or changing the schema.",
		`
## \`prisma/schema.prisma\` is the schema, not \`src/db/schema.ts\`

Prisma's models live in \`prisma/schema.prisma\`. After changing a model, run
\`npm run db:generate\` (\`prisma generate\`) to regenerate the typed client
before the new fields are visible to TypeScript, then \`npm run db:push\` to
apply the change to the database. Editing a model and querying its new
field without regenerating first is the most common "but I did add the
column" report — the client TypeScript is checking against is stale.

## The client is cached across hot reloads on purpose

\`src/db/client.ts\` stores the \`PrismaClient\` instance on \`globalThis\` in
development and reuses it. Removing that caching — or constructing a new
\`PrismaClient\` anywhere else in the app — opens a new connection pool on
every save and exhausts the database's connection limit during a normal dev
session.

## The one file allowed to read \`process.env\` directly for this reason

\`src/db/client.ts\` reads \`env.NODE_ENV\` (through \`@/lib/env\`, not raw
\`process.env\`) only to decide whether to cache itself — it is still bound
by the same rule as the rest of the app: the environment is parsed in
\`src/lib/env.ts\` and read from there.
`,
	),
	mongoose: claudeSkill(
		"mongoose",
		"Mongoose — schema-first modelling over MongoDB, and the cached-connection and cached-model patterns this project already uses. Use when writing a query or changing the schema.",
		`
## Schema and model live in \`src/db/schema.ts\`

A field MongoDB will happily store without one, but Mongoose will not
validate, cast, or expose in types unless it is declared on the \`Schema\`
there first. Add it to the schema before writing code that relies on it.

## Models are cached against hot reload

\`export const User = models.User ?? model("User", userSchema);\` — reusing
\`models.User\` if it is already registered — is not a style preference. In a
framework with hot module reloading, calling \`model()\` unconditionally on
every reload throws \`OverwriteModelError\` the second time the module is
re-evaluated. Follow the same \`models.X ?? model(...)\` shape for a new
model.

## The connection is cached too, and is a function, not a constant

\`src/db/client.ts\` exports a \`db()\` function backed by a memoised promise,
not a bare client — call it (\`await db()\`) rather than importing a top-level
connected instance, and do not remove the memoisation, or every hot reload
opens another connection.

## Ids

Documents get a MongoDB ObjectId as \`_id\` automatically; there is no
separate string primary key to define unless the schema deliberately adds
one.
`,
	),
};

function ormFragment(answers: StarterAnswers): Fragment {
	const { orm, database } = answers;
	const base = ORMS[orm ?? ""] ?? {};
	const files: Record<string, string> = { ...(ORM_SKILLS[orm ?? ""] ?? {}) };

	const client =
		DB_CLIENT[`${orm}:${database}`] ??
		(orm === "prisma" ? PRISMA_SQL_CLIENT : undefined);
	if (client) files["src/db/client.ts"] = client;

	const dialect = dialectOf(database);
	if (orm === "drizzle" && dialect) {
		files["src/db/schema.ts"] = DRIZZLE_SCHEMA[dialect];
		files["src/db/schema.test.ts"] = DRIZZLE_SCHEMA_TEST;

		/* Without this, `db:push` and `db:generate` are scripts that fail on
		   first use — drizzle-kit reads its dialect and credentials from here. */
		const urlVar = database === "turso" ? "TURSO_DATABASE_URL" : "DATABASE_URL";
		const kitDialect =
			dialect === "postgres"
				? "postgresql"
				: dialect === "mysql"
					? "mysql"
					: "turso";

		files["drizzle.config.ts"] = `import { defineConfig } from "drizzle-kit";
import { env } from "./src/lib/env";

export default defineConfig({
	dialect: "${kitDialect}",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: env.${urlVar},${
			database === "turso" ? "\n\t\tauthToken: env.TURSO_AUTH_TOKEN," : ""
		}
	},
});
`;
	}
	if (orm === "prisma") {
		files["prisma/schema.prisma"] = prismaSchema(database);
	}
	if (orm === "mongoose") {
		files["src/db/schema.ts"] = MONGOOSE_SCHEMA;
		files["src/db/schema.test.ts"] = MONGOOSE_SCHEMA_TEST;
	}

	/* Postgres over the wire needs a driver Drizzle does not bundle. */
	const extra =
		orm === "drizzle" && database === "supabase"
			? { postgres: "^3.4.5" }
			: undefined;

	return { ...base, dependencies: { ...base.dependencies, ...extra }, files };
}

/**
 * The auth module for the chosen provider.
 *
 * Every one of these is complete: the provider is configured, the pages exist,
 * the routes are mounted and `currentUser()` can answer. There is no
 * "configured only" tier any more, and no fallback — an auth id with no module
 * is a bug in the question set, and returning an empty fragment for it would
 * generate a project with a sign-in page and no way to sign in.
 *
 * The three hosted providers look thinner than the two self-hosted ones, and
 * that is the shape of the thing rather than an omission: Clerk, Auth0 and
 * Neon Auth host the forms, so what a starter owns is the wiring around them.
 */
const AUTH_MODULES: Record<string, (answers: StarterAnswers) => Fragment> = {
	better_auth: betterAuthFragment,
	supabase_auth: supabaseAuthFragment,
	clerk: clerkAuthFragment,
	auth0: auth0Fragment,
	neon_auth: neonAuthFragment,
};

function authFragment(answers: StarterAnswers): Fragment {
	const build = AUTH_MODULES[answers.auth ?? ""];

	if (!build) {
		throw new Error(
			`No auth module for "${answers.auth}". Every option the wizard offers needs one.`,
		);
	}
	return build(answers);
}

/**
 * The base, with the server-only half removed for a browser-only app.
 *
 * A SPA has no place to keep a secret, so `src/lib/env.ts` — which parses
 * private variables out of `process.env` — and `src/server/`, whose entire
 * purpose is the `server-only` tripwire, are not merely unused there:
 * shipping them would be shipping a lie about what the project can do.
 * `public-env.ts` is generated instead, and its name says what it is.
 */
function baseFor(answers: StarterAnswers): Fragment {
	if (!isSpa(answers)) return BASE;

	const {
		"src/lib/env.ts": _env,
		"src/lib/env.test.ts": _envTest,
		"src/server/session.ts": _session,
		...files
	} = BASE.files ?? {};
	const { "server-only": _serverOnly, ...dependencies } =
		BASE.dependencies ?? {};

	return { ...BASE, files, dependencies };
}

/** Browser-only: no server, so no secrets and no server-side data access. */
const isSpa = (answers: StarterAnswers) => answers.framework === "react_vite";

/**
 * The database module, which is a different shape without a server.
 *
 * With one, Supabase is reached over Postgres and `;
DATABASE_URL` is a secret
 * the server holds. Without one, it is reached over HTTP with the publishable
 * key, and row level security — not the secrecy of the key — is what protects
 * the rows. Declaring `;
DATABASE_URL` in a SPA would be asking for a credential
 * the project has no way to use and no way to hide.
 */
function databaseFragment(answers: StarterAnswers): Fragment {
	const base = DATABASES[answers.database ?? ""] ?? {};
	if (!isSpa(answers)) return base;

	const { env: _private, ...rest } = base;

	return {
		...rest,
		files: {
			...rest.files,
			"src/lib/supabase.ts": `;
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/public-env";

/**
 * The Supabase client, configured once.
 *
 * This app has no server, so this is the only way it reaches its data. The
 * key here is the publishable one and is compiled into the bundle by design;
 * every table it touches must have row level security enabled, because that
 * policy is the only thing standing between a visitor and the rows.
 */
export const supabase = createClient(
	publicEnv.SUPABASE_URL,
	publicEnv.SUPABASE_ANON_KEY,
);
`,
			"src/lib/supabase.test.ts": `;
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { supabase } from "./supabase.js";

describe("supabase", () => {
	it("is configured and exported", () => {
		expect(supabase).toBeDefined();
		expect(typeof supabase.from).toBe("function");
	});

	/**
	 * The whole security model of a browser-only app: this key ships to every
	 * visitor, so the database has to refuse anything the policies do not
	 * allow. What is asserted is that the client is built from the
	 * *publishable* key, and not a service-role key or a connection string.
	 *
	 * Read out of the source rather than off the client, and both alternatives
	 * were tried first: serialising the client throws, because it holds a live
	 * timer and the structure is circular; reading \`supabase.supabaseKey\` is
	 * a type error, because the field is protected. The file itself is the one
	 * place the answer is plainly visible.
	 */
	it("is built from the publishable key and nothing else", () => {
		const source = readFileSync("src/lib/supabase.ts", "utf8");

		expect(source).toContain("publicEnv.SUPABASE_ANON_KEY");
		expect(source).not.toMatch(/service_role/);
		expect(source).not.toMatch(/SERVICE_ROLE/);
		expect(source).not.toMatch(/DATABASE_URL/);
	});
});
`,
		},
	};
}

const FRAMEWORKS: Record<string, Fragment> = {
	nextjs: NEXTJS,
	tanstack_start: TANSTACK_START,
	react_vite: REACT_VITE,
};

/**
 * The background jobs module, for the provider chosen.
 *
 * Each provider needs the framework to pick its route shape — Inngest and
 * QStash mount one, and even Trigger.dev's config differs by nothing here
 * but is kept in this shape for symmetry with the others — so, like auth,
 * this dispatches to a function rather than a static per-id map.
 */
const JOBS_MODULES: Record<string, (answers: StarterAnswers) => Fragment> = {
	trigger: triggerJobsFragment,
	inngest: inngestJobsFragment,
	qstash: qstashJobsFragment,
};

function jobsFragment(answers: StarterAnswers): Fragment {
	const build = JOBS_MODULES[answers.jobs ?? ""];

	return build ? build(answers) : {};
}

export function fragmentsFor(answers: StarterAnswers): Fragment[] {
	return [
		baseFor(answers),
		FRAMEWORKS[answers.framework ?? ""] ?? NEXTJS,
		COMPONENTS[answers.components ?? ""] ?? {},
		databaseFragment(answers),
		ormFragment(answers),
		authFragment(answers),
		BILLING[answers.billing ?? ""] ?? {},
		EMAILS[answers.email ?? ""] ?? {},
		jobsFragment(answers),
		/* Last, so its route replaces the framework's own placeholder home
		   page rather than the other way round. */
		landingFragment(answers.framework ?? "nextjs", answers.landing ?? "none"),
	];
}
