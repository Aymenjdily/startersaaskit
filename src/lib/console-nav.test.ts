import { describe, expect, it } from "vitest";
import { isServedRoute } from "@/test/served-route";
import {
	activeHref,
	avatarFor,
	CONSOLE_HREF,
	displayNameFor,
	initialsFor,
	NAV_ITEMS,
	navItemsFor,
	SETTINGS_HREF,
} from "./console-nav";

describe("the console navigation", () => {
	it("offers somewhere to go", () => {
		expect(NAV_ITEMS.length).toBeGreaterThan(0);
	});

	/** A rail is a promise that each row goes somewhere. */
	it.each(NAV_ITEMS)("$label points at a route that is served", ({ href }) => {
		expect(isServedRoute(href)).toBe(true);
	});

	it("has no duplicate destinations", () => {
		const hrefs = NAV_ITEMS.map((item) => item.href);

		expect(new Set(hrefs).size).toBe(hrefs.length);
	});

	it("includes the page a signed-in reader lands on", () => {
		expect(NAV_ITEMS.some((item) => item.href === CONSOLE_HREF)).toBe(true);
	});

	/**
	 * The console has exactly one page with something on it today. If that stops
	 * being true this fails, which is the reminder to unset `built: false`
	 * rather than leaving "Soon" on a page that shipped months ago.
	 */
	/**
	 * Generate is the console's primary action and belongs in a button, not in
	 * a list where it would outrank the rows above it. Its route still has to
	 * exist so that button has a destination — which is the half a "removed
	 * from the sidebar" change tends to delete by accident.
	 */
	it("keeps Generate out of the rail but still served", () => {
		expect(NAV_ITEMS.some((item) => item.href === "/generate")).toBe(false);
		expect(isServedRoute("/generate")).toBe(true);
	});

	/**
	 * `built: false` is an admission, so the list of what is finished is worth
	 * pinning: it should only ever grow in the commit that finishes a page.
	 * Overview was alone here until Admin arrived, and this test still passed
	 * the day `/starters` shipped a full create/download/delete flow — a
	 * pinned list only catches drift once someone remembers to update the pin.
	 */
	it("names the pages that are actually finished", () => {
		expect(
			NAV_ITEMS.filter((item) => item.built)
				.map((item) => item.href)
				.sort(),
		).toEqual([CONSOLE_HREF, "/admin", "/starters", SETTINGS_HREF].sort());
	});

	/**
	 * The admin row is hidden from ordinary accounts, and that hiding is a
	 * courtesy rather than a lock — the row level security in
	 * `0003_feedback.sql` is what protects the data. Still worth asserting, or
	 * every signed-in visitor gets a door they cannot open.
	 */
	it("keeps admin-only rows out of an ordinary rail", () => {
		const ordinary = navItemsFor(false).map((item) => item.href);

		expect(ordinary).not.toContain("/admin");
		expect(navItemsFor(true)).toContain(
			NAV_ITEMS.find((item) => item.href === "/admin"),
		);
	});
});

describe("activeHref", () => {
	it("lights up the page you are on", () => {
		expect(activeHref(CONSOLE_HREF)).toBe(CONSOLE_HREF);
	});

	it("lights up the section for a page nested under it", () => {
		expect(activeHref("/starters/abc123")).toBe("/starters");
	});

	it("lights up nothing off the rail", () => {
		expect(activeHref("/sign-in")).toBeNull();
	});

	/** `/settings-old` is not `/settings`, and a prefix test would say it was. */
	it("does not match a path that merely starts with the same letters", () => {
		expect(activeHref("/settings-old")).toBeNull();
	});
});

describe("displayNameFor", () => {
	it("prefers what the provider called them", () => {
		expect(
			displayNameFor({
				email: "ada@example.com",
				user_metadata: { full_name: "Ada Lovelace" },
			}),
		).toBe("Ada Lovelace");
	});

	it("falls back through the other names a provider might send", () => {
		expect(displayNameFor({ user_metadata: { user_name: "ada" } })).toBe("ada");
	});

	/** An email sign-up sends no name at all, which is the common case. */
	it("uses the local part of the address when there is no name", () => {
		expect(displayNameFor({ email: "ada@example.com" })).toBe("ada");
	});

	it("ignores a name that is only whitespace", () => {
		expect(
			displayNameFor({
				email: "ada@example.com",
				user_metadata: { name: "   " },
			}),
		).toBe("ada");
	});

	it("has something to say even with nothing to go on", () => {
		expect(displayNameFor({})).toBe("Your account");
	});
});

describe("avatarFor", () => {
	it("takes the provider's picture", () => {
		expect(
			avatarFor({ user_metadata: { avatar_url: "https://cdn.test/a.png" } }),
		).toBe("https://cdn.test/a.png");
	});

	it("accepts the other key Google uses", () => {
		expect(
			avatarFor({ user_metadata: { picture: "https://cdn.test/b.png" } }),
		).toBe("https://cdn.test/b.png");
	});

	it("has none when the provider gave none", () => {
		expect(avatarFor({})).toBeNull();
	});

	/**
	 * Metadata is user-controlled, so it is not a trusted source of URLs. A
	 * `javascript:` value in an `src` is the reason this checks the scheme
	 * rather than merely checking for a string.
	 */
	it.each([
		"javascript:alert(1)",
		"data:text/html,<script>alert(1)</script>",
		"/relative/path.png",
		"",
	])("refuses %p", (value) => {
		expect(avatarFor({ user_metadata: { avatar_url: value } })).toBeNull();
	});
});

describe("initialsFor", () => {
	it.each([
		["Ada Lovelace", "AL"],
		["ada", "A"],
		["ada.lovelace", "AL"],
		["Ada Byron King Lovelace", "AB"],
	])("turns %s into %s", (name, expected) => {
		expect(initialsFor(name)).toBe(expected);
	});

	it("always has something to render", () => {
		expect(initialsFor("")).toBe("?");
	});
});
