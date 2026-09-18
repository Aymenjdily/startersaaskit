/**
 * A `.claude/skills/<id>/SKILL.md` file, in the shape Claude Code discovers on
 * its own.
 *
 * Every library a starter can be built with has its own sharp edges — a cookie
 * plugin Better Auth silently drops sessions without, a `<Show>` component
 * that replaced `<SignedIn>` in Clerk Core 3, a route tree TanStack Start has
 * to generate before `tsc` can see it. That knowledge already lives in this
 * generator, in the comments above the fragment that wires each library up —
 * it has to, or the fragment would be wrong. A skill is that same knowledge,
 * copied into the one place an AI assistant working *in the generated repo*
 * will actually look for it, rather than left behind in the generator's own
 * source where the reader never sees it.
 *
 * Only libraries the wizard actually chose get a skill: `fragmentsFor` already
 * decides which modules a starter is built from, and a skill for a database
 * nobody picked would be a file about a library that is not in the project.
 */
export function claudeSkill(
	id: string,
	description: string,
	body: string,
): Record<string, string> {
	return {
		[`.claude/skills/${id}/SKILL.md`]: `---
name: ${id}
description: ${description}
---

${body.trim()}
`,
	};
}
