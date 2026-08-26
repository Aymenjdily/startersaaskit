import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_ICONS, type BrandIcon } from "./brand-icons";

/**
 * The glyph paths are inlined rather than imported, because simple-icons v16
 * ships per-icon files as raw `.svg` only — a named import would pull the whole
 * ~3,000-icon module into the bundle. The tradeoff is that the data is now a
 * hand-maintained copy, so these tests guard the things a bad copy-paste breaks:
 * an empty string, a truncated path, or a stray `<svg>` wrapper.
 */
describe("BRAND_ICONS", () => {
	const entries = Object.entries(BRAND_ICONS) as [BrandIcon, string][];

	it("is not empty", () => {
		expect(entries.length).toBeGreaterThan(0);
	});

	it.each(entries)("%s has usable path data", (_icon, path) => {
		expect(typeof path).toBe("string");
		expect(path.length).toBeGreaterThan(20);
	});

	it.each(entries)("%s starts with a moveto command", (_icon, path) => {
		expect(path.trimStart()).toMatch(/^[Mm]/);
	});

	it.each(entries)("%s contains only SVG path syntax", (_icon, path) => {
		// Commands, numbers, separators — anything else means markup leaked in.
		expect(path).toMatch(/^[MmZzLlHhVvCcSsQqTtAa0-9\s,.\-+eE]+$/);
	});

	it("has no duplicate glyphs under different names", () => {
		const paths = entries.map(([, path]) => path);
		expect(new Set(paths).size).toBe(paths.length);
	});

	/**
	 * The checks above catch a *malformed* copy. This one catches a copy that is
	 * well-formed but wrong — Google's G filed under `github`, or a path that
	 * drifted when the package was upgraded. Any key whose name matches a file
	 * simple-icons ships is compared to that file; keys that do not (`neon`,
	 * `betterauth` at the time of writing) are skipped rather than asserted
	 * against nothing.
	 */
	describe("against the installed simple-icons", () => {
		const iconsDir = resolve(process.cwd(), "node_modules/simple-icons/icons");

		const upstream = entries.filter(([icon]) =>
			existsSync(resolve(iconsDir, `${icon}.svg`)),
		);

		it("finds a file for at least half the glyphs", () => {
			expect(upstream.length).toBeGreaterThanOrEqual(entries.length / 2);
		});

		it.each(upstream)("%s matches the shipped mark", (icon, path) => {
			const svg = readFileSync(resolve(iconsDir, `${icon}.svg`), "utf8");

			expect(path).toBe(svg.match(/ d="([^"]+)"/)?.[1]);
		});
	});
});
