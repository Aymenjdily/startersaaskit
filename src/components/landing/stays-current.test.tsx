import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CONTRASTS, StaysCurrent } from "./stays-current";

const column = (tone: "forked" | "generated") =>
	within(document.querySelector(`[data-column="${tone}"]`) as HTMLElement);

describe("StaysCurrent", () => {
	it("puts every contrast on the side that argues it", () => {
		render(<StaysCurrent />);

		for (const row of CONTRASTS) {
			expect(column("forked").getByText(row.forked)).toBeInTheDocument();
			expect(column("generated").getByText(row.generated)).toBeInTheDocument();
		}
	});

	/**
	 * The two columns are a pairing, not two lists: row `n` on the right answers
	 * row `n` on the left. Rendering them from one structure is what keeps that
	 * true, so the spec checks the counts match rather than trusting the markup.
	 */
	it("keeps the columns the same length", () => {
		render(<StaysCurrent />);

		expect(column("forked").getAllByRole("listitem")).toHaveLength(
			CONTRASTS.length,
		);
		expect(column("generated").getAllByRole("listitem")).toHaveLength(
			CONTRASTS.length,
		);
	});

	/**
	 * The concession is the load-bearing sentence — see the comment in the
	 * component. A page that answers "does it go stale?" without admitting that
	 * a downloaded repo is frozen is making a claim the generator cannot keep,
	 * so this asserts the admission is present and not quietly softened away.
	 */
	it("admits that an already-downloaded starter does not update", () => {
		render(<StaysCurrent />);

		expect(screen.getByText(/stays exactly as delivered/i)).toBeInTheDocument();
		expect(
			screen.getByText(/nothing here reaches back into it/i),
		).toBeInTheDocument();
	});

	it("heads the section once, and titles each column below it", () => {
		const { container } = render(<StaysCurrent />);

		expect(container.querySelectorAll("h2")).toHaveLength(1);
		expect(container.querySelectorAll("h3")).toHaveLength(2);
		expect(container.querySelectorAll("h1")).toHaveLength(0);
	});

	it("sells nothing — the section is an argument, not a call to action", () => {
		const { container } = render(<StaysCurrent />);
		expect(container.querySelectorAll("a, button")).toHaveLength(0);
	});
});
