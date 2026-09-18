import { describe, expect, it } from "vitest";
import { buildStarter } from "@/lib/generate/build-starter";
import { sanitiseAnswers } from "@/lib/starter-preview";
import {
	isStarterComplete,
	optionsFor,
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "@/lib/starter-questions";

/**
 * The guard on the public builder.
 *
 * `/build` takes a whole answer set over the network from someone who never
 * passed through the wizard, and hands it to the generator. Everything the
 * dialog enforces by only *offering* legal options has to be enforced again
 * here, because nothing about an HTTP request went through the dialog.
 *
 * These are written as attacks rather than as a description of the happy path.
 * A guard that is only tested with valid input is not tested.
 */

const question = (id: string) => {
	const found = STARTER_QUESTIONS.find((candidate) => candidate.id === id);

	if (!found) throw new Error(`no "${id}" question`);
	return found;
};

describe("sanitiseAnswers", () => {
	it("completes an empty request rather than refusing it", () => {
		const answers = sanitiseAnswers({});

		expect(isStarterComplete(answers)).toBe(true);
	});

	it("completes a request that answers only one question", () => {
		const answers = sanitiseAnswers({ framework: "react_vite" });

		expect(answers.framework).toBe("react_vite");
		expect(isStarterComplete(answers)).toBe(true);
	});

	/**
	 * The rule the wizard enforces by hiding the option. React + Vite has no
	 * server, so it cannot hold a Neon connection string — and a request naming
	 * that pairing anyway must not produce a starter with a secret in a browser
	 * bundle.
	 */
	it("drops a database the chosen framework cannot hold", () => {
		const answers = sanitiseAnswers({
			framework: "react_vite",
			database: "neon",
		});

		expect(answers.framework).toBe("react_vite");
		expect(answers.database).not.toBe("neon");
		expect(isStarterComplete(answers)).toBe(true);
	});

	/**
	 * Auth0 ships a server session only for Next. The pairing was offered once
	 * and is not any more, which is exactly the kind of rule that gets tightened
	 * after a URL is already in circulation.
	 */
	it("drops an auth provider the chosen framework cannot run", () => {
		const answers = sanitiseAnswers({
			framework: "tanstack_start",
			auth: "auth0",
		});

		expect(answers.auth).not.toBe("auth0");
	});

	it("ignores an answer that is not an option at all", () => {
		const answers = sanitiseAnswers({ framework: "svelte", auth: "../../etc" });

		expect(
			optionsFor(question("framework"), {}).map((option) => option.id),
		).toContain(answers.framework);
		expect(answers.auth).not.toBe("../../etc");
		expect(isStarterComplete(answers)).toBe(true);
	});

	it("ignores an unknown question", () => {
		const answers = sanitiseAnswers({
			framework: "nextjs",
			shell: "rm -rf /",
		} as StarterAnswers);

		expect(answers).not.toHaveProperty("shell");
	});

	/**
	 * The project name reaches `package.json`, so it is the one answer where a
	 * string the caller wrote ends up inside a generated file.
	 */
	it.each([
		["../../../etc/passwd", "a path"],
		['", "scripts": { "postinstall": "x', "a JSON break"],
		["My App", "a space"],
		["", "nothing"],
	])("replaces %s as a project name (%s)", (project) => {
		expect(sanitiseAnswers({ project }).project).toBe("my-app");
	});

	it("keeps a project name that is a valid repository name", () => {
		expect(sanitiseAnswers({ project: "my-real-app" }).project).toBe(
			"my-real-app",
		);
	});

	it.each([
		["null", null],
		["undefined", undefined],
		["a string", "framework=nextjs"],
		["an array", []],
	])("survives %s where an answer set was expected", (_name, given) => {
		const answers = sanitiseAnswers(given as unknown as StarterAnswers);

		expect(isStarterComplete(answers)).toBe(true);
	});

	/**
	 * The property the whole function exists for: whatever arrives, what comes
	 * out is something `buildStarter` can be handed.
	 */
	it.each([
		["an empty request", {}],
		["an illegal pairing", { framework: "react_vite", database: "neon" }],
		["nonsense", { framework: "🙂", orm: "12", auth: "{}" }],
	])("builds a real starter from %s", (_name, requested) => {
		const files = buildStarter(sanitiseAnswers(requested));

		expect(Object.keys(files).length).toBeGreaterThan(20);
		expect(Object.values(files).every((source) => source.length > 0)).toBe(
			true,
		);
	});

	/**
	 * Sanitising twice changes nothing.
	 *
	 * The builder round-trips its answers — the server returns what it built,
	 * the page puts that in the URL, the next request sends it back — so a
	 * function that kept adjusting its own output would drift a stack away from
	 * the one somebody shared.
	 */
	it.each([
		{ framework: "react_vite", database: "neon" },
		{ framework: "nextjs", auth: "clerk", billing: "stripe" },
		{},
	])("is idempotent for %o", (requested) => {
		const once = sanitiseAnswers(requested);

		expect(sanitiseAnswers(once)).toEqual(once);
	});
});
