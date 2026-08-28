/**
 * Who this product says it is: the name, the logo, and the repo behind both.
 *
 * The name used to be typed out at every callsite, and it drifted — the page
 * called itself one thing while the logo in the navbar plainly read another.
 * There is one spelling here now, so the two cannot disagree again.
 *
 * The URL points at the product's public repo; when the repo moves, this is
 * the only line that changes.
 */

export const BRAND = "StarterSaaSKit";

export const REPO_URL = "https://github.com/Aymenjdily/startersaaskit";

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

/** The docs page — on-site, so the navbar keeps the reader in the product. */
export const DOCS_HREF = "/docs";

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

/**
 * The mark on its own, square and transparent, cut from `logo.png` at the
 * gutter that separates the tiger from the first letter of the name.
 *
 * `LOGO_MARK_SRC` above is the console rail's copy and carries its own baked-in
 * margin. This one is trimmed to the artwork's bounds, so it fills whatever box
 * it is given rather than floating in the middle of one.
 */
export const ICON_SRC = "/icon.png";

/**
 * The tab icons, and the one place the brand is not transparent.
 *
 * The mark is a white face with orange stripes. On a light tab strip a
 * transparent version loses the face entirely and leaves the stripes floating,
 * so these are baked onto `--color-base` — the same near-black the page sits
 * on — which holds up under either browser theme.
 *
 * Three files rather than one scaled down: browsers pick a size by display
 * density, and a 512px tiger resampled to 16 by the browser is a smudge.
 */
export const FAVICON_SIZES = [16, 32, 48] as const;

export const faviconSrc = (size: (typeof FAVICON_SIZES)[number]) =>
	`/favicon-${size}.png`;

/** Home-screen icon. iOS composites onto white, so this one is opaque too. */
export const APPLE_TOUCH_ICON_SRC = "/apple-touch-icon.png";
