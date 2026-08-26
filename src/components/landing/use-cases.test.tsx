import { fireEvent, render, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMBINATIONS, SPEC_PAIRS } from "./tested-by-default";
import {
	DELIVERY_STEPS,
	SIGN_IN_FIELDS,
	TODO_COLUMNS,
	USE_CASES,
	UseCases,
} from "./use-cases";

const names = (container: HTMLElement) =>
	within(container.querySelector("[data-cases]") as HTMLElement);

const nameButton = (container: HTMLElement, title: string) =>
	names(container).getByRole("button", { name: title });

const lit = (container: HTMLElement) =>
	names(container)
		.getAllByRole("button")
		.find((button) => button.getAttribute("aria-current") === "true");

/**
 * jsdom has no `matchMedia`. The rotation asks it whether motion is welcome, so
 * every test has to answer — and the answer decides whether the interval that
 * drives the panel exists at all.
 */
function stubMotion(reduced: boolean) {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		writable: true,
		value: (query: string) => ({
			matches: reduced,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn(),
		}),
	});
}

describe("UseCases", () => {
	beforeEach(() => stubMotion(false));

	afterEach(() => {
		vi.useRealTimers();
		Reflect.deleteProperty(window, "matchMedia");
	});

	it("renders the section heading", () => {
		render(<UseCases />);

		expect(
			screen.getByRole("heading", {
				name: "Your starting point, whatever you are building",
			}),
		).toBeInTheDocument();
	});

	it("renders identical markup on the server across separate renders", () => {
		expect(renderToString(<UseCases />)).toBe(renderToString(<UseCases />));
	});

	/** The navbar's "Use cases" menu links here, so the anchor has to exist. */
	it("is the target the navbar menu points at", () => {
		const { container } = render(<UseCases />);

		expect(container.querySelector("#use-cases")).not.toBeNull();
	});

	it("names every use case", () => {
		const { container } = render(<UseCases />);

		for (const { title } of USE_CASES) {
			expect(nameButton(container, title)).toBeVisible();
		}
	});

	describe("the name the reader is looking at", () => {
		it("lights exactly one, and starts on the first", () => {
			const { container } = render(<UseCases />);

			expect(
				names(container)
					.getAllByRole("button")
					.filter((b) => b.getAttribute("aria-current") === "true"),
			).toHaveLength(1);
			expect(lit(container)).toHaveTextContent(USE_CASES[0].title);
		});

		it("moves on its own", () => {
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => void vi.advanceTimersByTime(3600));

			expect(lit(container)).toHaveTextContent(USE_CASES[1].title);
		});

		it("wraps back round to the first", () => {
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => void vi.advanceTimersByTime(3600 * USE_CASES.length));

			expect(lit(container)).toHaveTextContent(USE_CASES[0].title);
		});

		/** A panel that keeps moving after a deliberate click reads as broken. */
		it("stops rotating once the reader picks one", () => {
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => {
				fireEvent.click(nameButton(container, USE_CASES[3].title));
			});
			expect(lit(container)).toHaveTextContent(USE_CASES[3].title);

			act(() => void vi.advanceTimersByTime(3600 * 3));
			expect(lit(container)).toHaveTextContent(USE_CASES[3].title);
		});

		it("follows the keyboard", () => {
			const { container } = render(<UseCases />);

			act(() => {
				fireEvent.focus(nameButton(container, USE_CASES[2].title));
			});

			expect(lit(container)).toHaveTextContent(USE_CASES[2].title);
		});

		it("holds still when the reader asked for no motion", () => {
			stubMotion(true);
			vi.useFakeTimers();
			const { container } = render(<UseCases />);

			act(() => void vi.advanceTimersByTime(3600 * 3));

			expect(lit(container)).toHaveTextContent(USE_CASES[0].title);
			expect(vi.getTimerCount()).toBe(0);
		});

		it("clears its interval on unmount", () => {
			vi.useFakeTimers();
			const { unmount } = render(<UseCases />);

			expect(vi.getTimerCount()).toBe(1);
			unmount();
			expect(vi.getTimerCount()).toBe(0);
		});

		it("shows the copy belonging to the lit name", () => {
			const { container } = render(<UseCases />);

			expect(screen.getByText(USE_CASES[0].text)).toBeVisible();

			act(() => {
				fireEvent.click(nameButton(container, USE_CASES[4].title));
			});

			expect(screen.getByText(USE_CASES[4].text)).toBeVisible();
			expect(screen.queryByText(USE_CASES[0].text)).toBeNull();
		});
	});

	/**
	 * These screens used to be pictures of this repo, checked back against its
	 * files. They now picture a repo we generate, so disk proves nothing. What
	 * replaces those guards is agreement between sections: the matrix and the
	 * spec pairs are section 06's data, and a screen that quietly stopped
	 * rendering them would leave two parts of the page telling different stories.
	 */
	describe("the screens each one shows", () => {
		it("gives every use case its own screen", () => {
			const rendered = new Set(USE_CASES.map(({ Screen }) => Screen));

			expect(rendered.size).toBe(USE_CASES.length);
		});

		it("signs in with the fields the generated auth module turns on", () => {
			render(<UseCases />);

			expect(SIGN_IN_FIELDS).toEqual(["Email", "Password"]);
			for (const field of SIGN_IN_FIELDS) {
				expect(screen.getByText(field)).toBeInTheDocument();
			}
		});

		it("browses the columns the generated schema declares", () => {
			render(<UseCases />);

			for (const column of TODO_COLUMNS) {
				expect(screen.getByText(column)).toBeInTheDocument();
			}
		});

		it("ends the delivery in the reader's GitHub", () => {
			render(<UseCases />);

			for (const step of DELIVERY_STEPS) {
				expect(screen.getByText(step)).toBeInTheDocument();
			}
			expect(DELIVERY_STEPS.at(-1)).toMatch(/GitHub/);
		});

		/** Same matrix as section 06, or the page contradicts itself. */
		it("reports the combination matrix, not a suite count", () => {
			render(<UseCases />);

			for (const { framework, stack } of COMBINATIONS) {
				expect(screen.getByText(`${framework} · ${stack}`)).toBeInTheDocument();
			}
			expect(screen.getAllByText(`${COMBINATIONS.length} passed`).length).toBe(
				1,
			);
		});

		/** Same pairs as section 06's first pillar. */
		it("pairs each module with the spec beside it", () => {
			render(<UseCases />);

			for (const { module, spec } of SPEC_PAIRS) {
				expect(screen.getAllByText(module).length).toBeGreaterThan(0);
				expect(screen.getAllByText(spec).length).toBeGreaterThan(0);
			}
		});
	});
});
