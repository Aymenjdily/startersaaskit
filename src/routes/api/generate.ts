import { createFileRoute } from "@tanstack/react-router";
import { buildStarter } from "@/lib/generate/build-starter";
import { zipStarter } from "@/lib/generate/zip";
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
				 * The failure is returned rather than logged, which it was not when
				 * the zip went out alongside it — without a record there is now
				 * nothing to navigate to, so swallowing it would strand them on a
				 * finished wizard with nothing to show for it.
				 */
				if (!existing) {
					const { data: created, error: recordFailed } = await supabase
						.from("starters")
						.insert({
							user_id: user.id,
							answers,
							project: answers.project,
						})
						.select("id, project")
						.single();

					if (recordFailed || !created) {
						return problem(500, "Built it, but could not save the record.");
					}

					return new Response(JSON.stringify(created), {
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
