import type { Fragment } from "./fragments";

/**
 * Neon Auth, wired end to end.
 *
 * Neon Auth is Stack Auth with Neon's name on it: the dashboard is Neon's, the
 * SDK is `@stackframe/stack`, and the users end up in a `neon_auth.users_sync`
 * table alongside your own data. That is the reason to pick it over a hosted
 * provider — the identities are joinable rows in the same Postgres, not a
 * webhook away.
 *
 * ## Why Next.js only
 *
 * `@stackframe/react` exists and is framework-agnostic, but it is a *client*
 * library: it has `StackClientApp` and no server-side user lookup. The server
 * half — `StackServerApp` with the `nextjs-cookie` token store — is in
 * `@stackframe/stack`, and both of those names mean what they say.
 *
 * On TanStack Start that would mean client-only authentication on a framework
 * that has a server, with `currentUser()` unable to answer during SSR. Rather
 * than ship something that half-works, the wizard offers Neon Auth with
 * Next.js only — the same reason Auth0 is Next-only, arrived at the same way.
 *
 * ## Read off the installed package
 *
 * `StackHandler` in 2.8 deprecated `app`, `routeProps`, `params` and
 * `searchParams` — all four are "no longer necessary" per its own types, so
 * passing them is copying a tutorial written against an older version.
 */

/**
 * Two of these ship to the browser, and Stack reads them under exactly these
 * prefixed names — which is why the generator's `NEXT_PUBLIC_` prefix lands on
 * the names Stack already expects, and nothing has to be mapped.
 */
const PUBLIC: [string, string, string?][] = [
	/**
	 * The stand-in is a UUID because Stack rejects anything else *at
	 * construction* — "Project IDs must be UUIDs". A friendlier-looking
	 * `proj_example` passes the schema here and then fails `next build` while
	 * it collects page data, with an error that names the environment rather
	 * than the placeholder. The suite that runs on a clean checkout has to be
	 * given something the SDK will actually accept.
	 */
	[
		"STACK_PROJECT_ID",
		"Project id, from Neon's Auth tab. A UUID",
		"00000000-0000-4000-8000-000000000000",
	],
	[
		"STACK_PUBLISHABLE_CLIENT_KEY",
		"Publishable client key, from Neon's Auth tab",
		"pck_example",
	],
];

const SECRET: [string, string, string?][] = [
	[
		"STACK_SECRET_SERVER_KEY",
		"Secret server key, from Neon's Auth tab. Server only",
	],
];

export function neonAuthFragment(_answers?: unknown): Fragment {
	return {
		dependencies: { "@stackframe/stack": "^2.8.0" },
		env: SECRET,
		publicEnv: PUBLIC,
		files: {
			"src/lib/auth.ts": `import { StackServerApp } from "@stackframe/stack";
import { publicEnv } from "@/lib/public-env";
import { env } from "@/lib/env";

/**
 * Authentication, configured once.
 *
 * The keys are passed explicitly rather than left to the SDK's own
 * environment lookup. Stack would find them — it reads the same prefixed
 * names — but this project has one rule about environment variables, which is
 * that \`env.ts\` and \`public-env.ts\` are the only modules that read them.
 * Passing them here keeps that true and makes the dependency visible.
 *
 * \`tokenStore: "nextjs-cookie"\` is what makes the session readable on the
 * server: the tokens live in cookies the request carries, so a server
 * component can ask who is signed in without a round trip to the browser.
 */
export const stackServerApp = new StackServerApp({
	tokenStore: "nextjs-cookie",
	projectId: publicEnv.STACK_PROJECT_ID,
	publishableClientKey: publicEnv.STACK_PUBLISHABLE_CLIENT_KEY,
	secretServerKey: env.STACK_SECRET_SERVER_KEY,
	urls: {
		/* Where the handler below is mounted. Stack builds every link it
		   renders — sign in, sign out, password reset — from these, so moving
		   the route means changing this and nothing else. */
		signIn: "/handler/sign-in",
		signUp: "/handler/sign-up",
		afterSignIn: "/dashboard",
		afterSignUp: "/dashboard",
		afterSignOut: "/",
	},
});

/** The name the rest of the generator uses, whichever provider is chosen. */
export const auth = stackServerApp;
`,
			"src/lib/auth.test.ts": `import { describe, expect, it } from "vitest";
import { auth, stackServerApp } from "./auth.js";

describe("auth", () => {
	it("is configured and exported", () => {
		expect(stackServerApp).toBeDefined();
		expect(auth).toBe(stackServerApp);
	});

	it("exposes the user lookup the session helper calls", () => {
		expect(typeof stackServerApp.getUser).toBe("function");
	});

	/**
	 * Stack builds every link it renders from these, so a wrong one sends
	 * someone to a page that does not exist *after* they have signed in —
	 * which looks like a broken app rather than a misconfiguration.
	 */
	it("points its own links at the handler route that exists", () => {
		expect(stackServerApp.urls.signIn).toBe("/handler/sign-in");
		expect(stackServerApp.urls.afterSignIn).toBe("/dashboard");
	});
});
`,
			/**
			 * One catch-all route serves every page Stack owns: sign in, sign up,
			 * email verification, password reset, OAuth callback, sign out. They
			 * navigate between themselves, which is why it is a splat and not six
			 * routes.
			 */
			"src/app/handler/[...stack]/page.tsx": `import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "@/lib/auth";

/**
 * Every page Stack owns, mounted at \`/handler/*\`.
 *
 * \`fullPage\` renders them as standalone pages rather than embedded widgets.
 *
 * It takes no props, and that is worth stating because every tutorial older
 * than 2.8 passes \`routeProps\`, \`params\` and \`searchParams\`. All three are
 * deprecated as "no longer necessary" — and spreading them here is not merely
 * redundant, it fails the build: Next type-checks a page's props against its
 * own \`PageProps\`, and an index signature of \`unknown\` does not satisfy it.
 */
export default function Handler() {
	return <StackHandler fullPage app={stackServerApp} />;
}
`,
			"src/app/layout.tsx": `import { StackProvider, StackTheme } from "@stackframe/stack";
import type { ReactNode } from "react";
import { stackServerApp } from "@/lib/auth";
import "@/styles.css";

export const metadata = {
	title: "{{project}}",
	description: "Generated by StarterSaaSKit.",
};

/**
 * \`StackProvider\` gives the client half the session, and \`StackTheme\` styles
 * the pages under \`/handler\`. Both wrap the whole tree because the handler
 * routes live inside it and would otherwise render unstyled and signed out.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>
				<StackProvider app={stackServerApp}>
					<StackTheme>{children}</StackTheme>
				</StackProvider>
			</body>
		</html>
	);
}
`,
			"src/server/session.ts": `import "server-only";
import { stackServerApp } from "@/lib/auth";

/**
 * Server-only helpers.
 *
 * The \`server-only\` import is a build-time tripwire: importing this from a
 * client component fails the build rather than shipping the secret server
 * key's neighbourhood to a browser.
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
 * The same id is the primary key of \`neon_auth.users_sync\` in your database,
 * which is the whole appeal of Neon Auth: your own tables can reference it
 * with a foreign key instead of copying the profile.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const user = await stackServerApp.getUser();

	if (!user) return null;

	return {
		id: user.id,
		email: user.primaryEmail ?? "",
		name: user.displayName ?? "",
	};
}
`,
			/* Links, not forms: the credentials are collected on the handler
			   pages, which Stack renders and this app only mounts. */
			"src/components/auth/sign-in-form.tsx": `/**
 * Sign-in, which for Neon Auth is a link.
 *
 * The form itself is one of the pages under \`/handler\`, rendered by Stack.
 * A plain \`<a>\` rather than \`next/link\`: it is a route in this app, but the
 * page beyond it mounts its own provider state, and a soft navigation can
 * arrive before that is ready.
 */
export function SignInForm() {
	return (
		<a
			className="rounded-md bg-neutral-900 px-3 py-2 text-center text-sm text-white"
			href="/handler/sign-in"
		>
			Continue to sign in
		</a>
	);
}
`,
			"src/components/auth/sign-up-form.tsx": `export function SignUpForm() {
	return (
		<a
			className="rounded-md bg-neutral-900 px-3 py-2 text-center text-sm text-white"
			href="/handler/sign-up"
		>
			Create an account
		</a>
	);
}
`,
			"src/components/auth/sign-out-button.tsx": `/**
 * Sign-out is a link to the handler, which clears the tokens and redirects to
 * \`afterSignOut\`. Clearing the cookie here instead would leave the session
 * alive on Stack's side.
 */
export function SignOutButton() {
	return (
		<a
			className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
			href="/handler/sign-out"
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
 * \`(app)\` is protected by existing rather than by someone remembering.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
	if (!(await currentUser())) redirect("/handler/sign-in");

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
