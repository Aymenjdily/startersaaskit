import { cn } from "@/lib/utils";

/**
 * Placeholders shaped like the thing that is coming.
 *
 * The point is not decoration. A spinner says "wait"; a skeleton says "wait,
 * and here is what will be here" — and, more usefully, it occupies the same
 * space, so nothing on the page moves when the data lands. That only holds if
 * the skeleton is built from the *same* measurements as the real thing, which
 * is why each one below mirrors a specific component rather than being a
 * generic stack of grey bars, and why `skeleton.test.tsx` compares them.
 *
 * ## Announcing it
 *
 * The blocks themselves are `aria-hidden` — a screen reader has nothing to
 * gain from a list of empty rectangles. The container is the part that speaks:
 * `role="status"` with an honest label, so someone not looking at the screen
 * is told the page is loading rather than told nothing at all.
 */

export function Skeleton({
	className,
	style,
}: {
	className?: string;
	/** For the few placeholders whose size varies per row — a tree's indent. */
	style?: React.CSSProperties;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn("block rounded-[6px] skeleton", className)}
			style={style}
		/>
	);
}

/**
 * Wraps a page's skeleton and says what is loading.
 *
 * `aria-busy` as well as `role="status"`: the first is what assistive tech
 * polls for "is this region still working", the second is what makes the label
 * announce on arrival.
 */
export function SkeletonRegion({
	children,
	className,
	label,
}: {
	children: React.ReactNode;
	className?: string;
	/** A full sentence — "Loading your starters" — not "Loading". */
	label: string;
}) {
	return (
		/* \`<output>\` rather than \`<div role="status">\`: it carries the role
		   natively, which is what Biome's useSemanticElements asks for. It is
		   inline by default, so \`block\` restores the wrapper behaviour every
		   caller here already assumes. */
		<output aria-busy="true" className={cn("block", className)}>
			<span className="sr-only">{label}</span>
			{children}
		</output>
	);
}
