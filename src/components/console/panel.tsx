import { cn } from "@/lib/utils";

/**
 * The console's two repeating shapes: a section, and a panel inside it.
 *
 * Both exist so the surfaces and borders are declared once. The console is
 * three planes deep — rail, working area, panel — and the difference between
 * them is a few percent of lightness, which is exactly the kind of value that
 * drifts when every page picks its own.
 */

export function Section({
	action,
	children,
	description,
	title,
}: {
	/** Sits opposite the title: the one thing this section is for. */
	action?: React.ReactNode;
	children: React.ReactNode;
	description?: string;
	title: string;
}) {
	return (
		<section className="flex flex-col gap-4">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 className="font-medium text-[15px] text-ink tracking-[-0.01em]">
						{title}
					</h2>
					{description && (
						<p className="mt-1 max-w-[60ch] text-[13px] text-white/50 leading-[1.6]">
							{description}
						</p>
					)}
				</div>
				{action}
			</div>

			{children}
		</section>
	);
}

export function Panel({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-[10px] border border-white/8 bg-surface-raised",
				className,
			)}
		>
			{children}
		</div>
	);
}

/**
 * An entry point: mark, name, one line about it.
 *
 * Renders as a link or a button depending on what it was given, because a card
 * that opens a dialog and a card that navigates should look identical and
 * behave like what they are.
 */
export function ActionCard({
	description,
	disabled = false,
	href,
	icon,
	onClick,
	title,
}: {
	description: string;
	disabled?: boolean;
	href?: string;
	icon: React.ReactNode;
	onClick?: () => void;
	title: string;
}) {
	const body = (
		<>
			<span className="flex size-9 items-center justify-center rounded-[8px] bg-white/6 text-white/70 transition-colors duration-200 group-hover:bg-brand/15 group-hover:text-brand">
				{icon}
			</span>
			<span className="block font-medium text-[14px] text-ink">{title}</span>
			<span className="block text-[13px] text-white/50 leading-[1.55]">
				{description}
			</span>
		</>
	);

	const shell = cn(
		"group flex flex-col gap-3 rounded-[10px] border border-white/8 bg-surface-raised p-5 text-left",
		"transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
		disabled
			? "cursor-not-allowed opacity-55"
			: "hover:border-white/20 hover:bg-white/[0.04]",
	);

	if (href && !disabled) {
		return (
			<a className={shell} href={href}>
				{body}
			</a>
		);
	}

	return (
		<button
			className={shell}
			disabled={disabled}
			onClick={onClick}
			type="button"
		>
			{body}
		</button>
	);
}
