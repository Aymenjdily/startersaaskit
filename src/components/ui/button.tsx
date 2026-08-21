import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] font-medium tracking-[-0.01em] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				primary:
					"bg-brand text-ink-inverse hover:-translate-y-px hover:opacity-85",
				secondary:
					"border border-white/15 text-white/60 hover:border-white/40 hover:text-white",
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
