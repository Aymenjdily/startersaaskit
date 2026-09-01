import { useEffect, useState } from "react";
import {
	BRAND,
	LOGO_MARK_SIZE,
	LOGO_MARK_SRC,
	LOGO_SIZE,
	LOGO_SRC,
} from "@/lib/brand";
import {
	activeHref,
	avatarFor,
	displayNameFor,
	navItemsFor,
} from "@/lib/console-nav";
import { cn } from "@/lib/utils";
import { Avatar } from "./avatar";
import { NavGlyph } from "./nav-icon";

export type RailUser = {
	email?: string | null;
	user_metadata?: Record<string, unknown> | null;
};

/**
 * The console's left rail: labels alongside every icon by default, narrow
 * enough to be just the icons for anyone who would rather have the width
 * back.
 *
 * It starts expanded on every load — `renderToString` has to agree with the
 * first client render, and a remembered preference is not known until an
 * effect runs, so the default has to be a literal rather than a guess — but
 * the choice itself is remembered from there. Someone who collapses it once
 * should not have to on every visit.
 *
 * Collapsed, labels live in `aria-label` and `title` rather than on screen —
 * the trade an icon-only rail always makes. Expanded, the same strings
 * become the visible text (`aria-label` still wins as the accessible name,
 * so nothing is announced twice), which is what "expanding the sidebar"
 * buys: a real answer to "what does this icon mean" instead of a tooltip
 * you have to hold still for.
 */

const RAIL_KEY = "console-rail-expanded";

/**
 * The rail's two widths, exported so `ConsoleChromeSkeleton` can reserve the
 * real one rather than a number copied by eye. They stay literal Tailwind
 * classes rather than a computed template string — Tailwind's scanner reads
 * source text, not runtime values, so `` `w-[${n}px]` `` would compile to
 * nothing and the skeleton would silently stop reserving any width at all.
 */
export const RAIL_WIDTH_EXPANDED = "w-[220px]";
export const RAIL_WIDTH_COLLAPSED = "w-14";

/** Tailwind's `md` breakpoint, above which the rail pushes content instead of covering it. */
export const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Whether the rail is expanded, and the setter that also remembers it.
 *
 * Expanded is the default — collapsing is the opt-in now, not the other way
 * round — but only once there is room to push content aside for it. A phone
 * has no such room: expanded there means covering the page, and starting
 * every mobile visit with a drawer already open is the thing this guards
 * against. Reads both `localStorage` and the viewport in an effect, never
 * during render: neither is known until the browser has one, and guessing
 * would make the first paint disagree with itself once the real values
 * arrive. An explicit choice, once made, wins over the screen size either way.
 */
function useRailExpanded(): [boolean, (next: boolean) => void] {
	const [expanded, setExpanded] = useState(true);

	useEffect(() => {
		const stored = window.localStorage.getItem(RAIL_KEY);

		if (stored === "false") {
			setExpanded(false);
			return;
		}
		if (stored === "true") {
			setExpanded(true);
			return;
		}
		if (window.matchMedia(MOBILE_QUERY).matches) setExpanded(false);
	}, []);

	function update(next: boolean) {
		setExpanded(next);
		try {
			window.localStorage.setItem(RAIL_KEY, String(next));
		} catch {
			/* Private browsing or a full quota — the toggle still works for the
			   rest of this visit, it just will not be remembered for the next. */
		}
	}

	return [expanded, update];
}

/** One row: an icon, and — once expanded — the label that used to be a tooltip. */
function RailItem({
	children,
	className,
	expanded,
	label,
	...props
}: {
	children: React.ReactNode;
	className?: string;
	expanded: boolean;
	label: string;
} & (
	| ({ as?: "a" } & React.ComponentPropsWithoutRef<"a">)
	| ({ as: "button" } & React.ComponentPropsWithoutRef<"button">)
)) {
	const shared = cn(
		"relative flex h-10 shrink-0 items-center gap-3 rounded-[10px] text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
		expanded ? "w-full px-3" : "w-10 justify-center",
		className,
	);
	const inner = (
		<>
			{children}
			{expanded && <span className="truncate text-[13px]">{label}</span>}
		</>
	);

	if (props.as === "button") {
		const { as, ...rest } = props;
		return (
			<button className={shared} type="button" {...rest}>
				{inner}
			</button>
		);
	}

	const { as, ...rest } = props;
	return (
		<a className={shared} {...rest}>
			{inner}
		</a>
	);
}

/** The bar that marks the current page — only worth drawing when the row has no label to say so instead. */
function CurrentMarker() {
	return (
		<span
			aria-hidden="true"
			className="-left-2 -translate-y-1/2 absolute top-1/2 h-5 w-[3px] rounded-r-full bg-brand"
		/>
	);
}

/** A single chevron, rotated rather than swapped for its mirror — one path stays true to both directions. */
function Chevron({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.75"
			viewBox="0 0 24 24"
		>
			<path d="M9 6l6 6-6 6" />
		</svg>
	);
}

export function IconRail({
	currentPath,
	isAdmin = false,
	onFeedback,
	onReport,
	onSignOut,
	user,
}: {
	currentPath: string;
	/** Draws the admin row. The policies are what protect it; this is courtesy. */
	isAdmin?: boolean;
	onFeedback: () => void;
	onReport: () => void;
	onSignOut: () => void;
	user: RailUser;
}) {
	const active = activeHref(currentPath);
	const name = displayNameFor(user);
	const items = navItemsFor(isAdmin);
	const [expanded, setExpanded] = useRailExpanded();

	return (
		<>
			{/* Below `md`, expanded means covering the page rather than pushing it
			    — there is nowhere else for 220px to go on a phone. The backdrop is
			    what makes that read as a drawer instead of the rail suddenly
			    occupying most of the screen, and gives the rest of the page a
			    click that closes it again. `md:hidden` keeps it out of the way
			    entirely once there is room to push instead. */}
			{expanded && (
				<div
					aria-hidden="true"
					className="fixed inset-0 z-30 bg-black/60 md:hidden"
					data-rail-backdrop
					onClick={() => setExpanded(false)}
				/>
			)}

			<nav
				aria-label="Console"
				className={cn(
					"flex shrink-0 flex-col gap-1 overflow-y-auto border-white/8 border-r bg-surface-sunken py-3 transition-[width] duration-200 ease-out",
					expanded
						? cn(
								RAIL_WIDTH_EXPANDED,
								"items-stretch px-3 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:shadow-[8px_0_24px_rgba(0,0,0,0.45)]",
							)
						: `${RAIL_WIDTH_COLLAPSED} items-center`,
				)}
			>
				{/* The mark alone has nowhere to put the name at a readable size; the
				    wordmark takes over once there is width for it. */}
				<a
					className={cn(
						"mb-2 flex h-9 shrink-0 items-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
						expanded ? "px-1" : "w-9 justify-center",
					)}
					href="/"
					title={`${BRAND} — back to the site`}
				>
					{expanded ? (
						<img
							alt={BRAND}
							className="h-8 w-auto object-contain"
							height={LOGO_SIZE.height}
							src={LOGO_SRC}
							width={LOGO_SIZE.width}
						/>
					) : (
						<img
							alt={BRAND}
							className="size-8 object-contain"
							height={LOGO_MARK_SIZE.height}
							src={LOGO_MARK_SRC}
							width={LOGO_MARK_SIZE.width}
						/>
					)}
				</a>

				<RailItem
					aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
					as="button"
					className="mb-2 text-ink-muted hover:bg-white/5 hover:text-ink"
					expanded={expanded}
					label={expanded ? "Collapse sidebar" : "Expand sidebar"}
					onClick={() => setExpanded(!expanded)}
					title={expanded ? "Collapse sidebar" : "Expand sidebar"}
				>
					<Chevron
						className={cn(
							"size-[18px] shrink-0 transition-transform duration-200",
							expanded && "rotate-180",
						)}
					/>
				</RailItem>

				<ul
					className={cn("flex flex-col gap-1", expanded ? "" : "items-center")}
				>
					{items.map((item) => {
						const current = item.href === active;
						const label = item.built ? item.label : `${item.label} (soon)`;

						return (
							<li key={item.href}>
								<RailItem
									aria-current={current ? "page" : undefined}
									aria-label={label}
									className={
										current
											? "bg-white/8 text-ink"
											: "text-ink-muted hover:bg-white/5 hover:text-ink"
									}
									expanded={expanded}
									href={item.href}
									label={label}
									title={
										item.built ? item.label : `${item.label} — not built yet`
									}
								>
									{current && !expanded && <CurrentMarker />}
									<NavGlyph icon={item.icon} />
								</RailItem>
							</li>
						);
					})}
				</ul>

				<div
					className={cn(
						"mt-auto flex flex-col gap-1",
						expanded ? "" : "items-center",
					)}
				>
					{/**
					 * Feedback and reporting are actions, not destinations, so both open
					 * a dialog rather than taking a row in the list above — the same
					 * reasoning that keeps Generate out of the nav.
					 *
					 * In the footer because both are always available and never the
					 * thing someone came here to do. Feedback sits above the bug report
					 * — it is the one with a reward attached, and the balance card
					 * already leads with it for the same reason.
					 */}
					<RailItem
						aria-label="Leave feedback"
						as="button"
						className="text-ink-muted hover:bg-white/5 hover:text-ink"
						expanded={expanded}
						label="Leave feedback"
						onClick={onFeedback}
						title="Leave feedback"
					>
						<NavGlyph icon="spark" />
					</RailItem>

					<RailItem
						aria-label="Report a problem"
						as="button"
						className="text-ink-muted hover:bg-white/5 hover:text-ink"
						expanded={expanded}
						label="Report a problem"
						onClick={onReport}
						title="Report a problem"
					>
						<NavGlyph icon="bug" />
					</RailItem>

					<RailItem
						aria-label="Sign out"
						as="button"
						className="text-ink-muted hover:bg-white/5 hover:text-ink"
						expanded={expanded}
						label="Sign out"
						onClick={onSignOut}
						title="Sign out"
					>
						<svg
							aria-hidden="true"
							className="size-[18px] shrink-0"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
							viewBox="0 0 24 24"
						>
							<path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
						</svg>
					</RailItem>

					<div
						className={cn(
							"flex h-10 shrink-0 items-center gap-3",
							expanded ? "w-full px-3" : "w-10 justify-center",
						)}
						title={name}
					>
						<Avatar name={name} src={avatarFor(user)} />
						{expanded && (
							<span className="truncate text-[13px] text-ink">{name}</span>
						)}
					</div>
				</div>
			</nav>
		</>
	);
}
