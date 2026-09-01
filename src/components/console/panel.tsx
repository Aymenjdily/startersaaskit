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
						<p className="mt-1 max-w-[60ch] text-[13px] text-ink-muted leading-[1.6]">
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
/**
 * `variant="primary"` is for the one thing on the page worth outranking
 * everything else — a coloured icon chip, a brighter border, and an arrow
 * that steps forward on hover, the same motion the landing page's own CTAs
 * use. Everything else stays the quieter default so the primary card is the
 * only one drawing the eye.
 */
export function ActionCard({
	description,
	disabled = false,
	href,
	icon,
	onClick,
	title,
	variant = "default",
}: {
	description: string;
	disabled?: boolean;
	href?: string;
	icon: React.ReactNode;
	onClick?: () => void;
	title: string;
	variant?: "default" | "primary";
}) {
	const primary = variant === "primary" && !disabled;

	const body = (
		<>
			<span
				className={cn(
					"flex size-10 items-center justify-center rounded-[10px] border transition-colors duration-200",
					primary
						? "border-brand/25 bg-brand-dim text-brand"
						: "border-white/8 bg-white/6 text-ink-soft group-hover:bg-brand/15 group-hover:text-brand",
				)}
			>
				{icon}
			</span>
			<span className="flex items-center gap-1.5 font-medium text-[14px] text-ink">
				{title}
				{primary && (
					<span
						aria-hidden="true"
						className="transition-transform duration-300 group-hover:translate-x-[3px]"
					>
						→
					</span>
				)}
			</span>
			<span className="block text-[13px] text-ink-muted leading-[1.55]">
				{description}
			</span>
		</>
	);

	const shell = cn(
		"group relative flex flex-col gap-3 overflow-hidden rounded-[12px] border p-5 text-left",
		"transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
		disabled &&
			"cursor-not-allowed border-white/8 bg-surface-raised opacity-55",
		!disabled &&
			(primary
				? "border-brand/25 bg-gradient-to-br from-brand-dim to-surface-raised hover:border-brand/40"
				: "border-white/8 bg-surface-raised hover:border-white/20 hover:bg-white/5"),
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
