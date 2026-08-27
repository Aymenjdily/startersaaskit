import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";

/**
 * The crawler's entry rules.
 *
 * A route rather than a file in `public/` so the sitemap location comes from
 * the same `SITE_URL` that builds the canonical and Open Graph URLs — a domain
 * change is one constant, and robots.txt can never point at the old one.
 *
 * Everything behind the sign-in is disallowed rather than merely unlisted:
 * those pages carry `noindex`, and keeping a crawler out entirely saves it
 * from fetching a shell it was never going to index.
 */
export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () =>
				new Response(
					[
						"User-agent: *",
						"Allow: /",
						"Disallow: /dashboard",
						"Disallow: /starters",
						"Disallow: /settings",
						"Disallow: /generate",
						"Disallow: /onboarding",
						"Disallow: /admin",
						"Disallow: /api/",
						"",
						`Sitemap: ${SITE_URL}/sitemap.xml`,
						"",
					].join("\n"),
					{
						headers: {
							"Content-Type": "text/plain; charset=utf-8",
							"Cache-Control": "public, max-age=86400",
						},
					},
				),
		},
	},
});
