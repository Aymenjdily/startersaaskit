import type { NavIcon } from "@/lib/console-nav";
import { cn } from "@/lib/utils";

/**
 * Geometry, drawn here rather than pulled from an icon package. These are four
 * shapes; a dependency for them would cost more to keep current than to draw.
 *
 * Stroke rather than fill, so they sit at the same visual weight as the 13px
 * labels beside them instead of shouting over them.
 */
const PATHS: Record<NavIcon, string> = {
	grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
	spark: "M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11",
	stack: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5",
	sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 4v6M7 14v6",
	shield:
		"M12 3.5l7.5 2.8v5.4c0 4.5-3 7.7-7.5 9.3-4.5-1.6-7.5-4.8-7.5-9.3V6.3L12 3.5z",
	bug: "M9 6a3 3 0 0 1 6 0M8 9h8v5a4 4 0 0 1-8 0V9zM4 11h4M16 11h4M5 6l2.5 2M19 6l-2.5 2M5 17l2.5-2M19 17l-2.5-2",
};

export function NavGlyph({
	className,
	icon,
}: {
	className?: string;
	icon: NavIcon;
}) {
	return (
		<svg
			aria-hidden="true"
			className={cn("size-[18px] shrink-0", className)}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			viewBox="0 0 24 24"
		>
			<path d={PATHS[icon]} />
		</svg>
	);
}
