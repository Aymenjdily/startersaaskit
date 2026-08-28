import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SIGN_UP_HREF } from "@/lib/brand";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";

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
		const subtitle = () => {
			const { container } = render(<Hero />);
			const el = container.querySelector("[data-subtitle]");
			expect(el).not.toBeNull();
			return el?.textContent ?? "";
		};

		it.each([
			{ label: "Framework" },
			{ label: "Components" },
			{ label: "Database" },
			{ label: "ORM" },
			{ label: "Auth" },
		])("offers $label, which the wizard asks about", ({ label }) => {
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

		it("points the secondary action at a section this page renders", () => {
			render(<Hero />);
			const href = screen.getAllByRole("link")[1].getAttribute("href");
			expect(href).toBe("#how-it-works");

			const { container } = render(<HowItWorks />);
			expect(container.querySelector(href as string)).not.toBeNull();
		});
	});
});
