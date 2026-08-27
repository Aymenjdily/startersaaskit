/**
 * The console's navigation, and the only place it is written down.
 *
 * `built: false` is not a styling flag — it is an admission. The console has
 * one job that works today (answering questions) and several that do not, and
 * a sidebar that presents all of them identically teaches people to click into
 * empty rooms. Every destination here is a route that exists; a test resolves
 * each href against `src/routes/` so a renamed page cannot leave a dead link.
 */

export const CONSOLE_HREF = "/dashboard";

export type NavIcon = "grid" | "spark" | "stack" | "sliders" | "shield" | "bug";

export type NavItem = {
	href: string;
	label: string;
	icon: NavIcon;
	/** False while the page is a placeholder. The sidebar labels these. */
	built: boolean;
	/**
	 * Hidden from the rail unless the account is an admin.
	 *
	 * A convenience, not a lock. The route is in the bundle whether or not the
	 * link is drawn, so what actually keeps the data private is the row level
	 * security in `0003_feedback.sql` — this only stops the other 99% of people
	 * seeing a door they cannot open.
	 */
	adminOnly?: boolean;
};

/**
 * Generate is deliberately absent. It is the console's primary action, and a
 * primary action belongs in a button where it can be the loudest thing on the
 * page — not as the second row of a list it would outrank. `/generate` still
 * exists as a route so that button has somewhere to point.
 */
export const NAV_ITEMS: readonly NavItem[] = [
	{ href: CONSOLE_HREF, label: "Overview", icon: "grid", built: true },
	{ href: "/starters", label: "Starters", icon: "stack", built: false },
	{ href: "/settings", label: "Settings", icon: "sliders", built: false },
	{
		href: "/admin",
		label: "Admin",
		icon: "shield",
		built: true,
		adminOnly: true,
	},
] as const;

/** The rail's items for a given account. */
export function navItemsFor(isAdmin: boolean): readonly NavItem[] {
	return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}

/**
 * Which item a path belongs to. Longest match wins, so `/starters/abc` lights
 * up "Starters" rather than nothing, while `/dashboard` does not swallow every
 * path that happens to start with a slash.
 */
export function activeHref(path: string): string | null {
	const matches = NAV_ITEMS.filter(
		(item) => path === item.href || path.startsWith(`${item.href}/`),
	).map((item) => item.href);

	return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

/**
 * What to call someone, given whatever the provider handed over. Google sends
 * `full_name`, GitHub sends `name` or `user_name`, and an email sign-up sends
 * nothing at all — in which case the local part of the address beats showing
 * a blank space or the word "User".
 */
export function displayNameFor(user: {
	email?: string | null;
	user_metadata?: Record<string, unknown> | null;
}): string {
	const meta = user.user_metadata ?? {};

	for (const key of ["full_name", "name", "user_name"]) {
		const value = meta[key];
		if (typeof value === "string" && value.trim()) return value.trim();
	}

	const email = user.email?.trim();
	if (email) return email.split("@")[0];

	return "Your account";
}

/** The provider's avatar, if it gave us one we can actually load. */
export function avatarFor(user: {
	user_metadata?: Record<string, unknown> | null;
}): string | null {
	const meta = user.user_metadata ?? {};

	for (const key of ["avatar_url", "picture"]) {
		const value = meta[key];
		if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
	}
	return null;
}

/** Two letters at most: more than that stops reading as a monogram. */
export function initialsFor(name: string): string {
	const words = name.split(/[\s@._-]+/).filter(Boolean);
	const letters = words.slice(0, 2).map((word) => word[0]);

	return (letters.join("") || "?").toUpperCase();
}
