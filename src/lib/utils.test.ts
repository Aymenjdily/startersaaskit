import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
	it("joins plain class names", () => {
		expect(cn("flex", "items-center")).toBe("flex items-center");
	});

	it("drops falsy values so `cond && cls` is safe inline", () => {
		expect(cn("flex", false, null, undefined, "", "gap-2")).toBe("flex gap-2");
	});

	it("accepts arrays and conditional objects", () => {
		expect(cn(["flex", "gap-2"], { "text-sage": true, hidden: false })).toBe(
			"flex gap-2 text-sage",
		);
	});

	/**
	 * The whole reason `cn` wraps `twMerge` rather than just `clsx`: a caller's
	 * override has to beat the component's default, regardless of argument order
	 * within the same utility group.
	 */
	it("resolves conflicting utilities in favour of the last one", () => {
		expect(cn("p-3", "p-4")).toBe("p-4");
		expect(cn("text-white/70", "text-sage")).toBe("text-sage");
	});

	it("keeps utilities from different groups even when they share a prefix", () => {
		expect(cn("p-4", "px-6")).toBe("p-4 px-6");
	});

	/**
	 * The wired-grid tiles rely on this: `rounded-[8px] sm:rounded-[10px]` must
	 * survive, and a bare `rounded-lg` must not silently win over an explicit
	 * arbitrary radius passed later.
	 */
	it("treats responsive variants as independent of their base utility", () => {
		expect(cn("rounded-[8px]", "sm:rounded-[10px]")).toBe(
			"rounded-[8px] sm:rounded-[10px]",
		);
		expect(cn("rounded-lg", "rounded-[8px]")).toBe("rounded-[8px]");
	});

	/**
	 * Regression: `SectionHeading` renders `cn("... text-h2 text-ink")`. Because
	 * tailwind-merge only recognises t-shirt sizes as font sizes, `text-h2` was
	 * being treated as a colour, landing in the same conflict group as `text-ink`
	 * and losing to it — so every heading built on the shared primitive rendered
	 * at the 16px default instead of 60px. `cn` now registers the `@theme` tokens.
	 */
	describe("custom font-size tokens", () => {
		const SIZES = [
			"text-display",
			"text-hero",
			"text-h2",
			"text-h3",
			"text-h4",
			"text-body-lg",
			"text-body",
		];

		it.each(SIZES)("keeps %s alongside a colour token", (size) => {
			expect(cn(size, "text-ink").split(" ").sort()).toEqual(
				[size, "text-ink"].sort(),
			);
			// Order must not matter either.
			expect(cn("text-ink", size).split(" ").sort()).toEqual(
				[size, "text-ink"].sort(),
			);
		});

		it("still lets one size override another", () => {
			expect(cn("text-body", "text-h2")).toBe("text-h2");
			expect(cn("text-h2", "text-display")).toBe("text-display");
		});

		it("still lets one colour override another", () => {
			expect(cn("text-ink", "text-ink-muted")).toBe("text-ink-muted");
		});

		it("does not break Tailwind's own size tokens", () => {
			expect(cn("text-sm", "text-lg")).toBe("text-lg");
			expect(cn("text-sm", "text-ink").split(" ").sort()).toEqual([
				"text-ink",
				"text-sm",
			]);
		});
	});

	it("returns an empty string for no meaningful input", () => {
		expect(cn()).toBe("");
		expect(cn(false, undefined)).toBe("");
	});
});
