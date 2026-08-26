import type { StarterRecord } from "@/lib/generate/starters";
import { cn } from "@/lib/utils";
import { StackMarks } from "./stack-marks";

/**
 * One generated starter, drawn as a folder.
 *
 * The tab is a real element rather than a background image so it inherits the
 * same border and hover colour as the body — a folder drawn as a picture stops
 * matching the card the moment either changes.
 *
 * The whole card is a link, and the two actions are buttons *beside* it rather
 * than inside it. Nesting a button in an anchor is invalid HTML and browsers
 * resolve it by making one of them unreachable, usually the one you wanted.
 */

const ICONS = {
	download: "M12 4v10m0 0l-4-4m4 4l4-4M5 18h14",
	trash: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6",
};

function ActionIcon({ path }: { path: string }) {
	return (
		<svg
			aria-hidden="true"
			className="size-[15px]"
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
			viewBox="0 0 24 24"
		>
			<path d={path} />
		</svg>
	);
}

const ACTION =
	"flex size-8 items-center justify-center rounded-[7px] border border-white/10 text-white/55 transition-colors duration-200 hover:border-white/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40";

export function StarterCard({
	busy = false,
	href,
	onDelete,
	onDownload,
	record,
}: {
	busy?: boolean;
	href: string;
	onDelete: () => void;
	onDownload: () => void;
	record: StarterRecord;
}) {
	return (
		/* `w-full`: the card is a flex item inside its grid cell, so without it
		   it shrinks to its content and the grid renders ragged. */
		<article className="group relative flex w-full flex-col">
			{/* The tab. `-mb-px` so its border meets the body's rather than
			    doubling into a 2px seam. */}
			<span
				aria-hidden="true"
				className="-mb-px ml-0 h-3 w-20 rounded-t-[8px] border border-white/10 border-b-0 bg-surface-raised transition-colors duration-200 group-hover:border-white/25 group-hover:bg-white/[0.05]"
			/>

			<div
				className={cn(
					"flex flex-1 flex-col gap-4 rounded-[12px] rounded-tl-none border border-white/10 bg-surface-raised p-5",
					"transition-colors duration-200 group-hover:border-white/25 group-hover:bg-white/[0.05]",
				)}
			>
				<div className="min-w-0">
					<h3 className="truncate font-medium text-[14px] text-ink">
						{/* Stretched: the link covers the card, so the whole folder is
						    the target without wrapping the buttons in an anchor. */}
						<a
							className="after:absolute after:inset-0 after:rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							href={href}
						>
							{record.project}
						</a>
					</h3>
					<p className="mt-0.5 text-[12px] text-ink-muted">
						{new Date(record.created_at).toLocaleDateString(undefined, {
							year: "numeric",
							month: "short",
							day: "numeric",
						})}
					</p>
				</div>

				<StackMarks record={record} />

				{/* `relative z-10` lifts the actions above the stretched link, which
				    would otherwise swallow every click on them. */}
				<div className="relative z-10 mt-auto flex items-center gap-2 pt-1">
					<button
						aria-label={`Download ${record.project}`}
						className={ACTION}
						disabled={busy}
						onClick={onDownload}
						type="button"
					>
						<ActionIcon path={ICONS.download} />
					</button>

					<button
						aria-label={`Delete ${record.project}`}
						className={cn(
							ACTION,
							"hover:border-diagram-red/50 hover:text-diagram-red",
						)}
						disabled={busy}
						onClick={onDelete}
						type="button"
					>
						<ActionIcon path={ICONS.trash} />
					</button>
				</div>
			</div>
		</article>
	);
}
