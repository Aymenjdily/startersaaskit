import { describe, expect, it } from "vitest";
import type { StarterAnswers } from "@/lib/starter-questions";
import {
	availableChoices,
	filterStarters,
	hasActiveFilters,
	NO_FILTERS,
	PAGE_SIZE,
	paginate,
} from "./starter-filters";
import type { StarterRecord } from "./starters";

const base: StarterAnswers = {
	framework: "nextjs",
	components: "shadcn",
	database: "neon",
	orm: "drizzle",
	auth: "better_auth",
	billing: "stripe",
	email: "resend",
	packageManager: "pnpm",
	landing: "editorial",
	project: "my-app",
};

const record = (
	project: string,
	answers: StarterAnswers = {},
	created = "2026-01-01T00:00:00Z",
): StarterRecord => ({
	id: project,
	project,
	answers: { ...base, ...answers, project },
	created_at: created,
});

const many = (count: number) =>
	Array.from({ length: count }, (_, i) => record(`app-${i}`));

describe("filterStarters", () => {
	const starters = [
		record("billing-api"),
		record("marketing-site", { framework: "tanstack_start" }),
		record("Internal-Tool", { database: "mongodb", orm: "mongoose" }),
	];

	it("returns everything when nothing is asked for", () => {
		expect(filterStarters(starters, NO_FILTERS)).toHaveLength(3);
	});

	it("matches part of a name", () => {
		const found = filterStarters(starters, { ...NO_FILTERS, search: "market" });

		expect(found.map((r) => r.project)).toEqual(["marketing-site"]);
	});

	/** Nobody types the capitals back. */
	it("does not care about case", () => {
		expect(
			filterStarters(starters, { ...NO_FILTERS, search: "internal" }),
		).toHaveLength(1);
	});

	it("ignores whitespace around the search", () => {
		expect(
			filterStarters(starters, { ...NO_FILTERS, search: "   billing  " }),
		).toHaveLength(1);
	});

	it("filters by a chosen option", () => {
		const found = filterStarters(starters, {
			...NO_FILTERS,
			choices: { framework: "tanstack_start" },
		});

		expect(found.map((r) => r.project)).toEqual(["marketing-site"]);
	});

	it("treats an empty choice as no filter at all", () => {
		expect(
			filterStarters(starters, { ...NO_FILTERS, choices: { framework: "" } }),
		).toHaveLength(3);
	});

	it("applies search and filters together", () => {
		const found = filterStarters(starters, {
			search: "site",
			choices: { framework: "nextjs" },
		});

		expect(found).toHaveLength(0);
	});

	it("returns nothing rather than everything when nothing matches", () => {
		expect(
			filterStarters(starters, { ...NO_FILTERS, search: "nope" }),
		).toHaveLength(0);
	});
});

describe("availableChoices", () => {
	/** A dropdown whose every option yields nothing is worse than no dropdown. */
	it("offers a filter only where the starters actually differ", () => {
		const groups = availableChoices([
			record("a"),
			record("b", { framework: "tanstack_start" }),
		]);

		expect(groups.map((g) => g.id)).toEqual(["framework"]);
		expect(groups[0].options.map((o) => o.id).sort()).toEqual([
			"nextjs",
			"tanstack_start",
		]);
	});

	it("offers nothing when every starter is the same", () => {
		expect(availableChoices([record("a"), record("b")])).toEqual([]);
	});

	it("offers nothing for an empty account", () => {
		expect(availableChoices([])).toEqual([]);
	});
});

describe("paginate", () => {
	it("cuts the list into pages", () => {
		const page = paginate(many(PAGE_SIZE * 2 + 1), 1);

		expect(page.items).toHaveLength(PAGE_SIZE);
		expect(page.pages).toBe(3);
		expect(page.total).toBe(PAGE_SIZE * 2 + 1);
	});

	it("gives the tail on the last page", () => {
		const page = paginate(many(PAGE_SIZE + 2), 2);

		expect(page.items).toHaveLength(2);
		expect(page.page).toBe(2);
	});

	/**
	 * Deleting the last starter on the last page leaves the reader pointing at
	 * a page that no longer exists. Showing an empty grid under "Page 3 of 2"
	 * is a dead end, so the page is clamped instead.
	 */
	it("clamps a page past the end", () => {
		const page = paginate(many(4), 9);

		expect(page.page).toBe(1);
		expect(page.items).toHaveLength(4);
	});

	it.each([0, -3, Number.NaN])("clamps %p up to the first page", (asked) => {
		expect(paginate(many(4), asked).page).toBe(1);
	});

	it("reports one page for an empty list, not zero", () => {
		const page = paginate([], 1);

		expect(page.pages).toBe(1);
		expect(page.total).toBe(0);
		expect(page.items).toEqual([]);
	});

	it("does not lose or duplicate anything across pages", () => {
		const all = many(PAGE_SIZE * 2 + 3);
		const seen = [1, 2, 3].flatMap((n) => paginate(all, n).items);

		expect(seen).toHaveLength(all.length);
		expect(new Set(seen.map((r) => r.id)).size).toBe(all.length);
	});
});

describe("hasActiveFilters", () => {
	it("is false for a clean slate", () => {
		expect(hasActiveFilters(NO_FILTERS)).toBe(false);
	});

	/** Whitespace is not a search, and offering "Clear" for it is noise. */
	it("ignores a search of only spaces", () => {
		expect(hasActiveFilters({ ...NO_FILTERS, search: "   " })).toBe(false);
	});

	it("is true for a search", () => {
		expect(hasActiveFilters({ ...NO_FILTERS, search: "api" })).toBe(true);
	});

	it("is true for a chosen option", () => {
		expect(
			hasActiveFilters({ ...NO_FILTERS, choices: { framework: "nextjs" } }),
		).toBe(true);
	});

	it("is false once a choice is cleared", () => {
		expect(
			hasActiveFilters({ ...NO_FILTERS, choices: { framework: undefined } }),
		).toBe(false);
	});
});
