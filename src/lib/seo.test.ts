import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import {
	absolute,
	DEFAULT_DESCRIPTION,
	OG_IMAGE_PATH,
	OG_IMAGE_SIZE,
	pageHead,
	SITE_URL,
	siteJsonLd,
	titleFor,
} from "./seo";

/** The tags a head produced, as a lookup by `name` or `property`. */
function tags(head: ReturnType<typeof pageHead>): Record<string, string> {
	const out: Record<string, string> = {};

	for (const tag of head.meta) {
		const key = tag.name ?? tag.property ?? (tag.title ? "title" : undefined);

		if (key) out[key] = tag.content ?? tag.title ?? "";
	}

	return out;
}

describe("page metadata", () => {
	const home = pageHead({ path: "/" });

	it("puts the distinguishing word first and the brand last", () => {
		expect(titleFor("Starters")).toBe(`Starters · ${BRAND}`);
	});

	/** "StarterSaaSKit · StarterSaaSKit" helps nobody. */
	it("does not repeat the brand on the home page", () => {
		expect(titleFor()).toBe(BRAND);
	});

	it("never doubles the slash on the root path", () => {
		expect(absolute("/")).toBe(SITE_URL);
		expect(absolute("/starters")).toBe(`${SITE_URL}/starters`);
	});

	/**
	 * Open Graph has no page context to resolve a relative URL against, so every
	 * platform drops a relative image rather than guessing. This is the mistake
	 * that makes a card silently blank everywhere it is pasted.
	 */
	it("gives absolute URLs to the crawlers", () => {
		const found = tags(home);

		expect(found["og:image"]).toMatch(/^https:\/\//);
		expect(found["og:url"]).toMatch(/^https:\/\//);
		expect(found["twitter:image"]).toMatch(/^https:\/\//);
		expect(home.links[0]?.href).toMatch(/^https:\/\//);
	});

	it("keeps the title and description the same in all three places", () => {
		const found = tags(pageHead({ path: "/starters", title: "Starters" }));

		expect(found["og:title"]).toBe(found.title);
		expect(found["twitter:title"]).toBe(found.title);
		expect(found["og:description"]).toBe(found.description);
		expect(found["twitter:description"]).toBe(found.description);
	});

	/** The small card crops 1200x630 to a square and cuts the wordmark in half. */
	it("asks for the large card", () => {
		expect(tags(home)["twitter:card"]).toBe("summary_large_image");
	});

	it("declares the image size so a crawler need not fetch it to lay out", () => {
		const found = tags(home);

		expect(found["og:image:width"]).toBe(String(OG_IMAGE_SIZE.width));
		expect(found["og:image:height"]).toBe(String(OG_IMAGE_SIZE.height));
	});

	it("describes the card for anyone who cannot see it", () => {
		expect(tags(home)["og:image:alt"]).toContain(BRAND);
	});

	describe("what belongs in an index", () => {
		it("leaves the marketing page indexable", () => {
			expect(tags(home).robots).toBeUndefined();
		});

		/**
		 * Everything behind the sign-in is either an empty shell to a crawler or
		 * somebody's private console. `follow` stays on: the page should not be
		 * listed, but its links are still worth crawling.
		 */
		it("keeps the console out of it, without orphaning its links", () => {
			expect(tags(pageHead({ path: "/dashboard", noIndex: true })).robots).toBe(
				"noindex, follow",
			);
		});
	});

	describe("the card image", () => {
		it("is actually in public/", () => {
			expect(existsSync(`public${OG_IMAGE_PATH}`)).toBe(true);
		});

		/**
		 * Read from the file, not taken on trust. An `og:image` whose declared
		 * size does not match the file is how a card ends up letterboxed, and
		 * this is the one place both numbers exist.
		 */
		it("is the size the tags claim", () => {
			const bytes = readFileSync(`public${OG_IMAGE_PATH}`);

			expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR");
			expect(bytes.readUInt32BE(16)).toBe(OG_IMAGE_SIZE.width);
			expect(bytes.readUInt32BE(20)).toBe(OG_IMAGE_SIZE.height);
		});
	});

	describe("the structured data", () => {
		const data = JSON.parse(siteJsonLd());

		it("is valid JSON naming the product", () => {
			expect(data["@context"]).toBe("https://schema.org");
			expect(data.name).toBe(BRAND);
		});

		/** A price is a claim, and the page says free while in beta. */
		it("prices it the way the page does", () => {
			expect(data.offers.price).toBe("0");
		});

		it("points at an image that exists", () => {
			expect(data.image).toBe(`${SITE_URL}${OG_IMAGE_PATH}`);
			expect(existsSync(`public${OG_IMAGE_PATH}`)).toBe(true);
		});
	});

	it("has a description worth showing in a search result", () => {
		/* Google truncates around 160 characters; much shorter than 50 is not a
		   description. */
		expect(DEFAULT_DESCRIPTION.length).toBeGreaterThan(50);
	});
});
