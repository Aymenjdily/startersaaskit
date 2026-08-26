import { useState } from "react";
import { BRAND, LOGO_MARK_SIZE, LOGO_MARK_SRC } from "@/lib/brand";
import {
	activeHref,
	avatarFor,
	displayNameFor,
	initialsFor,
	NAV_ITEMS,
} from "@/lib/console-nav";
import { cn } from "@/lib/utils";
import { NavGlyph } from "./nav-icon";

export type RailUser = {
	email?: string | null;
	user_metadata?: Record<string, unknown> | null;
};

/**
 * The console's left rail: icons only, the width of a single button.
 *
 * Labels live in `aria-label` and `title` rather than on screen. That is the
 * trade an icon rail makes — it buys back most of a sidebar's width and costs
 * discoverability — so every destination has both, and the top bar names the
 * page you are on so the rail never has to.
 *
 * The same width at every breakpoint. A 56px rail is not worth hiding behind a
 * drawer, and the off-canvas version it replaces was a focus trap, an overlay
 * and a scroll lock for something narrower than a scrollbar on some machines.
 */

const RAIL_ITEM =
	"relative flex size-10 items-center justify-center rounded-[10px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/** The bar that marks the current page, since colour alone is not enough. */
function CurrentMarker() {
	return (
		<span
			aria-hidden="true"
			className="-left-2 -translate-y-1/2 absolute top-1/2 h-5 w-[3px] rounded-r-full bg-brand"
		/>
	);
}

function Avatar({ name, src }: { name: string; src: string | null }) {
	const [broken, setBroken] = useState(false);

	if (!src || broken) {
		return (
			<span
				aria-hidden="true"
				className="flex size-8 items-center justify-center rounded-full bg-white/10 text-[11px] text-ink"
			>
				{initialsFor(name)}
			</span>
		);
	}

	return (
		<img
			alt=""
			className="size-8 rounded-full object-cover"
			height={32}
			onError={() => setBroken(true)}
			referrerPolicy="no-referrer"
			src={src}
			width={32}
		/>
	);
}

export function IconRail({
	currentPath,
	onSignOut,
	user,
}: {
	currentPath: string;
	onSignOut: () => void;
	user: RailUser;
}) {
	const active = activeHref(currentPath);
	const name = displayNameFor(user);

	return (
		<nav
			aria-label="Console"
			className="flex w-14 shrink-0 flex-col items-center gap-1 border-white/8 border-r bg-surface-sunken py-3"
		>
			{/* The mark, not the wordmark: 56px of rail cannot hold the name at a
			    size anyone could read. */}
			<a
				className="mb-3 flex size-9 items-center justify-center rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				href="/"
				title={BRAND}
			>
				<img
					alt={BRAND}
					className="size-8 object-contain"
					height={LOGO_MARK_SIZE.height}
					src={LOGO_MARK_SRC}
					width={LOGO_MARK_SIZE.width}
				/>
			</a>

			<ul className="flex flex-col items-center gap-1">
				{NAV_ITEMS.map((item) => {
					const current = item.href === active;

					return (
						<li key={item.href}>
							<a
								aria-current={current ? "page" : undefined}
								aria-label={item.built ? item.label : `${item.label} (soon)`}
								className={cn(
									RAIL_ITEM,
									current
										? "bg-white/8 text-ink"
										: "text-white/45 hover:bg-white/5 hover:text-ink",
								)}
								href={item.href}
								title={
									item.built ? item.label : `${item.label} — not built yet`
								}
							>
								{current && <CurrentMarker />}
								<NavGlyph icon={item.icon} />
							</a>
						</li>
					);
				})}
			</ul>

			<div className="mt-auto flex flex-col items-center gap-1">
				<button
					aria-label="Sign out"
					className={cn(
						RAIL_ITEM,
						"text-white/45 hover:bg-white/5 hover:text-ink",
					)}
					onClick={onSignOut}
					title="Sign out"
					type="button"
				>
					<svg
						aria-hidden="true"
						className="size-[18px]"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="1.5"
						viewBox="0 0 24 24"
					>
						<path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" />
					</svg>
				</button>

				<span className="flex size-10 items-center justify-center" title={name}>
					<Avatar name={name} src={avatarFor(user)} />
				</span>
			</div>
		</nav>
	);
}
