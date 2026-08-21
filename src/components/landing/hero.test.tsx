import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

describe("Hero", () => {
	it("leads with a single h1", () => {
		const { container } = render(<Hero />);
		const h1s = container.querySelectorAll("h1");
		expect(h1s).toHaveLength(1);
		expect(h1s[0]).toHaveTextContent(
			"Skip the boilerplate. Keep the tests. Ship the product.",
		);
	});

	it("states the licence up front", () => {
		render(<Hero />);
		expect(screen.getByText("Open source · MIT licensed")).toBeVisible();
	});

	describe("calls to action", () => {
		it("offers exactly one primary and one secondary action", () => {
			render(<Hero />);
			const links = screen.getAllByRole("link");
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAccessibleName(/Get started/);
			expect(links[1]).toHaveAccessibleName(/View on GitHub/);
		});

		/**
		 * `target="_blank"` without `rel="noreferrer"` leaks the referrer and hands
		 * the opened page a live `window.opener` handle.
		 */
		it("opens external links safely", () => {
			render(<Hero />);
			for (const link of screen.getAllByRole("link")) {
				expect(link).toHaveAttribute("target", "_blank");
				expect(link).toHaveAttribute(
					"rel",
					expect.stringContaining("noreferrer"),
				);
			}
		});

		it("points both actions at the repository", () => {
			render(<Hero />);
			for (const link of screen.getAllByRole("link")) {
				expect(link.getAttribute("href")).toMatch(/^https:\/\/github\.com\//);
			}
		});
	});

	describe("product preview", () => {
		it("renders the placeholder rather than a broken recording", () => {
			render(<Hero />);
			expect(screen.getByText("Product preview")).toBeVisible();
			expect(
				screen.getByText("A walkthrough of the kit is on the way."),
			).toBeVisible();
		});

		/**
		 * The frame is aspect-locked so dropping in the real recording later causes
		 * no layout shift. Losing the ratio would regress CLS silently.
		 */
		it("reserves the aspect ratio the recording will occupy", () => {
			const { container } = render(<Hero />);
			expect(
				container.querySelector('[class*="aspect-[16/10]"]'),
			).toBeInTheDocument();
		});
	});
});
