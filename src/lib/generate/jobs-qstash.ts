import type { StarterAnswers } from "@/lib/starter-questions";
import { claudeSkill } from "./claude-skill";
import type { Fragment } from "./fragments";

/**
 * QStash, wired end to end.
 *
 * QStash is the plainest of the three: there is no dashboard-run worker and
 * no dev server to keep alive locally. It is an HTTP message queue that calls
 * *this app's own URL* back with the payload, on Upstash's schedule — so
 * `.env`'s `APP_URL` has to be a URL QStash can actually reach, which rules
 * out a bare `localhost` in anything other than local testing with their CLI
 * tunnel or a public tunnel of your own.
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

const JOBS = `import { Client } from "@upstash/qstash";
import { env } from "@/lib/env";

const qstash = new Client({ token: env.QSTASH_TOKEN });

/**
 * Background jobs, configured once. Named for what it does rather than who
 * runs it, because the rest of the app cares about queueing work, not about
 * QStash.
 *
 * There is no worker process to run: QStash calls this app's own
 * \`/api/jobs/<name>\` route back with the payload, on its own schedule, which
 * is why \`APP_URL\` has to be a URL QStash can actually reach rather than a
 * bare \`localhost\`.
 */
export async function queueJob(
	name: string,
	payload: Record<string, unknown>,
): Promise<{ id: string }> {
	const { messageId } = await qstash.publishJSON({
		url: \`\${env.APP_URL}/api/jobs/\${name}\`,
		body: payload,
	});

	return { id: messageId };
}
`;

const JOB_HANDLERS = `/**
 * What runs when QStash calls a job back. Add a name here and it is
 * reachable at \`/api/jobs/<name>\` — the mounted route looks it up, nothing
 * else has to change.
 */
export const JOB_HANDLERS: Record<
	string,
	(payload: unknown) => Promise<void> | void
> = {
	"example-job": async (payload) => {
		console.log("Received example-job", payload);
	},
};
`;

const ENV: [string, string, string?][] = [
	["QSTASH_TOKEN", "From the Upstash console → QStash → your project"],
	[
		"QSTASH_CURRENT_SIGNING_KEY",
		"From the same page. Verifies a callback is really from QStash",
	],
	[
		"QSTASH_NEXT_SIGNING_KEY",
		"The key QStash rotates to next. Required alongside the current one",
	],
	[
		"APP_URL",
		"Where this app is reachable from the internet, e.g. https://app.example.com",
		"https://example.test",
	],
];

const SKILL = claudeSkill(
	"qstash",
	"Upstash QStash — an HTTP message queue that calls this app's own route back, and why signature verification is not optional. Use when adding or calling a background job.",
	`
## There is no worker. QStash calls *you* back

Unlike Trigger.dev and Inngest, nothing runs on Upstash's infrastructure
except the queue itself. \`queueJob\` in \`src/lib/jobs.ts\` publishes a
message with \`APP_URL\`+\`/api/jobs/<name>\` as the target, and QStash makes
an HTTP request to that URL when the job is due. That means:

- \`APP_URL\` must be an address QStash can actually reach over the public
  internet. A bare \`http://localhost:3000\` works for nothing except
  Upstash's own local development CLI or a tunnel (ngrok, Cloudflare
  Tunnel) pointed at it.
- Adding a job handler means adding to \`JOB_HANDLERS\` in
  \`src/lib/job-handlers.ts\`, keyed by the same name \`queueJob\` was called
  with — a name with no matching key 404s when QStash calls back, and
  QStash will retry it as a failure.

## The signature check is the entire trust boundary

The mounted route verifies every incoming request against
\`QSTASH_CURRENT_SIGNING_KEY\` (and \`QSTASH_NEXT_SIGNING_KEY\`, needed during
Upstash's own key rotation) before running a handler. Removing that check —
or handling the raw body before verification runs, the same ordering
mistake that breaks Stripe webhooks in this project — turns the route into
an unauthenticated endpoint that runs arbitrary handler code for anyone who
finds the URL. Never skip it, even to "just test quickly".

## Retries

QStash retries a callback that does not return a 2xx response, on a backoff
schedule configured on their side. A handler that throws is retried
automatically; a handler that already did its work and then throws on a
second, unrelated step will run that first part again. Write handlers to
tolerate being called more than once for the same message.
`,
);

function nextFragment(): Fragment {
	return {
		dependencies: { "@upstash/qstash": "^2.7.0" },
		env: ENV,
		files: {
			...SKILL,
			"src/lib/jobs.ts": JOBS,
			"src/lib/jobs.test.ts": JOBS_TEST,
			"src/lib/job-handlers.ts": JOB_HANDLERS,
			"src/app/api/jobs/[name]/route.ts": `import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { JOB_HANDLERS } from "@/lib/job-handlers";

/**
 * \`verifySignatureAppRouter\` checks the request against
 * \`QSTASH_CURRENT_SIGNING_KEY\` / \`QSTASH_NEXT_SIGNING_KEY\` before this body
 * ever runs — the whole reason a stranger cannot invoke a handler by
 * guessing this URL.
 */
async function handler(
	request: Request,
	{ params }: { params: Promise<{ name: string }> },
) {
	const { name } = await params;
	const run = JOB_HANDLERS[name];

	if (!run) {
		return Response.json({ error: \`No handler for "\${name}"\` }, { status: 404 });
	}

	await run(await request.json());

	return Response.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler);
`,
		},
	};
}

function tanstackFragment(): Fragment {
	return {
		dependencies: { "@upstash/qstash": "^2.7.0" },
		env: ENV,
		files: {
			...SKILL,
			"src/lib/jobs.ts": JOBS,
			"src/lib/jobs.test.ts": JOBS_TEST,
			"src/lib/job-handlers.ts": JOB_HANDLERS,
			"src/routes/api/jobs/$name.ts": `import { createFileRoute } from "@tanstack/react-router";
import { Receiver } from "@upstash/qstash";
import { env } from "@/lib/env";
import { JOB_HANDLERS } from "@/lib/job-handlers";

/**
 * There is no official QStash adapter for TanStack Start, so the signature
 * is verified directly with \`Receiver\` rather than a framework-specific
 * wrapper. This is the same check \`verifySignatureAppRouter\` performs for
 * Next.js — it just has to be spelled out here.
 */
const receiver = new Receiver({
	currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
	nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
});

export const Route = createFileRoute("/api/jobs/$name")({
	server: {
		handlers: {
			POST: async ({ request, params }) => {
				const body = await request.text();
				const signature = request.headers.get("upstash-signature") ?? "";
				const valid = await receiver.verify({ signature, body });

				if (!valid) return new Response("Invalid signature", { status: 401 });

				const run = JOB_HANDLERS[params.name];

				if (!run) {
					return Response.json(
						{ error: \`No handler for "\${params.name}"\` },
						{ status: 404 },
					);
				}

				await run(JSON.parse(body));

				return Response.json({ ok: true });
			},
		},
	},
});
`,
		},
	};
}

/** The whole QStash module, for the framework chosen. */
export function qstashJobsFragment(answers: StarterAnswers): Fragment {
	if (answers.framework === "nextjs") return nextFragment();

	return tanstackFragment();
}
