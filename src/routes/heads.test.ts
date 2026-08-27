import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Every route has a complete head, and none of them writes one by hand.
 *
 * A head is eleven tags. Assembled per route they drift — one page gets a
 * Twitter card and another does not, a title is changed in `<title>` and not in
 * `og:title` — and the failure is invisible until somebody pastes a link
 * somewhere and the preview is wrong.
 *
 * So this checks the shape rather than the content: every route calls
 * `pageHead`, and no route hand-rolls the tags it produces. The tags themselves
 * are `seo.test.ts`'s job.
 */
const DIR = "src/routes";

/** Route modules, excluding the root and anything that is not a page. */
const ROUTES = readdirSync(DIR)
	.filter((file) => /\.tsx$/.test(file) && !file.startsWith("__"))
	.filter((file) => !file.includes(".test."));

describe("every route's head", () => {
	it("finds the routes to check", () => {
		expect(ROUTES.length).toBeGreaterThan(5);
	});

	it.each(ROUTES)("%s asks pageHead for its metadata", (file) => {
		const source = readFileSync(`${DIR}/${file}`, "utf8");

		expect(source).toContain("pageHead({");
	});

	it.each(ROUTES)("%s names its own path", (file) => {
		const source = readFileSync(`${DIR}/${file}`, "utf8");

		/* Without it the canonical and `og:url` point at the site root, which
		   tells a crawler every page is the home page. */
		expect(source).toMatch(/pageHead\(\{[\s\S]{0,200}?path: "\//);
	});

	/**
	 * The pages a stranger is meant to find.
	 *
	 * Legal pages belong here as much as the home page does: a privacy policy
	 * that cannot be indexed is one a Google OAuth reviewer has to be handed a
	 * link to, and one nobody can find when they go looking for it.
	 */
	const PUBLIC = ["index.tsx", "privacy.tsx", "terms.tsx"];

	/**
	 * Everything else is either an empty shell to a crawler or somebody's
	 * private data. Forgetting `noIndex` on a new console route is the easy
	 * mistake, and nothing about the page itself would show it.
	 */
	it.each(
		ROUTES.filter((file) => !PUBLIC.includes(file)),
	)("%s keeps itself out of search results", (file) => {
		const source = readFileSync(`${DIR}/${file}`, "utf8");

		expect(source).toContain("noIndex: true");
	});

	it.each(PUBLIC)("%s stays indexable", (file) => {
		const source = readFileSync(`${DIR}/${file}`, "utf8");

		expect(source).not.toContain("noIndex");
	});

	/**
	 * An indexable page missing from the sitemap is one a crawler reaches only
	 * by following a link to it, which is the difference between a privacy
	 * policy that turns up when somebody searches for it and one that does not.
	 * Sign-in and sign-up are indexable too but are not `PUBLIC` marketing
	 * pages, so this checks the sitemap covers PUBLIC rather than equals it.
	 */
	it("lists every indexable page in the sitemap", () => {
		const sitemap = readFileSync(`${DIR}/sitemap[.]xml.ts`, "utf8");

		for (const file of PUBLIC) {
			const path = file === "index.tsx" ? "/" : `/${file.replace(".tsx", "")}`;

			expect(sitemap).toContain(`"${path}"`);
		}
	});

	/** The helper exists so these are written once. Bypassing it defeats it. */
	it.each(ROUTES)("%s does not hand-roll social tags", (file) => {
		const source = readFileSync(`${DIR}/${file}`, "utf8");

		expect(source).not.toMatch(/og:(title|image|description)/);
		expect(source).not.toMatch(/twitter:(card|title|image)/);
	});
});
