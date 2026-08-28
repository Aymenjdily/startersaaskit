import { globSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The navbar and footer links point somewhere real, from every page.
 *
 * They were bare fragments — `#features` — which works only while the sections
 * are on the page doing the linking. The navbar is on `/privacy` and `/terms`
 * too, where all ten of them scrolled nowhere: no error, no console warning,
 * just a menu that did nothing.
 *
 * Rooting them at `/` fixes it, and costs nothing on the home page, where a
 * link to the current path with a different fragment is still a same-document
 * scroll rather than a reload. Both halves are checked here: that the links are
 * rooted, and that something on the home page actually has the id.
 */

const CHROME = ["src/components/Navbar.tsx", "src/components/Footer.tsx"];

/** Every `href` in the chrome that targets a section. */
function fragmentLinks(file: string): string[] {
	const source = readFileSync(file, "utf8");

	return [...source.matchAll(/href:\s*"([^"]*#[^"]*)"/g)].map(
		([, href]) => href,
	);
}

/** Ids rendered anywhere in the landing page's own components. */
const IDS = new Set(
	globSync("src/components/landing/**/*.tsx")
		.filter((file) => !file.includes(".test."))
		.flatMap((file) =>
			[...readFileSync(file, "utf8").matchAll(/\bid="([^"]+)"/g)].map(
				([, id]) => id,
			),
		),
);

describe("the navbar and footer links", () => {
	it("finds links to check", () => {
		/* Without this the two assertions below pass on an empty list. */
		for (const file of CHROME) {
			expect(fragmentLinks(file).length).toBeGreaterThan(0);
		}

		expect(IDS.size).toBeGreaterThan(1);
	});

	it.each(CHROME)("%s roots every section link at the home page", (file) => {
		const bare = fragmentLinks(file).filter((href) => href.startsWith("#"));

		expect(bare).toEqual([]);
	});

	it.each(CHROME)("%s only links sections that exist", (file) => {
		const missing = fragmentLinks(file)
			.map((href) => href.split("#")[1])
			.filter((id) => id && !IDS.has(id));

		expect([...new Set(missing)]).toEqual([]);
	});
});
