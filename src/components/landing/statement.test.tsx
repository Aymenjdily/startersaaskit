import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Statement } from "./statement";

describe("Statement", () => {
	/**
	 * The clauses are split by empty `.mobile-br` spans that only become blocks
	 * below 768px. Those spans fragment the text nodes, so an exact-string query
	 * would fail even though the rendered sentence is correct — hence the
	 * normalised `textContent` check.
	 */
	it("reads as one sentence despite the mobile line breaks", () => {
		render(<Statement />);
		const heading = screen.getByRole("heading", { level: 2 });

		expect(heading.textContent?.replace(/\s+/g, " ").trim()).toBe(
			"Any stack. Any provider. Already wired.",
		);
	});

	it("is a single h2 — it heads the section below it", () => {
		const { container } = render(<Statement />);
		expect(container.querySelectorAll("h2")).toHaveLength(1);
		expect(container.querySelectorAll("h1, h3")).toHaveLength(0);
	});

	it("inserts a break opportunity between each clause", () => {
		const { container } = render(<Statement />);
		// Two breaks for three clauses.
		expect(container.querySelectorAll("span.max-md\\:block")).toHaveLength(2);
	});

	it("carries no call to action — it is purely rhythmic", () => {
		const { container } = render(<Statement />);
		expect(container.querySelectorAll("a, button")).toHaveLength(0);
	});
});
