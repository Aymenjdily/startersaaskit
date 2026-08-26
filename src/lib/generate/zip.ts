import { strToU8, zipSync } from "fflate";
import type { StarterFiles } from "./build-starter";

/**
 * Packs a file map into a zip, under a single top-level directory.
 *
 * The directory matters: unzipping into the current folder and scattering
 * fifteen files across someone's Downloads is a rude thing to do, and every
 * tool that produces a project archive puts it in a folder for that reason.
 *
 * `zipSync` rather than the async form — the whole payload is a few dozen
 * kilobytes of text, so there is nothing to yield for, and a synchronous call
 * keeps the request handler trivial to reason about.
 */
/** The earliest date a zip entry can carry. */
const EPOCH = Date.UTC(1980, 0, 1);

export function zipStarter(root: string, files: StarterFiles): Uint8Array {
	const entries: Record<string, Uint8Array> = {};

	for (const [path, contents] of Object.entries(files)) {
		entries[`${root}/${path}`] = strToU8(contents);
	}

	/* A fixed timestamp keeps the bytes identical between two runs of the same
	   answers, which is what makes the output testable at all. It is 1980 and
	   not the epoch because the zip format cannot represent a date before
	   1980 — fflate rejects it outright rather than rounding. */
	return zipSync(entries, { level: 6, mtime: EPOCH });
}
