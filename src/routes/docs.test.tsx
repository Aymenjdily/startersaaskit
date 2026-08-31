import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PRODUCT_LINKS } from "@/components/Footer";
import { REPO_URL } from "@/lib/brand";
import { DEFAULT_GENERATION_LIMIT } from "@/lib/quota";
import {
	QUESTION_COUNT_WORD,
	STARTER_QUESTIONS,
} from "@/lib/starter-questions";
import { isServedRoute } from "@/test/served-route";
import { Docs } from "./docs";

const SECTION_TITLES = {
	quickstart: "Quickstart",
	questions: "The questions",
	allowance: "Your allowance",
	"the-zip": "What the zip contains",
	deploying: "Deploying",
} as const;

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

		for (const id of Object.keys(SECTION_TITLES)) {
			expect(container.querySelector(`#${id}`)).not.toBeNull();
		}
	});

	/**
	 * The sidebar, the mobile pill row, and each section's own `<h2>` are three
	 * separate renders of the same outline (`SECTIONS` in `docs.tsx`). Nothing
	 * stops them drifting apart except this — a nav that named a section
	 * differently from its heading would send a reader to the right anchor
	 * under the wrong label.
	 */
	describe("the on-this-page nav", () => {
		it("names every section exactly as its heading does, in both navs", () => {
			render(<Docs />);

			for (const [id, title] of Object.entries(SECTION_TITLES)) {
				const heading = screen.getByRole("heading", { level: 2, name: title });
				expect(heading.closest("section")).toHaveAttribute("id", id);
				// Once in the desktop rail, once in the mobile pill row.
				expect(screen.getAllByRole("link", { name: title })).toHaveLength(2);
			}
		});

		it("points every section link at that section's own anchor", () => {
			render(<Docs />);

			for (const [id, title] of Object.entries(SECTION_TITLES)) {
				for (const link of screen.getAllByRole("link", { name: title })) {
					expect(link).toHaveAttribute("href", `#${id}`);
				}
			}
		});

		it("highlights the first section before the reader has scrolled", () => {
			render(<Docs />);

			const first = screen.getAllByRole("link", {
				name: SECTION_TITLES.quickstart,
			})[0];
			expect(first).toHaveAttribute("aria-current", "location");
		});

		it("sends the edit link to this file on GitHub, in a new tab", () => {
			render(<Docs />);

			const edit = screen.getByRole("link", { name: /Edit this page/ });
			expect(edit).toHaveAttribute(
				"href",
				`${REPO_URL}/blob/main/src/routes/docs.tsx`,
			);
			expect(edit).toHaveAttribute("target", "_blank");
			expect(edit).toHaveAttribute("rel", "noreferrer");
		});
	});

	describe("copying the quickstart", () => {
		/**
		 * jsdom's `navigator.clipboard` is a getter with no setter, so a plain
		 * `Object.assign` either no-ops or throws depending on strict mode.
		 * `defineProperty` replaces it outright; `configurable: true` lets the
		 * next test replace it again rather than leaking into one another.
		 *
		 * Must run *after* `userEvent.setup()`, not before: setup() installs its
		 * own clipboard polyfill as a side effect, and it wins if it goes second.
		 */
		function stubClipboard(
			value: { writeText: (t: string) => Promise<void> } | undefined,
		) {
			Object.defineProperty(navigator, "clipboard", {
				value,
				configurable: true,
			});
		}

		it("copies every command, joined by newline", async () => {
			const user = userEvent.setup();
			const writeText = vi.fn().mockResolvedValue(undefined);
			stubClipboard({ writeText });
			render(<Docs />);

			await user.click(screen.getByRole("button", { name: /^Copy$/ }));

			expect(writeText).toHaveBeenCalledWith(
				"pnpm install\npnpm test\npnpm dev",
			);
			expect(
				await screen.findByRole("button", { name: /^Copied$/ }),
			).toBeInTheDocument();
		});

		it("does not crash when the clipboard is unavailable", async () => {
			const user = userEvent.setup();
			stubClipboard(undefined);
			render(<Docs />);

			await user.click(screen.getByRole("button", { name: /^Copy$/ }));

			expect(
				screen.getByRole("button", { name: /^Copy$/ }),
			).toBeInTheDocument();
		});
	});
});
