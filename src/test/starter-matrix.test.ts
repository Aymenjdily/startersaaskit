import { describe, expect, it } from "vitest";
import { STARTER_QUESTIONS } from "@/lib/starter-questions";
import {
	everyLegalCombination,
	isOrthogonal,
	ORTHOGONAL,
	requirementGraph,
} from "./starter-matrix";

/**
 * The matrix helper decides how much three other suites actually check, by
 * choosing which questions to enumerate. That makes its one judgement call —
 * "this question is orthogonal, so pin it" — worth testing directly: a wrong
 * answer there does not fail anything, it quietly shrinks the coverage of
 * `build-starter`, `guide` and everything downstream of them.
 */

const byId = (id: string) =>
	STARTER_QUESTIONS.find((question) => question.id === id) as NonNullable<
		(typeof STARTER_QUESTIONS)[number]
	>;

describe("isOrthogonal", () => {
	/**
	 * Package manager is the case this was built for: four options, none of
	 * which changes what any other question may answer.
	 */
	it("pins a question nothing filters on", () => {
		expect(isOrthogonal(byId("packageManager"))).toBe(true);
	});

	it.each([
		/* Its options require a database tag and a framework tag. */
		"orm",
		/* Supabase Auth requires a database, Auth0 a framework. */
		"auth",
		/* Stripe requires a server. */
		"billing",
	])("does not pin %s, whose options have requirements", (id) => {
		expect(isOrthogonal(byId(id))).toBe(false);
	});

	/**
	 * The other half, and the easier one to get wrong: framework's own options
	 * require nothing at all, but half the catalogue requires its `server` tag.
	 * Pinning it would drop React + Vite — and every constraint that exists to
	 * keep a secret out of a browser bundle — from the matrix entirely.
	 */
	it("does not pin a question other questions filter on", () => {
		const framework = byId("framework");

		expect(
			(framework.options ?? []).every(
				(option) => Object.keys(option.requires ?? {}).length === 0,
			),
			"framework's own options have no requirements",
		).toBe(true);
		expect(requirementGraph().some(([, tag]) => tag === "server")).toBe(true);
		expect(isOrthogonal(framework)).toBe(false);
	});
});

describe("the enumerated matrix", () => {
	const combinations = everyLegalCombination();

	it("still covers every framework, including the browser-only one", () => {
		expect(
			[...new Set(combinations.map((answers) => answers.framework))].sort(),
		).toEqual(["nextjs", "react_vite", "tanstack_start"]);
	});

	/** Pinned means one value, not a missing key. */
	it.each(
		ORTHOGONAL.map((question) => question.id),
	)("answers %s in every set, at a single value", (id) => {
		const seen = new Set(combinations.map((answers) => answers[id]));

		expect(seen.size).toBe(1);
		expect([...seen][0]).toBeDefined();
	});

	/**
	 * The saving is the whole reason for the pinning, so it is worth stating:
	 * without it the count is multiplied by every orthogonal question's option
	 * count, and each of those is a project built twice over.
	 */
	it("is smaller than the full cross-product by exactly what was pinned", () => {
		const multiplier = ORTHOGONAL.reduce(
			(total, question) => total * (question.options?.length ?? 1),
			1,
		);

		expect(multiplier).toBeGreaterThan(1);
		expect(combinations.length * multiplier).toBeGreaterThan(10_000);
	});
});
