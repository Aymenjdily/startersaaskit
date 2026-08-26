import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Whether the file router actually serves `href`.
 *
 * A link or an OAuth `redirectTo` that points at a route nobody wrote is a dead
 * end the type checker cannot see — the href is just a string. Asserting the
 * string alone would still pass after the route it names was renamed, which is
 * exactly the change that strands someone mid-sign-up, so this resolves it
 * against TanStack Router's naming convention on disk instead.
 */
export function isServedRoute(href: string): boolean {
	const base = href.replace(/^\//, "").split("/").join(".");

	/**
	 * Two spellings serve the same path. `starters.tsx` is a leaf route;
	 * `starters.index.tsx` is the index of a segment that also has children,
	 * which is what a route becomes the moment it gains a detail page. Knowing
	 * only the first made this report a live route as missing.
	 */
	return [`${base}.tsx`, `${base}.index.tsx`].some((file) =>
		existsSync(resolve(process.cwd(), "src/routes", file)),
	);
}
