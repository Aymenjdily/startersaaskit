import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Navbar } from "@/components/Navbar";
import { Container } from "./container";

/**
 * The navbar is the rhythm everything else answers to: it is pinned to the top
 * of every screenshot, so a section that sits even 8px further in reads as a
 * mistake. `Container` carried `lg:px-8` while the navbar carried `md:px-6`,
 * and the five sections built on it hung 8px inside the logo above them.
 *
 * jsdom has no layout, so these compare the utilities rather than the pixels.
 * The alignment itself was measured in the browser at 375, 1280 and 1920.
 */

const SPACING_STEP_PX = 4;

const gutters = (element: Element) =>
	element.className.split(/\s+/).filter((token) => /(?:^|:)px-/.test(token));

const containerElement = () => {
	const { container } = render(<Container />);

	return container.firstElementChild as HTMLElement;
};

describe("Container", () => {
	it("lays out on the same gutters as the navbar", () => {
		const { container } = render(<Navbar />);
		const navbar = container.querySelector("nav") as HTMLElement;

		expect(gutters(containerElement())).toEqual(gutters(navbar));
	});

	/**
	 * The padding sits inside the border box, so the cap has to carry both
	 * gutters on top of the content width. Capping at `--container-content`
	 * itself would shrink the content to 1252px and lose the alignment again
	 * above 1348px — which is exactly where the cap starts to bind.
	 */
	it("adds both gutters to the width it caps at", () => {
		const element = containerElement();
		const [, added] =
			element.className.match(
				/max-w-\[calc\(var\(--container-content\)_\+_(\d+)px\)\]/,
			) ?? [];
		const [, step] = element.className.match(/md:px-(\d+)/) ?? [];

		expect(Number(added)).toBe(2 * Number(step) * SPACING_STEP_PX);
	});
});
