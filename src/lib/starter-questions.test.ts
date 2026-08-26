import { describe, expect, it } from "vitest";
import { ANSWERS } from "@/components/landing/how-it-works";
import { SEAMS } from "@/components/landing/swap-anything";
import {
	answerProblems,
	backfillAnswers,
	isProjectNameValid,
	isStarterAnswered,
	isStarterComplete,
	optionsFor,
	pruneAnswers,
	STARTER_QUESTIONS,
	type StarterAnswers,
} from "./starter-questions";

const complete: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "supabase",
	orm: "drizzle",
	auth: "supabase_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

const byId = (id: string) =>
	STARTER_QUESTIONS.find((question) => question.id === id) as NonNullable<
		(typeof STARTER_QUESTIONS)[number]
	>;

describe("the question set", () => {
	/**
	 * The landing page tells visitors what the wizard asks. If the console asks
	 * something else, one of the two is lying to whoever read the other first.
	 */
	it("asks exactly what the landing page says it asks", () => {
		expect(STARTER_QUESTIONS.map((question) => question.label)).toEqual(
			ANSWERS.map((answer) => answer.label),
		);
	});

	/** Same argument, one level down: the options are advertised too. */
	it.each(SEAMS)("offers the $layer options the landing page lists", (seam) => {
		const question = STARTER_QUESTIONS.find(
			(candidate) => candidate.label === seam.layer,
		);

		expect(question).toBeDefined();
		expect(
			(question?.options ?? []).map((option) => option.label).sort(),
		).toEqual([...seam.options].sort());
	});

	it("has a text answer for the project name and choices for the rest", () => {
		expect(byId("project").kind).toBe("text");

		for (const question of STARTER_QUESTIONS) {
			if (question.id === "project") continue;
			expect(question.options?.length ?? 0).toBeGreaterThan(1);
		}
	});
});

describe("optionsFor", () => {
	it("offers everything when nothing rules anything out", () => {
		expect(optionsFor(byId("framework"), {})).toHaveLength(3);
	});

	/**
	 * `swap-anything.tsx` promises a pairing that cannot work "is never offered
	 * in the first place". Supabase Auth without Supabase is that pairing, and
	 * Neon Auth without Neon is the same shape — both are parts of their host
	 * rather than libraries you can bolt onto anything.
	 */
	describe("auth options tied to a host", () => {
		it("shows Supabase Auth only alongside Supabase", () => {
			expect(
				optionsFor(byId("auth"), { database: "supabase" }).map((o) => o.id),
			).toContain("supabase_auth");
			expect(
				optionsFor(byId("auth"), { database: "neon" }).map((o) => o.id),
			).not.toContain("supabase_auth");
		});

		it("shows Neon Auth only alongside Neon, and only on Next", () => {
			const on = (answers: StarterAnswers) =>
				optionsFor(byId("auth"), answers).map((o) => o.id);

			expect(on({ framework: "nextjs", database: "neon" })).toContain(
				"neon_auth",
			);
			expect(on({ framework: "nextjs", database: "supabase" })).not.toContain(
				"neon_auth",
			);
			/* Its server-side user lookup is behind a `nextjs-cookie` token store,
			   so on TanStack it could not answer during SSR. */
			expect(
				on({ framework: "tanstack_start", database: "neon" }),
			).not.toContain("neon_auth");
		});

		it("hides both while the database is still unanswered", () => {
			const ids = optionsFor(byId("auth"), {}).map((o) => o.id);

			expect(ids).not.toContain("supabase_auth");
			expect(ids).not.toContain("neon_auth");
		});

		/**
		 * Better Auth is self-hosted and Clerk keeps its own users, so neither
		 * cares which database sits behind them.
		 */
		it.each([
			"neon",
			"supabase",
			"planetscale",
			"turso",
			"mongodb",
		])("offers the host-independent options with %s", (database) => {
			const ids = optionsFor(byId("auth"), {
				framework: "nextjs",
				database,
			}).map((o) => o.id);

			expect(ids).toEqual(expect.arrayContaining(["better_auth", "clerk"]));
		});
	});

	/**
	 * Auth0's only SDK with a server session is `@auth0/nextjs-auth0`. Its other
	 * one is a browser-side SPA library, so `currentUser()` on the server would
	 * have nothing to read — offering it with TanStack Start would be offering
	 * something that cannot be built.
	 */
	describe("auth options tied to a framework", () => {
		it("shows Auth0 only with Next.js", () => {
			expect(
				optionsFor(byId("auth"), { framework: "nextjs" }).map((o) => o.id),
			).toContain("auth0");
			expect(
				optionsFor(byId("auth"), { framework: "tanstack_start" }).map(
					(o) => o.id,
				),
			).not.toContain("auth0");
		});

		it("hides it while the framework is still unanswered", () => {
			expect(optionsFor(byId("auth"), {}).map((o) => o.id)).not.toContain(
				"auth0",
			);
		});

		/**
		 * Clerk ships `@clerk/nextjs` *and* `@clerk/tanstack-react-start`, and
		 * Better Auth is framework-agnostic — so neither is constrained here.
		 * Both were checked against the registry rather than assumed.
		 */
		it.each([
			"nextjs",
			"tanstack_start",
		])("offers the framework-agnostic options with %s", (framework) => {
			const ids = optionsFor(byId("auth"), { framework }).map((o) => o.id);

			expect(ids).toEqual(expect.arrayContaining(["better_auth", "clerk"]));
		});
	});

	/**
	 * Adding MongoDB to the menu made the ORM question conditional for real:
	 * Drizzle has no MongoDB driver and Mongoose has no SQL one, so offering
	 * either against the wrong database is offering something that cannot build.
	 */
	describe("the ORM options a database can actually use", () => {
		it.each([
			"neon",
			"supabase",
			"planetscale",
			"turso",
		])("offers Drizzle and Prisma for %s", (database) => {
			expect(
				optionsFor(byId("orm"), { framework: "nextjs", database }).map(
					(o) => o.id,
				),
			).toEqual(["drizzle", "prisma"]);
		});

		it("offers Prisma and Mongoose for MongoDB", () => {
			expect(
				optionsFor(byId("orm"), {
					framework: "nextjs",
					database: "mongodb",
				}).map((o) => o.id),
			).toEqual(["prisma", "mongoose"]);
		});

		/** Prisma is the only one that spans both, so it is never filtered out. */
		it("offers Prisma whatever the database", () => {
			for (const database of byId("database").options ?? []) {
				expect(
					optionsFor(byId("orm"), {
						framework: "nextjs",
						database: database.id,
					}).map((o) => o.id),
				).toContain("prisma");
			}
		});

		it("offers only Prisma before a database is chosen", () => {
			expect(
				optionsFor(byId("orm"), { framework: "nextjs" }).map((o) => o.id),
			).toEqual(["prisma"]);
		});
	});

	/**
	 * Tags rather than ids is what makes this cheap: a new Postgres host is
	 * understood by Drizzle the moment it is tagged, with no ORM edited.
	 */
	it("works off what a choice is, not which one it is", () => {
		const sql = (byId("database").options ?? []).filter((option) =>
			option.tags?.includes("sql"),
		);

		expect(sql.length).toBeGreaterThan(1);
		for (const database of sql) {
			expect(
				optionsFor(byId("orm"), {
					framework: "nextjs",
					database: database.id,
				}).map((o) => o.id),
			).toContain("drizzle");
		}
	});
});

/**
 * React + Vite is a browser-only app, and every constraint below exists for
 * one reason: a bundle has no secrets. Whatever the app can read, so can every
 * visitor with devtools open. These are the pairings the landing page promises
 * are "never offered in the first place", and they are the ones where offering
 * them would generate a project that leaks a credential.
 */
describe("what a browser-only app is offered", () => {
	const spa = { framework: "react_vite" };
	const idsFor = (id: string, answers: StarterAnswers) =>
		optionsFor(byId(id), answers).map((option) => option.id);

	it("offers only the database with a browser client", () => {
		expect(idsFor("database", spa)).toEqual(["supabase"]);
	});

	/** All three ORMs open a connection with a credential. */
	it("offers no ORM, and says what it uses instead", () => {
		const ids = idsFor("orm", { ...spa, database: "supabase" });

		expect(ids).toEqual(["none"]);
		expect(byId("orm").options?.find((o) => o.id === "none")?.label).toBe(
			"Supabase client",
		);
	});

	/**
	 * The question must never be empty: `isStarterAnswered` requires an answer
	 * that is still on offer, so a question with no options would leave the
	 * wizard unable to move on from it.
	 */
	it.each(
		STARTER_QUESTIONS.filter((q) => q.kind === "choice").map((q) => q.id),
	)("leaves %s with something to pick", (id) => {
		const answers: StarterAnswers = { ...spa };
		for (const question of STARTER_QUESTIONS) {
			if (question.id === id) break;
			if (question.kind !== "choice") continue;
			answers[question.id] = optionsFor(question, answers)[0]?.id;
		}

		expect(idsFor(id, answers).length).toBeGreaterThan(0);
	});

	it("offers only auth that works without a server", () => {
		const ids = idsFor("auth", { ...spa, database: "supabase" });

		expect(ids).toEqual(["supabase_auth", "clerk"]);
		/* Better Auth *is* the server: it mounts a handler and signs cookies. */
		expect(ids).not.toContain("better_auth");
	});

	it.each([
		["billing", "Stripe's key is a secret and Checkout is a server call"],
		["email", "every provider key can send mail as you"],
	])("offers no %s, because %s", (id) => {
		expect(idsFor(id, spa)).toEqual(["none"]);
	});

	/** The same options are still there for a framework that has a server. */
	it("takes none of this away from Next.js", () => {
		const server = { framework: "nextjs", database: "supabase" };

		expect(idsFor("orm", server)).toContain("drizzle");
		expect(idsFor("auth", server)).toContain("better_auth");
		expect(idsFor("billing", server)).toContain("stripe");
		expect(idsFor("email", server)).toContain("resend");
	});
});

describe("pruneAnswers", () => {
	it("keeps a set that is still coherent", () => {
		expect(pruneAnswers(complete)).toEqual(complete);
	});

	/**
	 * Going back and changing the database is the move that strands an auth
	 * answer. Left in place it is invisible on screen and still in the payload.
	 */
	it("drops an answer the new database no longer allows", () => {
		const pruned = pruneAnswers({ ...complete, database: "neon" });

		expect(pruned.auth).toBeUndefined();
		expect(pruned.framework).toBe("nextjs");
		expect(pruned.project).toBe("my-app");
	});

	it("leaves an auth answer that survives the change", () => {
		const pruned = pruneAnswers({
			...complete,
			auth: "better_auth",
			database: "neon",
		});

		expect(pruned.auth).toBe("better_auth");
	});

	it("discards a value no question offers", () => {
		expect(pruneAnswers({ framework: "svelte" }).framework).toBeUndefined();
	});

	/** Switching from MongoDB to a SQL host strands a Mongoose answer. */
	it("drops an ORM the new database cannot use", () => {
		const onMongo = pruneAnswers({
			...complete,
			database: "mongodb",
			orm: "mongoose",
			auth: "better_auth",
		});
		expect(onMongo.orm).toBe("mongoose");

		const movedToSql = pruneAnswers({ ...onMongo, database: "turso" });
		expect(movedToSql.orm).toBeUndefined();
	});

	it("keeps Prisma across a move in either direction", () => {
		const answers = { ...complete, orm: "prisma", auth: "better_auth" };

		expect(pruneAnswers({ ...answers, database: "mongodb" }).orm).toBe(
			"prisma",
		);
		expect(pruneAnswers({ ...answers, database: "turso" }).orm).toBe("prisma");
	});
});

/**
 * The bug these were written for: adding the Email question made every starter
 * already in the database fail `isStarterComplete`, and the detail page — which
 * rebuilds the file tree from the stored answers — threw on render. The record
 * was fine; the question was new.
 */
describe("backfillAnswers", () => {
	/** Exactly the shape of a row written before the Email question existed. */
	const beforeEmail: StarterAnswers = {
		framework: "nextjs",
		components: "shadcn",
		database: "supabase",
		orm: "drizzle",
		auth: "supabase_auth",
		billing: "stripe",
		project: "my-app",
	};

	it("makes a record written before a question was added complete again", () => {
		expect(isStarterComplete(beforeEmail)).toBe(false);
		expect(isStarterComplete(backfillAnswers(beforeEmail))).toBe(true);
	});

	/** "Not yet" is not a guess — those starters genuinely sent no email. */
	it("fills the answer the absence actually meant", () => {
		expect(backfillAnswers(beforeEmail).email).toBe("none");
	});

	it("leaves an answer that is already there alone", () => {
		expect(backfillAnswers({ ...beforeEmail, email: "resend" }).email).toBe(
			"resend",
		);
	});

	/**
	 * The line that keeps this from papering over real breakage: a question with
	 * no honest default stays missing, and a *present* answer that has since
	 * become illegal is left to fail rather than silently rewritten.
	 */
	it("does not invent an answer for a question that has no default", () => {
		expect(backfillAnswers({ project: "my-app" }).framework).toBeUndefined();
	});

	it("does not rescue a pairing that is genuinely impossible", () => {
		const impossible = {
			...beforeEmail,
			framework: "tanstack_start",
			auth: "auth0",
		};

		expect(isStarterComplete(backfillAnswers(impossible))).toBe(false);
	});
});

describe("answerProblems", () => {
	it("says nothing about a set that is fine", () => {
		expect(answerProblems(complete)).toEqual([]);
	});

	it("names a question that was never answered", () => {
		const { email, ...rest } = complete;

		expect(answerProblems(rest).map((p) => p.problem)).toEqual([
			"Email was never answered.",
		]);
		expect(email).toBe("resend");
	});

	/**
	 * The requirement is spelled out from the tags, so a rule added later
	 * explains itself rather than waiting for someone to write prose for it.
	 */
	it("names what a stranded answer needs, not merely that it is wrong", () => {
		const problems = answerProblems({
			...complete,
			framework: "tanstack_start",
			auth: "auth0",
		});

		expect(problems.map((p) => p.problem)).toContain(
			"Auth0 needs Framework to be Next.js.",
		);
	});

	it("reports an option the catalogue no longer has", () => {
		expect(
			answerProblems({ ...complete, database: "rethinkdb" }).map(
				(p) => p.problem,
			),
		).toContain("Database is set to “rethinkdb”, which is no longer offered.");
	});

	it("reports a project name that cannot be a repository", () => {
		expect(
			answerProblems({ ...complete, project: "My App" }).map((p) => p.problem),
		).toEqual(["“My App” cannot be used as a repository name."]);
	});
});

describe("isProjectNameValid", () => {
	it.each(["my-app", "app", "a1", "a".repeat(39)])("accepts %s", (name) => {
		expect(isProjectNameValid(name)).toBe(true);
	});

	it.each([
		"",
		"My-App",
		"-leading",
		"has space",
		"has_underscore",
		"a".repeat(40),
	])("rejects %p", (name) => {
		expect(isProjectNameValid(name)).toBe(false);
	});
});

describe("isStarterAnswered", () => {
	it("wants a valid name for the project", () => {
		expect(isStarterAnswered(byId("project"), { project: "my-app" })).toBe(
			true,
		);
		expect(isStarterAnswered(byId("project"), { project: "My App" })).toBe(
			false,
		);
	});

	/** An answer that is no longer on offer is not an answer. */
	it("rejects a choice the current answers have ruled out", () => {
		expect(
			isStarterAnswered(byId("auth"), {
				database: "neon",
				auth: "supabase_auth",
			}),
		).toBe(false);
	});
});

describe("isStarterComplete", () => {
	it("is true for a full coherent set", () => {
		expect(isStarterComplete(complete)).toBe(true);
	});

	it.each(STARTER_QUESTIONS)("is false while $id is missing", (question) => {
		const answers = { ...complete };
		delete answers[question.id];

		expect(isStarterComplete(answers)).toBe(false);
	});
});
