import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PRODUCT_LINKS } from "@/components/Footer";
import { DEFAULT_GENERATION_LIMIT } from "@/lib/quota";
import {
	QUESTION_COUNT_WORD,
	STARTER_QUESTIONS,
} from "@/lib/starter-questions";
import { isServedRoute } from "@/test/served-route";
import { Docs } from "./docs";

/**
 * The docs page, held against the catalogue it documents.
 *
 * The questions section renders from `STARTER_QUESTIONS` directly, so it
 * cannot drift — what these tests guard is the page around it: that the docs
 * exist as a route, are linked, state the real quota, and render the whole
 * catalogue rather than a remembered subset of it.
 */

const SOURCE = readFileSync("src/routes/docs.tsx", "utf8");

describe("the docs page", () => {
	it("is a route the navbar and footer can point at", () => {
		expect(isServedRoute("/docs")).toBe(true);
		expect(PRODUCT_LINKS.some(({ href }) => href === "/docs")).toBe(true);
	});

	it("states the quota from the constant that enforces it", () => {
		expect(SOURCE).toContain("DEFAULT_GENERATION_LIMIT");
		expect(DEFAULT_GENERATION_LIMIT).toBeGreaterThan(0);
	});

	it("says how many questions there are in the derived word", () => {
		expect(SOURCE).toContain("QUESTION_COUNT_WORD");
		expect(QUESTION_COUNT_WORD).toMatch(/^[a-z]+$/);
	});

	it("renders identical markup on the server across separate renders", () => {
		expect(renderToString(<Docs />)).toBe(renderToString(<Docs />));
	});

	it("renders every question the wizard asks", () => {
		render(<Docs />);

		for (const question of STARTER_QUESTIONS) {
			expect(screen.getByText(question.prompt)).toBeInTheDocument();
		}
	});

	it("offers every option the wizard offers", () => {
		render(<Docs />);

		for (const question of STARTER_QUESTIONS) {
			for (const option of question.options ?? []) {
				expect(screen.getAllByText(option.label).length).toBeGreaterThan(0);
			}
		}
	});

	it("carries the anchors its sections are addressed by", () => {
		const { container } = render(<Docs />);

		for (const id of [
			"quickstart",
			"questions",
			"allowance",
			"the-zip",
			"deploying",
		]) {
			expect(container.querySelector(`#${id}`)).not.toBeNull();
		}
	});
});
