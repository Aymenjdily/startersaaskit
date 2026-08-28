import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { BRAND, LOGO_SRC } from "@/lib/brand";
import { Navbar } from "./Navbar";

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
		});

		/**
		 * Every destination in the bar is part of the product now, Docs included.
		 * An external link here once leaked the referrer for want of
		 * `rel="noreferrer"`; nothing leaves the site, so nothing opens a new tab.
		 */
		it("keeps every link in the same tab", () => {
			render(<Navbar />);

			for (const anchor of screen.getAllByRole("link")) {
				expect(anchor).not.toHaveAttribute("target");
				expect(anchor.getAttribute("href")).toMatch(/^\//);
			}
		});

		/**
		 * Sign in and Get started are the product, not a repo. Opening either in a
		 * new tab would break the flow the button is asking the reader to start.
		 */
		it("keeps the account actions in the same tab", () => {
			render(<Navbar />);

			for (const name of [/^Sign in$/, /^Get started$/]) {
				const link = screen.getAllByRole("link", { name })[0];
				expect(link).not.toHaveAttribute("target");
				expect(link.getAttribute("href")).toMatch(/^\//);
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
			/* The desktop bar hides below `md` with CSS but stays in the tree, so
			   "closed" means no second copy of the section links. */
			expect(screen.getAllByRole("link", { name: "Features" })).toHaveLength(1);
		});

		it("opens and closes on the toggle", async () => {
			const user = userEvent.setup();
			render(<Navbar />);
			const toggle = screen.getByRole("button", { name: "Toggle menu" });

			await user.click(toggle);
			expect(toggle).toHaveAttribute("aria-expanded", "true");
			expect(screen.getAllByRole("link", { name: "Features" })).toHaveLength(2);

			await user.click(toggle);
			expect(toggle).toHaveAttribute("aria-expanded", "false");
			expect(screen.getAllByRole("link", { name: "Features" })).toHaveLength(1);
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

			/* Two copies exist once the panel is open: [0] is the desktop bar,
			   [1] the mobile panel. Tapping the panel's copy must close it. */
			await user.click(screen.getAllByRole("link", { name: "Features" })[1]);

			expect(
				screen.getByRole("button", { name: "Toggle menu" }),
			).toHaveAttribute("aria-expanded", "false");
		});
	});
});
