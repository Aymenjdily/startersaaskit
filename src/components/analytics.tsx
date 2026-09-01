import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { capturePageview, initAnalytics } from "@/lib/analytics";

/**
 * Starts PostHog once and sends it a page view on every navigation.
 *
 * Rendered from the root shell rather than called at module scope, because it
 * has to run client-side only — `initAnalytics` reaches for `posthog.init`,
 * which touches `window`, and the root shell is what SSRs.
 *
 * `router.subscribe("onResolved", ...)` rather than PostHog's own automatic
 * pageview capture: this is a single-page app, and automatic capture has no
 * way to know a route changed without a full page load — it would count the
 * first page and nothing after it.
 */
export function Analytics() {
	const router = useRouter();

	useEffect(() => {
		initAnalytics();

		return router.subscribe("onResolved", (event) => {
			if (!event.pathChanged) return;
			capturePageview(`${window.location.origin}${event.toLocation.href}`);
		});
	}, [router]);

	return null;
}
