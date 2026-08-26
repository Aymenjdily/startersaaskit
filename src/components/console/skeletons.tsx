import { Panel } from "@/components/console/panel";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { STARTER_QUESTIONS } from "@/lib/starter-questions";

/**
 * The loading state of each console page, shaped like the page.
 *
 * Every one of these mirrors a specific component's measurements — the same
 * padding, the same row height, the same grid — so the content lands without
 * shifting anything. That correspondence is the whole value and also the thing
 * that rots silently, so `skeletons.test.tsx` asserts the parts that matter
 * (column count, row count, the grid) against the real components rather than
 * against numbers typed twice.
 *
 * Where the real component and the skeleton can share markup outright, they
 * do: the dashboard table's header is one constant used by both, because a
 * header that drifts between them is a column that lines up wrong.
 */

/**
 * How many rows the stack panel will have, and how many marks a card shows.
 *
 * Derived, not typed. Adding the Email question is what taught this codebase
 * that a count written down twice is a count that will disagree with itself —
 * there, it invalidated every stored starter; here it would only mean the
 * panel jumps a row on load, but the fix is the same and costs one line.
 */
const STACK_ROWS = STARTER_QUESTIONS.filter(
	(question) => question.kind === "choice",
).length;

/** `[depth, width%]` per row, so the tree placeholder is not a solid block. */
const TREE_SHAPE: [number, number][] = [
	[0, 34],
	[1, 46],
	[1, 40],
	[2, 52],
	[1, 44],
	[0, 30],
	[1, 48],
	[2, 56],
	[2, 42],
	[1, 38],
	[0, 32],
	[1, 50],
];

/** The dashboard's recent-starters columns. Shared with the real table. */
export const RECENT_COLUMNS = ["Name", "Stack", "Generated"] as const;

const HEAD_CELL =
	"px-5 py-3 font-medium text-[11px] text-white/40 uppercase tracking-[0.06em]";

export function RecentStartersHead() {
	return (
		<thead>
			<tr className="border-white/8 border-b">
				{RECENT_COLUMNS.map((column) => (
					<th
						className={
							/* "Generated" is a date column and reads right-aligned. */
							column === "Generated" ? `${HEAD_CELL} text-right` : HEAD_CELL
						}
						key={column}
					>
						{column}
					</th>
				))}
			</tr>
		</thead>
	);
}

/**
 * The recent-starters table, mid-load.
 *
 * `rows` defaults to the number the dashboard actually shows, so the panel is
 * the height it will be rather than a height it never is.
 */
export function RecentStartersSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<SkeletonRegion label="Loading your recent starters">
			<Panel>
				<table className="w-full text-left">
					<RecentStartersHead />
					<tbody>
						{Array.from({ length: rows }, (_, index) => (
							<tr
								/* The real row is 49px: its height comes from the line
								   boxes of the text inside it, and a placeholder made of
								   slim bars is shorter. Sized here rather than by padding
								   the bars, because `box-sizing: border-box` means a
								   `min-h` smaller than the natural height does nothing.
								   Measured in a browser against the real table rather
								   than reasoned about: jsdom has no layout, so none of
								   the tests below can catch this drifting. */
								className="h-[49px] border-white/8 border-b last:border-0"
								// biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
								key={index}
							>
								<td className="px-5 py-3">
									<Skeleton className="h-[18px] w-32" />
								</td>
								<td className="px-5 py-3">
									{/* One mark per choice question, less the one that is
									    usually "Not yet" and so has no logo — the shape
									    `StackMarks` renders at `size="sm"`. */}
									<div className="flex items-center gap-1.5">
										{Array.from({ length: STACK_ROWS - 1 }, (_, mark) => (
											<Skeleton
												className="size-5 rounded-[5px]"
												// biome-ignore lint/suspicious/noArrayIndexKey: placeholder marks have no identity
												key={mark}
											/>
										))}
									</div>
								</td>
								<td className="px-5 py-3">
									<Skeleton className="ml-auto h-[18px] w-24" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</Panel>
		</SkeletonRegion>
	);
}

/**
 * One folder card, mid-load — the tab, then the body.
 *
 * Mirrors `starter-card.tsx`: the same `-mb-px` tab so the borders meet, the
 * same `rounded-tl-none` body, the same `p-5` and `gap-4`.
 */
function StarterCardSkeleton() {
	return (
		<div className="flex w-full flex-col">
			<span
				aria-hidden="true"
				className="-mb-px h-3 w-20 rounded-t-[8px] border border-white/10 border-b-0 bg-surface-raised"
			/>
			<div className="flex flex-1 flex-col gap-4 rounded-[12px] rounded-tl-none border border-white/10 bg-surface-raised p-5">
				<div className="min-w-0">
					<Skeleton className="h-[20px] w-36" />
					<Skeleton className="mt-1.5 h-[15px] w-24" />
				</div>

				<div className="flex flex-wrap items-center gap-1.5">
					{Array.from({ length: STACK_ROWS - 1 }, (_, mark) => (
						<Skeleton
							className="size-6 rounded-[5px]"
							// biome-ignore lint/suspicious/noArrayIndexKey: placeholder marks have no identity
							key={mark}
						/>
					))}
				</div>

				<div className="mt-auto flex items-center gap-2 pt-1">
					<Skeleton className="size-8 rounded-[7px]" />
					<Skeleton className="size-8 rounded-[7px]" />
				</div>
			</div>
		</div>
	);
}

/**
 * The starters page, mid-load: the toolbar, then a grid of folders.
 *
 * `cards` defaults to a full page, because a short skeleton followed by a full
 * grid is the jump this exists to prevent.
 */
export function StarterGridSkeleton({ cards = 9 }: { cards?: number }) {
	return (
		<SkeletonRegion
			className="flex w-full flex-col gap-5"
			label="Loading your starters"
		>
			{/* The same strip as the real toolbar: search, a divider, one filter,
			    and the count on the right. */}
			<div className="flex flex-col gap-2 rounded-[12px] border border-white/10 bg-surface-raised/60 p-2 sm:flex-row sm:items-center">
				<Skeleton className="h-9 w-full rounded-[8px] sm:w-[240px]" />
				<span
					aria-hidden="true"
					className="hidden h-6 w-px shrink-0 bg-white/10 sm:block"
				/>
				<Skeleton className="h-9 w-[calc(50%-0.25rem)] rounded-[8px] sm:w-[168px]" />
				<Skeleton className="h-[18px] w-20 sm:ml-auto sm:mr-1" />
			</div>

			<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: cards }, (_, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: placeholder cards have no identity
					<li className="flex" key={index}>
						<StarterCardSkeleton />
					</li>
				))}
			</ul>
		</SkeletonRegion>
	);
}

/**
 * One starter's detail page, mid-load.
 *
 * The two-column grid is the same `lg:grid-cols-[320px_1fr]` the real page
 * uses, so the stack panel does not start full-width and then jump to a third.
 */
export function StarterDetailSkeleton({
	rows = STACK_ROWS,
}: {
	rows?: number;
}) {
	return (
		<SkeletonRegion
			className="flex flex-col gap-8"
			label="Loading this starter"
		>
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex flex-wrap items-center gap-1.5">
					{Array.from({ length: STACK_ROWS - 1 }, (_, mark) => (
						<Skeleton
							className="size-6 rounded-[5px]"
							// biome-ignore lint/suspicious/noArrayIndexKey: placeholder marks have no identity
							key={mark}
						/>
					))}
				</div>
				<Skeleton className="h-[15px] w-56" />
			</div>

			<div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
				<div className="flex flex-col gap-4">
					<Skeleton className="h-[22px] w-20" />
					<Panel>
						<div className="divide-y divide-white/8">
							{Array.from({ length: rows }, (_, index) => (
								<div
									className="flex items-center justify-between gap-4 px-4 py-2.5"
									// biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
									key={index}
								>
									{/* The wrappers carry the real row's type sizes, which is
									    what actually sets its height: the `dd` is 13px on a
									    19.5px line box, so the row is 40.5px however short
									    the bar inside it is. Sizing the bars alone left the
									    panel 25px short over seven rows. */}
									<span className="text-[12px] leading-[18px]">
										<Skeleton className="inline-block h-[11px] w-20 align-middle" />
									</span>
									<span className="text-[13px] leading-[19.5px]">
										<Skeleton className="inline-block h-[12px] w-24 align-middle" />
									</span>
								</div>
							))}
						</div>
					</Panel>
				</div>

				<div className="flex flex-col gap-4">
					<Skeleton className="h-[22px] w-28" />
					<Panel className="flex flex-col gap-2 p-4">
						{/* Indented like a tree rather than a flat list, because a file
						    tree is what arrives. The width shrinks with depth so the
						    rows do not read as one solid block. */}
						{TREE_SHAPE.map(([depth, width], index) => (
							<Skeleton
								className="h-[17px]"
								// biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
								key={index}
								style={{
									marginLeft: `${depth * 16}px`,
									width: `${width}%`,
								}}
							/>
						))}
					</Panel>
				</div>
			</div>
		</SkeletonRegion>
	);
}

/**
 * The console frame itself, while we are still finding out who is asking.
 *
 * This replaced a centred "Loading your console…", which meant the rail and
 * header appeared all at once afterwards and shifted the page. The rail is the
 * same 56px column with the same border and surface, so the only thing that
 * changes on arrival is what is drawn inside it.
 */
export function ConsoleChromeSkeleton({ title }: { title: string }) {
	return (
		<div className="flex min-h-screen bg-surface">
			<div
				aria-hidden="true"
				className="flex w-14 shrink-0 flex-col items-center gap-1 border-white/8 border-r bg-surface-sunken py-3"
			>
				<Skeleton className="mb-3 size-8 rounded-[10px]" />
				{Array.from({ length: 3 }, (_, index) => (
					<Skeleton
						className="size-10 rounded-[10px]"
						// biome-ignore lint/suspicious/noArrayIndexKey: placeholder items have no identity
						key={index}
					/>
				))}
				<div className="mt-auto flex flex-col items-center gap-1">
					<Skeleton className="size-10 rounded-[10px]" />
					<Skeleton className="size-8 rounded-full" />
				</div>
			</div>

			<div className="flex min-w-0 flex-1 flex-col">
				{/* The title is known before the session is, so it is shown rather
				    than blocked out — there is nothing to wait for. */}
				<header className="flex h-14 shrink-0 items-center gap-3 border-white/8 border-b px-4 md:px-6">
					<h1 className="min-w-0 truncate font-medium text-[15px] text-ink tracking-[-0.01em]">
						{title}
					</h1>
				</header>

				<main className="flex-1 px-4 py-8 md:px-6 md:py-10">
					<div className="mx-auto w-full max-w-[1040px]">
						<SkeletonRegion
							className="flex flex-col gap-4"
							label="Loading your console"
						>
							<Skeleton className="h-[22px] w-40" />
							<Skeleton className="h-[15px] w-72" />
							<div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{Array.from({ length: 3 }, (_, index) => (
									<Skeleton
										className="h-[148px] rounded-[10px]"
										// biome-ignore lint/suspicious/noArrayIndexKey: placeholder cards have no identity
										key={index}
									/>
								))}
							</div>
						</SkeletonRegion>
					</div>
				</main>
			</div>
		</div>
	);
}

/**
 * The onboarding wizard, mid-load.
 *
 * Sits inside `AuthShell` rather than the console frame, so it has no rail to
 * stand in for — just the progress bar, a stack of option rows and the button
 * beneath them. The rows are `py-3` on a 14px line, matching `OptionList`.
 */
export function OnboardingSkeleton({ options = 5 }: { options?: number }) {
	return (
		<SkeletonRegion
			className="flex flex-col gap-6"
			label="Loading your account"
		>
			{/* The real bar is 1px of track with a brand fill; an empty track is
			    honest here, because the step is not known yet either. */}
			<div aria-hidden="true" className="h-1 rounded-full bg-white/10" />

			<div className="flex flex-col gap-2">
				{Array.from({ length: options }, (_, index) => (
					<div
						className="flex items-center gap-3 rounded-[8px] border border-white/12 bg-black/25 px-4 py-3"
						// biome-ignore lint/suspicious/noArrayIndexKey: placeholder rows have no identity
						key={index}
					>
						<Skeleton className="size-4 shrink-0 rounded-full" />
						<span className="text-[14px] leading-[21px]">
							<Skeleton className="inline-block h-[13px] w-40 align-middle" />
						</span>
					</div>
				))}
			</div>

			<Skeleton className="h-11 rounded-[8px]" />
		</SkeletonRegion>
	);
}
