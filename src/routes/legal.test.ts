import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LEGAL_LINKS } from "@/components/Footer";
import { GOVERNING_LAW, LEGAL_CONTACT, SUBPROCESSORS } from "@/lib/legal";
import { DEFAULT_GENERATION_LIMIT, FEEDBACK_REWARD } from "@/lib/quota";
import { isServedRoute } from "@/test/served-route";

/**
 * The legal pages, checked against what the product actually does.
 *
 * A privacy policy is not prose, it is a set of claims — and every one of them
 * can be made false by a commit somewhere else in the repo. Nobody rereads
 * `privacy.tsx` when they add an analytics script or change the generation
 * limit, so these tests fail instead.
 *
 * They read the route source rather than rendering it, because what is being
 * checked is where a fact came from: a page that renders "5 generations"
 * correctly is still wrong if it hard-coded the 5.
 */

const PRIVACY = readFileSync("src/routes/privacy.tsx", "utf8");
const TERMS = readFileSync("src/routes/terms.tsx", "utf8");

describe("the legal pages", () => {
	describe("are reachable", () => {
		it.each(LEGAL_LINKS)("$label points at a route that exists", ({ href }) => {
			expect(isServedRoute(href)).toBe(true);
		});

		/* Unlinked, they exist only for whoever already knows the URL — which
		   defeats both the reader and the OAuth reviewer looking for them. */
		it("are both linked from the footer", () => {
			expect(LEGAL_LINKS.map((one) => one.href).sort()).toEqual([
				"/privacy",
				"/terms",
			]);
		});
	});

	describe("state facts that live elsewhere in the code", () => {
		/**
		 * Both pages tell the reader how many generations they get. Typed as a
		 * digit, both would be wrong the day the limit moves, and the only
		 * symptom would be a policy that lies.
		 */
		it("take the generation limit from the constant that enforces it", () => {
			expect(PRIVACY).toContain("DEFAULT_GENERATION_LIMIT");
			expect(TERMS).toContain("DEFAULT_GENERATION_LIMIT");
			expect(DEFAULT_GENERATION_LIMIT).toBeGreaterThan(0);
		});

		/* The terms now promise that feedback earns more. If the reward is ever
		   removed, the clause selling it has to go with it. */
		it("take the feedback reward from the constant that grants it", () => {
			expect(TERMS).toContain("FEEDBACK_REWARD");
			expect(FEEDBACK_REWARD).toBeGreaterThan(0);
		});

		/** Named from one list, so the two pages cannot come to disagree. */
		it("name every processor from the shared list", () => {
			expect(PRIVACY).toContain("SUBPROCESSORS");
			expect(SUBPROCESSORS.length).toBeGreaterThan(0);

			for (const one of SUBPROCESSORS) {
				expect(one.name).toBeTruthy();
				expect(one.does).toBeTruthy();
				expect(one.holds).toBeTruthy();
			}
		});

		/**
		 * The policy names PostHog as the one third-party script the site
		 * loads, and says where it loads from. If a later commit adds a
		 * second analytics tool, or a different provider takes over pageview
		 * capture, the policy is describing a product that no longer exists
		 * — so this checks the claim points at the real, single source.
		 */
		it("names the one third-party script it actually loads", () => {
			const root = readFileSync("src/routes/__root.tsx", "utf8");
			const analytics = readFileSync("src/lib/analytics.ts", "utf8");

			expect(root).toMatch(/<Analytics/);
			expect(analytics).toMatch(/posthog/i);
			expect(PRIVACY).toMatch(/PostHog/);
		});

		/* A second analytics provider shipping without anyone reopening this
		   page is exactly the failure the test above exists to catch — so it
		   also has to fail if one shows up somewhere else in the shell. */
		it("does not pick up an undisclosed second tracker", () => {
			const shell = [
				"src/routes/__root.tsx",
				"src/components/Navbar.tsx",
				"src/components/Footer.tsx",
			];

			for (const path of shell) {
				expect(readFileSync(path, "utf8")).not.toMatch(
					/googletagmanager|google-analytics|gtag\(|plausible|mixpanel|segment\.com|hotjar|fbq\(/i,
				);
			}
		});
	});

	describe("cover what each page has to cover", () => {
		/* Anchored on the clause ids, so deleting a section fails rather than
		   silently shortening the policy. */
		it.each([
			["what is collected", "what-we-collect"],
			["who else handles it", "who-else"],
			["cookies", "cookies"],
			["how long it is kept", "how-long"],
			["access and deletion rights", "your-rights"],
			["how changes are announced", "changes"],
			["a contact route", "contact"],
		])("privacy covers %s", (_, id) => {
			expect(PRIVACY).toContain(`id="${id}"`);
		});

		it.each([
			["what the service is", "what-this-is"],
			["what it costs", "what-it-costs"],
			["who owns the generated code", "what-you-own"],
			["the absence of warranty", "no-warranty"],
			["acceptable use", "fair-use"],
			["liability", "liability"],
			["governing law", "law"],
		])("terms cover %s", (_, id) => {
			expect(TERMS).toContain(`id="${id}"`);
		});
	});

	/**
	 * The one clause a developer actually reads before signing up. If a future
	 * edit softens it into a licence-back or an attribution requirement, that
	 * should be a deliberate act that breaks a test, not a wording tweak.
	 */
	it("promise the generated code outright, with no licence back", () => {
		expect(TERMS).toContain("The code we generate for you is yours");
		expect(TERMS).toContain("No licence back to us");
	});

	describe("carry a usable contact and jurisdiction", () => {
		/**
		 * The address a deletion request and a regulator both write to. An
		 * unroutable one makes the rights section decorative.
		 */
		it("has a contact address that is at least well-formed", () => {
			expect(LEGAL_CONTACT).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i);
			expect(LEGAL_CONTACT).not.toMatch(/example\.(com|org)/i);
		});

		/**
		 * Deliberately not asserting the jurisdiction is filled in.
		 *
		 * It is still a marker, because guessing which country's courts hear
		 * disputes is not a thing code should decide. A test failing over it
		 * would just be turned off; the marker is visible in the rendered page,
		 * which is a louder reminder than a red suite. What this does assert is
		 * that the clause reads from the constant, so filling that one string in
		 * is genuinely all that is left to do.
		 */
		it("reads the jurisdiction from one place, so it is set once", () => {
			expect(TERMS).toContain("{GOVERNING_LAW}");
			expect(GOVERNING_LAW).not.toHaveLength(0);
		});
	});

	it("date both pages, so a reader can tell how current they are", () => {
		expect(PRIVACY).toContain("PRIVACY_UPDATED");
		expect(TERMS).toContain("TERMS_UPDATED");
	});
});
