import { render, screen, within } from "@testing-library/react";
import { act } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	QUESTION_COUNT,
	QUESTION_COUNT_WORD,
	QUESTION_COUNT_WORD_CAPITALISED,
} from "@/lib/starter-questions";
import { setReducedMotion } from "@/test/setup";
import { ANSWERS, HowItWorks, STEPS } from "./how-it-works";

/** Offsets mirroring the holds in LINES: 500ms, then 620ms per answer. */
const ANSWER_AT = (n: number) => 500 + 620 * (n - 1);
const ALL_ANSWERS_AT = ANSWER_AT(ANSWERS.length);
const RESOLVING_AT = ALL_ANSWERS_AT + 620;
const DELIVERED_AT = RESOLVING_AT + 900;
const RESET_AT = DELIVERED_AT + 2600;

const panel = () =>
	within(document.querySelector("[data-wizard]") as HTMLElement);

const answered = (label: string) => panel().queryByText(label);

describe("HowItWorks", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders the section heading and every step card", () => {
		render(<HowItWorks />);

		expect(
			screen.getByRole("heading", {
				name: `${QUESTION_COUNT_WORD_CAPITALISED} answers and the repo is on your machine`,
			}),
		).toBeInTheDocument();
		for (const { title } of STEPS) {
			expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
		}
	});

	/**
	 * The heading, the first step card and the panel all state the count. They
	 * used to spell it out by hand, so growing the list left all three lying —
	 * the word is derived from the question set now, and this checks the three
	 * places actually print it rather than trusting that they do.
	 */
	it("asks as many questions as the copy claims", () => {
		expect(ANSWERS).toHaveLength(QUESTION_COUNT);

		const { container } = render(<HowItWorks />);
		act(() => void vi.advanceTimersByTime(RESOLVING_AT));

		expect(container).toHaveTextContent(
			`${QUESTION_COUNT_WORD_CAPITALISED} answers`,
		);
		expect(container).toHaveTextContent(
			`Answer ${QUESTION_COUNT_WORD} questions`,
		);
		expect(container).toHaveTextContent(
			`resolving ${QUESTION_COUNT_WORD} answers`,
		);
	});

	/** A derived word is only useful if it is the real one. */
	it("spells the count out rather than printing a digit", () => {
		expect(QUESTION_COUNT_WORD).toMatch(/^[a-z]+$/);
		expect(QUESTION_COUNT_WORD_CAPITALISED[0]).toBe(
			QUESTION_COUNT_WORD[0].toUpperCase(),
		);
	});

	it("carries the anchor the hero's secondary link points at", () => {
		const { container } = render(<HowItWorks />);

		expect(container.querySelector("#how-it-works")).not.toBeNull();
	});

	/**
	 * The panel fills in on a timer, which is the shape of bug that produces a
	 * hydration mismatch if the first paint differed between server and client.
	 * It always mounts empty and only moves inside `useEffect`.
	 */
	describe("server/client agreement", () => {
		it("renders identical markup on the server across separate renders", () => {
			expect(renderToString(<HowItWorks />)).toBe(
				renderToString(<HowItWorks />),
			);
		});

		it("starts with an empty panel", () => {
			render(<HowItWorks />);

			for (const { label } of ANSWERS) {
				expect(answered(label)).toBeNull();
			}
		});
	});

	describe("the run through the wizard", () => {
		it("fills the answers in order", () => {
			render(<HowItWorks />);

			act(() => void vi.advanceTimersByTime(ANSWER_AT(1)));
			expect(answered(ANSWERS[0].label)).not.toBeNull();
			expect(answered(ANSWERS[1].label)).toBeNull();

			act(() => void vi.advanceTimersByTime(ANSWER_AT(2) - ANSWER_AT(1)));
			expect(answered(ANSWERS[1].label)).not.toBeNull();
		});

		it("shows every answer with the value it resolved to", () => {
			render(<HowItWorks />);

			act(() => void vi.advanceTimersByTime(ALL_ANSWERS_AT));

			for (const { label, value } of ANSWERS) {
				expect(answered(label)).not.toBeNull();
				expect(panel().getByText(value)).toBeInTheDocument();
			}
		});

		it("holds delivery back until the answers have resolved", () => {
			render(<HowItWorks />);

			act(() => void vi.advanceTimersByTime(RESOLVING_AT));
			expect(
				panel().getByText(
					`resolving ${QUESTION_COUNT_WORD} answers into a template`,
				),
			).toBeInTheDocument();
			expect(panel().queryByText(/delivered as/)).toBeNull();

			act(() => void vi.advanceTimersByTime(DELIVERED_AT - RESOLVING_AT));
			expect(panel().getByText(/delivered as/)).toBeInTheDocument();
		});

		/** The zip it claims to deliver is named for the wizard's project answer. */
		it("delivers the project the answers named", () => {
			render(<HowItWorks />);

			act(() => void vi.advanceTimersByTime(DELIVERED_AT));

			const project = ANSWERS[ANSWERS.length - 1].value;
			expect(
				panel().getByText(`delivered as ${project}.zip`),
			).toBeInTheDocument();
		});

		it("holds the finished state, then restarts", () => {
			render(<HowItWorks />);

			act(() => void vi.advanceTimersByTime(RESET_AT + 100));

			expect(answered(ANSWERS[0].label)).toBeNull();
		});

		it("clears its timer on unmount", () => {
			const { unmount } = render(<HowItWorks />);
			expect(vi.getTimerCount()).toBe(1);

			unmount();

			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("prefers-reduced-motion", () => {
		it("settles straight to delivered and schedules nothing", () => {
			setReducedMotion(true);
			render(<HowItWorks />);

			for (const { label } of ANSWERS) {
				expect(answered(label)).not.toBeNull();
			}
			expect(panel().getByText(/delivered as/)).toBeInTheDocument();
			expect(vi.getTimerCount()).toBe(0);
		});
	});

	describe("accessibility", () => {
		it("marks the animated panel as decorative", () => {
			const { container } = render(<HowItWorks />);

			expect(container.querySelector("[data-wizard]")).toHaveAttribute(
				"aria-hidden",
				"true",
			);
		});
	});
});
