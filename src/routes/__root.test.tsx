import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	APPLE_TOUCH_ICON_SRC,
	FAVICON_SIZES,
	faviconSrc,
	ICON_SRC,
} from "@/lib/brand";
import { Route } from "./__root";

const repoPath = (src: string) => resolve(process.cwd(), "public", `.${src}`);

/**
 * A PNG's IHDR chunk is fixed-offset: 8-byte signature, 4-byte length, the tag,
 * then width, height, bit depth and colour type. Colour type 6 carries an alpha
 * channel; 2 is opaque RGB. Cheaper than a dependency.
 */
const png = (src: string) => {
	const bytes = readFileSync(repoPath(src));

	expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR");
	return {
		width: bytes.readUInt32BE(16),
		height: bytes.readUInt32BE(20),
		hasAlpha: bytes.readUInt8(25) === 6,
	};
};

/**
 * TanStack types `head` as possibly async, so its return needs narrowing before
 * the links come off it. Ours is synchronous and takes no context.
 */
const links = () => {
	const head = Route.options.head?.({} as never) as {
		links?: Array<Record<string, string>>;
	};

	return head.links ?? [];
};

describe("the document head", () => {
	describe("the tab icon", () => {
		it("declares one link per file the brand ships", () => {
			expect(links().filter((link) => link.rel === "icon")).toEqual(
				FAVICON_SIZES.map((size) => ({
					rel: "icon",
					type: "image/png",
					sizes: `${size}x${size}`,
					href: faviconSrc(size),
				})),
			);
		});

		it.each(FAVICON_SIZES)("ships the %ipx file it promises", (size) => {
			expect(existsSync(repoPath(faviconSrc(size)))).toBe(true);
		});

		/**
		 * A link that advertises 32x32 and serves 512 is worse than no link: the
		 * browser trusts the attribute, picks that file for a 32px slot, and
		 * resamples it itself.
		 */
		it.each(FAVICON_SIZES)("is really %ipx square on disk", (size) => {
			expect(png(faviconSrc(size))).toMatchObject({
				width: size,
				height: size,
			});
		});

		/**
		 * The mark is a white face with orange stripes. Transparent, it loses the
		 * face against a light tab strip, so the tab icons are baked onto the
		 * page's own near-black instead.
		 */
		it.each(FAVICON_SIZES)("is opaque at %ipx", (size) => {
			expect(png(faviconSrc(size)).hasAlpha).toBe(false);
		});
	});

	describe("the home-screen icon", () => {
		it("is linked", () => {
			expect(links()).toContainEqual({
				rel: "apple-touch-icon",
				href: APPLE_TOUCH_ICON_SRC,
			});
		});

		/** iOS composites onto white and squares off anything it is given. */
		it("ships opaque and square", () => {
			const { width, height, hasAlpha } = png(APPLE_TOUCH_ICON_SRC);

			expect({ width, height, hasAlpha }).toEqual({
				width: 180,
				height: 180,
				hasAlpha: false,
			});
		});
	});

	/** Not linked here, but the same mark — it belongs to the same set. */
	describe("the standalone mark", () => {
		it("is a square PNG that keeps its transparency", () => {
			const { width, height, hasAlpha } = png(ICON_SRC);

			expect({ width, height, hasAlpha }).toEqual({
				width: 512,
				height: 512,
				hasAlpha: true,
			});
		});
	});
});
