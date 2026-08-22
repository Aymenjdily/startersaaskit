import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The page's one horizontal rhythm. The navbar, hero, statement and footer all
 * lay out as gutter-outside-the-content-box, so this has to as well:
 *
 *   - `md:px-6` (24px), not `lg:px-8`, or these sections sit 8px further in
 *     than the navbar above them.
 *   - the cap is the content width *plus* both gutters, because the padding is
 *     inside the border box. Capping at `max-w-content` instead would shrink
 *     the content itself to 1300 − 48 = 1252px and break the alignment again
 *     above 1348px, where the cap starts to bind.
 */
export function Container({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"mx-auto w-full max-w-[calc(var(--container-content)_+_48px)] px-gutter md:px-6",
				className,
			)}
			{...props}
		/>
	);
}
