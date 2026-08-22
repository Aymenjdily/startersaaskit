/**
 * Who this product says it is: the name, the logo, and the repo behind both.
 *
 * The name used to be typed out at every callsite, and it drifted — the page
 * called itself one thing while the logo in the navbar plainly read another.
 * There is one spelling here now, so the two cannot disagree again.
 *
 * The URL is still a placeholder. When the repo gets its real home, this is the
 * only line that changes.
 */

export const BRAND = "StarterSaaSKit";

export const REPO_URL = "https://github.com/startersaaskit/startersaaskit";

export const README_URL = `${REPO_URL}#readme`;

/** The directory a clone drops you into, which is the repo's last segment. */
export const REPO_SLUG = REPO_URL.slice(REPO_URL.lastIndexOf("/") + 1);

/**
 * The one logo, at its one path. The navbar prints it at 40px and the footer
 * prints the same file across the full width of the page, so a swap has to
 * reach both — `Footer.test.tsx` checks the file is really in `public/`.
 */
export const LOGO_SRC = "/logo-trimmed.png";

/** Intrinsic size, so the footer reserves its box before the file arrives. */
export const LOGO_SIZE = { width: 2086, height: 607 };
