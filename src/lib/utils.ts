import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to be told about our custom font-size tokens.
 *
 * Its default rules resolve `text-*` to a colour unless the suffix looks like a
 * t-shirt size, so `text-h2` was being classed as a colour — putting it in the
 * same conflict group as `text-ink`. `cn("text-h2 text-ink")` then returned just
 * `"text-ink"`, silently dropping the size and rendering 60px headings at 16px.
 *
 * Registering the tokens from the `@theme` block in `styles.css` puts them back
 * in the font-size group, where they no longer conflict with colours.
 */
const twMerge = extendTailwindMerge({
	extend: {
		classGroups: {
			"font-size": [
				{
					text: ["display", "hero", "h2", "h3", "h4", "body-lg", "body"],
				},
			],
		},
	},
});

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
