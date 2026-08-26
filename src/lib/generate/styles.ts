/**
 * The stylesheet every starter begins with.
 *
 * In its own module, and that is not tidiness. It lived in `fragments.ts`,
 * `landing.ts` imported it to build a template's palette on top, and
 * `fragments.ts` imports `landing.ts` back — a cycle. Under ESM the loser of
 * that race sees the constant before it is initialised, so
 * `` `${BASE_STYLES}…` `` interpolated the string `"undefined"` into the top of
 * every themed stylesheet.
 *
 * The failure was invisible in the usual places: generation succeeded, the
 * files were non-empty, the project typechecked and `next build` reported
 * success. It only showed up as a page rendering unstyled, because the line
 * that got clobbered was `@import "tailwindcss"` — so Tailwind emitted nothing
 * and every class name in the project became decoration.
 *
 * A leaf module with no imports of its own cannot be in a cycle, which is the
 * whole reason this file exists.
 */
export const BASE_STYLES = `/**
 * Inter, actually loaded — and first in the file, which is not a style choice.
 *
 * A CSS \`@import\` is only honoured while nothing but other imports has come
 * before it. Placed under \`@import "tailwindcss"\` it looked correct and was
 * silently dropped from the build, because that line expands into thousands of
 * rules before this one is reached. Zero occurrences of "googleapis" in the
 * compiled stylesheet was the only symptom.
 *
 * The stack named Inter long before anything fetched it, so every weight
 * resolved to whatever generic sans the machine had. Not a subtle difference:
 * it is the typeface the layout is measured against, and a light 32px pull
 * quote rendered at regular weight because no light face existed to use.
 *
 * Worth knowing if you go looking: \`document.fonts.check("300 32px Inter")\`
 * answers **true** in that situation. It reports whether the text can be drawn
 * with *some* font, not whether the family you named is available. Compare a
 * rendered width against a deliberately bogus family name instead.
 *
 * An \`@import\` rather than a \`<link>\` in the document head, because the head
 * is written three different ways by the three frameworks this template
 * supports and the stylesheet is the one file all of them share.
 *
 * The cost is a request that cannot start until this file has parsed. Before
 * you launch, self-host the two files — or on Next, swap this for
 * \`next/font/google\`, which inlines the face and removes the round trip.
 */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap");
@import "tailwindcss";

:root {
	color-scheme: light dark;
}

* {
	box-sizing: border-box;
}

body {
	margin: 0;
	font-family:
		ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
`;
