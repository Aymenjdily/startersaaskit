import type { ReactNode } from "react";
import { BrandGlyph } from "@/components/landing/brand-glyph";
import type { BrandIcon } from "@/components/landing/brand-icons";
import { cn } from "@/lib/utils";

/**
 * Choices as picture cards: the vendor's mark in a square tile, the name under
 * it.
 *
 * People recognise these logos faster than they read the words beside them, and
 * a stack of identical radio rows makes every option look like every other one.
 *
 * Still real `<input type="radio">` underneath, visually hidden rather than
 * removed — that keeps the roles, the arrow-key behaviour within the group, and
 * the label-clicks-the-control association. `peer-focus-visible` puts the
 * keyboard ring on the card, so nothing is lost by hiding the control itself.
 */

/** For choices that are not a product, so have no logo to show. */
export function NeutralGlyph({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={cn("size-6", className)}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
			viewBox="0 0 24 24"
		>
			<circle cx="12" cy="12" r="8.5" />
			<path d="M6.5 17.5l11-11" />
		</svg>
	);
}

/**
 * For a choice that is a page rather than a product — "Editorial" has no
 * vendor to borrow a mark from, and {@link NeutralGlyph}'s crossed-out circle
 * reads as "none of these", which is backwards for the one option that is a
 * real, positive choice.
 */
export function PageGlyph({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={cn("size-6", className)}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
			viewBox="0 0 24 24"
		>
			<rect height="17" rx="2" width="16" x="4" y="3.5" />
			<path d="M7.5 8h9" />
			<path d="M7.5 12h9" />
			<path d="M7.5 16h5" />
		</svg>
	);
}

export function OptionCards({
	name,
	onChange,
	options,
	renderIcon,
	value,
}: {
	/** Groups the radios, so only one card in this set can be chosen. */
	name: string;
	onChange: (value: string) => void;
	options: readonly { id: string; label: string; icon: BrandIcon | null }[];
	/**
	 * Override the icon for one or more options, falling back to the vendor
	 * mark (or {@link NeutralGlyph}) for anything it returns nothing for.
	 * For the rare choice that is not a product but also is not "none".
	 */
	renderIcon?: (option: { id: string; icon: BrandIcon | null }) => ReactNode;
	value: string | undefined;
}) {
	return (
		<div className="grid grid-cols-2 gap-3">
			{options.map((option) => {
				const checked = option.id === value;

				return (
					<label
						className={cn(
							"flex cursor-pointer flex-col items-center gap-3 rounded-[12px] border px-4 py-5 text-center transition-colors duration-200",
							"has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand",
							checked
								? "border-brand/60 bg-brand/10"
								: "border-white/8 bg-black/25 hover:border-white/25 hover:bg-black/40",
						)}
						key={option.id}
					>
						<input
							checked={checked}
							className="sr-only"
							name={name}
							onChange={() => onChange(option.id)}
							type="radio"
						/>

						<span
							className={cn(
								"flex size-12 items-center justify-center rounded-[10px] transition-colors duration-200",
								checked ? "bg-brand/15 text-ink" : "bg-white/6 text-ink-soft",
							)}
						>
							{renderIcon?.(option) ??
								(option.icon ? (
									<BrandGlyph className="size-6" icon={option.icon} />
								) : (
									<NeutralGlyph />
								))}
						</span>

						<span
							className={cn(
								"text-[13px] transition-colors duration-200",
								checked ? "text-ink" : "text-ink-soft",
							)}
						>
							{option.label}
						</span>
					</label>
				);
			})}
		</div>
	);
}
