import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BRAND, LOGO_MARK_SIZE, LOGO_MARK_SRC, LOGO_SRC } from "@/lib/brand";
import { CONSOLE_HREF, navItemsFor } from "@/lib/console-nav";
import { IconRail, MOBILE_QUERY } from "./icon-rail";

const ada = {
	email: "ada@example.com",
	user_metadata: { full_name: "Ada Lovelace" },
};

function renderIconRail(props: Partial<Parameters<typeof IconRail>[0]> = {}) {
	return render(
		<IconRail
			currentPath={CONSOLE_HREF}
			onFeedback={vi.fn()}
			onReport={vi.fn()}
			onSignOut={vi.fn()}
			user={ada}
			{...props}
		/>,
	);
}

/** Stubs `matchMedia` so the rail's own viewport check sees a phone or not. */
function stubViewport(mobile: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: mobile && query === MOBILE_QUERY,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	);
}

describe("IconRail", () => {
	/* The expanded/collapsed choice is remembered in localStorage — cleared so
	   one test's toggle cannot leave the next one starting pre-expanded. The
	   viewport is stubbed to "not a phone" by default, matching every existing
	   test's assumption of starting expanded; the mobile describe block below
	   opts back in per test. */
	beforeEach(() => {
		localStorage.clear();
		stubViewport(false);
	});

	it("renders identical markup across separate server renders", () => {
		const rail = (
			<IconRail
				currentPath={CONSOLE_HREF}
				onFeedback={vi.fn()}
				onReport={vi.fn()}
				onSignOut={vi.fn()}
				user={ada}
			/>
		);

		expect(renderToString(rail)).toBe(renderToString(rail));
	});

	it("is findable as the console's navigation", () => {
		renderIconRail();

		expect(screen.getByRole("navigation", { name: "Console" })).toBeVisible();
	});

	/**
	 * `navItemsFor(true)`, not `NAV_ITEMS`.
	 *
	 * The list now holds a row the rail hides from ordinary accounts, so
	 * iterating the raw constant asserts the rail draws a link it is supposed to
	 * withhold. Rendering as an admin is what makes "offers every item" true.
	 */
	it.each(navItemsFor(true))("offers $label", ({ href, label }) => {
		renderIconRail({ isAdmin: true });

		expect(
			screen.getByRole("link", { name: new RegExp(label) }),
		).toHaveAttribute("href", href);
	});

	describe("the current page", () => {
		/**
		 * `aria-current` rather than a colour alone. Someone using a screen reader
		 * gets no benefit from a lighter background, and it is the attribute that
		 * says "you are here" rather than merely looking like it.
		 */
		it("is marked for screen readers, not just tinted", () => {
			renderIconRail({ currentPath: CONSOLE_HREF });

			expect(screen.getByRole("link", { name: /Overview/ })).toHaveAttribute(
				"aria-current",
				"page",
			);
		});

		it("is the only one marked", () => {
			const { container } = renderIconRail({ currentPath: "/starters" });

			expect(container.querySelectorAll("[aria-current='page']")).toHaveLength(
				1,
			);
			expect(screen.getByRole("link", { name: /Starters/ })).toHaveAttribute(
				"aria-current",
				"page",
			);
		});

		it("marks nothing on a path that is not in the rail", () => {
			const { container } = renderIconRail({ currentPath: "/sign-in" });

			expect(container.querySelectorAll("[aria-current='page']")).toHaveLength(
				0,
			);
		});
	});

	/**
	 * An icon rail has nowhere to print "Soon", so the warning moved into the
	 * accessible name and the tooltip. It still has to be there — a row that
	 * looks identical to a working one and opens an empty page is the thing
	 * this is guarding against.
	 */
	describe("pages that do not exist yet", () => {
		it.each(
			navItemsFor(true).filter((item) => !item.built),
		)("warns that $label is not built, in its name and its tooltip", ({
			label,
		}) => {
			renderIconRail();

			const link = screen.getByRole("link", { name: `${label} (soon)` });
			expect(link).toHaveAttribute("title", `${label} — not built yet`);
		});

		it.each(
			navItemsFor(true).filter((item) => item.built),
		)("says nothing of the sort about $label", ({ label }) => {
			renderIconRail({ isAdmin: true });

			const link = screen.getByRole("link", { name: label });
			expect(link).toHaveAttribute("title", label);
		});
	});

	describe("whoever is signed in", () => {
		/**
		 * The tooltip names the account regardless of width — collapsed, it is
		 * the only place that answers "whose account is this?" without leaving
		 * the page; expanded, it is redundant with the name printed beside the
		 * avatar (covered by "starts expanded, with every label already on
		 * screen"), but still correct rather than removed.
		 */
		it("names the account on the avatar", () => {
			const { container } = renderIconRail();

			expect(container.querySelector('[title="Ada Lovelace"]')).not.toBeNull();
		});

		const withPhoto = {
			...ada,
			user_metadata: {
				...ada.user_metadata,
				avatar_url: "https://cdn.test/a.png",
			},
		};
		const photo = () =>
			document.querySelector('img[src="https://cdn.test/a.png"]');

		it("shows the provider's avatar when there is one", () => {
			renderIconRail({ user: withPhoto });

			expect(photo()).toBeVisible();
			/* Decorative: the name sits right beside it, so alt text would repeat. */
			expect(photo()).toHaveAttribute("alt", "");
		});

		/**
		 * The console's URL is nobody else's business, and Google's CDN is known
		 * to refuse some referrers outright — which would break the very avatar
		 * this is meant to display.
		 */
		it("does not leak the page URL to whoever hosts the photo", () => {
			renderIconRail({ user: withPhoto });

			expect(photo()).toHaveAttribute("referrerpolicy", "no-referrer");
		});

		it("falls back to initials when there is no photo", () => {
			renderIconRail();

			expect(screen.getByText("AL")).toBeVisible();
		});

		/**
		 * A provider URL can rot or be blocked after the fact. Without this the
		 * rail shows a broken-image icon, which looks like our bug rather than a
		 * missing file.
		 */
		it("falls back to initials when the photo fails to load", () => {
			renderIconRail({ user: withPhoto });
			expect(screen.queryByText("AL")).toBeNull();

			fireEvent.error(photo() as HTMLImageElement);

			expect(screen.getByText("AL")).toBeVisible();
			expect(photo()).toBeNull();
		});

		it("copes with an account that has only an address", () => {
			const { container } = renderIconRail({
				user: { email: "ada@example.com" },
			});

			expect(container.querySelector('[title="ada"]')).not.toBeNull();
			expect(screen.getByText("A")).toBeVisible();
		});

		it("signs out when asked", async () => {
			const user = userEvent.setup();
			const onSignOut = vi.fn();
			renderIconRail({ onSignOut });

			await user.click(screen.getByRole("button", { name: "Sign out" }));

			expect(onSignOut).toHaveBeenCalledOnce();
		});
	});

	/**
	 * Feedback carries a reward, and used to be reachable only through the
	 * balance card on pages that render one — nowhere on a page without it,
	 * including the console's own overview until this shipped. The rail is
	 * on every page, so this is where "always reachable" actually lives.
	 */
	describe("leaving feedback", () => {
		it("opens feedback when asked, from the rail", async () => {
			const user = userEvent.setup();
			const onFeedback = vi.fn();
			renderIconRail({ onFeedback });

			await user.click(screen.getByRole("button", { name: "Leave feedback" }));

			expect(onFeedback).toHaveBeenCalledOnce();
		});

		it("sits above the bug report, not after it", () => {
			renderIconRail();

			const buttons = screen
				.getAllByRole("button")
				.map((button) => button.getAttribute("aria-label"));
			const feedbackAt = buttons.indexOf("Leave feedback");
			const reportAt = buttons.indexOf("Report a problem");

			expect(feedbackAt).toBeGreaterThan(-1);
			expect(feedbackAt).toBeLessThan(reportAt);
		});
	});

	/**
	 * Widening the rail is not the same feature this guards against: it never
	 * leaves the screen, at any width, on any breakpoint. It replaced an
	 * off-canvas panel that needed a focus trap, an overlay and a scroll lock
	 * to hide 56px, and none of that came back — there is still no drawer, no
	 * backdrop and no navigation callback, only a wider version of the same
	 * always-visible nav.
	 */
	it("is always on screen, with no drawer to open or close", () => {
		renderIconRail();

		expect(
			screen.queryByRole("button", { name: /Open navigation/ }),
		).toBeNull();
		expect(screen.getByRole("navigation", { name: "Console" })).toBeVisible();
	});

	describe("the brand mark", () => {
		/**
		 * The square mark, not the wordmark, once the rail is narrow. Scaled
		 * into 56px the 2086×607 wordmark renders the name about three pixels
		 * tall — present, unreadable, and worse than no logo. The rail starts
		 * expanded now, so this collapses it first rather than testing the
		 * default.
		 */
		it("uses the mark rather than the wordmark once collapsed", async () => {
			const user = userEvent.setup();
			renderIconRail();

			await user.click(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			);

			expect(screen.getByAltText(BRAND)).toHaveAttribute("src", LOGO_MARK_SRC);
		});

		/** A src pointing at nothing renders as a broken image, silently. */
		it("points at a file that is really in public/", () => {
			expect(
				existsSync(resolve(process.cwd(), "public", LOGO_MARK_SRC.slice(1))),
			).toBe(true);
		});

		/** Square, or `object-contain` letterboxes it inside its own button. */
		it("is square", () => {
			expect(LOGO_MARK_SIZE.width).toBe(LOGO_MARK_SIZE.height);
		});
	});

	it("links the mark home", () => {
		renderIconRail();

		expect(screen.getByAltText(BRAND).closest("a")).toHaveAttribute(
			"href",
			"/",
		);
	});

	/**
	 * The rail used to be the same width always, with every label living only
	 * in a tooltip. Expanded — labels on screen — is the default now; these
	 * guard both that default and the collapse it can still be asked for.
	 */
	describe("expanding the rail", () => {
		it("starts expanded, with every label already on screen", () => {
			renderIconRail({ isAdmin: true });

			for (const { built, label } of navItemsFor(true)) {
				expect(
					screen.getByText(built ? label : `${label} (soon)`),
				).toBeVisible();
			}
			expect(screen.getByText("Leave feedback")).toBeVisible();
			expect(screen.getByText("Report a problem")).toBeVisible();
			expect(screen.getByText("Sign out")).toBeVisible();
			expect(screen.getByText("Ada Lovelace")).toBeVisible();
			expect(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			).toBeInTheDocument();
		});

		it("hides every label once collapsed, leaving only the tooltip", async () => {
			const user = userEvent.setup();
			renderIconRail();

			await user.click(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			);

			expect(screen.queryByText("Overview")).toBeNull();
			expect(
				screen.getByRole("link", { name: "Overview" }),
			).toBeInTheDocument();
		});

		it("swaps the button's own name each time it is pressed", async () => {
			const user = userEvent.setup();
			renderIconRail();

			await user.click(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			);
			expect(
				screen.queryByRole("button", { name: "Collapse sidebar" }),
			).toBeNull();

			await user.click(screen.getByRole("button", { name: "Expand sidebar" }));
			expect(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			).toBeInTheDocument();
		});

		it("shows the wordmark by default, and the mark once collapsed", async () => {
			const user = userEvent.setup();
			renderIconRail();

			expect(screen.getByAltText(BRAND)).toHaveAttribute("src", LOGO_SRC);

			await user.click(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			);

			expect(screen.getByAltText(BRAND)).toHaveAttribute("src", LOGO_MARK_SRC);
		});

		it("remembers a collapse the next time the rail mounts", async () => {
			const user = userEvent.setup();
			const first = renderIconRail();
			await user.click(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			);
			first.unmount();

			renderIconRail();

			expect(
				await screen.findByRole("button", { name: "Expand sidebar" }),
			).toBeInTheDocument();
			expect(screen.queryByText("Overview")).toBeNull();
		});
	});

	/**
	 * A phone has nowhere to push 220px of content aside to, so expanded there
	 * means covering the page instead — a backdrop, `position: fixed`, and a
	 * default that does not open a drawer on someone's very first visit.
	 */
	describe("on a narrow screen", () => {
		it("starts collapsed rather than opening a drawer unasked", () => {
			stubViewport(true);
			renderIconRail();

			expect(
				screen.getByRole("button", { name: "Expand sidebar" }),
			).toBeInTheDocument();
			expect(screen.queryByText("Overview")).toBeNull();
		});

		it("still starts expanded once there is room to push instead of cover", () => {
			stubViewport(false);
			renderIconRail();

			expect(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			).toBeInTheDocument();
		});

		/* A stored choice is a person's own decision and outranks the screen
		   they happen to be looking at it on. */
		it("still remembers an explicit choice over the screen size", () => {
			localStorage.setItem("console-rail-expanded", "true");
			stubViewport(true);
			renderIconRail();

			expect(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			).toBeInTheDocument();
		});

		it("shows a backdrop only while expanded, and closes on a click", async () => {
			const user = userEvent.setup();
			const { container } = renderIconRail();

			const backdrop = () => container.querySelector("[data-rail-backdrop]");
			expect(backdrop()).not.toBeNull();

			await user.click(backdrop() as HTMLElement);

			expect(
				screen.getByRole("button", { name: "Expand sidebar" }),
			).toBeInTheDocument();
			expect(backdrop()).toBeNull();
		});

		it("lifts the rail out of the page's flow only while expanded", async () => {
			const user = userEvent.setup();
			renderIconRail();

			expect(screen.getByRole("navigation", { name: "Console" })).toHaveClass(
				"max-md:fixed",
			);

			await user.click(
				screen.getByRole("button", { name: "Collapse sidebar" }),
			);

			expect(
				screen.getByRole("navigation", { name: "Console" }),
			).not.toHaveClass("max-md:fixed");
		});
	});
});
