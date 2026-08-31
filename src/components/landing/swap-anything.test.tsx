import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { ANSWERS } from "./how-it-works";
import { SEAMS, SwapAnything } from "./swap-anything";

const CYCLE_MS = 4200;

const tabs = () => screen.getAllByRole("tab");
const activeTab = () =>
	tabs().find((t) => t.getAttribute("aria-selected") === "true");

describe("SwapAnything", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * This section used to print line counts measured against this repo's own
	 * files, which was checkable because the pitch was "clone this one". The pitch
	 * is now "we generate yours", so the only claim left worth pinning is that
	 * every layer advertised as swappable is a layer the wizard actually asks
	 * about. A tab here with no question behind it is the page selling a choice
	 * nobody is ever offered.
	 */
	describe("what it advertises as swappable", () => {
		const asked = new Set(ANSWERS.map((a) => a.label));

		it.each(SEAMS)("$layer is a question the wizard asks", ({ layer }) => {
			expect(asked).toContain(layer);
		});

		it("offers at least two options per layer, or it is not a choice", () => {
			for (const { options } of SEAMS) {
				expect(options.length).toBeGreaterThan(1);
				expect(new Set(options).size).toBe(options.length);
			}
		});

		/**
		 * The panel reserves exactly three lines for this text (`line-clamp-3` /
		 * `min-h-[3lh]` on the desktop breakpoint, in `SeamPanel`) so the card
		 * cannot grow or shrink as the seams cycle. A note past this length wraps
		 * onto a fourth line at that width and gets clipped with an ellipsis —
		 * measured against the real render, not guessed.
		 */
		it("keeps every note short enough to fit the panel's reserved three lines", () => {
			for (const { layer, note } of SEAMS) {
				expect(
					note.length,
					`${layer}'s note is ${note.length} chars`,
				).toBeLessThanOrEqual(260);
			}
		});

		it("names every option of the active layer", () => {
			render(<SwapAnything />);

			for (const option of SEAMS[0].options) {
				expect(screen.getByText(option)).toBeInTheDocument();
			}
		});

		it("counts the places it says the answer lands", () => {
			render(<SwapAnything />);

			expect(
				screen.getByText(`${SEAMS[0].touches.length} places change`),
			).toBeInTheDocument();
			expect(screen.getAllByText("generated")).toHaveLength(
				SEAMS[0].touches.length,
			);
		});
	});

	describe("server/client agreement", () => {
		it("renders identical markup across separate server renders", () => {
			expect(renderToString(<SwapAnything />)).toBe(
				renderToString(<SwapAnything />),
			);
		});

		it("starts on the first seam so hydration matches", () => {
			const server = document.createElement("div");
			server.innerHTML = renderToString(<SwapAnything />);
			render(<SwapAnything />);

			const serverActive = Array.from(
				server.querySelectorAll('[role="tab"]'),
			).find((t) => t.getAttribute("aria-selected") === "true");
			expect(serverActive?.textContent).toBe(SEAMS[0].layer);
			expect(activeTab()?.textContent).toBe(SEAMS[0].layer);
		});
	});

	describe("the cycle", () => {
		it("advances to the next seam on its own", () => {
			render(<SwapAnything />);
			expect(activeTab()?.textContent).toBe(SEAMS[0].layer);

			act(() => void vi.advanceTimersByTime(CYCLE_MS + 50));

			expect(activeTab()?.textContent).toBe(SEAMS[1].layer);
		});

		it("wraps around rather than stopping at the end", () => {
			render(<SwapAnything />);

			act(() => void vi.advanceTimersByTime(CYCLE_MS * SEAMS.length + 50));

			expect(activeTab()?.textContent).toBe(SEAMS[0].layer);
		});

		it("swaps the file list when the seam changes", () => {
			render(<SwapAnything />);
			expect(screen.getByText(SEAMS[0].touches[0])).toBeInTheDocument();

			act(() => void vi.advanceTimersByTime(CYCLE_MS + 50));

			expect(screen.queryByText(SEAMS[0].touches[0])).not.toBeInTheDocument();
			expect(screen.getByText(SEAMS[1].touches[0])).toBeInTheDocument();
		});

		it("holds still when the reader prefers reduced motion", () => {
			setReducedMotion(true);
			render(<SwapAnything />);

			act(() => void vi.advanceTimersByTime(CYCLE_MS * 4));

			expect(activeTab()?.textContent).toBe(SEAMS[0].layer);
		});

		it("clears its interval on unmount", () => {
			const clear = vi.spyOn(globalThis, "clearInterval");
			const { unmount } = render(<SwapAnything />);

			unmount();

			expect(clear).toHaveBeenCalled();
			clear.mockRestore();
		});
	});

	/**
	 * `fireEvent` rather than `user-event` here: the latter schedules its own
	 * delays on the timer queue, which deadlocks against `vi.useFakeTimers`. A
	 * bare click is the whole interaction under test, so the realism buys nothing.
	 */
	describe("picking a layer by hand", () => {
		it("jumps to the chosen seam", () => {
			render(<SwapAnything />);

			fireEvent.click(screen.getByRole("tab", { name: SEAMS[2].layer }));

			expect(activeTab()?.textContent).toBe(SEAMS[2].layer);
		});

		/**
		 * A carousel that yanks itself away a second after you click it is worse
		 * than one that never moved, so selecting a tab stops the loop for good.
		 */
		it("stops auto-advancing once the reader has chosen", () => {
			render(<SwapAnything />);

			fireEvent.click(screen.getByRole("tab", { name: SEAMS[1].layer }));
			act(() => void vi.advanceTimersByTime(CYCLE_MS * 3));

			expect(activeTab()?.textContent).toBe(SEAMS[1].layer);
		});
	});

	describe("accessibility", () => {
		it("exposes the layers as a tablist", () => {
			render(<SwapAnything />);

			expect(screen.getByRole("tablist")).toHaveAccessibleName(
				"Swappable layers",
			);
			expect(tabs()).toHaveLength(SEAMS.length);
		});

		it("points the panel at the tab that controls it", () => {
			render(<SwapAnything />);

			expect(screen.getByRole("tabpanel")).toHaveAccessibleName(SEAMS[0].layer);
		});
	});
});
