import { createFileRoute } from "@tanstack/react-router";
import { buildStarter } from "@/lib/generate/build-starter";
import { zipStarter } from "@/lib/generate/zip";
import { QUOTA_EXHAUSTED_MESSAGE } from "@/lib/quota";
import {
	answerProblems,
	backfillAnswers,
	isStarterComplete,
	pruneAnswers,
	type StarterAnswers,
} from "@/lib/starter-questions";
import { getServerSupabase } from "@/lib/supabase.server";

/**
 * Builds a starter and hands it back as a zip.
 *
 * Everything the browser sent is treated as a suggestion. The answers are
 * pruned and re-checked here with the same pure functions the wizard uses, and
 * the account comes from the session cookie rather than the payload — a request
 * can claim any user id it likes, and only the cookie is evidence.
 */
export const Route = createFileRoute("/api/generate")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const supabase = getServerSupabase(request);
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) return problem(401, "You need to be signed in.");

				let submitted: unknown;
				try {
					submitted = await request.json();
				} catch {
					return problem(400, "That request body was not JSON.");
				}

				const body = submitted as {
					answers?: StarterAnswers;
					starterId?: string;
				};

				/**
				 * Two verbs, not one. A `starterId` downloads something already
				 * generated, and the answers come from the row rather than the
				 * request — so re-downloading cannot quietly change the stack. A set
				 * of `answers` *creates* a starter and answers with the record.
				 *
				 * Creating no longer returns the zip. Handing someone a file the
				 * instant they finish the wizard skips the page that explains what to
				 * do with it, and makes the download the end of the flow rather than
				 * the start of using the thing.
				 */
				let existing = false;
				let source = body?.answers ?? {};

				if (body?.starterId) {
					const { data, error: lookupFailed } = await supabase
						.from("starters")
						.select("answers")
						.eq("id", body.starterId)
						.maybeSingle();

					/* RLS scopes this to the owner, so "not found" covers both a
					   missing row and someone else's. */
					if (lookupFailed || !data) return problem(404, "No such starter.");

					existing = true;
					/* Same reading-forward as the console list: this row may predate
					   a question, which must not stop someone re-downloading it. */
					source = backfillAnswers(data.answers as StarterAnswers);
				}

				/* Pruning first means a payload carrying an impossible pairing —
				   Supabase Auth with Neon, say — fails as incomplete rather than
				   generating a project that could never build. */
				const answers = pruneAnswers(source);

				if (!isStarterComplete(answers)) {
					/* Named, not merely refused: the usual cause is a stored record
					   meeting a rule that was added after it was written, and the
					   reader can only act on being told which answer. */
					return problem(
						422,
						[
							"Those answers do not describe a complete starter.",
							...answerProblems(answers).map((p) => p.problem),
						].join(" "),
					);
				}

				/* Built on both paths, and on create the bytes are discarded.
				   That is deliberate: a record is only written for something that
				   actually builds, so the list can never show a starter that cannot
				   be delivered. */
				let zip: Uint8Array;
				try {
					const name = answers.project as string;
					zip = zipStarter(name, buildStarter(answers));
				} catch (thrown) {
					return problem(
						422,
						thrown instanceof Error ? thrown.message : "Could not build that.",
					);
				}

				/**
				 * Creating: record it, and answer with the row so the console can
				 * send the reader to its page.
				 *
				 * Creation goes through `create_starter`, the function from
				 * 0004_generation_quota.sql — it spends one of the account's five
				 * generations and inserts the row in the same transaction, and it
				 * is the *only* way in: the direct insert policy is dropped in the
				 * same migration, so the quota cannot be sidestepped with a
				 * PostgREST call. Re-downloads come here with a `starterId` and
				 * never touch this branch, so re-fetching your own zip is free.
				 *
				 * The failure is returned rather than logged: without a record
				 * there is nothing to navigate to, so swallowing it would strand
				 * them on a finished wizard with nothing to show for it.
				 */
				if (!existing) {
					const { data: created, error: recordFailed } = await supabase.rpc(
						"create_starter",
						{ p_answers: answers, p_project: answers.project },
					);

					if (recordFailed) {
						/* The quota refusal is the one the reader can act on, so it is
					   the one that gets its own status rather than a generic 500. */
						if (recordFailed.message.includes(QUOTA_EXHAUSTED_MESSAGE)) {
							return problem(
								429,
								"You have used all five generations. Delete nothing — the counter does not reset — and contact us if you need more.",
							);
						}

						/**
						 * Say what actually went wrong, somewhere.
						 *
						 * This returned "could not save the record" and dropped the
						 * Postgres error on the floor, which is the same 500 whether the
						 * function is missing, the schema has drifted, or a constraint
						 * fired. Diagnosing one meant impersonating a user in the SQL
						 * editor to make the database say it out loud.
						 *
						 * The full error goes to the server log, where the operator can
						 * read it and the visitor cannot. The `code` alone rides back on
						 * the response — `PGRST202`, `42702` and friends name the fault
						 * precisely enough to act on while describing nothing about the
						 * schema that a reader could not already infer.
						 */
						console.error("create_starter failed", {
							code: recordFailed.code,
							details: recordFailed.details,
							hint: recordFailed.hint,
							message: recordFailed.message,
						});

						return problem(
							500,
							`Built it, but could not save the record.${
								recordFailed.code
									? ` (database error ${recordFailed.code})`
									: ""
							}`,
						);
					}

					const row = Array.isArray(created) ? created[0] : created;
					if (!row) {
						return problem(500, "Built it, but could not save the record.");
					}

					return new Response(JSON.stringify(row), {
						status: 201,
						headers: {
							"Content-Type": "application/json",
							"Cache-Control": "no-store",
						},
					});
				}

				return new Response(zip as unknown as BodyInit, {
					headers: {
						"Content-Type": "application/zip",
						/* The name is `^[a-z0-9][a-z0-9-]*$`, enforced twice before
						   reaching here, so it cannot break out of the quotes or
						   inject a header line. */
						"Content-Disposition": `attachment; filename="${answers.project}.zip"`,
						"Content-Length": String(zip.byteLength),
						"Cache-Control": "no-store",
					},
				});
			},
		},
	},
});

/** A refusal the client can show verbatim. */
function problem(status: number, message: string): Response {
	return new Response(JSON.stringify({ message }), {
		status,
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-store",
		},
	});
}
