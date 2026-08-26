import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BRAND, LOGO_MARK_SIZE, LOGO_MARK_SRC } from "@/lib/brand";
import { CONSOLE_HREF, NAV_ITEMS } from "@/lib/console-nav";
import { IconRail } from "./icon-rail";

const ada = {
	email: "ada@example.com",
	user_metadata: { full_name: "Ada Lovelace" },
};

function renderIconRail(props: Partial<Parameters<typeof IconRail>[0]> = {}) {
	return render(
		<IconRail
			currentPath={CONSOLE_HREF}
			onSignOut={vi.fn()}
			user={ada}
			{...props}
		/>,
	);
}

describe("IconRail", () => {
	it("renders identical markup across separate server renders", () => {
		const rail = (
			<IconRail currentPath={CONSOLE_HREF} onSignOut={vi.fn()} user={ada} />
		);

		expect(renderToString(rail)).toBe(renderToString(rail));
	});

	it("is findable as the console's navigation", () => {
		renderIconRail();

		expect(screen.getByRole("navigation", { name: "Console" })).toBeVisible();
	});

	it.each(NAV_ITEMS)("offers $label", ({ href, label }) => {
		renderIconRail();

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
			NAV_ITEMS.filter((item) => !item.built),
		)("warns that $label is not built, in its name and its tooltip", ({
			label,
		}) => {
			renderIconRail();

			const link = screen.getByRole("link", { name: `${label} (soon)` });
			expect(link).toHaveAttribute("title", `${label} — not built yet`);
		});

		it.each(
			NAV_ITEMS.filter((item) => item.built),
		)("says nothing of the sort about $label", ({ label }) => {
			renderIconRail();

			const link = screen.getByRole("link", { name: label });
			expect(link).toHaveAttribute("title", label);
		});
	});

	describe("whoever is signed in", () => {
		/**
		 * The rail is one button wide, so the name cannot be printed beside the
		 * avatar. It is on the tooltip instead, which is the only place left to
		 * answer "whose account is this?" without leaving the page.
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
	 * The rail is the same width at every breakpoint, so there is no drawer to
	 * close and no navigation callback. It replaced an off-canvas panel that
	 * needed a focus trap, an overlay and a scroll lock to hide 56px.
	 */
	it("is always on screen, with nothing to open or close", () => {
		renderIconRail();

		expect(
			screen.queryByRole("button", { name: /Open navigation/ }),
		).toBeNull();
		expect(screen.getByRole("navigation", { name: "Console" })).toBeVisible();
	});

	describe("the brand mark", () => {
		/**
		 * The square mark, not the wordmark. Scaled into 56px of rail the
		 * 2086×607 wordmark renders the name about three pixels tall — present,
		 * unreadable, and worse than no logo.
		 */
		it("uses the mark rather than the wordmark", () => {
			renderIconRail();

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
});
