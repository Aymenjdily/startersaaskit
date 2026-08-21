import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "./hero";

const repoPath = (path: string) => resolve(process.cwd(), path);

const installed = (): string[] =>
	Object.keys(
		JSON.parse(readFileSync(repoPath("package.json"), "utf8")).dependencies,
	);

/**
 * The subtitle is the broadest claim on the page, and it named billing, email
 * and CI for a while when the repo shipped none of them.
 *
 * Each entry releases itself: the word is only forbidden while nothing that
 * could deliver it is installed. Add Stripe and "billing" becomes sayable.
 */
const NOT_YET_SHIPPED = [
	{
		word: "billing",
		needs: ["stripe", "@polar-sh/sdk", "@lemonsqueezy/lemonsqueezy.js"],
	},
	{
		word: "email",
		needs: ["resend", "nodemailer", "postmark", "@react-email/render"],
	},
];

describe("Hero", () => {
	it("leads with a single h1", () => {
		const { container } = render(<Hero />);
		const h1s = container.querySelectorAll("h1");
		expect(h1s).toHaveLength(1);
		expect(h1s[0]).toHaveTextContent(
			"Skip the boilerplate. Keep the tests. Ship the product.",
		);
	});

	describe("what the subtitle promises", () => {
		/**
		 * Selected by `data-subtitle`, not by class: three elements share
		 * `hero-in`, and matching on it silently read the licence line instead.
		 */
		const subtitle = () => {
			const { container } = render(<Hero />);
			const el = container.querySelector("[data-subtitle]");
			expect(el).not.toBeNull();
			return el?.textContent ?? "";
		};

		it.each(NOT_YET_SHIPPED)("does not offer $word while nothing ships it", ({
			word,
			needs,
		}) => {
			const deps = installed();
			if (needs.some((pkg) => deps.includes(pkg))) return;
			expect(subtitle().toLowerCase()).not.toContain(word);
		});

		it("does not offer CI while no workflow ships", () => {
			if (existsSync(repoPath(".github"))) return;
			expect(subtitle()).not.toMatch(/\bCI\b/);
		});
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
