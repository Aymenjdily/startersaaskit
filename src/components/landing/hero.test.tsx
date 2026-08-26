import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SIGN_UP_HREF } from "@/lib/brand";
import { Hero } from "./hero";
import { ANSWERS, HowItWorks } from "./how-it-works";

/**
 * The last answer names the repo; everything before it is a stack choice. The
 * subtitle lists those choices, so it is the slice the two have to agree on.
 */
const STACK_AXES = ANSWERS.slice(0, -1);

describe("Hero", () => {
	it("leads with a single h1", () => {
		const { container } = render(<Hero />);
		const h1s = container.querySelectorAll("h1");
		expect(h1s).toHaveLength(1);
		expect(h1s[0]).toHaveTextContent(
			"Skip the boilerplate. Keep your stack. Ship the product.",
		);
	});

	describe("what the subtitle promises", () => {
		/**
		 * Selected by `data-subtitle`, not by class: three elements share
		 * `hero-in`, and matching on it silently read the eyebrow instead.
		 */
		const subtitle = () => {
			const { container } = render(<Hero />);
			const el = container.querySelector("[data-subtitle]");
			expect(el).not.toBeNull();
			return el?.textContent ?? "";
		};

		/**
		 * This used to forbid words the repo could not deliver, back when the
		 * subtitle described this codebase. It now describes the wizard, so the
		 * check that matters is different: every choice the hero advertises has to
		 * be a question the wizard actually asks.
		 */
		it.each(STACK_AXES)("offers $label, which the wizard asks about", ({
			label,
		}) => {
			expect(subtitle().toLowerCase()).toContain(label.toLowerCase());
		});

		it("promises the repo arrives passing its tests", () => {
			expect(subtitle()).toMatch(/test/i);
		});
	});

	it("states the offer up front", () => {
		render(<Hero />);
		expect(screen.getByText("Free while in beta")).toBeVisible();
	});

	describe("calls to action", () => {
		it("offers exactly one primary and one secondary action", () => {
			render(<Hero />);
			const links = screen.getAllByRole("link");
			expect(links).toHaveLength(2);
			expect(links[0]).toHaveAccessibleName(/Generate your starter/);
			expect(links[1]).toHaveAccessibleName(/See how it works/);
		});

		/**
		 * Both actions stay on our own site now — one into the product, one down
		 * the page. `target="_blank"` on either would throw the reader out of a
		 * flow they are already in.
		 */
		it("keeps both actions in the same tab", () => {
			render(<Hero />);
			for (const link of screen.getAllByRole("link")) {
				expect(link).not.toHaveAttribute("target");
			}
		});

		it("sends the primary action into the product", () => {
			render(<Hero />);
			expect(screen.getAllByRole("link")[0]).toHaveAttribute(
				"href",
				SIGN_UP_HREF,
			);
		});

		/** A dead anchor would scroll nowhere and look like a broken button. */
		it("points the secondary action at a section this page renders", () => {
			render(<Hero />);
			const href = screen.getAllByRole("link")[1].getAttribute("href");
			expect(href).toBe("#how-it-works");

			const { container } = render(<HowItWorks />);
			expect(container.querySelector(href as string)).not.toBeNull();
		});
	});

	describe("product preview", () => {
		it("renders the placeholder rather than a broken recording", () => {
			render(<Hero />);
			expect(screen.getByText("Product preview")).toBeVisible();
			expect(
				screen.getByText("A walkthrough of the generator is on the way."),
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
