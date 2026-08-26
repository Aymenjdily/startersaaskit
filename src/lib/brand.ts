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
 * Where every call to action on the page sends people. The wizard lives behind
 * a sign-in, so both routes below are the product rather than the marketing
 * site. `sign-in.test.tsx` and `sign-up.test.tsx` each resolve their own href
 * against `src/routes/`, so neither can point at a page that is not served.
 */
export const SIGN_UP_HREF = "/sign-up";

export const SIGN_IN_HREF = "/sign-in";

/**
 * The wordmark: the name set as artwork. The navbar prints it at 40px and the
 * footer prints the same file across the full width of the page, so a swap has
 * to reach both — `Footer.test.tsx` checks the file is really in `public/`.
 */
export const LOGO_SRC = "/logo-trimmed.png";

/** Intrinsic size, so the footer reserves its box before the file arrives. */
export const LOGO_SIZE = { width: 2086, height: 607 };

/**
 * The mark alone, square, for places too narrow for the name.
 *
 * The console's rail is 56px. Scaling the 2086×607 wordmark down to fit made
 * the letters about three pixels tall — present, unreadable, and worse than no
 * logo at all. This is the same brand at a shape that survives the width.
 */
export const LOGO_MARK_SRC = "/logo-mark.png";

export const LOGO_MARK_SIZE = { width: 680, height: 680 };
