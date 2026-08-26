import type { StarterAnswers } from "@/lib/starter-questions";
import type { Fragment } from "./fragments";

/**
 * Clerk, wired end to end, for all three frameworks.
 *
 * The bar, same as the other providers: after generating, the only thing
 * between the reader and a working sign-in is filling in `.env`. Clerk hosts
 * the forms, so "wired" here means the provider is mounted, the routes exist,
 * the middleware protects what it should, and the server can say who is
 * asking — not that a `publishableKey` sits in an exported object.
 *
 * ## Read off the installed packages, not from memory
 *
 * Clerk Core 3 (March 2026) **removed `<SignedIn>`, `<SignedOut>` and
 * `<Protect>`** in favour of `<Show when="signed-in">`. `@clerk/nextjs@7` and
 * `@clerk/react@6` ship a stub for the old names whose only job is to throw
 * with a message that begins "If you are an agent, your Clerk knowledge is
 * likely out of date." It is right, and this file is the result of reading the
 * export maps instead.
 *
 * The packages, and why each:
 *
 * - Next → `@clerk/nextjs@7`. Has its own provider, `clerkMiddleware`, and
 *   `auth()` / `currentUser()` under `/server`.
 * - TanStack Start → `@clerk/tanstack-react-start@1` for the provider and the
 *   hosted pages, plus `@clerk/react@6` for `Show`, `UserButton` and the
 *   hooks — the TanStack package deliberately re-exports neither.
 * - React + Vite → `@clerk/react@6` alone. Its only peer dependencies are
 *   react and react-dom, so it needs no framework.
 */

const NEXT = "^7.8.0";
const REACT = "^6.14.0";
const TANSTACK = "^1.5.0";

/**
 * The publishable key is genuinely public — it identifies the app to Clerk and
 * is compiled into every bundle. The secret key is what proves the *server* is
 * you, so it never appears in a browser-only build.
 */
const PUBLISHABLE: [string, string, string?][] = [
	[
		"CLERK_PUBLISHABLE_KEY",
		"Publishable key, from the Clerk dashboard",
		"pk_test_example",
	],
];

const SECRET: [string, string, string?][] = [
	["CLERK_SECRET_KEY", "Secret key, from the Clerk dashboard. Server only"],
];

/**
 * The shared shape of `src/lib/auth.ts`: what the rest of the app imports.
 *
 * Every provider in this generator exports the same two things — a way to
 * configure and a way to ask who is signed in — so swapping providers is one
 * file rather than a search. Clerk's configuration lives in its provider
 * component, which is why this module is thinner than Better Auth's and says
 * so rather than looking unfinished.
 */
const AUTH_TEST = `import { describe, expect, it } from "vitest";
import { auth } from "./auth.js";

describe("auth", () => {
	it("is configured and exported", () => {
		expect(auth).toBeDefined();
	});

	it("knows which Clerk application it belongs to", () => {
		expect(auth.publishableKey).toBeTruthy();
	});

	/**
	 * The publishable key is meant to ship; the secret key is not. A starter
	 * that leaked one would do it exactly here, by exporting both from a module
	 * a component can import.
	 */
	it("exposes no secret key", () => {
		expect(JSON.stringify(auth)).not.toMatch(/sk_/);
		expect(Object.keys(auth)).not.toContain("secretKey");
	});
});
`;

/* ------------------------------------------------------------------- next */

function nextFragment(): Fragment {
	return {
		dependencies: { "@clerk/nextjs": NEXT },
		env: SECRET,
		publicEnv: PUBLISHABLE,
		files: {
			"src/lib/auth.ts": `import { publicEnv } from "@/lib/public-env";

/**
 * Authentication, configured once.
 *
 * Thinner than the self-hosted providers, and deliberately: Clerk keeps the
 * users, the forms and the session, so there is no client to construct here.
 * What this module owns is the identity of *this* application — which is the
 * publishable key — and the promise that nothing secret is reachable from a
 * component.
 *
 * The secret key is read by \`@clerk/nextjs\` from the environment on the
 * server. It is deliberately not re-exported here: a module a client
 * component can import must not be able to hand one out.
 */
export const auth = {
	publishableKey: publicEnv.CLERK_PUBLISHABLE_KEY,
};
`,
			"src/lib/auth.test.ts": AUTH_TEST,
			/**
			 * Clerk reads its keys from process.env under fixed names. Ours are
			 * declared in `.env.example` under the same names, so nothing has to
			 * be copied across — but the mapping is stated because the two look
			 * independent and are not.
			 */
			"src/middleware.ts": `import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Which routes require a session.
 *
 * Everything else stays public. Listing what is *protected* rather than what
 * is open is the safer default of the two: forgetting to add a route here
 * leaves it public and visible, while forgetting to add one to a public list
 * locks people out of a page that was meant to be seen.
 *
 * A route matched here is checked before it renders, so the page underneath
 * can assume a session rather than re-checking.
 */
const isProtected = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, request) => {
	if (isProtected(request)) await auth.protect();
});

export const config = {
	/* Skips static files and Next internals, and always runs for API routes.
	   Straight from Clerk's own matcher: the cost of getting it wrong is
	   either running auth on every image or not running it on a route that
	   needed it. */
	matcher: [
		"/((?!_next|[^?]*\\\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		"/(api|trpc)(.*)",
	],
};
`,
			"src/app/layout.tsx": `import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";
import "@/styles.css";

export const metadata = {
	title: "{{project}}",
	description: "Generated by StarterSaaSKit.",
};

/**
 * \`ClerkProvider\` wraps the whole tree because both halves need it: client
 * components read the session through it, and the server components read the
 * same request context. Mounting it lower would leave the pages above unable
 * to tell whether anyone is signed in.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider>
			<html lang="en">
				<body>{children}</body>
			</html>
		</ClerkProvider>
	);
}
`,
			/* Clerk's own components, mounted on catch-all routes: they own their
			   internal navigation — verification steps, factor two, recovery —
			   and a fixed path would 404 partway through. */
			"src/app/(auth)/sign-in/[[...sign-in]]/page.tsx": `import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-12">
			<SignIn />
		</main>
	);
}
`,
			"src/app/(auth)/sign-up/[[...sign-up]]/page.tsx": `import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-12">
			<SignUp />
		</main>
	);
}
`,
			"src/app/(app)/layout.tsx": `import type { ReactNode } from "react";

/**
 * The signed-in half of the app.
 *
 * There is no check here, and that is not an oversight: \`src/middleware.ts\`
 * protects \`/dashboard\` before this renders. Adding a second check would
 * imply the first one is unreliable, and the two would drift.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
	return children;
}
`,
			"src/app/(app)/dashboard/page.tsx": `import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@/server/session";

export default async function Dashboard() {
	/* Non-null: the middleware redirects anyone without a session before this
	   page is reached. */
	const user = await currentUser();

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-12">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">Dashboard</h1>
					<p className="mt-1 text-neutral-500">Signed in as {user?.email}</p>
				</div>
				{/* Clerk's own menu: account settings and sign-out, hosted. */}
				<UserButton />
			</div>
		</main>
	);
}
`,
			"src/server/session.ts": `import "server-only";
import { currentUser as clerkUser } from "@clerk/nextjs/server";

/**
 * Server-only helpers.
 *
 * The \`server-only\` import is a build-time tripwire: importing this from a
 * client component fails the build rather than shipping the secret key's
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
 * Clerk returns a user with an array of email addresses — one is primary, and
 * the rest may be unverified. Picking the primary rather than the first is the
 * difference between greeting someone by their address and greeting them by an
 * address they once typed and never confirmed.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const user = await clerkUser();

	if (!user) return null;

	const primary = user.emailAddresses.find(
		(address) => address.id === user.primaryEmailAddressId,
	);

	return {
		id: user.id,
		email: primary?.emailAddress ?? "",
		name: [user.firstName, user.lastName].filter(Boolean).join(" "),
	};
}
`,
		},
	};
}

/* -------------------------------------------------------------- tanstack */

function tanstackFragment(): Fragment {
	return {
		dependencies: {
			"@clerk/react": REACT,
			"@clerk/tanstack-react-start": TANSTACK,
		},
		env: SECRET,
		publicEnv: PUBLISHABLE,
		files: {
			"src/lib/auth.ts": `import { publicEnv } from "@/lib/public-env";

/**
 * Authentication, configured once.
 *
 * Clerk keeps the users, the forms and the session, so what this module owns
 * is the identity of *this* application — the publishable key — and the
 * promise that nothing secret is reachable from a component.
 */
export const auth = {
	publishableKey: publicEnv.CLERK_PUBLISHABLE_KEY,
};
`,
			"src/lib/auth.test.ts": AUTH_TEST,
			"src/routes/__root.tsx": `import { ClerkProvider } from "@clerk/tanstack-react-start";
import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "{{project}}" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
});

/**
 * \`ClerkProvider\` wraps the document rather than the page, because the
 * session has to be readable during server rendering as well as after
 * hydration. Mounting it inside a route would leave the first paint unable to
 * tell whether anyone is signed in.
 */
function RootDocument({ children }: { children: ReactNode }) {
	return (
		<ClerkProvider>
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<body>
					{children}
					<Scripts />
				</body>
			</html>
		</ClerkProvider>
	);
}

export function RouteComponent() {
	return <Outlet />;
}
`,
			/* Splat routes: Clerk's components own their internal navigation —
			   verification, second factor, recovery — and a fixed path would 404
			   partway through a flow. */
			"src/routes/sign-in.$.tsx": `import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({ component: SignInPage });

function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-12">
			<SignIn />
		</main>
	);
}
`,
			"src/routes/sign-up.$.tsx": `import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({ component: SignUpPage });

function SignUpPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-12">
			<SignUp />
		</main>
	);
}
`,
			"src/routes/_authed.tsx": `import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
 * each page.
 */
export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const user = await getUser();
		if (!user) throw redirect({ to: "/sign-in/$", params: { _splat: "" } });
		return { user };
	},
	component: () => <Outlet />,
});
`,
			"src/routes/_authed/dashboard.tsx": `import { UserButton } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
	component: Dashboard,
});

function Dashboard() {
	/* Non-null: \`_authed\` redirects anyone without a session. */
	const { user } = Route.useRouteContext();

	return (
		<main className="mx-auto flex max-w-2xl flex-col gap-6 p-12">
			<div className="flex items-start justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">Dashboard</h1>
					<p className="mt-1 text-neutral-500">Signed in as {user.email}</p>
				</div>
				{/* From \`@clerk/react\`: the TanStack package exports the pages and
				    the provider, and deliberately not the widgets or hooks. */}
				<UserButton />
			</div>
		</main>
	);
}
`,
			"src/server/session.ts": `import "server-only";
import { auth as clerkAuth, clerkClient } from "@clerk/tanstack-react-start/server";

export type SessionUser = {
	id: string;
	email: string;
	name: string;
};

/**
 * The signed-in user, or null.
 *
 * Two calls rather than one: \`auth()\` reads the session from the request and
 * is cheap, while the profile has to be fetched. Returning early when there is
 * no session keeps the round trip off every signed-out request.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const { userId } = await clerkAuth();

	if (!userId) return null;

	const user = await (await clerkClient()).users.getUser(userId);
	const primary = user.emailAddresses.find(
		(address) => address.id === user.primaryEmailAddressId,
	);

	return {
		id: user.id,
		email: primary?.emailAddress ?? "",
		name: [user.firstName, user.lastName].filter(Boolean).join(" "),
	};
}
`,
		},
	};
}

/* ------------------------------------------------------------------- spa */

function spaFragment(): Fragment {
	return {
		dependencies: { "@clerk/react": REACT },
		/* No secret key at all. There is nowhere to put one in a bundle, and
		   asking for it would invite someone to try. */
		publicEnv: PUBLISHABLE,
		files: {
			"src/lib/auth.ts": `import { publicEnv } from "@/lib/public-env";

/**
 * Authentication, configured once.
 *
 * Only the publishable key: this app runs entirely in the browser, so a secret
 * key would be readable by every visitor. Clerk is built for exactly this —
 * the key identifies the application, and the session is a token Clerk issues
 * and verifies.
 */
export const auth = {
	publishableKey: publicEnv.CLERK_PUBLISHABLE_KEY,
};
`,
			"src/lib/auth.test.ts": AUTH_TEST,
			"src/main.tsx": `import { ClerkProvider } from "@clerk/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { auth } from "@/lib/auth";
import { router } from "@/routes/router";
import "@/styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("index.html has no #root to mount into.");

createRoot(root).render(
	<StrictMode>
		<ClerkProvider publishableKey={auth.publishableKey}>
			<RouterProvider router={router} />
		</ClerkProvider>
	</StrictMode>,
);
`,
			"src/routes/router.tsx": `import { createBrowserRouter } from "react-router-dom";
import { Dashboard } from "./dashboard";
import { Home } from "./home";
import { SignInPage } from "./sign-in";
import { SignUpPage } from "./sign-up";

export const router = createBrowserRouter([
	{ path: "/", element: <Home /> },
	/* Splat paths: Clerk's components navigate within themselves for
	   verification and recovery steps, and an exact path would 404 partway
	   through one. */
	{ path: "/sign-in/*", element: <SignInPage /> },
	{ path: "/sign-up/*", element: <SignUpPage /> },
	{ path: "/dashboard", element: <Dashboard /> },
]);
`,
			"src/routes/sign-in.tsx": `import { SignIn } from "@clerk/react";

export function SignInPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-12">
			<SignIn signUpUrl="/sign-up" />
		</main>
	);
}
`,
			"src/routes/sign-up.tsx": `import { SignUp } from "@clerk/react";

export function SignUpPage() {
	return (
		<main className="flex min-h-screen items-center justify-center p-12">
			<SignUp signInUrl="/sign-in" />
		</main>
	);
}
`,
			"src/routes/dashboard.tsx": `import { Show, UserButton, useUser } from "@clerk/react";
import { Navigate } from "react-router-dom";

/**
 * The signed-in page.
 *
 * \`isLoaded\` is a third state on purpose: rendering the signed-out branch
 * while Clerk is still restoring the session flashes a redirect at someone who
 * is already signed in, on every reload.
 *
 * \`<Show when="signed-out">\` rather than \`<SignedOut>\`: the old control
 * components were removed in Clerk Core 3.
 *
 * And the redirect is a courtesy, not a lock. This check lives in a bundle
 * anyone can edit, so it protects the person using the app from a confusing
 * screen — never the data from an attacker. Whatever this page calls must
 * verify the session itself.
 */
export function Dashboard() {
	const { isLoaded, user } = useUser();

	if (!isLoaded) {
		return <main className="p-12 text-sm">Checking your session…</main>;
	}

	return (
		<>
			<Show when="signed-out">
				<Navigate replace to="/sign-in" />
			</Show>
			<Show when="signed-in">
				<main className="mx-auto flex max-w-2xl flex-col gap-6 p-12">
					<div className="flex items-start justify-between gap-4">
						<div>
							<h1 className="font-semibold text-2xl">Dashboard</h1>
							<p className="mt-1 text-neutral-500">
								Signed in as {user?.primaryEmailAddress?.emailAddress}
							</p>
						</div>
						<UserButton />
					</div>
				</main>
			</Show>
		</>
	);
}
`,
		},
	};
}

/** The whole Clerk module, for the framework chosen. */
export function clerkAuthFragment(answers: StarterAnswers): Fragment {
	if (answers.framework === "react_vite") return spaFragment();
	if (answers.framework === "tanstack_start") return tanstackFragment();

	return nextFragment();
}
