import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertUrl, readEnv } from "./supabase";

/**
 * A Supabase client for request handlers, reading the session out of cookies.
 *
 * This only works because the browser client stores its session in cookies
 * rather than localStorage — that choice was made at sign-in precisely so the
 * server could answer "who is asking?" without the client telling it.
 *
 * The user id is never taken from the request body. A caller can put any id
 * they like in a JSON payload; only the cookie is evidence.
 *
 * Nothing is written back here. These handlers read the session and act on it;
 * refreshing tokens is the browser's job, so `setAll` is deliberately a no-op
 * rather than a half-implemented cookie writer.
 */
export function getServerSupabase(request: Request): SupabaseClient {
	const header = request.headers.get("cookie") ?? "";

	return createServerClient(
		assertUrl(readEnv("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL)),
		readEnv("VITE_SUPABASE_ANON_KEY", import.meta.env.VITE_SUPABASE_ANON_KEY),
		{
			cookies: {
				getAll: () =>
					parseCookieHeader(header).map((cookie) => ({
						name: cookie.name,
						value: cookie.value ?? "",
					})),
				setAll: () => {},
			},
		},
	);
}
