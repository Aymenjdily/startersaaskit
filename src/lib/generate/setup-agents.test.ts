import { describe, expect, it } from "vitest";
import type { StarterAnswers } from "@/lib/starter-questions";
import { everyGeneratedStarter } from "@/test/starter-matrix";
import { buildStarter } from "./build-starter";
import { setupAgentsGuide } from "./setup-agents";

/**
 * `SETUP_AGENTS.md` hands the reader a prompt for drafting a product-specific
 * `AGENTS.md` — see `setup-agents.ts`'s own comment for why the generator
 * cannot write that part itself. These tests hold the mechanism to account:
 * the stack it already knows has to appear, the blanks only a person can fill
 * have to stay blanks rather than being guessed at, and the file has to
 * actually reach the starter.
 */

const answers: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "neon",
	orm: "drizzle",
	auth: "better_auth",
	billing: "stripe",
	email: "resend",
	jobs: "trigger",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

describe("setupAgentsGuide", () => {
	it("names every choice the wizard collected", () => {
		const guide = setupAgentsGuide(answers, ["DATABASE_URL"]);

		for (const label of [
			"Next.js",
			"shadcn/ui",
			"Neon",
			"Drizzle",
			"Better Auth",
			"Stripe",
			"Resend",
			"Trigger.dev",
			"pnpm",
		]) {
			expect(guide).toContain(label);
		}
	});

	/**
	 * The generator was told a stack, not a product. Filling in a guess at
	 * "what this app does" would be worse than an obvious blank — it would
	 * read as authoritative and quietly narrow what the reader thinks to
	 * change.
	 */
	it("leaves the product itself as a blank for a person to fill in", () => {
		const guide = setupAgentsGuide(answers, []);

		expect(guide).toMatch(/\[DESCRIBE YOUR PRODUCT/);
		expect(guide).toMatch(/\[WHAT MAKES THIS/);
		expect(guide).toMatch(/\[LIST WHAT YOU ARE NOT\s+BUILDING/);
	});

	it("names the secrets this stack actually introduces", () => {
		const guide = setupAgentsGuide(answers, [
			"DATABASE_URL",
			"STRIPE_SECRET_KEY",
		]);

		expect(guide).toContain("DATABASE_URL, STRIPE_SECRET_KEY");
	});

	/** A SPA with no billing or email has nothing to ask the checklist about. */
	it("says so rather than naming nothing when there is no secret yet", () => {
		const guide = setupAgentsGuide(answers, []);

		expect(guide).toContain("no secret this build has introduced yet");
	});

	it("tells the reader to delete it once they are done", () => {
		expect(setupAgentsGuide(answers, [])).toMatch(/delete this file/i);
	});
});

describe("the file a generated starter ships", () => {
	it("includes SETUP_AGENTS.md alongside AGENTS.md", () => {
		const files = buildStarter(answers);

		expect(files["SETUP_AGENTS.md"]).toBeDefined();
		expect(files["AGENTS.md"]).toBeDefined();
	});

	it("points the reader at it from the README", () => {
		expect(buildStarter(answers)["README.md"]).toContain("SETUP_AGENTS.md");
	});

	/** Every combination, not one fixture — the same bar every matrix test holds. */
	it("ships a non-empty guide for every combination the wizard allows", () => {
		for (const { answers: combo, files } of everyGeneratedStarter()) {
			expect(files["SETUP_AGENTS.md"], JSON.stringify(combo)).toBeTruthy();
			expect(files["SETUP_AGENTS.md"].length).toBeGreaterThan(200);
		}
	});
});
