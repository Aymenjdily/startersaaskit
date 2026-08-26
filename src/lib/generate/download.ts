import type { StarterAnswers } from "@/lib/starter-questions";

export const GENERATE_ENDPOINT = "/api/generate";

/**
 * Asks the server for a starter and hands the file to the browser.
 *
 * `fetch` rather than submitting a form. A form POST would let the browser do
 * the download itself, but a 422 would then replace the page with the error
 * body — losing the answers someone just spent a minute giving. Fetching keeps
 * the failure inline and the dialog open.
 */
/**
 * Either a fresh set of answers, or the id of one already generated.
 *
 * Re-downloading by id takes the answers from the stored row, so an old
 * starter cannot quietly come back with a different stack, and no second
 * record is written for the same thing.
 */
export type StarterRequest =
	| { answers: StarterAnswers; starterId?: never }
	| { starterId: string; answers?: never };

/** What the endpoint answers with when a starter is created. */
export type CreatedStarter = { id: string; project: string };

/** Same call on both paths: same origin, same JSON, same refusals. */
async function post(request: StarterRequest): Promise<Response> {
	const response = await fetch(GENERATE_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		/* Same-origin credentials so the session cookie travels; without it the
		   endpoint cannot tell who is asking and refuses. */
		credentials: "same-origin",
		body: JSON.stringify(request),
	});

	if (!response.ok) throw new Error(await refusal(response));
	return response;
}

/**
 * Generates a starter and records it. Returns the row; sends no file.
 *
 * Creating and downloading are separate on purpose. The wizard used to hand
 * over a zip the moment it was finished, which put the file in someone's
 * Downloads folder before they had read a word about what to do with it — so
 * the guide, which is the actually useful part, was never seen.
 */
export async function createStarter(
	answers: StarterAnswers,
): Promise<CreatedStarter> {
	const response = await post({ answers });
	return (await response.json()) as CreatedStarter;
}

export async function downloadStarter(request: StarterRequest): Promise<void> {
	const response = await post(request);

	const blob = await response.blob();
	const url = URL.createObjectURL(blob);

	try {
		const link = document.createElement("a");
		link.href = url;
		/* The server names the file too, in Content-Disposition. This is the
		   fallback for a blob URL, which carries no name of its own. */
		link.download = `${request.answers?.project ?? "starter"}.zip`;
		/* Appended before clicking: a detached anchor is ignored by Firefox. */
		document.body.appendChild(link);
		link.click();
		link.remove();
	} finally {
		/* Revoked on a turn of the event loop, not immediately — Safari reads
		   the blob after the click returns, and revoking first cancels it. */
		setTimeout(() => URL.revokeObjectURL(url), 30_000);
	}
}

/** The server's own words where it gave any, rather than a status code. */
async function refusal(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as { message?: string };
		if (body?.message) return body.message;
	} catch {
		/* Not JSON — fall through to something generic. */
	}
	return `Could not generate that starter (${response.status}).`;
}
