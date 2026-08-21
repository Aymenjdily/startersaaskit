import { render, screen } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { WiredGrid } from "./wired-grid";

const TILE_COUNT = 18;

const tiles = (root: HTMLElement | Document = document) =>
	Array.from(root.querySelectorAll("li"));

/** The visible module/detail pair, used to assert tiles never duplicate. */
const taskOf = (tile: Element) =>
	Array.from(tile.querySelectorAll("span"))
		.slice(0, 2)
		.map((s) => s.textContent)
		.join(" — ");

describe("WiredGrid", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		// Several tests pin `Math.random`; make sure it never leaks to the next one.
		vi.restoreAllMocks();
	});

	/**
	 * The grid shuffles itself with `Math.random`, which is exactly the shape of
	 * bug that produces a hydration mismatch: if the server picked different tasks
	 * than the client's first render, React would discard the server HTML. The
	 * component avoids that by seeding slot N with `TASKS[N % TASKS.length]` and
	 * only introducing randomness inside `useEffect`, which never runs on the
	 * server. These two tests pin that contract down.
	 */
	describe("server/client agreement", () => {
		it("renders identical markup on the server across separate renders", () => {
			expect(renderToString(<WiredGrid />)).toBe(renderToString(<WiredGrid />));
		});

		it("matches the client's first paint before any timer fires", () => {
			const server = document.createElement("div");
			server.innerHTML = renderToString(<WiredGrid />);

			const { container } = render(<WiredGrid />);

			expect(tiles(container as unknown as HTMLElement).map(taskOf)).toEqual(
				tiles(server).map(taskOf),
			);
		});
	});

	describe("initial render", () => {
		it("renders the full 6 x 3 grid", () => {
			const { container } = render(<WiredGrid />);
			expect(tiles(container as unknown as HTMLElement)).toHaveLength(
				TILE_COUNT,
			);
		});

		it("starts every tile in the wiring state", () => {
			render(<WiredGrid />);
			expect(screen.getAllByText("Wiring")).toHaveLength(TILE_COUNT);
			expect(screen.queryByText("Wired")).not.toBeInTheDocument();
		});

		it("shows no task twice", () => {
			const { container } = render(<WiredGrid />);
			const shown = tiles(container as unknown as HTMLElement).map(taskOf);
			expect(new Set(shown).size).toBe(TILE_COUNT);
		});

		it("staggers the entrance so tiles do not all pop at once", () => {
			const { container } = render(<WiredGrid />);
			const delays = tiles(container as unknown as HTMLElement).map(
				(t) => (t as HTMLElement).style.animationDelay,
			);
			expect(delays[0]).toBe("0ms");
			expect(delays[1]).toBe("80ms");
			expect(delays[17]).toBe("1360ms");
		});
	});

	describe("the wiring loop", () => {
		it("advances tiles to Wired and never leaves the grid empty", () => {
			/**
			 * Each tile's run is `4000 + random * 6000`, and a finished tile only
			 * shows "Wired" for the 1600ms hold before it recycles. So there is no
			 * wall-clock instant at which a tile is *guaranteed* to be showing it —
			 * advancing past the longest possible run just means the early tiles
			 * have already looped back to running. Pinning `Math.random` to 0 makes
			 * every run exactly `RUN_MIN_MS`, so the whole grid is mid-hold together
			 * and the assertion tests the loop instead of a dice roll.
			 */
			vi.spyOn(Math, "random").mockReturnValue(0);
			const { container } = render(<WiredGrid />);

			// Just past the (now fixed) 4000ms run, well inside the 1600ms hold.
			act(() => void vi.advanceTimersByTime(4100));

			expect(screen.getAllByText("Wired")).toHaveLength(TILE_COUNT);
			expect(tiles(container as unknown as HTMLElement)).toHaveLength(
				TILE_COUNT,
			);
		});

		it("recycles a finished tile back into a running one", () => {
			vi.spyOn(Math, "random").mockReturnValue(0);
			render(<WiredGrid />);

			act(() => void vi.advanceTimersByTime(4100));
			expect(screen.getAllByText("Wired")).toHaveLength(TILE_COUNT);

			// run 4000 + hold 1600 + exit 300 = 5900; past that every tile is running.
			act(() => void vi.advanceTimersByTime(2000));
			expect(screen.queryAllByText("Wired")).toHaveLength(0);
		});

		it("keeps tasks unique after many cycles", () => {
			const { container } = render(<WiredGrid />);

			act(() => void vi.advanceTimersByTime(60_000));

			const shown = tiles(container as unknown as HTMLElement).map(taskOf);
			expect(shown).toHaveLength(TILE_COUNT);
			expect(new Set(shown).size).toBe(TILE_COUNT);
		});

		it("swaps in new tasks rather than cycling the same ones forever", () => {
			const { container } = render(<WiredGrid />);
			const before = tiles(container as unknown as HTMLElement).map(taskOf);

			act(() => void vi.advanceTimersByTime(30_000));

			const after = tiles(container as unknown as HTMLElement).map(taskOf);
			const changed = before.filter((t, i) => t !== after[i]);
			expect(changed.length).toBeGreaterThan(0);
		});

		/**
		 * Regression: the cycle callback used to rebuild the tile object from
		 * scratch instead of spreading the previous one, dropping `slot`. Since
		 * `slot` is the React key, every recycled tile silently fell back to its
		 * array index — which is what `key` exists to avoid, and what swallows the
		 * exit animation mid-transition. TypeScript catches it now; this catches it
		 * if the type ever loosens.
		 */
		it("preserves each tile's slot identity across recycles", () => {
			const warn = vi
				.spyOn(console, "error")
				.mockImplementation(() => undefined);

			render(<WiredGrid />);
			act(() => void vi.advanceTimersByTime(60_000));

			const keyWarnings = warn.mock.calls.filter((args) =>
				String(args[0]).includes('unique "key"'),
			);
			expect(keyWarnings).toHaveLength(0);

			warn.mockRestore();
		});

		it("clears every pending timer on unmount", () => {
			const { unmount } = render(<WiredGrid />);
			expect(vi.getTimerCount()).toBeGreaterThan(0);

			unmount();

			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("prefers-reduced-motion", () => {
		it("settles straight to Wired and schedules nothing", () => {
			setReducedMotion(true);
			render(<WiredGrid />);

			expect(screen.getAllByText("Wired")).toHaveLength(TILE_COUNT);
			expect(screen.queryByText("Wiring")).not.toBeInTheDocument();
			expect(vi.getTimerCount()).toBe(0);
		});

		it("drops the entrance stagger", () => {
			setReducedMotion(true);
			const { container } = render(<WiredGrid />);

			for (const tile of tiles(container as unknown as HTMLElement)) {
				expect((tile as HTMLElement).style.animationDelay).toBe("");
			}
		});
	});

	describe("accessibility", () => {
		it("hides the decorative brand glyphs from assistive tech", () => {
			const { container } = render(<WiredGrid />);
			const svgs = container.querySelectorAll("svg");
			expect(svgs).toHaveLength(TILE_COUNT);
			for (const svg of svgs) {
				expect(svg).toHaveAttribute("aria-hidden", "true");
			}
		});

		it("names every module in text, not only by icon", () => {
			const { container } = render(<WiredGrid />);
			for (const tile of tiles(container as unknown as HTMLElement)) {
				expect(tile.textContent?.trim()).not.toBe("");
			}
		});
	});
});
