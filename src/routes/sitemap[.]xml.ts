import { createFileRoute } from "@tanstack/react-router";
import { absolute } from "@/lib/seo";

/**
 * The crawlable pages, as XML.
 *
 * The list is short on purpose: everything not here is a private console page
 * marked `noindex`, and a sitemap that repeated them would only describe pages
 * a crawler is told not to keep. Auth pages are included — they are public and
 * are what a returning person searches for.
 *
 * The legal pages belong here too. A privacy policy is the page a Google OAuth
 * reviewer goes looking for, and one that is indexable but unlisted is a page
 * only somebody who already has the URL can find.
 *
 * `heads.test.ts` holds this list to the set of routes without `noIndex`, so
 * adding a public page and forgetting the sitemap fails rather than ships.
 */
const PATHS = ["/", "/sign-up", "/sign-in", "/privacy", "/terms"] as const;

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: () => {
				const urls = PATHS.map(
					(path) => `\t<url>\n\t\t<loc>${absolute(path)}</loc>\n\t</url>`,
				).join("\n");

				return new Response(
					`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
					{
						headers: {
							"Content-Type": "application/xml; charset=utf-8",
							"Cache-Control": "public, max-age=86400",
						},
					},
				);
			},
		},
	},
});
