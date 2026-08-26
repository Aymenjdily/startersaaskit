import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * `createBrowserClient` rather than `supabase-js`'s `createClient`: it persists
 * the session to cookies instead of localStorage, and the server has to be able
 * to read it. A localStorage session is invisible to loaders, which would leave
 * every protected route unable to tell who is asking.
 */

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | undefined;

/**
 * Vite hands back whatever is right of the first `=`, so a line pasted as
 * `VITE_SUPABASE_URL=L=https://…` yields the literal `L=https://…` and a line
 * pasted as `KEY==sb_…` yields a value with a leading `=`. Both look correct in
 * an editor. supabase-js rejects the first with "Invalid supabaseUrl" and never
 * names the variable, and accepts the second only to fail later on a 401, so
 * the check happens here where the message can say which line to look at.
 */
export function readEnv(name: string, value: string | undefined): string {
	const trimmed = value?.trim();

	if (!trimmed) {
		throw new Error(
			`Supabase is not configured. Set ${name} in .env — see .env.example.`,
		);
	}
	if (trimmed.startsWith("=")) {
		throw new Error(
			`${name} starts with "=" — the line in .env probably has a doubled "=".`,
		);
	}
	return trimmed;
}

export function assertUrl(value: string): string {
	if (!/^https?:\/\//.test(value)) {
		throw new Error(
			`VITE_SUPABASE_URL must start with http:// or https://, but is "${value}". Check .env for a stray character before the URL.`,
		);
	}
	return value;
}

/**
 * Built on first use, not at import time. Reaching for it during module
 * evaluation would make a missing key crash the whole route on render, which
 * turns a misconfigured `.env` into a blank page rather than a message.
 */
export function getSupabase(): SupabaseClient {
	client ??= createBrowserClient(
		assertUrl(readEnv("VITE_SUPABASE_URL", url)),
		readEnv("VITE_SUPABASE_ANON_KEY", anonKey),
		{
			/**
			 * Off, deliberately. `createBrowserClient` otherwise defaults this to
			 * true in the browser, and the client starts its own PKCE exchange the
			 * instant it is constructed on a page carrying `?code=`. The callback
			 * route then runs a second exchange against a verifier the first one
			 * has already consumed and cleared, and the loser of that race reports
			 * "PKCE code verifier not found in storage" — which reads like a
			 * cookie problem and is really a double redemption.
			 *
			 * The callback route owns the exchange now, so it can report what
			 * actually went wrong instead of watching for a session that may never
			 * arrive.
			 */
			auth: { detectSessionInUrl: false },
		},
	);
	return client;
}
