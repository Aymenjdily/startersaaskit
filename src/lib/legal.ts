/**
 * The facts both legal pages state, in one place.
 *
 * ## Read this before you launch
 *
 * These pages were written against what the code actually does — the tables in
 * `supabase/migrations/`, the providers in `auth/controls.tsx`, what
 * `src/lib/analytics.ts` does and does not capture — and every claim in them
 * was checked against it. That makes
 * them accurate. It does not make them *sufficient*: whether you need a DPA, a
 * cookie banner, a specific GDPR representative, or different wording for your
 * jurisdiction is a question for a lawyer, and this file has never met one.
 *
 * The two constants below are placeholders that must be real before launch. A
 * privacy policy with an unroutable contact address is worse than none: it is
 * the address a regulator and a Google OAuth reviewer both write to.
 */

/** Where privacy and account requests actually arrive. **Set this.** */
export const LEGAL_CONTACT = "hello@startersaaskit.com";

/**
 * Whose law governs the terms, and where disputes go. **Set this.**
 *
 * Left as a marker rather than guessed. A governing-law clause naming the wrong
 * country is not a small error — it is the clause that decides which court
 * hears everything else.
 */
export const GOVERNING_LAW = "[jurisdiction — set before launch]";

/**
 * When each page last changed.
 *
 * Bump the page you edited, in the same commit. A reader has no other way to
 * tell whether a policy describes the product they are using today.
 */
export const PRIVACY_UPDATED = "2026-09-01";
export const TERMS_UPDATED = "2026-08-27";

/**
 * Everyone who processes data on our behalf.
 *
 * Named rather than described as "our service providers". A reader deciding
 * whether to sign up is entitled to know whose infrastructure their email
 * address lands in, and a vague list is the thing GDPR asks you not to write.
 */
export const SUBPROCESSORS = [
	{
		name: "Supabase",
		does: "Hosts the database and runs sign-in.",
		holds: "Your email address, your answers, and anything you report.",
	},
	{
		name: "Google",
		does: "Signs you in, only if you choose the Google button.",
		holds: "Confirms your email address, name and profile picture to us.",
	},
	{
		name: "PostHog",
		does: "Product analytics and masked session recording, on by default and switchable off in Settings.",
		holds:
			"Page views, in-app events, and a masked session recording. Your email address too, once you are signed in.",
	},
] as const;
