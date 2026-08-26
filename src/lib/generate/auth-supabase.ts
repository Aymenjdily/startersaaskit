import type { StarterAnswers } from "@/lib/starter-questions";
import type { Fragment } from "./fragments";

/**
 * Supabase Auth, wired end to end.
 *
 * The same bar as Better Auth: after generating, the only thing between the
 * reader and a working sign-in is filling in `.env`.
 *
 * Two things make this different from a self-hosted provider, and both shape
 * the files below:
 *
 * **Supabase owns the users.** They live in its `auth.users` table, not yours,
 * so there is no schema to generate and nothing to migrate. Your own tables
 * reference the id and nothing else.
 *
 * **The session lives in cookies, and they expire.** `@supabase/ssr` needs a
 * client on each side — browser and server — and something has to refresh the
 * token before pages render. In Next that is middleware; in TanStack Start the
 * server client refreshes on read. Skipping it produces the bug where everyone
 * is signed out after an hour and nobody can say why.
 */

const SIGN_IN_FORM = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Sign in with an email and a password.
 *
 * Supabase reports a wrong password and an unknown address with the same
 * message on purpose — telling them apart turns this form into a way to
 * discover which addresses have accounts. Its wording is passed through.
 */
export function SignInForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		const { error: failed } = await authClient.auth.signInWithPassword({
			email,
			password,
		});

		if (failed) {
			setError(failed.message);
			setPending(false);
			return;
		}
		/* A full navigation, not a router push: the server has to re-read the
		   cookie the sign-in just set. */
		window.location.assign("/dashboard");
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={submit}>
			<label className="flex flex-col gap-1 text-sm">
				Email
				<input
					autoComplete="email"
					className="h-10 rounded-md border px-3"
					onChange={(event) => setEmail(event.target.value)}
					required
					type="email"
					value={email}
				/>
			</label>

			<label className="flex flex-col gap-1 text-sm">
				Password
				<input
					autoComplete="current-password"
					className="h-10 rounded-md border px-3"
					onChange={(event) => setPassword(event.target.value)}
					required
					type="password"
					value={password}
				/>
			</label>

			{error && (
				<p className="text-red-600 text-sm" role="alert">
					{error}
				</p>
			)}

			<Button disabled={pending} type="submit">
				{pending ? "Signing in…" : "Sign in"}
			</Button>
		</form>
	);
}
`;

const SIGN_UP_FORM = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignUpForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);
	const [pending, setPending] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		const { data, error: failed } = await authClient.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: \`\${window.location.origin}/auth/callback\`,
			},
		});

		if (failed) {
			setError(failed.message);
			setPending(false);
			return;
		}

		/**
		 * With email confirmation on, Supabase returns a user and no session —
		 * and returns exactly that for an address that already has an account,
		 * deliberately, so this form cannot be used to find out who has one.
		 * Both land here, which is the point.
		 */
		if (!data.session) {
			setSent(true);
			setPending(false);
			return;
		}
		window.location.assign("/dashboard");
	}

	if (sent) {
		return (
			<p className="text-sm">
				If that address can be signed up, a confirmation link is on its way to{" "}
				<strong>{email}</strong>. Open it and you are in.
			</p>
		);
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={submit}>
			<label className="flex flex-col gap-1 text-sm">
				Email
				<input
					autoComplete="email"
					className="h-10 rounded-md border px-3"
					onChange={(event) => setEmail(event.target.value)}
					required
					type="email"
					value={email}
				/>
			</label>

			<label className="flex flex-col gap-1 text-sm">
				Password
				<input
					autoComplete="new-password"
					className="h-10 rounded-md border px-3"
					minLength={8}
					onChange={(event) => setPassword(event.target.value)}
					required
					type="password"
					value={password}
				/>
			</label>

			{error && (
				<p className="text-red-600 text-sm" role="alert">
					{error}
				</p>
			)}

			<Button disabled={pending} type="submit">
				{pending ? "Creating…" : "Create account"}
			</Button>
		</form>
	);
}
`;

const SIGN_OUT_BUTTON = `"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
	return (
		<Button
			onClick={async () => {
				await authClient.auth.signOut();
				window.location.assign("/");
			}}
		>
			Sign out
		</Button>
	);
}
`;

const AUTH_TEST = `import { describe, expect, it } from "vitest";
import { createAuthServerClient } from "./auth.js";

/**
 * Auth is one module, and this is its contract. Whatever provider sits behind
 * it, the rest of the app only reaches auth through here — so this is what
 * makes swapping providers a one-file change rather than a search.
 */
describe("auth", () => {
	it("builds a server client from a cookie store", () => {
		const client = createAuthServerClient({
			getAll: () => [],
			setAll: () => {},
		});

		expect(client.auth).toBeDefined();
		expect(typeof client.auth.getUser).toBe("function");
	});
});
`;

const AUTH_CLIENT_TEST = `import { describe, expect, it } from "vitest";
import { authClient } from "./auth-client.js";

/**
 * The surface the forms in \`src/components/auth\` call. A client missing one
 * of these fails at the click rather than at import, which is the worst place
 * to find out.
 */
describe("authClient", () => {
	it("offers the calls the sign-in and sign-up forms make", () => {
		expect(typeof authClient.auth.signInWithPassword).toBe("function");
		expect(typeof authClient.auth.signUp).toBe("function");
		expect(typeof authClient.auth.signOut).toBe("function");
	});
});
`;

/** The whole Supabase Auth module, for the framework chosen. */
export function supabaseAuthFragment(answers: StarterAnswers): Fragment {
	const next = answers.framework === "nextjs";

	if (answers.framework === "react_vite") return spaFragment();

	const files: Record<string, string> = {
		"src/lib/auth.ts": `import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/public-env";

/**
 * Authentication, configured once.
 *
 * Supabase needs a client per side: this builds the *server* one, and
 * \`src/lib/auth-client.ts\` holds the browser one. Both are given the same
 * publishable key — the difference is where they read and write cookies.
 *
 * It takes a cookie store rather than reaching for one, because the way to get
 * cookies differs between a request handler, middleware and a page. Callers
 * supply it; this file stays framework-agnostic.
 */
export type CookieStore = {
	getAll: () => { name: string; value: string }[];
	setAll: (
		cookies: { name: string; value: string; options?: object }[],
	) => void;
};

export function createAuthServerClient(cookies: CookieStore) {
	return createServerClient(publicEnv.SUPABASE_URL, publicEnv.SUPABASE_ANON_KEY, {
		cookies,
	});
}
`,
		"src/lib/auth.test.ts": AUTH_TEST,
		"src/lib/auth-client.ts": `import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/public-env";

/**
 * The browser half.
 *
 * \`createBrowserClient\` stores the session in cookies rather than
 * localStorage, which is the only reason the server can read it at all — a
 * localStorage session is invisible to \`src/server/session.ts\`.
 *
 * It holds the publishable key, which is meant to be public. Row level
 * security is what protects the data, not the secrecy of this value.
 */
export const authClient = createBrowserClient(
	publicEnv.SUPABASE_URL,
	publicEnv.SUPABASE_ANON_KEY,
);
`,
		"src/lib/auth-client.test.ts": AUTH_CLIENT_TEST,
		"src/components/auth/sign-in-form.tsx": SIGN_IN_FORM,
		"src/components/auth/sign-up-form.tsx": SIGN_UP_FORM,
		"src/components/auth/sign-out-button.tsx": SIGN_OUT_BUTTON,
	};

	if (next) {
		files["src/server/session.ts"] = `import "server-only";
import { cookies } from "next/headers";
import { createAuthServerClient } from "@/lib/auth";

/**
 * Server-only helpers.
 *
 * The \`server-only\` import is a build-time tripwire: pulling anything from
 * this folder into a client component fails the build rather than shipping
 * secrets to the browser.
 */

export type SessionUser = {
	id: string;
	email: string;
};

/**
 * The signed-in user, or null.
 *
 * \`getUser()\` rather than \`getSession()\`: the session is read from a cookie
 * the browser sent, so it is only as trustworthy as the browser. \`getUser()\`
 * verifies the token with Supabase before answering.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const store = await cookies();
	const supabase = createAuthServerClient({
		getAll: () => store.getAll(),
		/* A Server Component cannot set cookies. Refreshing is the middleware's
		   job, so this is deliberately a no-op rather than a thrown error. */
		setAll: () => {},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) return null;

	return { id: user.id, email: user.email };
}
`;
		files["src/middleware.ts"] =
			`import { type NextRequest, NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/auth";

/**
 * Refreshes the Supabase session on every request.
 *
 * Access tokens are short-lived. A Server Component cannot write cookies, so
 * without this the refreshed token has nowhere to go and everyone is signed
 * out roughly an hour after signing in — the classic Supabase SSR bug, and one
 * that looks like a mystery because nothing errors.
 */
export async function middleware(request: NextRequest) {
	let response = NextResponse.next({ request });

	const supabase = createAuthServerClient({
		getAll: () => request.cookies.getAll(),
		setAll: (cookies) => {
			for (const { name, value } of cookies) {
				request.cookies.set(name, value);
			}
			response = NextResponse.next({ request });
			for (const { name, value, options } of cookies) {
				response.cookies.set(name, value, options);
			}
		},
	});

	/* The call is the point: it refreshes the token as a side effect. */
	await supabase.auth.getUser();

	return response;
}

export const config = {
	/* Everything except static assets, which never need a session. */
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
`;
		files["src/app/auth/callback/route.ts"] =
			`import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAuthServerClient } from "@/lib/auth";

/**
 * Where Supabase hands the reader back, after a confirmation email or an OAuth
 * provider. The \`code\` is worth nothing until it is traded for a session, and
 * without this route the links in those emails are a dead end.
 */
export async function GET(request: Request) {
	const { searchParams, origin } = new URL(request.url);
	const code = searchParams.get("code");

	if (!code) {
		return NextResponse.redirect(\`\${origin}/sign-in?error=missing_code\`);
	}

	const store = await cookies();
	const supabase = createAuthServerClient({
		getAll: () => store.getAll(),
		setAll: (list) => {
			for (const { name, value, options } of list) {
				store.set(name, value, options);
			}
		},
	});

	const { error } = await supabase.auth.exchangeCodeForSession(code);

	if (error) {
		return NextResponse.redirect(\`\${origin}/sign-in?error=exchange_failed\`);
	}
	return NextResponse.redirect(\`\${origin}/dashboard\`);
}
`;
		files["src/app/(auth)/sign-in/page.tsx"] = `import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { currentUser } from "@/server/session";

export default async function SignInPage() {
	/* Already signed in: a sign-in form is a dead end. */
	if (await currentUser()) redirect("/dashboard");

	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Sign in</h1>
			<SignInForm />
			<p className="text-neutral-500 text-sm">
				No account? <Link className="underline" href="/sign-up">Create one</Link>
			</p>
		</main>
	);
}
`;
		files["src/app/(auth)/sign-up/page.tsx"] = `import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { currentUser } from "@/server/session";

export default async function SignUpPage() {
	if (await currentUser()) redirect("/dashboard");

	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Create your account</h1>
			<SignUpForm />
			<p className="text-neutral-500 text-sm">
				Already have one? <Link className="underline" href="/sign-in">Sign in</Link>
			</p>
		</main>
	);
}
`;
		files["src/app/(app)/layout.tsx"] =
			`import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { currentUser } from "@/server/session";

/**
 * The signed-in half of the app. Everything under \`(app)\` is behind this, so
 * the check lives in one place rather than at the top of every page.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
	const user = await currentUser();

	if (!user) redirect("/sign-in");

	return <div className="min-h-screen">{children}</div>;
}
`;
		files["src/app/(app)/dashboard/page.tsx"] =
			`import { SignOutButton } from "@/components/auth/sign-out-button";
import { currentUser } from "@/server/session";

export default async function Dashboard() {
	/* Non-null: the layout above redirects anyone without a session. */
	const user = await currentUser();

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-12">
			<div>
				<h1 className="font-semibold text-2xl">Dashboard</h1>
				<p className="mt-1 text-neutral-500">Signed in as {user?.email}</p>
			</div>
			<div>
				<SignOutButton />
			</div>
		</main>
	);
}
`;
	} else {
		files["src/server/session.ts"] = `import "server-only";
import { getCookies } from "@tanstack/react-start/server";
import { createAuthServerClient } from "@/lib/auth";

export type SessionUser = {
	id: string;
	email: string;
};

/**
 * The signed-in user, or null.
 *
 * \`getUser()\` rather than \`getSession()\`: the session is read from a cookie
 * the browser sent, so it is only as trustworthy as the browser. \`getUser()\`
 * verifies the token with Supabase before answering.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const supabase = createAuthServerClient({
		getAll: () =>
			Object.entries(getCookies()).map(([name, value]) => ({ name, value })),
		/* Refreshing writes cookies, which a loader cannot do. The browser
		   client refreshes its own token, so reads here stay read-only. */
		setAll: () => {},
	});

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user?.email) return null;

	return { id: user.id, email: user.email };
}
`;
		files["src/routes/auth.callback.tsx"] =
			`import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/callback")({
	component: AuthCallback,
});

/**
 * Where Supabase hands the reader back, after a confirmation email or an OAuth
 * provider. The exchange runs in the browser because the client that started
 * the flow holds the matching verifier, and only it can complete the trade.
 */
function AuthCallback() {
	useEffect(() => {
		const code = new URLSearchParams(window.location.search).get("code");

		if (!code) {
			window.location.replace("/sign-in?error=missing_code");
			return;
		}

		authClient.auth.exchangeCodeForSession(code).then(({ error }) => {
			window.location.replace(error ? "/sign-in?error=exchange_failed" : "/dashboard");
		});
	}, []);

	return <main className="p-12 text-sm">Signing you in…</main>;
}
`;
		files["src/routes/sign-in.tsx"] =
			`import { createFileRoute, Link } from "@tanstack/react-router";
import { SignInForm } from "@/components/auth/sign-in-form";

export const Route = createFileRoute("/sign-in")({ component: SignInPage });

function SignInPage() {
	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Sign in</h1>
			<SignInForm />
			<p className="text-neutral-500 text-sm">
				No account? <Link className="underline" to="/sign-up">Create one</Link>
			</p>
		</main>
	);
}
`;
		files["src/routes/sign-up.tsx"] =
			`import { createFileRoute, Link } from "@tanstack/react-router";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const Route = createFileRoute("/sign-up")({ component: SignUpPage });

function SignUpPage() {
	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Create your account</h1>
			<SignUpForm />
			<p className="text-neutral-500 text-sm">
				Already have one? <Link className="underline" to="/sign-in">Sign in</Link>
			</p>
		</main>
	);
}
`;
		files["src/routes/_authed.tsx"] =
			`import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { currentUser } from "@/server/session";

/** Runs on the server, so \`src/server\` never reaches the browser bundle. */
const getUser = createServerFn().handler(() => currentUser());

/**
 * The signed-in half of the app.
 *
 * A pathless layout route: the leading underscore keeps it out of the URL, so
 * \`_authed/dashboard.tsx\` is served at \`/dashboard\`. Every route beneath it
 * inherits this check, which is why it lives here rather than at the top of
 * each page — the same job Next's \`(app)\` group does.
 */
export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const user = await getUser();
		if (!user) throw redirect({ to: "/sign-in" });
		return { user };
	},
	component: () => <Outlet />,
});
`;
		files["src/routes/_authed/dashboard.tsx"] =
			`import { createFileRoute } from "@tanstack/react-router";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const Route = createFileRoute("/_authed/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	/* Non-null: \`_authed\` redirects anyone without a session. */
	const { user } = Route.useRouteContext();

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-12">
			<div>
				<h1 className="font-semibold text-2xl">Dashboard</h1>
				<p className="mt-1 text-neutral-500">Signed in as {user.email}</p>
			</div>
			<div>
				<SignOutButton />
			</div>
		</main>
	);
}
`;
	}

	return {
		dependencies: {
			"@supabase/ssr": "^0.12.4",
			"@supabase/supabase-js": "^2.57.0",
		},
		/**
		 * Nothing new: Supabase as a database already declares these, and the
		 * option is only offered when Supabase *is* the database. Repeating them
		 * is harmless — `merge` keeps the first declaration — and it keeps this
		 * module honest about what it reads.
		 */
		publicEnv: [
			[
				"SUPABASE_URL",
				"Project URL, from Project Settings → API",
				"https://example.supabase.co",
			],
			[
				"SUPABASE_ANON_KEY",
				"Publishable key. Never the service-role key",
				"test-supabase-anon-key",
			],
		],
		files,
	};
}

/**
 * Supabase Auth in a browser-only app.
 *
 * Structurally simpler than the other two, and worth saying why rather than
 * leaving it looking unfinished: with a server there are two clients, and the
 * hard part is moving the session between them — cookies written by the
 * browser, read and refreshed by the server, on every request. With no server
 * there is one client, the session stays where it was created, and the whole
 * cookie apparatus has nothing to do.
 *
 * What is genuinely gone rather than simplified: nothing here can be trusted
 * by a backend, because there is no backend. Row level security on the
 * Supabase side is what enforces access. The route guard below is a
 * convenience for the person using the app, never a security boundary, and the
 * generated file says so where someone will actually read it.
 */
function spaFragment(): Fragment {
	return {
		dependencies: { "@supabase/supabase-js": "^2.57.0" },
		publicEnv: [
			[
				"SUPABASE_URL",
				"Project URL, from Project Settings → API",
				"https://example.supabase.co",
			],
			[
				"SUPABASE_ANON_KEY",
				"Publishable key. Never the service-role key",
				"test-supabase-anon-key",
			],
		],
		files: {
			"src/lib/auth.ts": `import { supabase } from "@/lib/supabase";

/**
 * Authentication, configured once.
 *
 * One client, because there is one place code runs. It is the same client
 * \`src/lib/supabase.ts\` exports, so a signed-in session and a data query
 * cannot drift apart.
 */
export const auth = supabase.auth;
`,
			"src/lib/auth.test.ts": `import { describe, expect, it } from "vitest";
import { auth } from "./auth.js";

describe("auth", () => {
	it("is configured and exported", () => {
		expect(auth).toBeDefined();
	});

	it("offers the calls the sign-in and sign-up forms make", () => {
		expect(typeof auth.signInWithPassword).toBe("function");
		expect(typeof auth.signUp).toBe("function");
		expect(typeof auth.signOut).toBe("function");
	});

	/** The hook subscribes to this; without it a session goes stale. */
	it("can be subscribed to for session changes", () => {
		expect(typeof auth.onAuthStateChange).toBe("function");
	});
});
`,
			"src/lib/use-session.ts": `import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";

export type SessionUser = { id: string; email: string };

/**
 * Who is signed in, as the browser sees it.
 *
 * \`loading\` is a third state on purpose. Rendering a signed-out view while the
 * first \`getSession\` is still in flight flashes the sign-in page at someone
 * who is already signed in, on every reload.
 *
 * The subscription matters as much as the first read: a session can end in
 * another tab, and without it this one would keep showing a signed-in shell
 * over calls that have already started failing.
 */
export function useSession() {
	const [user, setUser] = useState<SessionUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const toUser = (session: { user?: { id: string; email?: string } } | null) =>
			session?.user?.email
				? { id: session.user.id, email: session.user.email }
				: null;

		auth.getSession().then(({ data }) => {
			setUser(toUser(data.session));
			setLoading(false);
		});

		const { data } = auth.onAuthStateChange((_event, session) => {
			setUser(toUser(session));
			setLoading(false);
		});

		return () => data.subscription.unsubscribe();
	}, []);

	return { user, loading };
}
`,
			"src/lib/use-session.test.ts": `import { describe, expect, it } from "vitest";
import { useSession } from "./use-session.js";

/**
 * The hook needs a DOM and a running app to do anything, and this suite has
 * neither. What is asserted here is the shape the routes import.
 */
describe("useSession", () => {
	it("is exported as a hook", () => {
		expect(typeof useSession).toBe("function");
		expect(useSession.name).toBe("useSession");
	});
});
`,
			"src/components/auth/sign-in-form.tsx": SPA_SIGN_IN_FORM,
			"src/components/auth/sign-up-form.tsx": SPA_SIGN_UP_FORM,
			"src/components/auth/sign-out-button.tsx": `import { auth } from "@/lib/auth";

export function SignOutButton() {
	return (
		<button
			className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
			onClick={() => auth.signOut()}
			type="button"
		>
			Sign out
		</button>
	);
}
`,
			"src/routes/sign-in.tsx": `import { Link } from "react-router-dom";
import { SignInForm } from "@/components/auth/sign-in-form";

export function SignIn() {
	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Sign in</h1>
			<SignInForm />
			<p className="text-neutral-500 text-sm">
				No account? <Link className="underline" to="/sign-up">Create one</Link>
			</p>
		</main>
	);
}
`,
			"src/routes/sign-up.tsx": `import { Link } from "react-router-dom";
import { SignUpForm } from "@/components/auth/sign-up-form";

export function SignUp() {
	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Create your account</h1>
			<SignUpForm />
			<p className="text-neutral-500 text-sm">
				Already have one? <Link className="underline" to="/sign-in">Sign in</Link>
			</p>
		</main>
	);
}
`,
			"src/routes/dashboard.tsx": `import { Navigate } from "react-router-dom";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { useSession } from "@/lib/use-session";

/**
 * The signed-in page.
 *
 * The redirect below is a courtesy, not a lock. Anyone can edit the bundle
 * this check lives in, so the only thing actually protecting data is row level
 * security on the Supabase side. Write your policies as though this file did
 * not exist, because to an attacker it does not.
 */
export function Dashboard() {
	const { user, loading } = useSession();

	if (loading) {
		return <main className="p-12 text-sm">Checking your session…</main>;
	}
	if (!user) return <Navigate replace to="/sign-in" />;

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-12">
			<div>
				<h1 className="font-semibold text-2xl">Dashboard</h1>
				<p className="mt-1 text-neutral-500">Signed in as {user.email}</p>
			</div>
			<div>
				<SignOutButton />
			</div>
		</main>
	);
}
`,
			/* Replaces the framework fragment's router: these are the routes the
			   app has once authentication is part of it. */
			"src/routes/router.tsx": `import { createBrowserRouter } from "react-router-dom";
import { Dashboard } from "./dashboard";
import { Home } from "./home";
import { SignIn } from "./sign-in";
import { SignUp } from "./sign-up";

export const router = createBrowserRouter([
	{ path: "/", element: <Home /> },
	{ path: "/sign-in", element: <SignIn /> },
	{ path: "/sign-up", element: <SignUp /> },
	{ path: "/dashboard", element: <Dashboard /> },
]);
`,
		},
	};
}

const SPA_SIGN_IN_FORM = `import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/auth";

export function SignInForm() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setBusy(true);

		const form = new FormData(event.currentTarget);
		const { error: failed } = await auth.signInWithPassword({
			email: String(form.get("email")),
			password: String(form.get("password")),
		});

		setBusy(false);
		if (failed) {
			setError(failed.message);
			return;
		}
		navigate("/dashboard");
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={submit}>
			<label className="flex flex-col gap-1 text-sm">
				Email
				<input
					autoComplete="email"
					className="rounded-md border border-neutral-300 px-3 py-2"
					name="email"
					required
					type="email"
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Password
				<input
					autoComplete="current-password"
					className="rounded-md border border-neutral-300 px-3 py-2"
					name="password"
					required
					type="password"
				/>
			</label>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<button
				className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white"
				disabled={busy}
				type="submit"
			>
				{busy ? "Signing in…" : "Sign in"}
			</button>
		</form>
	);
}
`;

const SPA_SIGN_UP_FORM = `import { type FormEvent, useState } from "react";
import { auth } from "@/lib/auth";

export function SignUpForm() {
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setBusy(true);

		const form = new FormData(event.currentTarget);
		const { error: failed } = await auth.signUp({
			email: String(form.get("email")),
			password: String(form.get("password")),
			options: { emailRedirectTo: \`\${window.location.origin}/dashboard\` },
		});

		setBusy(false);
		if (failed) {
			setError(failed.message);
			return;
		}
		/* Not signed in yet, and saying so: with confirmations on, Supabase
		   returns a user with no session until the link is clicked. */
		setSent(true);
	}

	if (sent) {
		return <p className="text-sm">Check your email for a confirmation link.</p>;
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={submit}>
			<label className="flex flex-col gap-1 text-sm">
				Email
				<input
					autoComplete="email"
					className="rounded-md border border-neutral-300 px-3 py-2"
					name="email"
					required
					type="email"
				/>
			</label>
			<label className="flex flex-col gap-1 text-sm">
				Password
				<input
					autoComplete="new-password"
					className="rounded-md border border-neutral-300 px-3 py-2"
					minLength={8}
					name="password"
					required
					type="password"
				/>
			</label>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<button
				className="rounded-md bg-neutral-900 px-3 py-2 text-sm text-white"
				disabled={busy}
				type="submit"
			>
				{busy ? "Creating…" : "Create account"}
			</button>
		</form>
	);
}
`;
