import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
	/**
	 * `font-semibold` and plain tracking, not the site's usual `-0.01em` —
	 * several people reported the orange buttons specifically as hard to
	 * read, and a bolder, less tightened label is a legibility win on any
	 * background, not only a busy or saturated one.
	 */
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] font-semibold tracking-normal transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				/**
				 * `hover:bg-brand-hover`, not `hover:opacity-85` — opacity fades the
				 * label by the same fraction as the fill, so the exact thing being
				 * fixed here got worse for as long as the pointer stayed put. A real
				 * darker shade keeps the black label at full strength.
				 */
				primary:
					"bg-brand text-ink-inverse hover:-translate-y-px hover:bg-brand-hover",
				secondary:
					"border border-white/20 text-ink-muted hover:border-white/25 hover:text-white",
				ghost: "text-ink-soft hover:bg-brand-dim hover:text-ink",
			},
			size: {
				sm: "px-3.5 py-2 text-[13px]",
				md: "px-5 py-2.5 text-[14px]",
				lg: "px-6 py-3 text-[15px]",
			},
		},
		defaultVariants: { variant: "primary", size: "md" },
	},
);

type ButtonProps = ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>;

export function Button({ variant, size, className, ...props }: ButtonProps) {
	return (
		<button
			type="button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
