import { BrandGlyph } from "@/components/landing/brand-glyph";
import type { StarterRecord } from "@/lib/generate/starters";
import { STARTER_QUESTIONS } from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

/**
 * A starter's stack, as the vendors' marks.
 *
 * People recognise these faster than they read the words, and six labels per
 * row is unreadable at any width. The name is still on the `title` of each
 * tile as the accessible/keyboard fallback, but the native tooltip it drives
 * is slow and easy to miss — mid-hover as a small gray icon, not something
 * that visibly invites a look. The bubble below is the same information,
 * just actually noticeable.
 *
 * Shared by the folder cards and the dashboard table, which is the only reason
 * it is not simply inlined in one of them.
 */
export function StackMarks({
	record,
	size = "md",
}: {
	record: StarterRecord;
	size?: "sm" | "md";
}) {
	const marks = STARTER_QUESTIONS.filter(
		(question) => question.kind === "choice",
	)
		.map((question) =>
			question.options?.find(
				(option) => option.id === record.answers[question.id],
			),
		)
		.filter((option) => option?.icon);

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{marks.map((option) => (
				<span
					className="group/mark relative flex"
					key={option?.id}
					title={option?.label}
				>
					<span
						className={cn(
							"flex items-center justify-center rounded-[5px] bg-white/6 text-ink-soft transition-colors duration-150 group-hover/mark:bg-white/10 group-hover/mark:text-ink",
							size === "sm" ? "size-5" : "size-6",
						)}
					>
						{option?.icon && (
							<BrandGlyph
								className={size === "sm" ? "size-3" : "size-3.5"}
								icon={option.icon}
							/>
						)}
					</span>

					{/* `aria-hidden`: `title` above already carries this to assistive
					    tech, so this is a sighted-hover affordance only, not a second
					    announcement of the same name. */}
					<span
						aria-hidden="true"
						className="-translate-x-1/2 pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 whitespace-nowrap rounded-[6px] border border-white/8 bg-surface-raised px-2 py-1 text-[11px] text-ink opacity-0 shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover/mark:opacity-100"
					>
						{option?.label}
					</span>
				</span>
			))}
		</div>
	);
}
