import { render, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { COMBINATIONS, SPEC_PAIRS, TestedByDefault } from "./tested-by-default";

/**
 * A matrix row and the summary both read "passed", so a bare text query finds
 * two nodes. Every count below is asked for inside the region that owns it.
 */
const region = (name: "suites" | "summary") =>
	within(document.querySelector(`[data-${name}]`) as HTMLElement);

/** The state label on one combination's own row. */
const rowState = (index: number) =>
	region("suites").getAllByText("passed")[index];

/** Timeline offsets, mirroring STEP_MS in the component. */
const SUITE_PASSES_AT = [900, 1700, 2500];
const SUMMARY_AT = 3200;
const GATES_PASS_AT = [3800, 4300, 4800, 5300];
const BANNER_AT = 5900;
const RESET_AT = 8700;

const isHidden = (el: HTMLElement) => el.className.includes("opacity-0");

const banner = () => screen.getByText("All checks passed — ready to ship");

/** The gate rows live outside both marked regions. */
const gateStates = () =>
	screen
		.getAllByText("passed")
		.filter(
			(el) => !el.closest("[data-suites]") && !el.closest("[data-summary]"),
		);

describe("TestedByDefault", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * The section's whole claim is that every combination the wizard offers is
	 * green. A row naming a stack, or a summary counting a different number of
	 * them, would be the exact failure the claim denies.
	 */
	describe("the matrix it shows", () => {
		it("names a framework and a stack on every row", () => {
			for (const { framework, stack } of COMBINATIONS) {
				expect(framework).not.toHaveLength(0);
				expect(stack).not.toHaveLength(0);
			}
		});

		it("lists each combination once", () => {
			const rows = COMBINATIONS.map((c) => `${c.framework} ${c.stack}`);

			expect(new Set(rows).size).toBe(rows.length);
		});

		/**
		 * Both numbers derive from COMBINATIONS today, so comparing either to
		 * COMBINATIONS.length would pass no matter what the summary printed. The
		 * count is read back out of the rendered summary instead, which is the
		 * only version of it a reader ever sees.
		 */
		it("counts exactly the combinations it rendered", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUMMARY_AT));

			const rows = region("suites").getAllByText("passed").length;
			const summary = document.querySelector("[data-summary]")?.textContent;
			const claimed = summary?.match(/(\d+) passed/)?.[1];

			expect(claimed).toBe(String(rows));
			expect(rows).toBe(COMBINATIONS.length);
		});

		it("renders every framework it claims to cover", () => {
			render(<TestedByDefault />);

			for (const framework of new Set(COMBINATIONS.map((c) => c.framework))) {
				expect(screen.getAllByText(framework).length).toBeGreaterThan(0);
			}
		});
	});

	/**
	 * The first pillar claims every module ships with a spec beside it. These
	 * name files in a generated repo rather than in this one, so the convention
	 * is what is checkable — and the convention is the actual claim.
	 */
	describe("the module/spec pairs it shows", () => {
		it("names the spec after the module it covers", () => {
			for (const { module, spec } of SPEC_PAIRS) {
				const base = module.replace(/\.(ts|tsx)$/, "");
				expect(spec).toMatch(new RegExp(`^${base}\\.test\\.(ts|tsx)$`));
			}
		});

		it("renders both halves of every pair", () => {
			render(<TestedByDefault />);

			for (const { module, spec } of SPEC_PAIRS) {
				expect(screen.getByText(module)).toBeInTheDocument();
				expect(screen.getByText(spec)).toBeInTheDocument();
			}
		});
	});

	it("renders the section heading and pillar copy", () => {
		render(<TestedByDefault />);

		expect(
			screen.getByRole("heading", { name: "Tested by default" }),
		).toBeInTheDocument();
		for (const title of [
			"Tests ship with the feature",
			"Strict by default",
			"Coverage from day one",
		]) {
			expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
		}
	});

	/**
	 * The cycle advances on a timer, which is exactly the shape of bug that
	 * produces a hydration mismatch if the first paint differed between server
	 * and client. The component always mounts at step 0 and only moves inside
	 * `useEffect`, which never runs on the server.
	 */
	describe("server/client agreement", () => {
		it("renders identical markup on the server across separate renders", () => {
			expect(renderToString(<TestedByDefault />)).toBe(
				renderToString(<TestedByDefault />),
			);
		});

		it("starts every combination running and every gate queued", () => {
			render(<TestedByDefault />);

			for (let i = 0; i < COMBINATIONS.length; i++) {
				expect(isHidden(rowState(i))).toBe(true);
			}
			for (const gate of gateStates()) {
				expect(isHidden(gate)).toBe(true);
			}
			expect(isHidden(banner())).toBe(true);
		});
	});

	describe("the green run", () => {
		it("passes the combinations in order", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUITE_PASSES_AT[0]));
			expect(isHidden(rowState(0))).toBe(false);
			expect(isHidden(rowState(1))).toBe(true);

			act(
				() =>
					void vi.advanceTimersByTime(SUITE_PASSES_AT[1] - SUITE_PASSES_AT[0]),
			);
			expect(isHidden(rowState(1))).toBe(false);
			expect(isHidden(rowState(2))).toBe(true);

			act(
				() =>
					void vi.advanceTimersByTime(SUITE_PASSES_AT[2] - SUITE_PASSES_AT[1]),
			);
			expect(isHidden(rowState(2))).toBe(false);
		});

		it("keeps the gates queued until every combination has finished", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUITE_PASSES_AT[2]));

			for (const gate of gateStates()) {
				expect(isHidden(gate)).toBe(true);
			}
		});

		it("reveals the summary, flips each gate, then shows the banner", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUMMARY_AT));
			expect(isHidden(region("summary").getByText(/\d+ passed/))).toBe(false);

			act(() => void vi.advanceTimersByTime(GATES_PASS_AT[3] - SUMMARY_AT));
			for (const gate of gateStates()) {
				expect(isHidden(gate)).toBe(false);
			}
			expect(isHidden(banner())).toBe(true);

			act(() => void vi.advanceTimersByTime(BANNER_AT - GATES_PASS_AT[3]));
			expect(isHidden(banner())).toBe(false);
		});

		it("holds the finished state, then restarts the cycle", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(RESET_AT + 100));

			expect(isHidden(rowState(0))).toBe(true);
			for (const gate of gateStates()) {
				expect(isHidden(gate)).toBe(true);
			}
		});

		it("clears its timer on unmount", () => {
			const { unmount } = render(<TestedByDefault />);
			expect(vi.getTimerCount()).toBe(1);

			unmount();

			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("prefers-reduced-motion", () => {
		it("settles straight to the finished state and schedules nothing", () => {
			setReducedMotion(true);
			render(<TestedByDefault />);

			for (let i = 0; i < COMBINATIONS.length; i++) {
				expect(isHidden(rowState(i))).toBe(false);
			}
			for (const gate of gateStates()) {
				expect(isHidden(gate)).toBe(false);
			}
			expect(isHidden(banner())).toBe(false);
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("accessibility", () => {
		it("marks the animated mocks as decorative", () => {
			const { container } = render(<TestedByDefault />);

			const mocks = container.querySelectorAll("[data-mock]");
			expect(mocks).toHaveLength(2);
			for (const mock of mocks) {
				expect(mock).toHaveAttribute("aria-hidden", "true");
			}
		});
	});
});
