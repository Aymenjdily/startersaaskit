import { describe, expect, it } from "vitest";
import type { StarterAnswers } from "@/lib/starter-questions";
import { everyGeneratedStarter } from "@/test/starter-matrix";
import { buildStarter } from "./build-starter";
import { claudeSkill } from "./claude-skill";

/**
 * `.claude/skills/` is how a chosen library's own gotchas reach an AI
 * assistant working inside the *generated* repo — see `claudeSkill`'s own
 * comment for why. This asserts the mechanism rather than any one library's
 * prose: that a skill exists for exactly what was chosen, that it is shaped
 * the way Claude Code expects a skill to be shaped, and that nothing chosen
 * is left without one.
 */

/** The library ids an answer set should produce a skill for. `"none"` and
 * `"tailwind_only"` are not libraries, so neither gets a skill. */
function expectedSkillIds(answers: StarterAnswers): string[] {
	return [
		answers.framework,
		answers.components,
		answers.database,
		answers.orm,
		answers.auth,
		answers.billing,
		answers.email,
		answers.jobs,
	].filter(
		(id): id is string => !!id && id !== "none" && id !== "tailwind_only",
	);
}

describe("claudeSkill", () => {
	it("writes a SKILL.md with name and description frontmatter", () => {
		const files = claudeSkill("widget", "What it is for.", "The body.");

		expect(files[".claude/skills/widget/SKILL.md"]).toBe(
			`---
name: widget
description: What it is for.
---

The body.
`,
		);
	});
});

describe("the skills a generated starter ships", () => {
	const answers: StarterAnswers = {
		framework: "nextjs",
		components: "shadcn",
		database: "neon",
		orm: "drizzle",
		auth: "better_auth",
		billing: "stripe",
		email: "resend",
		jobs: "qstash",
		packageManager: "pnpm",
		landing: "none",
		project: "my-app",
	};

	it("has one skill per library chosen, and no others", () => {
		const files = buildStarter(answers);
		const shipped = Object.keys(files)
			.filter((path) => /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(path))
			.map((path) => path.split("/")[2]);

		expect(shipped.sort()).toEqual(expectedSkillIds(answers).sort());
	});

	it("skips a skill for choices that are not libraries", () => {
		const files = buildStarter({
			...answers,
			components: "tailwind_only",
			billing: "none",
			email: "none",
			jobs: "none",
		});
		const shipped = Object.keys(files).filter((path) =>
			path.startsWith(".claude/skills/"),
		);

		for (const missing of ["tailwind_only", "none"]) {
			expect(shipped.some((path) => path.includes(`/${missing}/`))).toBe(false);
		}
	});

	/**
	 * Every combination the wizard allows, not one fixture — a skill missing
	 * for a single (framework, auth) pair would otherwise slip past a suite
	 * that only ever builds the default stack.
	 */
	it("matches exactly across every combination the wizard allows", () => {
		for (const { answers: combo, files } of everyGeneratedStarter()) {
			const shipped = Object.keys(files)
				.filter((path) => /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(path))
				.map((path) => path.split("/")[2])
				.sort();

			expect(shipped, JSON.stringify(combo)).toEqual(
				expectedSkillIds(combo).sort(),
			);
		}
	});

	it("gives every skill a valid frontmatter and a real body", () => {
		for (const { files } of everyGeneratedStarter()) {
			for (const [path, contents] of Object.entries(files)) {
				if (!path.startsWith(".claude/skills/")) continue;

				const match =
					/^---\nname: (\S+)\ndescription: (.+)\n---\n\n([\s\S]+)$/.exec(
						contents,
					);

				expect(match, `${path} is not a valid SKILL.md`).not.toBeNull();
				expect(match?.[1]).toBe(path.split("/")[2]);
				expect((match?.[2] ?? "").length).toBeGreaterThan(10);
				expect((match?.[3] ?? "").trim().length).toBeGreaterThan(50);
			}
		}
	});

	it("mentions the skills folder in AGENTS.md", () => {
		expect(buildStarter(answers)["AGENTS.md"]).toContain(".claude/skills/");
	});
});
