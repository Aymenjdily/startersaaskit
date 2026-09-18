import type { StarterAnswers } from "@/lib/starter-questions";
import { claudeSkill } from "./claude-skill";
import type { Fragment } from "./fragments";

/**
 * Inngest, wired end to end.
 *
 * Inngest works by event: this app sends an event by name, and a function
 * elsewhere subscribes to it — the sender and the handler never call each
 * other directly, which is what lets one event fan out to several functions
 * later without the sender changing.
 *
 * Both halves live in this app rather than on Inngest's infrastructure. A
 * route has to receive Inngest's invocations, which is why — unlike
 * Trigger.dev — this fragment mounts one.
 */

const JOBS_TEST = `import { describe, expect, it } from "vitest";
import { queueJob } from "./jobs.js";

/**
 * The contract every job provider in this generator exposes: one function,
 * taking a job name and a payload. Which service runs it is this module's
 * business and nobody else's.
 */
describe("jobs", () => {
	it("offers one way to queue work", () => {
		expect(typeof queueJob).toBe("function");
	});
});
`;

const CLIENT = `import { Inngest } from "inngest";

/**
 * The Inngest client, configured once. Both sending an event
 * (\`src/lib/jobs.ts\`) and receiving one (\`src/inngest/functions.ts\`) go
 * through this instance, so they always agree on which app they belong to.
 */
export const inngest = new Inngest({ id: "{{project}}" });
`;

const FUNCTIONS = `import { inngest } from "./client";

/**
 * One function, to show the shape. It runs whenever \`queueJob\` (in
 * \`src/lib/jobs.ts\`) sends the \`"app/example.requested"\` event — add a new
 * function here and to the \`functions\` array below it, and the route already
 * mounted picks it up automatically.
 */
export const exampleFunction = inngest.createFunction(
	{ id: "example-function" },
	{ event: "app/example.requested" },
	async ({ event, step }) => {
		await step.run("log-payload", async () => {
			return event.data;
		});

		return { received: event.data };
	},
);

export const functions = [exampleFunction];
`;

const JOBS = `import { inngest } from "@/inngest/client";

/**
 * Background jobs, configured once. Named for what it does rather than who
 * runs it, because the rest of the app cares about queueing work, not about
 * Inngest.
 *
 * Sends an event rather than calling a function directly — a function
 * subscribes to an event name in \`src/inngest/functions.ts\`, and the two
 * never reference each other, which is what lets a second function
 * subscribe to the same event later without this call site changing.
 */
export async function queueJob(
	name: string,
	payload: Record<string, unknown>,
): Promise<{ id: string }> {
	const { ids } = await inngest.send({ name, data: payload });

	return { id: ids[0] ?? "" };
}
`;

const ENV: [string, string, string?][] = [
	[
		"INNGEST_EVENT_KEY",
		"From the Inngest dashboard. Authenticates a send in production",
		"test-inngest-event-key",
	],
	[
		"INNGEST_SIGNING_KEY",
		"From the Inngest dashboard. Verifies Inngest's own requests to this app",
		"test-inngest-signing-key",
	],
];

/**
 * The one difference between the two frameworks: Inngest ships an official
 * `inngest/next` adapter, but nothing for TanStack Start, so the route text
 * — and the skill's note about it — differs between them.
 */
const INNGEST_SKILL = (framework: "nextjs" | "tanstack_start") =>
	claudeSkill(
		"inngest",
		"Inngest background jobs — sending an event, the function that receives it, and the route mounted for Inngest's own invocations. Use when adding or sending a job.",
		`
## Two halves, and they never call each other directly

\`queueJob\` in \`src/lib/jobs.ts\` sends an **event** by name
(\`inngest.send({ name, data })\`); a function in \`src/inngest/functions.ts\`
**subscribes** to that same name (\`inngest.createFunction({ id }, { event:
name }, handler)\`). Neither references the other by import. That is
deliberate — it is what lets a second function subscribe to the same event
later without the sender changing — but it also means a typo in the event
name silently produces an event nothing handles, with no error at the send
site. Check the exact string matches on both sides.

## New functions have to be added to the exported array

\`src/inngest/functions.ts\` exports \`functions\`, an array the mounted route
passes to \`serve()\`. A function defined but left out of that array is never
registered with Inngest and never runs, even though the file compiles and
the send succeeds.

## The route is for Inngest's own invocations, not this app's

Whatever is mounted at \`/api/inngest\` exists so Inngest's servers can
discover functions and invoke them — nothing in this app's own code should
call that route directly. Calling \`queueJob\` is how this app triggers a
job; the route is Inngest calling back in.
${
	framework === "nextjs"
		? ""
		: `
## TanStack Start has no official Inngest adapter

Next.js has one (\`inngest/next\`). This route uses the framework-agnostic
\`inngest/edge\` \`serve()\` instead, which speaks plain Fetch
\`Request\`/\`Response\` — exactly what a TanStack Start route's
\`server.handlers\` receive and return. If Inngest ships a dedicated adapter
for this framework later, prefer it.
`
}
## Local development needs the Inngest Dev Server

\`npx inngest-cli@latest dev\` runs alongside \`npm run dev\` and
auto-discovers the mounted route — without it, \`queueJob\` still resolves
but nothing executes the function locally.
`,
	);

function nextFragment(): Fragment {
	return {
		dependencies: { inngest: "^3.27.0" },
		env: ENV,
		files: {
			...INNGEST_SKILL("nextjs"),
			"src/inngest/client.ts": CLIENT,
			"src/inngest/functions.ts": FUNCTIONS,
			"src/lib/jobs.ts": JOBS,
			"src/lib/jobs.test.ts": JOBS_TEST,
			"src/app/api/inngest/route.ts": `import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

/**
 * Every registered function is reached through this one route. Inngest's
 * own dashboard calls it to discover functions and to invoke them — nothing
 * in this app calls it directly.
 */
export const { GET, POST, PUT } = serve({ client: inngest, functions });
`,
		},
	};
}

function tanstackFragment(): Fragment {
	return {
		dependencies: { inngest: "^3.27.0" },
		env: ENV,
		files: {
			...INNGEST_SKILL("tanstack_start"),
			"src/inngest/client.ts": CLIENT,
			"src/inngest/functions.ts": FUNCTIONS,
			"src/lib/jobs.ts": JOBS,
			"src/lib/jobs.test.ts": JOBS_TEST,
			"src/routes/api/inngest.ts": `import { createFileRoute } from "@tanstack/react-router";
import { serve } from "inngest/edge";
import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

/**
 * There is no official Inngest adapter for TanStack Start, so this uses
 * \`inngest/edge\`'s framework-agnostic handler instead — it speaks plain
 * Fetch \`Request\`/\`Response\`, which is exactly what \`server.handlers\`
 * receives and returns here.
 */
const handler = serve({ client: inngest, functions });

export const Route = createFileRoute("/api/inngest")({
	server: {
		handlers: {
			GET: ({ request }) => handler(request),
			POST: ({ request }) => handler(request),
			PUT: ({ request }) => handler(request),
		},
	},
});
`,
		},
	};
}

/** The whole Inngest module, for the framework chosen. */
export function inngestJobsFragment(answers: StarterAnswers): Fragment {
	if (answers.framework === "nextjs") return nextFragment();

	return tanstackFragment();
}
