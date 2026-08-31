import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { AiOptimized, LOOKUPS, TREE, TS_FLAGS } from "./ai-optimized";

const CYCLE_MS = 3800;

describe("AiOptimized", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * These paths used to be checked against disk, which worked while the tree
	 * described this repo. It now describes a generated starter, so disk says
	 * nothing. The claim that survives is internal and is the one that actually
	 * breaks the UI: a lookup whose path is not a node in the tree highlights
	 * nothing, and the panel silently answers a question by pointing at empty air.
	 */
	describe("the paths it points at", () => {
		const nodes = new Set(
			TREE.map((n) => n.path).filter((p): p is string => Boolean(p)),
		);

		it.each(LOOKUPS)("$ask lands on a node in the tree", ({ path }) => {
			expect(nodes).toContain(path);
		});

		it("never points twice at the same file", () => {
			const paths = LOOKUPS.map((l) => l.path);
			expect(new Set(paths).size).toBe(paths.length);
		});

		/** The label a path highlights, which is what the reader actually sees. */
		const leafOf = (path: string) =>
			TREE.find((n) => n.path === path)?.label as string;

		it("highlights the answer in the tree", () => {
			render(<AiOptimized />);

			expect(screen.getByText(leafOf(LOOKUPS[0].path)).className).toContain(
				"text-brand",
			);
		});

		it("moves the highlight when the question changes", () => {
			render(<AiOptimized />);
			expect(screen.getByText(leafOf(LOOKUPS[0].path)).className).toContain(
				"text-brand",
			);

			act(() => void vi.advanceTimersByTime(CYCLE_MS + 50));

			expect(screen.getByText(leafOf(LOOKUPS[0].path)).className).not.toContain(
				"text-brand",
			);
			expect(screen.getByText(leafOf(LOOKUPS[1].path)).className).toContain(
				"text-brand",
			);
		});

		/** Two nodes sharing a label would make the highlight ambiguous on screen. */
		it("labels every node uniquely", () => {
			const labels = TREE.map((n) => n.label);
			expect(new Set(labels).size).toBe(labels.length);
		});
	});

	/**
	 * Every flag advertised as catching a wrong guess has to actually be on.
	 */
	describe("the TypeScript flags it advertises", () => {
		const tsconfig = readFileSync(
			resolve(process.cwd(), "tsconfig.json"),
			"utf8",
		);

		it.each(TS_FLAGS)("%s is enabled in tsconfig.json", (flag) => {
			expect(tsconfig).toMatch(new RegExp(`"${flag}"\\s*:\\s*true`));
		});

		it("renders each flag for the reader", () => {
			render(<AiOptimized />);

			for (const flag of TS_FLAGS) {
				expect(screen.getByText(flag)).toBeInTheDocument();
			}
		});
	});

	/**
	 * The card reserves exactly three lines for `path` + `because` combined
	 * (`line-clamp-3` / `min-h-[3lh]` on the desktop breakpoint) so the card
	 * cannot grow or shrink as the lookups cycle. A `because` much past this
	 * length wraps onto a fourth line at that width and gets clipped.
	 */
	it("keeps every lookup short enough to fit the card's reserved three lines", () => {
		for (const { path, because } of LOOKUPS) {
			expect(
				because.length,
				`${path}'s because is ${because.length} chars`,
			).toBeLessThanOrEqual(120);
		}
	});

	/**
	 * There is no CLAUDE.md or meaningful rules file in this repo. If one is ever
	 * added, this test should be deleted and the section can say so — until then
	 * it guards against the copy drifting into a claim we cannot back.
	 */
	it("does not claim context files the repo lacks", () => {
		render(<AiOptimized />);
		const copy = document.body.textContent ?? "";

		expect(copy).not.toMatch(/CLAUDE\.md|\.cursorrules|rules file/i);
	});

	describe("server/client agreement", () => {
		it("renders identical markup across separate server renders", () => {
			expect(renderToString(<AiOptimized />)).toBe(
				renderToString(<AiOptimized />),
			);
		});

		it("starts on the first lookup so hydration matches", () => {
			const server = document.createElement("div");
			server.innerHTML = renderToString(<AiOptimized />);
			render(<AiOptimized />);

			expect(server.textContent).toContain(LOOKUPS[0].ask);
			expect(screen.getByText(LOOKUPS[0].ask)).toBeInTheDocument();
		});
	});

	describe("the cycle", () => {
		it("advances to the next question", () => {
			render(<AiOptimized />);

			act(() => void vi.advanceTimersByTime(CYCLE_MS + 50));

			expect(screen.getByText(LOOKUPS[1].ask)).toBeInTheDocument();
		});

		it("wraps back to the first question", () => {
			render(<AiOptimized />);

			act(() => void vi.advanceTimersByTime(CYCLE_MS * LOOKUPS.length + 50));

			expect(screen.getByText(LOOKUPS[0].ask)).toBeInTheDocument();
		});

		it("holds still when the reader prefers reduced motion", () => {
			setReducedMotion(true);
			render(<AiOptimized />);

			act(() => void vi.advanceTimersByTime(CYCLE_MS * 3));

			expect(screen.getByText(LOOKUPS[0].ask)).toBeInTheDocument();
		});

		it("clears its interval on unmount", () => {
			const clear = vi.spyOn(globalThis, "clearInterval");
			const { unmount } = render(<AiOptimized />);

			unmount();

			expect(clear).toHaveBeenCalled();
			clear.mockRestore();
		});
	});

	it("announces the changing question to screen readers", () => {
		render(<AiOptimized />);

		const live = document.querySelector('[aria-live="polite"]');
		expect(live).toHaveTextContent(LOOKUPS[0].ask);
	});
});
