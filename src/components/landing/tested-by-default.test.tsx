import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setReducedMotion } from "@/test/setup";
import { SPEC_PAIRS, TestedByDefault } from "./tested-by-default";

/** Timeline offsets, mirroring STEP_MS in the component. */
const SUITE_PASSES_AT = [900, 1700, 2500];
const SUMMARY_AT = 3200;
const GATES_PASS_AT = [3800, 4300, 4800, 5300];
const BANNER_AT = 5900;
const RESET_AT = 8700;

const isHidden = (el: HTMLElement) => el.className.includes("opacity-0");

const banner = () => screen.getByText("All checks passed — ready to ship");

describe("TestedByDefault", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * The first pillar claims every module ships with a spec beside it. A pair
	 * naming a file that does not exist — or a spec that is not actually next to
	 * its module — would be the exact failure the claim denies.
	 */
	describe("the module/spec pairs it shows", () => {
		it.each(SPEC_PAIRS)("$module and $spec both exist in $dir", ({
			dir,
			module,
			spec,
		}) => {
			expect(existsSync(resolve(process.cwd(), dir, module))).toBe(true);
			expect(existsSync(resolve(process.cwd(), dir, spec))).toBe(true);
		});

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

		it("starts every suite running and every gate queued", () => {
			render(<TestedByDefault />);

			for (const label of ["17 passed", "140 passed", "5 passed"]) {
				expect(isHidden(screen.getByText(label))).toBe(true);
			}
			for (const gate of screen.getAllByText("passed")) {
				expect(isHidden(gate)).toBe(true);
			}
			expect(isHidden(banner())).toBe(true);
		});
	});

	describe("the green run", () => {
		it("passes the suites in order", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUITE_PASSES_AT[0]));
			expect(isHidden(screen.getByText("17 passed"))).toBe(false);
			expect(isHidden(screen.getByText("140 passed"))).toBe(true);

			act(
				() =>
					void vi.advanceTimersByTime(SUITE_PASSES_AT[1] - SUITE_PASSES_AT[0]),
			);
			expect(isHidden(screen.getByText("162 passed"))).toBe(false);
			expect(isHidden(screen.getByText("5 passed"))).toBe(true);

			act(
				() =>
					void vi.advanceTimersByTime(SUITE_PASSES_AT[2] - SUITE_PASSES_AT[1]),
			);
			expect(isHidden(screen.getByText("5 passed"))).toBe(false);
		});

		it("keeps the gates queued until every suite has finished", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUITE_PASSES_AT[2]));

			for (const gate of screen.getAllByText("passed")) {
				expect(isHidden(gate)).toBe(true);
			}
		});

		it("reveals the summary, flips each gate, then shows the banner", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(SUMMARY_AT));
			expect(isHidden(screen.getByText("162 passed"))).toBe(false);

			act(() => void vi.advanceTimersByTime(GATES_PASS_AT[3] - SUMMARY_AT));
			for (const gate of screen.getAllByText("passed")) {
				expect(isHidden(gate)).toBe(false);
			}
			expect(isHidden(banner())).toBe(true);

			act(() => void vi.advanceTimersByTime(BANNER_AT - GATES_PASS_AT[3]));
			expect(isHidden(banner())).toBe(false);
		});

		it("holds the finished state, then restarts the cycle", () => {
			render(<TestedByDefault />);

			act(() => void vi.advanceTimersByTime(RESET_AT + 100));

			expect(isHidden(screen.getByText("17 passed"))).toBe(true);
			for (const gate of screen.getAllByText("passed")) {
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

			for (const label of ["17 passed", "140 passed", "5 passed"]) {
				expect(isHidden(screen.getByText(label))).toBe(false);
			}
			for (const gate of screen.getAllByText("passed")) {
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
