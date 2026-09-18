import {
	STARTER_QUESTIONS,
	type StarterAnswers,
	type StarterQuestionId,
} from "@/lib/starter-questions";

/**
 * `SETUP_AGENTS.md` — a ready-made prompt for turning this starter's generic
 * `AGENTS.md` into one that actually describes the product being built.
 *
 * `AGENTS.md` (see `fragments.ts`'s `BASE`) can only say what is true of
 * every starter this generator produces: the conventions, the boundaries,
 * where a test sits. It has no way to know what the app is *for* — that is
 * the one thing the generator was never told, because the wizard asks about
 * a stack, not a product.
 *
 * Rather than leave that gap silent, this hands the reader a prompt with the
 * stack half already filled in, built around the structure a good
 * `AGENTS.md` follows: what the product is, how the AI should work, its
 * boundaries, its data model, its pitfalls, and what to check before calling
 * something done. The reader fills in the four blanks only they can answer,
 * pastes the rest into whatever LLM they plan on using, and reviews what
 * comes back before it replaces anything.
 */

function labelFor(id: StarterQuestionId, answers: StarterAnswers): string {
	const question = STARTER_QUESTIONS.find((candidate) => candidate.id === id);
	const chosen = question?.options?.find((option) => option.id === answers[id]);

	return chosen?.label ?? "—";
}

/**
 * The stack rows every prompt gets, so the LLM never has to guess which
 * database or auth provider it is writing rules for.
 */
function stackLines(answers: StarterAnswers): string {
	return STARTER_QUESTIONS.filter((question) => question.kind === "choice")
		.map((question) => `- ${question.label}: ${labelFor(question.id, answers)}`)
		.join("\n");
}

/**
 * The secrets this exact stack introduces, named so the review checklist can
 * ask about them by name rather than "any secrets" — which is the kind of
 * vague line the guide this follows warns against.
 */
function secretNames(envNames: readonly string[]): string {
	if (envNames.length === 0) {
		return "no secret this build has introduced yet";
	}
	return envNames.join(", ");
}

export function setupAgentsGuide(
	answers: StarterAnswers,
	envNames: readonly string[],
): string {
	return `# Setting up a deeper AGENTS.md

\`AGENTS.md\` at the root of this repo already tells an AI coding agent the
conventions every starter from this generator enforces — one module per
integration, where environment variables are read, the boundary between
the browser and the server. What it cannot know is what *this* app is for:
what problem it solves, who uses it, what its standout feature is, and what
is deliberately out of scope for now. Only you know that, so it is not in
there.

This file is a prompt for getting it written. Fill in the blanks marked
below, then copy everything in the fenced block into any LLM you use for
planning — ChatGPT, Claude, or your coding agent's own planning mode — and
review what comes back against the checklist at the end before any of it
replaces what is already in \`AGENTS.md\`.

Delete this file once you are done with it. Unlike \`AGENTS.md\`, it
documents nothing about the app itself.

## Fill this in, then copy everything below into an LLM

\`\`\`
I am building [DESCRIBE YOUR PRODUCT IN ONE OR TWO SENTENCES — what it does
and who it is for].

The standout feature is [WHAT MAKES THIS MORE THAN A GENERIC CRUD APP —
delete this line if there isn't one yet].

What is explicitly out of scope for this build: [LIST WHAT YOU ARE NOT
BUILDING YET, SO THE AGENT DOES NOT ADD IT UNPROMPTED].

The stack is already decided:
${stackLines(answers)}

The repository already enforces some rules, read from its own AGENTS.md and
ARCHITECTURE.md:
- One module per integration, named after the integration —
  \`src/lib/auth.ts\`, \`src/lib/checkout.ts\`, \`src/lib/email.ts\`,
  \`src/lib/jobs.ts\` among them.
- Environment variables are declared once, in \`src/lib/env.ts\`, and read
  nowhere else; a value the browser is allowed to see goes through
  \`src/lib/public-env.ts\` instead.
- Anything that must never reach the browser lives in \`src/server/\`, which
  imports \`server-only\` so leaking it into a client component fails the
  build.
- The test for a module sits beside it: \`foo.ts\` is specified by
  \`foo.test.ts\`.
- A skill for each library in the stack above already lives in
  \`.claude/skills/\`.

Help me draft an AGENTS.md file for an AI coding agent working in this
repository, building on top of what is already there rather than repeating
it.

Include: the role of the AI agent, what the app actually is, how the AI
should work — plan first, get approval, then implement, then test, then
report, rather than implementing on the first message — UI implementation
rules (does the AI match a reference exactly, or is it trusted to design
something), which skills and docs it should read before touching each part
of the stack, app responsibilities and boundaries beyond what is listed
above, decisions already made that a feature should not re-litigate, the
data model, any background or offline processes, the behavior of the most
important features in real detail, pitfalls specific to this product, the
checks to run before calling something done, and simple fallback rules for
when the agent is unsure.

Write it as direct instructions to the agent, not a description of the
project for a person to read. Be specific and concrete — a rule like "keep
it secure" tells the agent nothing useful; a rule like "the browser must
never see a Stripe secret key" does. Avoid vague advice.
\`\`\`

## Before you accept the draft

- Is every section actually true of this project, or did the LLM guess at
  something you never told it?
- Does it say what is *out* of scope, not only what is in it?
- Does it protect every secret this stack introduces — ${secretNames(envNames)}?
- Does it say where the line between browser and server sits, and does that
  match what \`ARCHITECTURE.md\` already says?
- Does it match the order you actually intend to build features in, rather
  than an order the LLM invented?
- Would someone who has read only this file know what *not* to build?

Do not accept the first draft blindly. An LLM can help write the file; the
product and architecture decisions inside it are still yours to make.

Once you are happy with it, fold the product-specific sections into
\`AGENTS.md\` itself and delete this file — a second file nobody reads again
is worse than no file at all.
`;
}
