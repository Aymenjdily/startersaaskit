import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Every `text-*` class names a token that exists.
 *
 * Tailwind drops a utility it does not recognise, silently and at build time.
 * `text-h1` was written on the legal pages for a token that had never been
 * defined — the scale stops at `--text-h2` — so the heading inherited 16px and
 * rendered *smaller* than the 20px headings beneath it. Nothing failed: not the
 * type checker, which sees a string; not the linter; not the tests, which
 * asserted the element existed and it did.
 *
 * The only signal was the rendered page, and only to someone who measured it.
 * So this reads the tokens out of `styles.css` and holds the source to them.
 */

const CSS = readFileSync("src/styles.css", "utf8");

/** `--text-body`, `--color-ink` and friends, as declared in `@theme`. */
function tokens(prefix: string): Set<string> {
	const found = new Set<string>();

	for (const [, name] of CSS.matchAll(
		new RegExp(`--${prefix}-([a-z0-9-]+)\\s*:`, "g"),
	)) {
		found.add(name);
	}

	return found;
}

const TEXT = tokens("text");
const COLOR = tokens("color");

/**
 * `text-*` utilities Tailwind ships itself, which no token backs.
 *
 * Sizes, alignment, wrapping, decoration and transform all share the prefix, so
 * a check that only knew about tokens would flag `text-center` as a typo.
 */
const BUILT_IN = new Set([
	"xs",
	"sm",
	"base",
	"lg",
	"xl",
	"2xl",
	"3xl",
	"4xl",
	"5xl",
	"6xl",
	"7xl",
	"8xl",
	"9xl",
	"left",
	"center",
	"right",
	"justify",
	"start",
	"end",
	"wrap",
	"nowrap",
	"balance",
	"pretty",
	"ellipsis",
	"clip",
	"transparent",
	"current",
	"inherit",
	"black",
	"white",
]);

const SOURCES = globSync("src/{components,routes}/**/*.tsx").filter(
	(file) => !file.includes(".test."),
);

describe("the type and colour scale", () => {
	it("finds the tokens it is checking against", () => {
		/* If the parse ever returns nothing, every assertion below passes
		   vacuously and this file becomes decoration. */
		expect(TEXT.size).toBeGreaterThan(4);
		expect(COLOR.size).toBeGreaterThan(4);
		expect(TEXT.has("h3")).toBe(true);
		expect(SOURCES.length).toBeGreaterThan(20);
	});

	it("has no `text-*` class naming a token that was never defined", () => {
		const unknown: string[] = [];

		for (const file of SOURCES) {
			const source = readFileSync(file, "utf8");

			for (const [, name] of source.matchAll(
				/\btext-([a-z][a-z0-9-]*)\b(?!\s*:)/g,
			)) {
				const known =
					BUILT_IN.has(name) ||
					TEXT.has(name) ||
					COLOR.has(name) ||
					/* `text-ink-soft` is `--color-ink-soft`; the loop above already
					   holds the full name, so this only catches opacity suffixes
					   like `text-ink/50`, which resolve fine. */
					[...COLOR].some((token) => name.startsWith(`${token}-`)) ||
					[...TEXT].some((token) => name.startsWith(`${token}-`));

				if (!known) unknown.push(`${file}: text-${name}`);
			}
		}

		expect(unknown).toEqual([]);
	});

	/**
	 * The specific inversion that started this. A document's title outranking
	 * its own section headings is the minimum a heading scale has to get right.
	 */
	it("gives the legal page a title larger than its clause headings", () => {
		const page = readFileSync("src/components/legal/legal-page.tsx", "utf8");
		const title = page.match(/<h1 className="[^"]*text-(h\d)/)?.[1];

		expect(title).toBeTruthy();

		/* Clause headings are a fixed 20px, so the title's floor has to clear it. */
		const floor = Number(
			CSS.match(new RegExp(`--text-${title}: clamp\\((\\d+)px`))?.[1],
		);

		expect(floor).toBeGreaterThan(20);
	});
});
