import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TrustStrip } from "./trust-strip";

describe("TrustStrip", () => {
	it("labels the row", () => {
		render(<TrustStrip />);
		expect(screen.getByText("Pick the tools you already trust")).toBeVisible();
	});

	/**
	 * The strip is a trust signal, so the specific names matter — this is the one
	 * place the page claims what the kit is built on. Next.js and Prisma are
	 * included deliberately: they belong to the planned Next.js starters rather
	 * than this repo's current dependencies.
	 */
	it("names the whole stack", () => {
		render(<TrustStrip />);

		for (const label of [
			"TanStack Start",
			"Next.js",
			"React 19",
			"Neon",
			"Drizzle ORM",
			"Prisma",
			"Better Auth",
			"Tailwind CSS",
			"Biome",
			"Vercel",
		]) {
			expect(screen.getByText(label)).toBeInTheDocument();
		}
	});

	it("renders one list item per tool", () => {
		const { container } = render(<TrustStrip />);
		expect(container.querySelectorAll("li")).toHaveLength(10);
	});

	/**
	 * Each glyph sits next to its own name, so the icons are decorative. If one
	 * ever loses `aria-hidden` a screen reader would announce the tool twice.
	 */
	it("pairs every glyph with a text label and hides the glyph", () => {
		const { container } = render(<TrustStrip />);
		const items = container.querySelectorAll("li");

		for (const item of items) {
			const svg = item.querySelector("svg");
			expect(svg).toHaveAttribute("aria-hidden", "true");
			expect(item.textContent?.trim()).not.toBe("");
		}
	});

	it("does not present the tools as links", () => {
		const { container } = render(<TrustStrip />);
		expect(container.querySelectorAll("a")).toHaveLength(0);
	});
});
