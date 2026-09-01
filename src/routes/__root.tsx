import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Analytics } from "@/components/analytics";
import { NotFound } from "@/components/not-found";
import { RouteError } from "@/components/route-error";
import {
	APPLE_TOUCH_ICON_SRC,
	BRAND,
	FAVICON_SIZES,
	faviconSrc,
} from "@/lib/brand";
import { DEFAULT_DESCRIPTION, OG_IMAGE_PATH, siteJsonLd } from "@/lib/seo";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: BRAND,
			},
			/**
			 * A default for anything that forgets to set one.
			 *
			 * Every route calls `pageHead`, which supplies its own — but a new
			 * route that does not would otherwise ship with no description at all,
			 * and a search result with no snippet is worse than a generic one.
			 */
			{
				name: "description",
				content: DEFAULT_DESCRIPTION,
			},
			/* Tells a crawler the site is deliberate about locale rather than
			   leaving it to guess from the copy. */
			{
				property: "og:locale",
				content: "en",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			/* One entry per file so the browser can pick by display density
			   rather than resample a large tiger down to 16px itself. */
			...FAVICON_SIZES.map((size) => ({
				rel: "icon",
				type: "image/png",
				sizes: `${size}x${size}`,
				href: faviconSrc(size),
			})),
			{
				rel: "apple-touch-icon",
				href: APPLE_TOUCH_ICON_SRC,
			},
			/* The card image, preconnected nowhere — it is same-origin. Declared
			   here so a crawler that ignores `og:image` still finds it. */
			{
				rel: "preload",
				as: "image",
				href: OG_IMAGE_PATH,
			},
		],
		scripts: [
			/**
			 * The organisation and product, as structured data.
			 *
			 * In the root rather than on the home route because a script tag is
			 * not part of the `meta` a route contributes, and duplicating it per
			 * page would give a crawler several descriptions of one entity.
			 */
			{
				type: "application/ld+json",
				children: siteJsonLd(),
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
	errorComponent: RouteError,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				<Analytics />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
