import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = () =>
	readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8").replace(
		/\/\*[\s\S]*?\*\//g,
		"",
	);

/** `code`, `pre code`, `h1, h2` — but not `.prose pre` or `:root`. */
const isElementSelector = (selector: string) =>
	selector
		.split(",")
		.every((part) => /^[a-z][a-z0-9]*(\s+[a-z][a-z0-9]*)*$/.test(part.trim()));

/** Selectors of every rule that sits at the top level of the file. */
function topLevelSelectors(source: string): string[] {
	const found: string[] = [];
	let depth = 0;
	let start = 0;

	for (let i = 0; i < source.length; i++) {
		const char = source[i];
		if (char === "{") {
			if (depth === 0) found.push(source.slice(start, i).trim());
			depth += 1;
		} else if (char === "}") {
			depth -= 1;
			if (depth === 0) start = i + 1;
		}
	}
	return found;
}

describe("styles.css", () => {
	/**
	 * Tailwind v4 emits its utilities inside `@layer utilities`, and unlayered CSS
	 * outranks every layer regardless of specificity. So a bare `code {}` at the
	 * top of the file quietly beat `text-[12px]` and `bg-base` on every inline
	 * chip on the page — the utilities were in the markup and did nothing.
	 *
	 * Element defaults belong in `@layer base`, where a utility can still win.
	 * Class rules are exempt: `.fade-up` and friends are not competing with a
	 * utility for the same property.
	 */
	it("declares no element defaults outside a cascade layer", () => {
		const offenders = topLevelSelectors(css()).filter(
			(selector) => !selector.startsWith("@") && isElementSelector(selector),
		);

		expect(offenders).toEqual([]);
	});
});
