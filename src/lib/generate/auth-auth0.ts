import type { Fragment } from "./fragments";

/**
 * Auth0, wired end to end.
 *
 * Next only, and not by preference: `@auth0/nextjs-auth0` is the one Auth0 SDK
 * with a server session. Their other package is a browser-side SPA library, so
 * `currentUser()` on a server would have nothing to read — which is why the
 * wizard does not offer Auth0 beside the other two frameworks.
 *
 * ## Read off the installed package, not from memory
 *
 * Version 4 is a different library from version 3 wearing the same name, and
 * anything remembered about it is probably wrong:
 *
 * - v3 exported `handleAuth()` and you mounted `app/api/auth/[...auth0]`.
 *   v4 has **no route file at all** — `auth0.middleware(request)` serves
 *   `/auth/login`, `/auth/logout`, `/auth/callback` and `/auth/profile`
 *   itself. Those paths were read out of the shipped `client.js`.
 * - v3 read `AUTH0_BASE_URL` and `AUTH0_ISSUER_BASE_URL`. v4 reads
 *   `APP_BASE_URL` and `AUTH0_DOMAIN`, plus `AUTH0_SECRET` for cookie
 *   encryption — all four confirmed in `client.d.ts`.
 * - `getSession()` is a method on an `Auth0Client` instance, not a free
 *   function.
 *
 * Getting any of those wrong produces a project that builds and then 404s on
 * the first sign-in, which is the failure mode this generator exists to avoid.
 */

/**
 * The five variables Auth0 v4 reads, under the names it reads them.
 *
 * None is public. Auth0's browser side talks to the app's own `/auth/*`
 * routes rather than to Auth0 directly, so nothing here reaches the bundle —
 * which is also why this provider cannot work without a server.
 */
const ENV: [string, string, string?][] = [
	[
		"AUTH0_DOMAIN",
		"Your tenant domain, e.g. example.eu.auth0.com",
		"example.eu.auth0.com",
	],
	["AUTH0_CLIENT_ID", "Application client id, from the Auth0 dashboard"],
	["AUTH0_CLIENT_SECRET", "Application client secret. Server only"],
	[
		"AUTH0_SECRET",
		"32+ random bytes, encrypts the session cookie. `openssl rand -hex 32`",
		"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
	],
	[
		"APP_BASE_URL",
		"Where this app is reachable, e.g. http://localhost:3000",
		"http://localhost:3000",
	],
];

export function auth0Fragment(_answers?: unknown): Fragment {
	return {
		dependencies: { "@auth0/nextjs-auth0": "^4.27.0" },
		env: ENV,
		files: {
			"src/lib/auth.ts": `import { Auth0Client } from "@auth0/nextjs-auth0/server";

/**
 * Authentication, configured once.
 *
 * The client reads \`AUTH0_DOMAIN\`, \`AUTH0_CLIENT_ID\`,
 * \`AUTH0_CLIENT_SECRET\`, \`AUTH0_SECRET\` and \`APP_BASE_URL\` from the
 * environment under exactly those names, which is why they are declared in
 * \`.env.example\` unprefixed and read nowhere else.
 *
 * It is constructed at module scope on purpose: the instance holds the session
 * store and the discovery cache, and building one per request would refetch
 * the tenant's OpenID configuration every time.
 */
export const auth0 = new Auth0Client();
`,
			"src/lib/auth.test.ts": `import { describe, expect, it } from "vitest";
import { auth0 } from "./auth.js";

describe("auth0", () => {
	it("is configured and exported", () => {
		expect(auth0).toBeDefined();
	});

	/** The middleware mounts the routes; without it nothing signs in. */
	it("exposes the middleware the request pipeline mounts", () => {
		expect(typeof auth0.middleware).toBe("function");
	});

	it("exposes the session lookup the server helper calls", () => {
		expect(typeof auth0.getSession).toBe("function");
	});
});
`,
			"src/middleware.ts": `import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth";

/**
 * Auth0's routes, and the only place they exist.
 *
 * There is no \`app/api/auth/...\` route file in version 4 — the middleware
 * *is* the handler. It serves:
 *
 *     /auth/login     starts the login flow
 *     /auth/logout    clears the session and returns to the app
 *     /auth/callback  where Auth0 sends the reader back
 *     /auth/profile   the session as JSON
 *
 * Anything else passes straight through, so this runs on every matched
 * request and costs a cookie read.
 */
export async function middleware(request: NextRequest) {
	return auth0.middleware(request);
}

export const config = {
	/* Skips Next internals and static files. \`/auth/*\` must stay matched —
	   excluding it would remove the very routes this middleware exists to
	   serve, and sign-in would 404 with nothing in the logs. */
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
`,
			"src/server/session.ts": `import "server-only";
import { auth0 } from "@/lib/auth";

/**
 * Server-only helpers.
 *
 * The \`server-only\` import is a build-time tripwire: importing this from a
 * client component fails the build rather than shipping the client secret's
 * neighbourhood to a browser.
 */

export type SessionUser = {
	id: string;
	email: string;
	name: string;
};

/**
 * The signed-in user, or null.
 *
 * Everything that needs to know who is asking calls this, so swapping the
 * provider is one file rather than a search for session handling.
 *
 * \`sub\` is the id: it is the OpenID Connect claim for the subject, and the
 * only field guaranteed to be stable and unique across providers. \`email\` is
 * not — a tenant with social logins can return none.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const session = await auth0.getSession();

	if (!session?.user) return null;

	return {
		id: String(session.user.sub),
		email: String(session.user.email ?? ""),
		name: String(session.user.name ?? ""),
	};
}
`,
			/* Links rather than a form: the credentials are collected on Auth0's
			   own domain, which is the point of a hosted login page. */
			"src/components/auth/sign-in-form.tsx": `/**
 * Sign-in, which for Auth0 is a link rather than a form.
 *
 * The reader is sent to Auth0's hosted page, types their password there, and
 * comes back through \`/auth/callback\`. That is the design: the password never
 * touches this application, so this app can never leak it.
 *
 * A plain \`<a>\` and not a router link — the destination is served by
 * middleware, not by a route in this app, so a client-side navigation would
 * find nothing to render.
 */
export function SignInForm() {
	return (
		<a
			className="rounded-md bg-neutral-900 px-3 py-2 text-center text-sm text-white"
			href="/auth/login"
		>
			Continue with Auth0
		</a>
	);
}
`,
			"src/components/auth/sign-up-form.tsx": `/**
 * Sign-up sends the reader to the same hosted page with a hint that they want
 * to register. Auth0 shows the sign-up tab; the flow back is identical.
 */
export function SignUpForm() {
	return (
		<a
			className="rounded-md bg-neutral-900 px-3 py-2 text-center text-sm text-white"
			href="/auth/login?screen_hint=signup"
		>
			Create an account with Auth0
		</a>
	);
}
`,
			"src/components/auth/sign-out-button.tsx": `/**
 * Sign-out is a link for the same reason sign-in is: \`/auth/logout\` is served
 * by the middleware, and it has to clear the session cookie *and* end the
 * session at Auth0. Clearing the cookie alone would sign the reader straight
 * back in on the next login attempt.
 */
export function SignOutButton() {
	return (
		<a
			className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
			href="/auth/logout"
		>
			Sign out
		</a>
	);
}
`,
			"src/app/(auth)/sign-in/page.tsx": `import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Sign in</h1>
			<SignInForm />
		</main>
	);
}
`,
			"src/app/(auth)/sign-up/page.tsx": `import { SignUpForm } from "@/components/auth/sign-up-form";

export default function SignUpPage() {
	return (
		<main className="mx-auto flex max-w-sm flex-col gap-6 p-12">
			<h1 className="font-semibold text-2xl">Create your account</h1>
			<SignUpForm />
		</main>
	);
}
`,
			"src/app/(app)/layout.tsx": `import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { currentUser } from "@/server/session";

/**
 * The signed-in half of the app.
 *
 * The check lives here rather than in each page, so a new page under
 * \`(app)\` is protected by existing. The middleware does not do it: Auth0's
 * middleware serves \`/auth/*\` and passes everything else through, so guarding
 * the app is this layout's job.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
	if (!(await currentUser())) redirect("/sign-in");

	return children;
}
`,
			"src/app/(app)/dashboard/page.tsx": `import { SignOutButton } from "@/components/auth/sign-out-button";
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
`,
		},
	};
}
