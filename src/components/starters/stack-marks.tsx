import { BrandGlyph } from "@/components/landing/brand-glyph";
import type { StarterRecord } from "@/lib/generate/starters";
import { STARTER_QUESTIONS } from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

/**
 * A starter's stack, as the vendors' marks.
 *
 * People recognise these faster than they read the words, and six labels per
 * row is unreadable at any width. The name is on the `title` of each tile, so
 * the information is available rather than merely implied.
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
					className={cn(
						"flex items-center justify-center rounded-[5px] bg-white/6 text-white/70",
						size === "sm" ? "size-5" : "size-6",
					)}
					key={option?.id}
					title={option?.label}
				>
					{option?.icon && (
						<BrandGlyph
							className={size === "sm" ? "size-3" : "size-3.5"}
							icon={option.icon}
						/>
					)}
				</span>
			))}
		</div>
	);
}
