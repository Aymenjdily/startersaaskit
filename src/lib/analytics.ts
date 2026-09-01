import posthog from "posthog-js";

/**
 * PostHog: product analytics and session recording, and the one place both
 * are turned on or off.
 *
 * Unlike Supabase, a missing key here must not break the app. Auth is core
 * functionality and `lib/supabase.ts` throws a clear error the moment it is
 * misconfigured — analytics is not, and every contributor running this
 * locally without a PostHog project of their own should get a silent no-op on
 * every call below, not a thrown error blocking every page.
 *
 * Session recording masks every input's value (`maskAllInputs`) rather than
 * relying on whatever the library defaults to this month — this product has
 * a password field, a free-text onboarding note, and a bug-report body, and
 * none of those belong in a replay verbatim. It still has to be turned on for
 * the project in the PostHog dashboard itself; the SDK config here is only
 * half of what decides whether a session is actually recorded.
 *
 * `respect_dnt` opts a browser out automatically if it has asked to be left
 * alone, on top of the manual opt-out in Settings (`setAnalyticsOptedOut`).
 */

const KEY = import.meta.env.VITE_POSTHOG_KEY;
const HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let started = false;

/** Whether there is a project to talk to at all. */
function configured(): boolean {
	return Boolean(KEY);
}

/** Starts PostHog once. Safe to call more than once — every call after the first is a no-op. */
export function initAnalytics(): void {
	if (started || !configured()) return;
	started = true;

	posthog.init(KEY, {
		api_host: HOST,
		/* Anonymous visitors to the marketing site do not become tracked
		   people until they sign in and `identifyAccount` runs — this is what
		   keeps that true on PostHog's side as well as ours. */
		person_profiles: "identified_only",
		/* The router sends these on every navigation instead — see
		   `capturePageview` — because PostHog's own automatic pageview capture
		   has no way to know this is a single-page app and would count only
		   the first load. */
		capture_pageview: false,
		respect_dnt: true,
		session_recording: {
			maskAllInputs: true,
		},
	});
}

/** One page view, for the router to call on every navigation. */
export function capturePageview(url: string): void {
	if (!configured()) return;
	posthog.capture("$pageview", { $current_url: url });
}

/** Ties every event from here on to the signed-in account, until `resetAnalytics` runs. */
export function identifyAccount(userId: string, email: string | null): void {
	if (!configured()) return;
	posthog.identify(userId, email ? { email } : undefined);
}

/** Ends the tie to whichever account was signed in — call this on sign-out. */
export function resetAnalytics(): void {
	if (!configured()) return;
	posthog.reset();
}

/**
 * The Settings toggle, both directions. PostHog remembers the choice itself
 * (in the same browser storage it already uses), so there is nothing for this
 * app to persist on top of it.
 */
export function setAnalyticsOptedOut(optedOut: boolean): void {
	if (!configured()) return;
	if (optedOut) posthog.opt_out_capturing();
	else posthog.opt_in_capturing();
}

/** Defaults to "opted out" when analytics is not configured at all — nothing is capturing either way, but the toggle should not claim otherwise. */
export function isAnalyticsOptedOut(): boolean {
	if (!configured()) return true;
	return posthog.has_opted_out_capturing();
}
