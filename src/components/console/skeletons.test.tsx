import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StarterBrowser } from "@/components/starters/starter-browser";
import type { StarterRecord } from "@/lib/generate/starters";
import {
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";
import {
	ConsoleChromeSkeleton,
	RECENT_COLUMNS,
	RecentStartersSkeleton,
	StarterDetailSkeleton,
	StarterGridSkeleton,
} from "./skeletons";

/**
 * A skeleton is a promise about the shape of what is coming. These check the
 * promise against the real components rather than against numbers typed twice
 * — the correspondence is the entire value, and it is exactly the kind of
 * thing that rots the next time a column or a card changes.
 */

const answers: StarterAnswers = {
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

const record = (project: string): StarterRecord => ({
	id: project,
	project,
	answers: { ...answers, project },
	created_at: "2026-01-15T10:00:00Z",
});

const blocks = (container: HTMLElement) =>
	container.querySelectorAll(".skeleton");

describe("the skeletons", () => {
	/**
	 * Placeholder rectangles are noise to a screen reader; the region they sit
	 * in is what should speak. Both halves matter — hiding the blocks without
	 * labelling the region would mean announcing nothing at all.
	 */
	describe("what a screen reader gets", () => {
		it.each([
			["dashboard", <RecentStartersSkeleton key="a" />],
			["starters", <StarterGridSkeleton key="b" />],
			["detail", <StarterDetailSkeleton key="c" />],
		])("announces the %s page as busy, with a reason", (_name, element) => {
			render(element);
			const status = screen.getByRole("status");

			expect(status).toHaveAttribute("aria-busy", "true");
			expect(status.textContent?.trim()).toMatch(/^Loading /);
		});

		it("hides every placeholder block from the accessibility tree", () => {
			const { container } = render(<StarterGridSkeleton />);

			expect(blocks(container).length).toBeGreaterThan(0);
			for (const block of blocks(container)) {
				expect(block).toHaveAttribute("aria-hidden", "true");
			}
		});
	});

	describe("the recent-starters table", () => {
		/** One header, used by the skeleton and the real table alike. */
		it("has the columns the dashboard table has", () => {
			render(
				<table>
					<RecentStartersSkeleton />
				</table>,
			);

			expect(
				screen.getAllByRole("columnheader").map((c) => c.textContent),
			).toEqual([...RECENT_COLUMNS]);
		});

		it("stands in for as many rows as will arrive", () => {
			const { container } = render(<RecentStartersSkeleton rows={4} />);

			/* The header row is a `<tr>` too, hence the extra one. */
			expect(container.querySelectorAll("tr")).toHaveLength(5);
		});
	});

	describe("the starters grid", () => {
		/**
		 * The jump this exists to prevent: a skeleton laid out one-per-row
		 * followed by content in three columns. Both must carry the same grid.
		 */
		it("uses the same grid the real list uses", () => {
			const { container: skeleton } = render(<StarterGridSkeleton cards={3} />);
			const { container: real } = render(
				<StarterBrowser
					onDelete={async () => {}}
					onDownload={() => {}}
					starters={[record("a"), record("b"), record("c")]}
				/>,
			);

			const classesOf = (root: HTMLElement) =>
				root.querySelector("ul.grid")?.className;

			expect(classesOf(skeleton)).toBe(classesOf(real));
		});

		it("draws a placeholder for every card it says it will", () => {
			const { container } = render(<StarterGridSkeleton cards={6} />);

			expect(container.querySelectorAll("ul.grid > li")).toHaveLength(6);
		});
	});

	describe("the starter detail", () => {
		/**
		 * The stack panel lists one row per choice question, so the placeholder
		 * has to as well — otherwise the panel grows or shrinks on arrival.
		 */
		it("stands in for one stack row per question the page shows", () => {
			const questions = STARTER_QUESTIONS.filter(
				(question) => question.kind === "choice",
			).length;
			/* No `rows` passed on purpose: the default has to be derived from the
			   question set, or adding a question leaves the panel a row short. */
			const { container } = render(<StarterDetailSkeleton />);

			expect(container.querySelectorAll(".divide-y > div")).toHaveLength(
				questions,
			);
		});

		it("keeps the two-column split the loaded page uses", () => {
			const { container } = render(<StarterDetailSkeleton />);

			expect(
				container.querySelector(".lg\\:grid-cols-\\[320px_1fr\\]"),
			).not.toBeNull();
		});
	});

	/**
	 * The chrome skeleton replaced a centred "Loading your console…", which
	 * meant the rail arrived all at once and moved the page sideways. The rail
	 * has to be the same width before and after.
	 */
	describe("the console chrome", () => {
		it("reserves the rail at its real width", () => {
			const { container } = render(<ConsoleChromeSkeleton title="Overview" />);

			expect(container.querySelector(".w-14")).not.toBeNull();
		});

		/** The title is known before the session is, so it is not blocked out. */
		it("shows the page title rather than a placeholder for it", () => {
			render(<ConsoleChromeSkeleton title="Overview" />);

			expect(
				screen.getByRole("heading", { level: 1, name: "Overview" }),
			).toBeVisible();
		});
	});
});
