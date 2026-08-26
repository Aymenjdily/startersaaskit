import { useEffect, useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SelectMenu } from "@/components/ui/select-menu";
import {
	availableChoices,
	filterStarters,
	hasActiveFilters,
	NO_FILTERS,
	paginate,
	type StarterFilters,
} from "@/lib/generate/starter-filters";
import type { StarterRecord } from "@/lib/generate/starters";
import type { StarterQuestionId } from "@/lib/starter-questions";
import { cn } from "@/lib/utils";
import { StarterCard } from "./starter-card";

/**
 * The starters an account has generated: searchable, filterable, paged.
 *
 * All three are held here rather than in the URL. That is a deliberate limit —
 * a filtered view cannot be linked or reloaded into — and the right moment to
 * change it is when someone wants to share one, not before.
 */

/* The search field. The dropdown beside it wears the same shape from
   `SelectMenu`, which owns its own because it is used elsewhere too. */
const SEARCH_FIELD =
	"h-9 w-full rounded-[8px] border border-white/10 bg-black/25 pr-3 pl-8 text-[13px] text-ink transition-colors duration-200 placeholder:text-ink-muted hover:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand";

const SEARCH_ICON = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM16 16l4.5 4.5";

function Glyph({ className, path }: { className?: string; path: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
			viewBox="0 0 24 24"
		>
			<path d={path} />
		</svg>
	);
}

export function StarterBrowser({
	busyId,
	onDelete,
	onDownload,
	starters,
}: {
	/** The starter currently being downloaded or deleted, if any. */
	busyId?: string | null;
	onDelete: (record: StarterRecord) => Promise<void>;
	onDownload: (record: StarterRecord) => void;
	starters: StarterRecord[];
}) {
	const [filters, setFilters] = useState<StarterFilters>(NO_FILTERS);
	const [page, setPage] = useState(1);
	const [confirming, setConfirming] = useState<StarterRecord | null>(null);

	const groups = useMemo(() => availableChoices(starters), [starters]);
	const matched = useMemo(
		() => filterStarters(starters, filters),
		[starters, filters],
	);
	const shown = paginate(matched, page);

	/* Narrowing the results can strand the reader past the last page. */
	useEffect(() => {
		if (page !== shown.page) setPage(shown.page);
	}, [page, shown.page]);

	function choose(id: StarterQuestionId, value: string) {
		setPage(1);
		setFilters((current) => ({
			...current,
			choices: { ...current.choices, [id]: value || undefined },
		}));
	}

	return (
		<div className="flex w-full flex-col gap-5">
			{/* One bordered strip rather than loose boxes on the page, so the
			    controls read as a single toolbar that belongs to the grid. */}
			<div className="flex flex-col gap-2 rounded-[12px] border border-white/10 bg-surface-raised/60 p-2 sm:flex-row sm:items-center">
				<div className="relative w-full sm:w-[240px]">
					<label className="sr-only" htmlFor="starter-search">
						Search starters
					</label>
					<Glyph
						className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-ink-muted"
						path={SEARCH_ICON}
					/>
					<input
						className={SEARCH_FIELD}
						id="starter-search"
						onChange={(event) => {
							setPage(1);
							setFilters((current) => ({
								...current,
								search: event.target.value,
							}));
						}}
						placeholder="Search by name"
						type="search"
						value={filters.search}
					/>
				</div>

				{groups.length > 0 && (
					<span
						aria-hidden="true"
						className="hidden h-6 w-px shrink-0 bg-white/10 sm:block"
					/>
				)}

				<div className="flex flex-wrap items-center gap-2">
					{groups.map((group) => (
						<SelectMenu
							className="w-[calc(50%-0.25rem)] sm:w-[168px]"
							key={group.id}
							label={group.label}
							onChange={(value) => choose(group.id, value)}
							options={group.options}
							value={filters.choices[group.id] ?? ""}
						/>
					))}
				</div>

				<div className="flex items-center gap-3 sm:ml-auto sm:pr-1">
					<p aria-live="polite" className="text-[12px] text-ink-muted">
						{shown.total} {shown.total === 1 ? "starter" : "starters"}
					</p>

					{hasActiveFilters(filters) && (
						<button
							className="rounded-[7px] border border-white/10 px-2.5 py-1 text-[12px] text-ink-muted transition-colors duration-200 hover:border-white/25 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							onClick={() => {
								setFilters(NO_FILTERS);
								setPage(1);
							}}
							type="button"
						>
							Clear
						</button>
					)}
				</div>
			</div>

			{shown.total === 0 ? (
				<div className="rounded-[12px] border border-white/10 border-dashed px-6 py-14 text-center">
					<p className="text-[14px] text-ink">Nothing matches</p>
					<p className="mt-1 text-[13px] text-ink-muted">
						Try a different search, or clear the filters.
					</p>
				</div>
			) : (
				<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{shown.items.map((record) => (
						<li className="flex" key={record.id}>
							<StarterCard
								busy={busyId === record.id}
								href={`/starters/${record.id}`}
								onDelete={() => setConfirming(record)}
								onDownload={() => onDownload(record)}
								record={record}
							/>
						</li>
					))}
				</ul>
			)}

			{shown.pages > 1 && (
				<nav
					aria-label="Pages"
					className="flex items-center justify-center gap-3"
				>
					<button
						className={cn(
							buttonVariants({ variant: "secondary", size: "sm" }),
							"rounded-[8px]",
						)}
						disabled={shown.page === 1}
						onClick={() => setPage(shown.page - 1)}
						type="button"
					>
						Previous
					</button>

					<p className="text-[13px] text-ink-muted">
						Page {shown.page} of {shown.pages}
					</p>

					<button
						className={cn(
							buttonVariants({ variant: "secondary", size: "sm" }),
							"rounded-[8px]",
						)}
						disabled={shown.page === shown.pages}
						onClick={() => setPage(shown.page + 1)}
						type="button"
					>
						Next
					</button>
				</nav>
			)}

			{/* Deleting is the one action here with no undo, so it asks. */}
			<Dialog
				description="This cannot be undone. The generated files are not stored, so the record is all there is."
				onClose={() => setConfirming(null)}
				open={confirming !== null}
				title={`Delete ${confirming?.project ?? ""}?`}
			>
				<div className="flex items-center gap-3">
					<button
						className={cn(
							buttonVariants({ variant: "secondary" }),
							"h-10 rounded-[8px]",
						)}
						onClick={() => setConfirming(null)}
						type="button"
					>
						Keep it
					</button>

					<button
						className={cn(
							buttonVariants({ variant: "primary" }),
							"h-10 flex-1 rounded-[8px] bg-diagram-red text-ink",
						)}
						onClick={async () => {
							const record = confirming;
							setConfirming(null);
							if (record) await onDelete(record);
						}}
						type="button"
					>
						Delete
					</button>
				</div>
			</Dialog>
		</div>
	);
}
