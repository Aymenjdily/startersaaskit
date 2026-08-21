import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { SEAMS, SwapAnything } from "./swap-anything";

const CYCLE_MS = 4200;

const tabs = () => screen.getAllByRole("tab");
const activeTab = () =>
	tabs().find((t) => t.getAttribute("aria-selected") === "true");

/** `wc -l` semantics: a trailing newline does not open a new line. */
const countLines = (text: string) => {
	const lines = text.split("\n");
	if (lines.at(-1) === "") lines.pop();
	return lines.length;
};

/** The `@theme { ... }` block, matching the `awk` range used to source the number. */
const themeBlock = (css: string) => {
	const start = css.split("\n").findIndex((l) => l.startsWith("@theme {"));
	if (start === -1) return "";
	const rest = css.split("\n").slice(start);
	const end = rest.findIndex((l, i) => i > 0 && l.startsWith("}"));
	return rest.slice(0, end + 1).join("\n");
};

describe("SwapAnything", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * The section's entire persuasive weight rests on the line counts being real.
	 * A number that silently drifts turns the strongest claim on the page into the
	 * most embarrassing one, so the suite reads the actual files rather than
	 * trusting a comment telling maintainers to remember.
	 */
	describe("the advertised line counts", () => {
		it.each(
			SEAMS.flatMap((s) => s.files.map((f) => ({ ...f, layer: s.layer }))),
		)("$path really is $lines lines", ({ path, lines, scope }) => {
			const source = readFileSync(resolve(process.cwd(), path), "utf8");
			const measured = scope
				? countLines(themeBlock(source))
				: countLines(source);

			expect(measured).toBe(lines);
		});

		it("scopes the count whenever it is not the whole file", () => {
			for (const seam of SEAMS) {
				for (const file of seam.files) {
					const whole = countLines(
						readFileSync(resolve(process.cwd(), file.path), "utf8"),
					);
					// If the printed number is not the file's real length, the UI has to
					// say which part of it we mean.
					if (whole !== file.lines) expect(file.scope).toBeTruthy();
				}
			}
		});

		it("shows the summed total for the active seam", () => {
			render(<SwapAnything />);
			const total = SEAMS[0].files.reduce((sum, f) => sum + f.lines, 0);

			expect(screen.getByText(`${total} lines`)).toBeInTheDocument();
		});
	});

	/**
	 * Nothing here may claim the template ships adapters, because it does not.
	 */
	describe("honesty of the pitch", () => {
		it("states plainly that adapters are not included", () => {
			render(<SwapAnything />);

			expect(
				screen.getByText(/no pre-built adapters are included/i),
			).toBeInTheDocument();
		});

		it("marks only the shipped provider, not the swap targets", () => {
			render(<SwapAnything />);

			expect(screen.getByText("Better Auth")).toBeInTheDocument();
			for (const target of SEAMS[0].targets) {
				expect(screen.getByText(target)).toBeInTheDocument();
			}
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
			expect(screen.getByText("src/lib/auth.ts")).toBeInTheDocument();

			act(() => void vi.advanceTimersByTime(CYCLE_MS + 50));

			expect(screen.queryByText("src/lib/auth.ts")).not.toBeInTheDocument();
			expect(screen.getByText("src/db/index.ts")).toBeInTheDocument();
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
