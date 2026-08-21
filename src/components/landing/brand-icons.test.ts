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
});
