import { buildStarter, type StarterFiles } from "@/lib/generate/build-starter";
import {
	optionsFor,
	STARTER_QUESTIONS,
	type StarterAnswers,
	type StarterQuestion,
	type StarterQuestionId,
} from "@/lib/starter-questions";

/**
 * Every stack the wizard can produce, generated once per test file.
 *
 * Several suites assert something about *all* of them — that each builds, that
 * none is empty, that the guide never names a missing script — and generating
 * the matrix inside each test is what pushed the suite past its timeouts.
 *
 * ## Why it is not literally every combination
 *
 * Each question multiplies the count. Email took it from 696 to 2784; package
 * manager took it to 11136. Building eleven thousand projects twice over is
 * minutes of CPU for information the run does not contain — because the matrix
 * exists to catch *interactions between answers*, and a question no other
 * question can see has no interactions to catch.
 *
 * So a question that is **orthogonal** — no option of its own requires
 * anything, and no option anywhere requires a tag it carries — is pinned to a
 * single value here, and covered directly by the suite that cares about it
 * (`guide.test.ts` walks all four package managers against one stack).
 *
 * `isOrthogonal` reads the requirement graph rather than naming questions, so
 * the moment someone writes `requires: { packageManager: ... }` this stops
 * pinning it and the full cross-product comes back on its own. There is a test
 * for that in `starter-matrix.test.ts` — the pinning is a claim about the data,
 * and a stale claim here would silently shrink the coverage of three suites.
 */

const CHOICES = STARTER_QUESTIONS.filter(
	(question) => question.kind === "choice",
);

/** Every tag any option of this question carries. */
const tagsOffered = (question: StarterQuestion): Set<string> =>
	new Set((question.options ?? []).flatMap((option) => option.tags ?? []));

/** Every `[questionId, tag]` pair some option demands. */
export function requirementGraph(): [StarterQuestionId, string][] {
	return CHOICES.flatMap((question) =>
		(question.options ?? []).flatMap(
			(option) =>
				Object.entries(option.requires ?? {}) as [StarterQuestionId, string][],
		),
	);
}

/**
 * A question nothing filters on and which filters on nothing.
 *
 * Both halves are needed. A question whose own options have requirements
 * changes which of *its* answers are legal, and a question others require tags
 * from changes which of *their* answers are legal. Either way it belongs in
 * the cross-product.
 */
export function isOrthogonal(question: StarterQuestion): boolean {
	const ownsRequirements = (question.options ?? []).some(
		(option) => Object.keys(option.requires ?? {}).length > 0,
	);
	if (ownsRequirements) return false;

	const mine = tagsOffered(question);
	return !requirementGraph().some(
		([id, tag]) => id === question.id || mine.has(tag),
	);
}

export const ORTHOGONAL = CHOICES.filter(isOrthogonal);

/**
 * Every legal set, with orthogonal questions pinned to their first option.
 *
 * "Legal" is still decided by `optionsFor`, exactly as the wizard decides it —
 * the pinning narrows which sets are *enumerated*, never which are considered
 * valid.
 */
export function everyLegalCombination(): StarterAnswers[] {
	const pinned = new Set(ORTHOGONAL.map((question) => question.id));
	const out: StarterAnswers[] = [];

	const walk = (index: number, so_far: StarterAnswers) => {
		if (index === CHOICES.length) {
			out.push({ ...so_far, project: "my-app" });
			return;
		}

		const question = CHOICES[index] as StarterQuestion;
		const options = optionsFor(question, so_far);
		const walked = pinned.has(question.id) ? options.slice(0, 1) : options;

		for (const option of walked) {
			walk(index + 1, { ...so_far, [question.id]: option.id });
		}
	};
	walk(0, {});
	return out;
}

let cache: { answers: StarterAnswers; files: StarterFiles }[] | null = null;

/**
 * The same list, already built. Lazy, so a file that does not want the matrix
 * pays nothing for importing the helper beside it.
 */
export function everyGeneratedStarter() {
	if (!cache) {
		cache = everyLegalCombination().map((answers) => ({
			answers,
			files: buildStarter(answers),
		}));
	}
	return cache;
}
