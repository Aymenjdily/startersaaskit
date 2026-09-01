import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PAGE_SIZE } from "@/lib/generate/starter-filters";
import type { StarterRecord } from "@/lib/generate/starters";
import type { StarterAnswers } from "@/lib/starter-questions";
import { StarterBrowser } from "./starter-browser";

const base: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "neon",
	orm: "drizzle",
	auth: "better_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
};

const record = (
	project: string,
	answers: StarterAnswers = {},
): StarterRecord => ({
	id: project,
	project,
	answers: { ...base, ...answers, project },
	created_at: "2026-01-15T10:00:00Z",
});

function show(starters: StarterRecord[], overrides = {}) {
	const onCreate = vi.fn();
	const onDelete = vi.fn().mockResolvedValue(undefined);
	const onDownload = vi.fn();
	const view = render(
		<StarterBrowser
			onCreate={onCreate}
			onDelete={onDelete}
			onDownload={onDownload}
			starters={starters}
			{...overrides}
		/>,
	);
	return { ...view, onCreate, onDelete, onDownload };
}

const cards = () => screen.queryAllByRole("heading", { level: 3 });
const names = () => cards().map((h) => h.textContent);
const search = () => screen.getByLabelText("Search starters");

const three = [
	record("billing-api"),
	record("marketing-site", { framework: "tanstack_start" }),
	record("internal-tool", { database: "mongodb", orm: "mongoose" }),
];

describe("StarterBrowser", () => {
	it("shows every starter it is given", () => {
		show(three);

		expect(names()).toEqual(["billing-api", "marketing-site", "internal-tool"]);
	});

	it("says how many there are", () => {
		show(three);

		expect(screen.getByText("3 starters")).toBeVisible();
	});

	/** "1 starters" is the kind of thing that makes software feel unfinished. */
	it("counts one starter in the singular", () => {
		show([record("only")]);

		expect(screen.getByText("1 starter")).toBeVisible();
	});

	describe("searching", () => {
		it("narrows to what was typed", async () => {
			const user = userEvent.setup();
			show(three);

			await user.type(search(), "market");

			expect(names()).toEqual(["marketing-site"]);
		});

		it("says so when nothing matches, rather than showing an empty grid", async () => {
			const user = userEvent.setup();
			show(three);

			await user.type(search(), "zzz");

			expect(screen.getByText("Nothing matches")).toBeVisible();
			expect(cards()).toHaveLength(0);
		});

		it("can be cleared back to everything", async () => {
			const user = userEvent.setup();
			show(three);

			await user.type(search(), "market");
			await user.click(screen.getByRole("button", { name: "Clear" }));

			expect(names()).toHaveLength(3);
		});

		/** Nothing to clear means no button offering to. */
		it("offers no Clear until something is filtered", () => {
			show(three);

			expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
		});
	});

	/**
	 * The create button used to live in the page header, away from the
	 * controls someone is actually looking at while browsing. It belongs in
	 * this toolbar now, beside the filters rather than a scroll away from them.
	 */
	describe("starting a new one", () => {
		it("offers the create button in the toolbar", () => {
			show(three);

			expect(
				screen.getByRole("button", { name: "Create your starter" }),
			).toBeVisible();
		});

		it("asks the page to open the wizard when pressed", async () => {
			const user = userEvent.setup();
			const { onCreate } = show(three);

			await user.click(
				screen.getByRole("button", { name: "Create your starter" }),
			);

			expect(onCreate).toHaveBeenCalledOnce();
		});
	});

	describe("filtering", () => {
		/* The dropdown is ours, not the browser's — a native `<select>` cannot
		   put a vendor's mark beside an option, and its popup is drawn by the
		   operating system. So these drive it the way a person does. */
		const framework = () => screen.getByRole("button", { name: "Framework" });
		const openFramework = async (user: ReturnType<typeof userEvent.setup>) => {
			await user.click(framework());
			return screen.getByRole("listbox", { name: "Framework" });
		};

		it("offers a filter only where the starters differ", () => {
			show(three);

			expect(framework()).toBeVisible();
			/* Every one of the three uses Neon and Better Auth — and neither is
			   offered as a filter any more regardless: name and framework are the
			   two axes worth a control, and the rest is on the cards as marks. */
			expect(screen.queryByRole("button", { name: "Database" })).toBeNull();
			expect(screen.queryByRole("button", { name: "Auth" })).toBeNull();
		});

		it("narrows to the chosen option", async () => {
			const user = userEvent.setup();
			show(three);

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));

			expect(names()).toEqual(["billing-api", "internal-tool"]);
		});

		it("goes back to everything on 'any'", async () => {
			const user = userEvent.setup();
			show(three);

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));
			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Any framework" }));

			expect(names()).toHaveLength(3);
		});

		it("offers no filters at all when there is nothing to distinguish", () => {
			show([record("a"), record("b")]);

			expect(screen.queryByRole("button", { name: "Framework" })).toBeNull();
		});

		/**
		 * A filter that is on has to look different from one that is off, or the
		 * only way to tell why the grid is short is to open the dropdown.
		 */
		it("marks a filter that is doing something", async () => {
			const user = userEvent.setup();
			show(three);

			expect(framework().className).not.toContain("border-brand");

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));

			expect(
				screen.getByRole("button", { name: "Framework" }).className,
			).toContain("border-brand");
		});

		/** The trigger names the layer until it has something better to say. */
		it("reads as the layer's name until something is chosen", async () => {
			const user = userEvent.setup();
			show(three);

			expect(framework()).toHaveTextContent("Framework");

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));

			expect(
				screen.getByRole("button", { name: "Framework" }),
			).toHaveTextContent("Next.js");
		});

		/** The chosen vendor's mark, the same one the cards show. */
		it("shows the chosen option's mark on the trigger", async () => {
			const user = userEvent.setup();
			show(three);

			expect(framework().querySelectorAll("svg")).toHaveLength(1);

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));

			expect(
				screen
					.getByRole("button", { name: "Framework" })
					.querySelectorAll("svg"),
			).toHaveLength(2);
		});

		/**
		 * The list is only mounted while open. A hidden-but-present listbox is
		 * still reachable by a screen reader and by Tab, which is worse than not
		 * having one.
		 */
		it("keeps the list out of the page until it is opened", async () => {
			const user = userEvent.setup();
			show(three);

			expect(screen.queryByRole("listbox")).toBeNull();

			await openFramework(user);
			expect(screen.getByRole("listbox")).toBeVisible();
			expect(framework()).toHaveAttribute("aria-expanded", "true");
		});

		it("says which option is the current one", async () => {
			const user = userEvent.setup();
			show(three);

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));
			await openFramework(user);

			expect(screen.getByRole("option", { name: "Next.js" })).toHaveAttribute(
				"aria-selected",
				"true",
			);
			expect(
				screen.getByRole("option", { name: "TanStack Start" }),
			).toHaveAttribute("aria-selected", "false");
		});

		describe("from the keyboard alone", () => {
			it("opens, moves and commits", async () => {
				const user = userEvent.setup();
				show(three);

				framework().focus();
				await user.keyboard("{ArrowDown}");
				expect(screen.getByRole("listbox")).toBeVisible();

				/* Opens on the current row — "Any framework" — so one step down is
				   the first real option. */
				await user.keyboard("{ArrowDown}{Enter}");

				expect(names()).toEqual(["billing-api", "internal-tool"]);
				expect(screen.queryByRole("listbox")).toBeNull();
			});

			it("closes on Escape without choosing anything", async () => {
				const user = userEvent.setup();
				show(three);

				framework().focus();
				await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");

				expect(screen.queryByRole("listbox")).toBeNull();
				expect(names()).toHaveLength(3);
			});

			it("jumps to the ends with Home and End", async () => {
				const user = userEvent.setup();
				show(three);

				framework().focus();
				await user.keyboard("{ArrowDown}{End}{Enter}");

				expect(names()).toEqual(["marketing-site"]);
			});
		});

		/**
		 * Focus has to come back, or the tab order is lost mid-page. Asserted on
		 * the *mouse* path on purpose: with the keyboard, focus never leaves the
		 * trigger — the highlight is published through `aria-activedescendant` —
		 * so a keyboard version of this passes whether the code returns focus or
		 * not, and proves nothing.
		 */
		it("returns focus to the trigger after choosing with the mouse", async () => {
			const user = userEvent.setup();
			show(three);

			await openFramework(user);
			await user.click(screen.getByRole("option", { name: "Next.js" }));

			expect(screen.getByRole("button", { name: "Framework" })).toHaveFocus();
		});

		it("closes when the pointer goes down outside it", async () => {
			const user = userEvent.setup();
			show(three);

			await openFramework(user);
			await user.click(document.body);

			expect(screen.queryByRole("listbox")).toBeNull();
		});
	});

	describe("paging", () => {
		const plenty = Array.from({ length: PAGE_SIZE + 4 }, (_, i) =>
			record(`app-${String(i).padStart(2, "0")}`),
		);

		it("shows one page at a time", () => {
			show(plenty);

			expect(cards()).toHaveLength(PAGE_SIZE);
			expect(screen.getByText(`Page 1 of 2`)).toBeVisible();
		});

		it("moves forward and back", async () => {
			const user = userEvent.setup();
			show(plenty);

			await user.click(screen.getByRole("button", { name: "Next" }));
			expect(cards()).toHaveLength(4);

			await user.click(screen.getByRole("button", { name: "Previous" }));
			expect(cards()).toHaveLength(PAGE_SIZE);
		});

		it("cannot go back from the first page or on from the last", async () => {
			const user = userEvent.setup();
			show(plenty);

			expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();

			await user.click(screen.getByRole("button", { name: "Next" }));
			expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		});

		it("hides the pager when everything fits on one page", () => {
			show(three);

			expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull();
		});

		/**
		 * Searching from page two would otherwise leave the reader on a page the
		 * narrowed results no longer have.
		 */
		it("returns to the first page when the results narrow", async () => {
			const user = userEvent.setup();
			show(plenty);

			await user.click(screen.getByRole("button", { name: "Next" }));
			expect(screen.getByText("Page 2 of 2")).toBeVisible();

			/* Still more than one page of matches, so this checks the page reset
			   rather than the pager merely disappearing. */
			await user.type(search(), "app-0");

			expect(screen.getByText("Page 1 of 2")).toBeVisible();
			expect(cards().length).toBe(PAGE_SIZE);
		});

		/**
		 * Deleting the last card on the last page is the case that strands
		 * someone on a page that no longer exists.
		 */
		it("falls back a page when the last one empties", async () => {
			const user = userEvent.setup();
			const { rerender } = show(plenty);

			await user.click(screen.getByRole("button", { name: "Next" }));
			expect(screen.getByText("Page 2 of 2")).toBeVisible();

			rerender(
				<StarterBrowser
					onCreate={vi.fn()}
					onDelete={vi.fn()}
					onDownload={vi.fn()}
					starters={plenty.slice(0, PAGE_SIZE)}
				/>,
			);

			expect(screen.queryByRole("navigation", { name: "Pages" })).toBeNull();
			expect(cards()).toHaveLength(PAGE_SIZE);
		});
	});

	describe("the actions on a card", () => {
		it("downloads the starter it belongs to", async () => {
			const user = userEvent.setup();
			const { onDownload } = show(three);

			await user.click(
				screen.getByRole("button", { name: "Download marketing-site" }),
			);

			expect(onDownload).toHaveBeenCalledWith(
				expect.objectContaining({ project: "marketing-site" }),
			);
		});

		/** Deleting has no undo, so it must not happen on one click. */
		it("asks before deleting", async () => {
			const user = userEvent.setup();
			const { onDelete } = show(three);

			await user.click(
				screen.getByRole("button", { name: "Delete billing-api" }),
			);

			expect(
				screen.getByRole("dialog", { name: "Delete billing-api?" }),
			).toBeVisible();
			expect(onDelete).not.toHaveBeenCalled();
		});

		it("deletes once confirmed", async () => {
			const user = userEvent.setup();
			const { onDelete } = show(three);

			await user.click(
				screen.getByRole("button", { name: "Delete billing-api" }),
			);
			await user.click(
				within(screen.getByRole("dialog")).getByRole("button", {
					name: "Delete",
				}),
			);

			expect(onDelete).toHaveBeenCalledWith(
				expect.objectContaining({ project: "billing-api" }),
			);
		});

		it("keeps it when the reader backs out", async () => {
			const user = userEvent.setup();
			const { onDelete } = show(three);

			await user.click(
				screen.getByRole("button", { name: "Delete billing-api" }),
			);
			await user.click(screen.getByRole("button", { name: "Keep it" }));

			expect(onDelete).not.toHaveBeenCalled();
			expect(screen.queryByRole("dialog")).toBeNull();
		});

		it("disables both actions on the card that is working", () => {
			show(three, { busyId: "billing-api" });

			expect(
				screen.getByRole("button", { name: "Download billing-api" }),
			).toBeDisabled();
			expect(
				screen.getByRole("button", { name: "Delete billing-api" }),
			).toBeDisabled();
			expect(
				screen.getByRole("button", { name: "Download marketing-site" }),
			).toBeEnabled();
		});
	});

	/**
	 * The card is a link with two buttons on it. Nesting them inside the anchor
	 * is invalid HTML and makes one of them unclickable, so the link is
	 * stretched over the card instead and the buttons sit above it.
	 */
	it("keeps the actions out of the link that covers the card", () => {
		const { container } = show([record("only")]);

		expect(container.querySelector("a button")).toBeNull();
		expect(screen.getByRole("link", { name: "only" })).toHaveAttribute(
			"href",
			"/starters/only",
		);
	});
});
