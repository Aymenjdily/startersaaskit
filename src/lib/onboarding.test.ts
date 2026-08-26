import { describe, expect, it } from "vitest";
import {
	type Answers,
	firstUnansweredStep,
	isAnswered,
	isComplete,
	QUESTIONS,
	questionById,
} from "./onboarding";

const complete = () =>
	Object.fromEntries(
		QUESTIONS.map((question) => [
			question.id,
			question.multiple ? [question.options[0].id] : question.options[0].id,
		]),
	) as Answers;

describe("the question set", () => {
	it("asks for something", () => {
		expect(QUESTIONS.length).toBeGreaterThan(0);
	});

	it.each(QUESTIONS)("$id offers at least two options", (question) => {
		expect(question.options.length).toBeGreaterThan(1);
	});

	/** A duplicate id makes two options the same answer, silently. */
	it.each(QUESTIONS)("$id has distinct option ids", (question) => {
		const ids = question.options.map((option) => option.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it("has no duplicate question ids", () => {
		const ids = QUESTIONS.map((question) => question.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	/**
	 * Every id becomes a Postgres column name and a value inside a CHECK
	 * constraint, so anything needing quoting or escaping is a bug waiting for
	 * the first person who picks it.
	 */
	it.each(QUESTIONS)("$id is safe to use as a column name", (question) => {
		expect(question.id).toMatch(/^[a-z][a-z0-9_]*$/);

		for (const option of question.options) {
			expect(option.id).toMatch(/^[a-z0-9][a-z0-9_]*$/);
		}
	});
});

describe("questionById", () => {
	it("finds one", () => {
		expect(questionById("role").id).toBe("role");
	});

	it("refuses to invent one", () => {
		// @ts-expect-error -- the point is the runtime behaviour
		expect(() => questionById("nope")).toThrow(/nope/);
	});
});

describe("isAnswered", () => {
	const single = questionById("role");
	const multi = questionById("friction");

	it("accepts an option the question offers", () => {
		expect(isAnswered(single, single.options[0].id)).toBe(true);
	});

	it("rejects a value it never offered", () => {
		expect(isAnswered(single, "chief_vibes_officer")).toBe(false);
	});

	it.each([undefined, null, "", []])("rejects %p", (empty) => {
		expect(isAnswered(single, empty)).toBe(false);
		expect(isAnswered(multi, empty)).toBe(false);
	});

	it("accepts one choice on a multi-select", () => {
		expect(isAnswered(multi, [multi.options[0].id])).toBe(true);
	});

	/** An array with one bad element is a bad answer, not a partly good one. */
	it("rejects a multi-select carrying anything unknown", () => {
		expect(isAnswered(multi, [multi.options[0].id, "nope"])).toBe(false);
	});

	it("rejects a bare string for a multi-select", () => {
		expect(isAnswered(multi, multi.options[0].id)).toBe(false);
	});
});

describe("isComplete", () => {
	it("is true only when every question has an answer", () => {
		expect(isComplete(complete())).toBe(true);
	});

	it.each(QUESTIONS)("is false while $id is missing", (question) => {
		const answers = complete();
		delete answers[question.id];

		expect(isComplete(answers)).toBe(false);
	});
});

describe("firstUnansweredStep", () => {
	it("starts at the beginning for a new account", () => {
		expect(firstUnansweredStep({})).toBe(0);
	});

	it("skips what was already answered", () => {
		expect(
			firstUnansweredStep({ [QUESTIONS[0].id]: QUESTIONS[0].options[0].id }),
		).toBe(1);
	});

	/** With nothing left to ask, the last question is the safe place to land. */
	it("stops at the last question when everything is answered", () => {
		expect(firstUnansweredStep(complete())).toBe(QUESTIONS.length - 1);
	});

	it("returns to a gap left in the middle", () => {
		const answers = complete();
		delete answers[QUESTIONS[2].id];

		expect(firstUnansweredStep(answers)).toBe(2);
	});
});
