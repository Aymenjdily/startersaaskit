import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AuthBackdrop } from "@/components/auth/auth-backdrop";
import { SIGN_IN_HREF } from "@/lib/brand";
import { ONBOARDING_HREF } from "@/lib/onboarding";
import { pageHead } from "@/lib/seo";
import { getSupabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
	/**
	 * A head on a page nobody reads, because a crawler might.
	 *
	 * This route exists for the few hundred milliseconds between a provider
	 * handing someone back and the redirect landing. Indexed, it would put a
	 * blank "Signing you in" page in search results under the product's name —
	 * and its URL carries the OAuth code, which is not a string that belongs in
	 * anybody's index.
	 */
	head: () =>
		pageHead({
			path: "/auth/callback",
			title: "Signing you in",
			description: "Completing sign-in.",
			noIndex: true,
		}),
	component: AuthCallback,
});

/**
 * Where the OAuth providers hand the reader back. Supabase returns a PKCE
 * `code`, which is worth nothing until it is traded for a session — without
 * this route the provider buttons are a redirect into a dead end.
 *
 * The exchange runs in the browser because the session is stored in cookies by
 * the same browser client that started the flow, and only it holds the
 * matching verifier. It runs exactly once: the verifier is single-use, so a
 * second attempt does not fail with "already used" but with "verifier not
 * found", because the first attempt cleared it on the way out.
 */
function AuthCallback() {
	const [error, setError] = useState<string | null>(null);
	const started = useRef(false);

	useEffect(() => {
		if (started.current) return;
		started.current = true;

		const params = new URLSearchParams(window.location.search);
		const code = params.get("code");

		/**
		 * A provider that refuses sends the reason here rather than a code —
		 * a declined consent screen is the common one. Reading `code` first
		 * would report it as a malformed link.
		 */
		const refusal = params.get("error_description") ?? params.get("error");

		if (refusal) {
			setError(refusal);
			return;
		}
		if (!code) {
			setError("This sign-in link is missing its code.");
			return;
		}

		const supabase = getSupabase();

		supabase.auth
			.exchangeCodeForSession(code)
			.then(async ({ error: failure }) => {
				/**
				 * Reloading this URL after a successful sign-in replays a spent
				 * code, which fails even though the reader is already signed in.
				 * The session is the thing that matters, so it decides.
				 */
				if (failure) {
					const { data } = await supabase.auth.getSession();

					if (!data.session) {
						setError(failure.message);
						return;
					}
				}
				window.location.replace(ONBOARDING_HREF);
			})
			.catch((thrown: unknown) =>
				setError(
					thrown instanceof Error ? thrown.message : "Could not sign you in.",
				),
			);
	}, []);

	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-base px-gutter text-center">
			<AuthBackdrop />

			{/* Static children would paint *under* the positioned backdrop, so the
			    whole message sits in its own positioned layer. */}
			<div className="relative z-10 flex flex-col items-center gap-4">
				{error ? (
					<>
						<p className="text-[14px] text-ink" role="alert">
							{error}
						</p>
						<a
							className="text-[13px] text-ink-muted underline underline-offset-4 hover:text-ink"
							href={SIGN_IN_HREF}
						>
							Back to sign in
						</a>
					</>
				) : (
					<p className="text-[14px] text-ink-muted">Signing you in…</p>
				)}
			</div>
		</main>
	);
}
