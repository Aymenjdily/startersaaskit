import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SIGN_UP_HREF } from "@/lib/brand";
import type { StarterPreview } from "@/lib/starter-preview";
import { Hero } from "./hero";
import { ANSWERS, HowItWorks } from "./how-it-works";

/**
 * The last answer names the repo; everything before it is a stack choice. The
 * subtitle lists those choices, so it is the slice the two have to agree on.
 */
const STACK_AXES = ANSWERS.slice(0, -1);

/**
 * One combination is enough for these tests.
 *
 * They are about the hero's copy, not its panel — the generator preview has its
 * own tests. A fixture keeps the real `buildStarter` out of a suite that has no
 * opinion about file trees.
 */
const PREVIEWS: StarterPreview[] = [
	{
		framework: "nextjs",
		database: "neon",
		tree: [
			{ id: "src", name: "src", children: [{ id: "src/app", name: "app" }] },
		],
		files: 44,
		tests: 7,
		opening: {
			path: "src/db/schema.ts",
			source: "export const users = table(",
		},
	},
];

describe("Hero", () => {
	it("leads with a single h1", () => {
		const { container } = render(<Hero previews={PREVIEWS} />);
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
			const { container } = render(<Hero previews={PREVIEWS} />);
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
		render(<Hero previews={PREVIEWS} />);
		expect(screen.getByText("Free while in beta")).toBeVisible();
	});

	describe("calls to action", () => {
		it("offers exactly one primary and one secondary action", () => {
			render(<Hero previews={PREVIEWS} />);
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
			render(<Hero previews={PREVIEWS} />);
			for (const link of screen.getAllByRole("link")) {
				expect(link).not.toHaveAttribute("target");
			}
		});

		it("sends the primary action into the product", () => {
			render(<Hero previews={PREVIEWS} />);
			expect(screen.getAllByRole("link")[0]).toHaveAttribute(
				"href",
				SIGN_UP_HREF,
			);
		});

		/** A dead anchor would scroll nowhere and look like a broken button. */
		it("points the secondary action at a section this page renders", () => {
			render(<Hero previews={PREVIEWS} />);
			const href = screen.getAllByRole("link")[1].getAttribute("href");
			expect(href).toBe("#how-it-works");

			const { container } = render(<HowItWorks />);
			expect(container.querySelector(href as string)).not.toBeNull();
		});
	});

	describe("the generator panel", () => {
		it("shows real generated files rather than a promise of some", () => {
			render(<Hero previews={PREVIEWS} />);

			/* The placeholder this replaced said a walkthrough was "on the way".
			   A hero whose largest element is an IOU is worse than a smaller
			   hero, and it is the kind of copy that survives to launch. */
			expect(screen.queryByText(/on the way/i)).not.toBeInTheDocument();
			expect(screen.getByText("src/")).toBeVisible();
		});

		it("reports counts taken from the generated paths", () => {
			render(<Hero previews={PREVIEWS} />);

			expect(screen.getByText("44 files · 7 tests")).toBeVisible();
		});
	});
});
