import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BRAND, LOGO_SRC } from "@/lib/brand";
import { Navbar } from "./Navbar";

const USE_CASES = [
	"B2B SaaS",
	"Internal tools",
	"Side projects",
	"Client work",
	"AI apps",
];

describe("Navbar", () => {
	describe("branding", () => {
		it("links the logo home and names the product for screen readers", () => {
			render(<Navbar />);
			const logo = screen.getByAltText(BRAND);
			expect(logo).toHaveAttribute("src", LOGO_SRC);
			expect(logo.closest("a")).toHaveAttribute("href", "/");
		});
	});

	describe("desktop navigation", () => {
		it("exposes the primary sections", () => {
			render(<Navbar />);
			expect(
				screen.getByRole("link", { name: "Features" }),
			).toBeInTheDocument();
			expect(screen.getByRole("link", { name: "Testing" })).toBeInTheDocument();
		});

		it("lists every use case in the dropdown", () => {
			render(<Navbar />);
			for (const label of USE_CASES) {
				expect(screen.getByRole("link", { name: label })).toHaveAttribute(
					"href",
					"#use-cases",
				);
			}
		});

		it("opens external destinations safely", () => {
			render(<Navbar />);
			// Docs carries a decorative ↗ inside a nested span, so match loosely.
			for (const name of [/^Docs/, /^GitHub$/, /^Get started$/]) {
				const link = screen.getByRole("link", { name });
				expect(link).toHaveAttribute("target", "_blank");
				expect(link).toHaveAttribute(
					"rel",
					expect.stringContaining("noreferrer"),
				);
				expect(link.getAttribute("href")).toMatch(/^https:\/\/github\.com\//);
			}
		});
	});

	describe("mobile menu", () => {
		/**
		 * The panel is conditionally rendered rather than hidden with CSS, so the
		 * toggle genuinely controls whether the links exist in the accessibility
		 * tree. `aria-expanded` has to track that, or the button lies to a screen
		 * reader about what it does.
		 */
		it("starts closed", () => {
			render(<Navbar />);
			const toggle = screen.getByRole("button", { name: "Toggle menu" });
			expect(toggle).toHaveAttribute("aria-expanded", "false");
			expect(
				screen.queryByRole("button", { name: /Use cases/ }),
			).not.toBeInTheDocument();
		});

		it("opens and closes on the toggle", async () => {
			const user = userEvent.setup();
			render(<Navbar />);
			const toggle = screen.getByRole("button", { name: "Toggle menu" });

			await user.click(toggle);
			expect(toggle).toHaveAttribute("aria-expanded", "true");
			expect(
				screen.getByRole("button", { name: /Use cases/ }),
			).toBeInTheDocument();

			await user.click(toggle);
			expect(toggle).toHaveAttribute("aria-expanded", "false");
			expect(
				screen.queryByRole("button", { name: /Use cases/ }),
			).not.toBeInTheDocument();
		});

		it("expands the nested use-cases accordion independently", async () => {
			const user = userEvent.setup();
			render(<Navbar />);

			await user.click(screen.getByRole("button", { name: "Toggle menu" }));
			const accordion = screen.getByRole("button", { name: /Use cases/ });
			expect(accordion).toHaveAttribute("aria-expanded", "false");

			await user.click(accordion);
			expect(accordion).toHaveAttribute("aria-expanded", "true");
			// One desktop copy plus one mobile copy of each entry.
			expect(screen.getAllByRole("link", { name: "B2B SaaS" })).toHaveLength(2);
		});

		/**
		 * Every in-page link has to dismiss the panel. It is a full-screen overlay,
		 * so navigating to an anchor behind it would otherwise land the user on a
		 * section they cannot see.
		 */
		it("closes when a section link is tapped", async () => {
			const user = userEvent.setup();
			render(<Navbar />);
			await user.click(screen.getByRole("button", { name: "Toggle menu" }));

			const panel = screen.getByRole("button", {
				name: /Use cases/,
			}).parentElement?.parentElement as HTMLElement;

			await user.click(
				within(panel).getAllByRole("link", { name: "Features" })[0],
			);

			expect(
				screen.getByRole("button", { name: "Toggle menu" }),
			).toHaveAttribute("aria-expanded", "false");
		});

		it("closes when a use-case link is tapped", async () => {
			const user = userEvent.setup();
			render(<Navbar />);
			await user.click(screen.getByRole("button", { name: "Toggle menu" }));
			await user.click(screen.getByRole("button", { name: /Use cases/ }));

			await user.click(screen.getAllByRole("link", { name: "AI apps" })[1]);

			expect(
				screen.getByRole("button", { name: "Toggle menu" }),
			).toHaveAttribute("aria-expanded", "false");
		});
	});
});
