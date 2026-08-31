import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SIGN_UP_HREF } from "@/lib/brand";
import { DEFAULT_GENERATION_LIMIT, FEEDBACK_REWARD } from "@/lib/quota";
import { Pricing } from "./pricing";

describe("Pricing", () => {
	it("carries the anchor the navbar's Pricing link points at", () => {
		const { container } = render(<Pricing />);
		expect(container.querySelector("#pricing")).not.toBeNull();
	});

	it("states the price as free", () => {
		render(<Pricing />);
		expect(screen.getByText("$0")).toBeInTheDocument();
		expect(screen.getAllByText(/[Ff]ree/).length).toBeGreaterThan(0);
	});

	/**
	 * The allowance printed here is imported from `lib/quota.ts`, not typed —
	 * this only checks the two constants actually reach the card. Whether
	 * those constants match the database is `quota.sql.test.ts`'s job, the
	 * same split the docs page uses for the same numbers.
	 */
	it("states the real allowance, not a guessed one", () => {
		render(<Pricing />);

		expect(
			screen.getByText(new RegExp(`${DEFAULT_GENERATION_LIMIT} generations`)),
		).toBeInTheDocument();
		expect(
			screen.getByText(new RegExp(`${FEEDBACK_REWARD} more`)),
		).toBeInTheDocument();
	});

	it("sends the reader to sign up, in the same tab", () => {
		render(<Pricing />);

		const cta = screen.getByRole("link", { name: /Get started free/ });
		expect(cta).toHaveAttribute("href", SIGN_UP_HREF);
		expect(cta).not.toHaveAttribute("target");
	});

	it("renders identical markup across separate server renders", () => {
		expect(renderToString(<Pricing />)).toBe(renderToString(<Pricing />));
	});
});
