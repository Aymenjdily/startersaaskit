import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

/**
 * jsdom implements neither of the two browser APIs our reveal/motion code
 * depends on, so every component that scrolls into view or checks a media query
 * would throw on import. Both stubs default to the "no motion preference,
 * nothing visible yet" state; individual tests override them when they need the
 * other branch.
 */

class MockIntersectionObserver implements IntersectionObserver {
	readonly root = null;
	readonly rootMargin = "";
	readonly scrollMargin = "";
	readonly thresholds: readonly number[] = [];
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
	takeRecords = vi.fn(() => []);
}

/** Lets a test flip `prefers-reduced-motion` before render. */
export function setReducedMotion(reduced: boolean) {
	vi.stubGlobal(
		"matchMedia",
		vi.fn((query: string) => ({
			matches: reduced && query.includes("prefers-reduced-motion"),
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	);
}

beforeEach(() => {
	vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
	setReducedMotion(false);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
	vi.useRealTimers();
});
