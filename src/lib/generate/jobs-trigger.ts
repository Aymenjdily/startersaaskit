import { claudeSkill } from "./claude-skill";
import type { Fragment } from "./fragments";

/**
 * Trigger.dev, wired end to end.
 *
 * The bar is the same as every other integration in this generator: after
 * generating, the only thing between the reader and a background job that
 * actually runs is filling in `.env` and starting `trigger dev` alongside
 * `npm run dev`.
 *
 * Unlike Inngest and QStash, nothing here mounts a route. Trigger.dev's own
 * infrastructure runs the task, reached through the CLI in development and
 * through `trigger deploy` in production — this app only ever *starts* a run
 * and returns, through `queueJob` in `src/lib/jobs.ts`.
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

export function triggerJobsFragment(_answers?: unknown): Fragment {
	return {
		dependencies: { "@trigger.dev/sdk": "^3.3.0" },
		env: [
			["TRIGGER_SECRET_KEY", "From the Trigger.dev dashboard → API keys"],
			[
				"TRIGGER_PROJECT_REF",
				"Project ref, e.g. proj_abcdefghijk",
				"proj_test0000000000000000",
			],
		],
		files: {
			...claudeSkill(
				"trigger",
				"Trigger.dev background jobs — tasks run on Trigger's own infrastructure, dispatched by id from this app. Use when adding or calling a background task.",
				`
## Tasks run elsewhere, not in this app's request lifecycle

A task defined with \`task()\` in \`src/trigger/\` does not execute inside this
app's server process. Trigger.dev's own infrastructure runs it, after this
app calls \`queueJob\`, which only *starts* a run and returns immediately —
there is no way to \`await\` a task's result inline, and nothing in this app
should be written as if there were. If a caller needs the outcome, that has
to happen out of band: a webhook, a poll against Trigger's API, or the task
itself writing to your database.

## \`queueJob\` dispatches by string id, deliberately

\`src/lib/jobs.ts\` calls \`tasks.trigger(name, payload)\` rather than
importing the task function directly. That runtime-id dispatch is what
keeps this app's own bundle from having to import every task's
implementation just to queue one — the files under \`src/trigger/\` are
picked up by Trigger's own build step (\`trigger dev\` / \`trigger deploy\`),
not bundled into this app.

## \`trigger.config.ts\` is what the CLI reads, not the app

It lives at the repository root, outside \`src/\`, beside the other
tool-owned config files (\`next.config.ts\`, \`vite.config.ts\`) — \`trigger
dev\` and \`trigger deploy\` read it directly. It reads \`TRIGGER_PROJECT_REF\`
from \`process.env\` rather than \`@/lib/env\`, which looks like it breaks
this project's "only \`env.ts\` reads \`process.env\`" rule; it does not,
because this file runs under the Trigger CLI and is never imported by the
app itself — the same exception \`vite.config.ts\` already makes for loading
\`.env\`.

## Running it locally

\`npx trigger.dev@latest dev\` has to run alongside \`npm run dev\`, in a
second terminal — it is what actually executes a task during local
development. Without it running, \`queueJob\` still resolves (the run is
accepted by Trigger's servers) but nothing processes it until a dev session
or a deployed worker is listening.
`,
			),
			"src/trigger/example.ts": `import { logger, task } from "@trigger.dev/sdk";

/**
 * One task, to show the shape. A new one is a new export from a file under
 * \`src/trigger/\` — the Trigger.dev CLI discovers them by scanning the
 * directory named in \`trigger.config.ts\`, not by an import list here.
 */
export const exampleTask = task({
	id: "example-task",
	run: async (payload: { message: string }) => {
		logger.log("Received payload", { payload });

		return { received: payload.message };
	},
});
`,
			"src/lib/jobs.ts": `import { tasks } from "@trigger.dev/sdk";

/**
 * Background jobs, configured once. Named for what it does rather than who
 * runs it, because the rest of the app cares about queueing work, not about
 * Trigger.dev.
 *
 * Dispatches by task id rather than importing the task itself: the
 * implementation lives in \`src/trigger/\` and runs on Trigger.dev's own
 * infrastructure, not in this app's process.
 */
export async function queueJob(
	name: string,
	payload: Record<string, unknown>,
): Promise<{ id: string }> {
	const handle = await tasks.trigger(name, payload);

	return { id: handle.id };
}
`,
			"src/lib/jobs.test.ts": JOBS_TEST,
			"trigger.config.ts": `import { defineConfig } from "@trigger.dev/sdk";

/**
 * Read by the Trigger.dev CLI (\`trigger dev\`, \`trigger deploy\`) directly,
 * outside this app's own request lifecycle — like \`vite.config.ts\`, it is
 * one of the few files allowed to read \`process.env\` directly rather than
 * through \`@/lib/env\`.
 */
export default defineConfig({
	project: process.env.TRIGGER_PROJECT_REF ?? "",
	dirs: ["./src/trigger"],
});
`,
		},
	};
}
