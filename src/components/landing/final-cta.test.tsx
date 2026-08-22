import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { README_URL, REPO_URL } from "@/lib/brand";
import { FinalCta } from "./final-cta";

const dots = (container: HTMLElement) =>
	container.querySelector("[data-dots]") as HTMLElement;

describe("FinalCta", () => {
	it("restates the promise in one heading", () => {
		render(<FinalCta />);

		expect(
			screen.getByRole("heading", {
				name: "Start with the tests already written",
			}),
		).toBeInTheDocument();
	});

	it("renders identical markup on the server across separate renders", () => {
		expect(renderToString(<FinalCta />)).toBe(renderToString(<FinalCta />));
	});

	/** One column, one thing to do. Anything else here is a second column. */
	it("closes on the heading, one line, and two buttons", () => {
		render(<FinalCta />);

		expect(screen.getAllByRole("heading")).toHaveLength(1);
		expect(screen.getAllByRole("link")).toHaveLength(2);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
	});

	describe("calls to action", () => {
		it("offers one primary and one secondary destination", () => {
			render(<FinalCta />);

			const links = screen.getAllByRole("link");
			expect(links[0]).toHaveAccessibleName(/Get started/);
			expect(links[0]).toHaveAttribute("href", REPO_URL);
			expect(links[1]).toHaveAccessibleName("Read the README");
			expect(links[1]).toHaveAttribute("href", README_URL);
		});

		/**
		 * `target="_blank"` without `rel="noreferrer"` leaks the referrer and hands
		 * the opened page a live `window.opener` handle.
		 */
		it("opens external destinations safely", () => {
			render(<FinalCta />);

			for (const link of screen.getAllByRole("link")) {
				expect(link).toHaveAttribute("target", "_blank");
				expect(link).toHaveAttribute(
					"rel",
					expect.stringContaining("noreferrer"),
				);
			}
		});
	});

	/**
	 * The field runs off the bottom of the page rather than stopping, which only
	 * works while the section keeps no padding under it.
	 */
	describe("the dot field it runs out on", () => {
		it("ends the section with nothing after it", () => {
			const { container } = render(<FinalCta />);
			const section = container.querySelector("section") as HTMLElement;

			expect(dots(container)).not.toBeNull();
			expect(section.lastElementChild).toBe(dots(container));
			expect(section.className).toContain("pb-0");
		});

		it("fades in downwards instead of starting on an edge", () => {
			const { container } = render(<FinalCta />);

			expect(dots(container).className).toContain("transparent_0%");
		});

		/** Texture. A screen reader has nothing to say about it. */
		it("stays out of the accessibility tree and out of the way", () => {
			const { container } = render(<FinalCta />);

			expect(dots(container)).toHaveAttribute("aria-hidden", "true");
			expect(dots(container).className).toContain("pointer-events-none");
		});
	});
});
