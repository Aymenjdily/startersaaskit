import type { StarterAnswers } from "@/lib/starter-questions";
import type { Fragment } from "./fragments";

/**
 * Better Auth, wired end to end.
 *
 * The bar this exists to meet: after generating, the only thing between the
 * reader and a working sign-in is filling in `.env`. That means the route
 * handler, the client, the pages, the session lookup and the tables all have
 * to be here — a configured `betterAuth()` call on its own is a library
 * import, not a feature.
 *
 * Verified against the installed `better-auth@1.7.1`: the subpaths below
 * (`better-auth/next-js`, `better-auth/tanstack-start`,
 * `better-auth/adapters/*`, `better-auth/react`) are read off its export map
 * rather than remembered.
 */

/** Which Drizzle dialect Better Auth's adapter should be told about. */
function providerFor(database: string | undefined): string {
	if (database === "planetscale") return "mysql";
	if (database === "turso") return "sqlite";
	return "pg";
}

function adapterCall(answers: StarterAnswers): {
	imports: string;
	call: string;
	extraDeps?: Record<string, string>;
} {
	if (answers.orm === "prisma") {
		return {
			imports: `import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/db/client";`,
			call: `prismaAdapter(db, {
		provider: "${answers.database === "mongodb" ? "mongodb" : providerFor(answers.database) === "mysql" ? "mysql" : providerFor(answers.database) === "sqlite" ? "sqlite" : "postgresql"}",
	})`,
		};
	}

	if (answers.orm === "mongoose") {
		/* Better Auth's Mongo adapter wants a driver `Db`, which a Mongoose
		   connection is not. It takes its own handle from the same URI rather
		   than reaching into Mongoose's internals. */
		return {
			imports: `import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { env } from "@/lib/env";

const client = new MongoClient(env.MONGODB_URI);`,
			call: "mongodbAdapter(client.db())",
			extraDeps: { mongodb: "^6.10.0" },
		};
	}

	return {
		imports: `import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/client";
import * as schema from "@/db/schema";`,
		call: `drizzleAdapter(db, {
		provider: "${providerFor(answers.database)}",
		schema,
	})`,
	};
}

/** The cookie plugin each framework needs so `Set-Cookie` survives. */
function cookiePlugin(framework: string | undefined) {
	return framework === "nextjs"
		? {
				import: `import { nextCookies } from "better-auth/next-js";`,
				use: "nextCookies()",
			}
		: {
				import: `import { tanstackStartCookies } from "better-auth/tanstack-start";`,
				use: "tanstackStartCookies()",
			};
}

const SIGN_IN_FORM = `"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/**
 * Sign in with an email and a password.
 *
 * The error is whatever Better Auth returned. It reports a wrong password and
 * an unknown address identically on purpose — telling them apart turns this
 * form into a way to discover which addresses have accounts.
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

		const { error: failed } = await authClient.signIn.email({
			email,
			password,
			callbackURL: "/dashboard",
		});

		if (failed) {
			setError(failed.message ?? "Could not sign you in.");
			setPending(false);
			return;
		}
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
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignUpForm() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setPending(true);

		const { error: failed } = await authClient.signUp.email({
			name,
			email,
			password,
			callbackURL: "/dashboard",
		});

		if (failed) {
			setError(failed.message ?? "Could not create your account.");
			setPending(false);
			return;
		}
		window.location.assign("/dashboard");
	}

	return (
		<form className="flex flex-col gap-3" onSubmit={submit}>
			<label className="flex flex-col gap-1 text-sm">
				Name
				<input
					autoComplete="name"
					className="h-10 rounded-md border px-3"
					onChange={(event) => setName(event.target.value)}
					required
					value={name}
				/>
			</label>

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

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
	return (
		<Button
			onClick={async () => {
				await authClient.signOut();
				window.location.assign("/");
			}}
		>
			Sign out
		</Button>
	);
}
`;

const AUTH_TEST = `import { describe, expect, it } from "vitest";
import { auth } from "./auth.js";

/**
 * Auth is one module, and this is its contract. Whatever provider sits behind
 * it, the rest of the app only imports \`auth\` from here — so this is what
 * makes swapping providers a one-file change rather than a search.
 */
describe("auth", () => {
	it("is configured and exported", () => {
		expect(auth).toBeDefined();
	});

	it("exposes the server API the session helper calls", () => {
		expect(typeof auth.api.getSession).toBe("function");
	});

	it("mounts a handler for the route to forward requests to", () => {
		expect(typeof auth.handler).toBe("function");
	});
});
`;

/** Better Auth's own tables, in Drizzle, for each dialect. */
const AUTH_SCHEMA: Record<string, string> = {
	pg: `import {
	boolean,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

/**
 * Better Auth's tables. The names and columns are the ones it expects — it
 * reads and writes these directly, so renaming a column here breaks sign-in.
 *
 * Your own tables belong beside them, referencing \`user.id\`.
 */
export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	/* Required since better-auth 1.7: it refuses to start without it. */
	issuer: text("issuer").notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
`,
	mysql: `import {
	boolean,
	mysqlTable,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable("user", {
	id: varchar("id", { length: 36 }).primaryKey(),
	name: text("name").notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = mysqlTable("session", {
	id: varchar("id", { length: 36 }).primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: varchar("token", { length: 255 }).notNull().unique(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: varchar("user_id", { length: 36 }).notNull(),
});

export const account = mysqlTable("account", {
	id: varchar("id", { length: 36 }).primaryKey(),
	/* Required since better-auth 1.7: it refuses to start without it. */
	issuer: varchar("issuer", { length: 255 }).notNull(),
	accountId: varchar("account_id", { length: 255 }).notNull(),
	providerId: varchar("provider_id", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = mysqlTable("verification", {
	id: varchar("id", { length: 36 }).primaryKey(),
	identifier: varchar("identifier", { length: 255 }).notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
`,
	sqlite: `import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: integer("email_verified", { mode: "boolean" })
		.notNull()
		.default(false),
	image: text("image"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	token: text("token").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
	id: text("id").primaryKey(),
	/* Required since better-auth 1.7: it refuses to start without it. */
	issuer: text("issuer").notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at", {
		mode: "timestamp",
	}),
	refreshTokenExpiresAt: integer("refresh_token_expires_at", {
		mode: "timestamp",
	}),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
`,
};

const AUTH_SCHEMA_TEST = `import { describe, expect, it } from "vitest";
import { account, session, user, verification } from "./schema.js";

/**
 * Better Auth reads and writes these tables directly, so the columns are its
 * contract rather than ours. Renaming one here breaks sign-in at runtime with
 * a database error, which this catches at the point the change is made.
 */
describe("the auth tables", () => {
	it("has the four tables Better Auth expects", () => {
		for (const table of [user, session, account, verification]) {
			expect(table).toBeDefined();
		}
	});

	it("keeps the session token unique, which lookups rely on", () => {
		expect(session.token.isUnique).toBe(true);
	});

	it("keeps email unique, so an address maps to one account", () => {
		expect(user.email.isUnique).toBe(true);
	});
});
`;

/** The whole Better Auth module, for the framework and ORM chosen. */
export function betterAuthFragment(answers: StarterAnswers): Fragment {
	const adapter = adapterCall(answers);
	const cookies = cookiePlugin(answers.framework);
	const next = answers.framework === "nextjs";

	const files: Record<string, string> = {
		"src/lib/auth.ts": `import { betterAuth } from "better-auth";
${cookies.import}
${adapter.imports}
import { env } from "@/lib/env";

/**
 * Authentication, configured once.
 *
 * Nothing else in this codebase imports \`better-auth\` directly. Replacing the
 * provider means rewriting this file, \`src/lib/auth-client.ts\` and
 * \`src/server/session.ts\` — and nothing else.
 *
 * The cookie plugin is not optional: without it the \`Set-Cookie\` header the
 * sign-in response carries is dropped, and every request afterwards looks
 * signed out.
 */
export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	database: ${adapter.call},
	emailAndPassword: {
		enabled: true,
		/* Turn on once you have somewhere to send the mail from. */
		requireEmailVerification: false,
		minPasswordLength: 8,
	},
	plugins: [${cookies.use}],
});

export type Session = typeof auth.$Infer.Session;
`,
		"src/lib/auth.test.ts": AUTH_TEST,
		"src/lib/auth-client.ts": `import { createAuthClient } from "better-auth/react";

/**
 * The browser half. Talks to the route handler over HTTP, so it holds no
 * secret and is safe to import from a client component.
 */
export const authClient = createAuthClient();

export const { signIn, signOut, signUp, useSession } = authClient;
`,
		"src/lib/auth-client.test.ts": `import { describe, expect, it } from "vitest";
import { authClient } from "./auth-client.js";

/**
 * The surface the forms in \`src/components/auth\` call. A client missing one
 * of these fails at the click rather than at import, which is the worst place
 * to find out.
 */
describe("authClient", () => {
	it("offers the calls the sign-in and sign-up forms make", () => {
		expect(typeof authClient.signIn.email).toBe("function");
		expect(typeof authClient.signUp.email).toBe("function");
		expect(typeof authClient.signOut).toBe("function");
	});

	/** It talks over HTTP, so it must not drag the server config in with it. */
	it("holds no secret", () => {
		expect(JSON.stringify(authClient)).not.toMatch(/secret/i);
	});
});
`,
		"src/components/auth/sign-in-form.tsx": SIGN_IN_FORM,
		"src/components/auth/sign-up-form.tsx": SIGN_UP_FORM,
		"src/components/auth/sign-out-button.tsx": SIGN_OUT_BUTTON,
		"src/server/session.ts": `import "server-only";
${next ? 'import { headers } from "next/headers";' : 'import { getRequest } from "@tanstack/react-start/server";'}
import { auth } from "@/lib/auth";

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
	name: string;
};

/**
 * The signed-in user, or null.
 *
 * Everything that needs to know who is asking calls this, so swapping the
 * provider is one file rather than a search for session handling.
 */
export async function currentUser(): Promise<SessionUser | null> {
	const session = await auth.api.getSession({
		headers: ${next ? "await headers()" : "getRequest().headers"},
	});

	if (!session) return null;

	return {
		id: session.user.id,
		email: session.user.email,
		name: session.user.name,
	};
}
`,
	};

	if (next) {
		files["src/app/api/auth/[...all]/route.ts"] =
			`import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Every Better Auth endpoint, mounted here. The client in
 * \`src/lib/auth-client.ts\` talks to this and nothing else.
 */
export const { GET, POST } = toNextJsHandler(auth);
`;
		files["src/app/(auth)/sign-in/page.tsx"] = `import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { currentUser } from "@/server/session";

export default async function SignInPage() {
	/* Already signed in: sending them to a sign-in form is a dead end. */
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
		/* Replaces the placeholder layout from the framework fragment. */
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
		files["src/routes/api/auth/$.ts"] =
			`import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

/**
 * Every Better Auth endpoint, mounted here. The client in
 * \`src/lib/auth-client.ts\` talks to this and nothing else.
 */
export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: ({ request }) => auth.handler(request),
			POST: ({ request }) => auth.handler(request),
		},
	},
});
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

	/* Drizzle owns the tables, so Better Auth's schema replaces the starter's
	   placeholder one rather than sitting beside it. */
	if (answers.orm === "drizzle") {
		const dialect = providerFor(answers.database);
		const key = dialect === "pg" ? "pg" : dialect;
		files["src/db/schema.ts"] = AUTH_SCHEMA[key];
		files["src/db/schema.test.ts"] = AUTH_SCHEMA_TEST;
	}

	return {
		dependencies: { "better-auth": "^1.7.1", ...adapter.extraDeps },
		env: [
			[
				"BETTER_AUTH_SECRET",
				"Random 32+ character string",
				"test-secret-at-least-32-characters-long",
			],
			[
				"BETTER_AUTH_URL",
				"Base URL of this app, e.g. http://localhost:3000",
				"http://localhost:3000",
			],
		],
		files,
	};
}
