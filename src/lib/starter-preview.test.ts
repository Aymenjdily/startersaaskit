import { describe, expect, it } from "vitest";
import { buildStarter } from "@/lib/generate/build-starter";
import { heroCombinations, previewKey } from "@/lib/starter-preview";
import {
	optionsFor,
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";

/**
 * Mirrors the module's own `completeAnswers`, which is not exported.
 *
 * Kept in step by construction rather than by copying: both walk the questions
 * and take the first legal option, so a rule added to `starter-questions.ts`
 * moves them together.
 */
function complete(framework: string, database: string): StarterAnswers {
	const chosen: StarterAnswers = {
		framework,
		database,
		components: "shadcn",
		billing: "none",
		email: "none",
		landing: "none",
		packageManager: "pnpm",
		project: "my-app",
	};

	for (const question of STARTER_QUESTIONS) {
		if (question.kind === "text" || chosen[question.id]) continue;

		const option = optionsFor(question, chosen)[0];

		if (option) chosen[question.id] = option.id;
	}

	return chosen;
}

describe("the hero's starter previews", () => {
	const combinations = heroCombinations();

	it("offers something to preview", () => {
		expect(combinations.length).toBeGreaterThan(5);
	});

	/**
	 * The panel renders whatever this returns. A combination the generator
	 * refuses to build would reach the browser as an empty box on the busiest
	 * part of the page, so every pairing is built here.
	 */
	it.each(combinations)("builds $framework with $database", ({
		framework,
		database,
	}) => {
		const files = buildStarter(complete(framework, database));

		expect(Object.keys(files).length).toBeGreaterThan(20);
	});

	/**
	 * The seam the hero exists to show.
	 *
	 * A browser-only app has no server to hold a connection string, so it must
	 * not be offered a database that needs one. If this ever passes for Neon the
	 * panel is demonstrating a rule the product does not have.
	 */
	it("never pairs a browser-only app with a server database", () => {
		const spa = combinations.filter((one) => one.framework === "react_vite");

		expect(spa.length).toBeGreaterThan(0);
		expect(spa.map((one) => one.database)).not.toContain("neon");
	});

	it("keys each pairing uniquely", () => {
		const keys = combinations.map((one) =>
			previewKey(one.framework, one.database),
		);

		expect(new Set(keys).size).toBe(keys.length);
	});

	/**
	 * The opening file has to be worth opening on.
	 *
	 * Falling back to the first path alphabetically lands on `.env.example`,
	 * which tells a visitor nothing about whether the generator writes real
	 * code. Every combination should reach something under `src/`.
	 */
	it.each(combinations)("opens $framework/$database on a source file", ({
		framework,
		database,
	}) => {
		const paths = Object.keys(buildStarter(complete(framework, database)));

		expect(paths.some((path) => path.startsWith("src/"))).toBe(true);
	});
});
