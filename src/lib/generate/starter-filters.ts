import {
	STARTER_QUESTIONS,
	type StarterQuestionId,
} from "@/lib/starter-questions";
import type { StarterRecord } from "./starters";

/**
 * Searching, filtering and paging a list of starters.
 *
 * Pure and separate from the components that render it, because these are the
 * parts with edge cases worth testing — an empty page after a delete, a filter
 * that matches nothing, a search that should not care about case.
 */

/**
 * Which questions are worth filtering on.
 *
 * One. Eight dropdowns would be a form, and three were still more chrome than
 * the thing they filter — a name search finds a specific starter faster than
 * any of them, and framework is the one axis people actually sort their work
 * along. The rest of the stack is on every card as marks, and readable at a
 * glance without a control.
 */
export const FILTERABLE: StarterQuestionId[] = ["framework"];

export type StarterFilters = {
	search: string;
	/** Question id → chosen option id. Absent means "any". */
	choices: Partial<Record<StarterQuestionId, string>>;
};

export const NO_FILTERS: StarterFilters = { search: "", choices: {} };

export const PAGE_SIZE = 9;

/** The options actually present in this account's starters, per question. */
export function availableChoices(records: StarterRecord[]) {
	return FILTERABLE.map((id) => {
		const question = STARTER_QUESTIONS.find((q) => q.id === id);
		const present = new Set(
			records.map((record) => record.answers[id]).filter(Boolean),
		);

		return {
			id,
			label: question?.label ?? id,
			/* Only offer a filter that would match something. A dropdown full of
			   options that all yield nothing is worse than no dropdown. */
			options: (question?.options ?? []).filter((option) =>
				present.has(option.id),
			),
		};
	}).filter((group) => group.options.length > 1);
}

export function filterStarters(
	records: StarterRecord[],
	filters: StarterFilters,
): StarterRecord[] {
	const needle = filters.search.trim().toLowerCase();

	return records.filter((record) => {
		if (needle && !record.project.toLowerCase().includes(needle)) return false;

		return Object.entries(filters.choices).every(
			([id, chosen]) =>
				!chosen || record.answers[id as StarterQuestionId] === chosen,
		);
	});
}

export type Page<T> = {
	items: T[];
	/** 1-based, and clamped to something that exists. */
	page: number;
	pages: number;
	total: number;
};

/**
 * One page of results.
 *
 * The requested page is clamped rather than trusted. Deleting the last starter
 * on page three leaves the reader on a page that no longer exists, and showing
 * them an empty list with "Page 3 of 2" underneath is a bug they cannot act on.
 */
export function paginate<T>(
	items: T[],
	page: number,
	size = PAGE_SIZE,
): Page<T> {
	const pages = Math.max(1, Math.ceil(items.length / size));
	const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
	const start = (current - 1) * size;

	return {
		items: items.slice(start, start + size),
		page: current,
		pages,
		total: items.length,
	};
}

export function hasActiveFilters(filters: StarterFilters): boolean {
	return (
		filters.search.trim() !== "" || Object.values(filters.choices).some(Boolean)
	);
}
