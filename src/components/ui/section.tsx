import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"section"> & {
	/** Alternate down the page so the eye gets a band change between blocks. */
	tone?: "base" | "forest";
};

export function Section({ tone = "base", className, ...props }: SectionProps) {
	return (
		<section
			className={cn(
				"relative pt-14 pb-12 md:pt-20 md:pb-15",
				tone === "forest" ? "bg-forest" : "bg-base",
				className,
			)}
			{...props}
		/>
	);
}

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
	return (
		<p
			className={cn(
				"font-mono text-[13px] uppercase tracking-[0.12em] text-sage",
				className,
			)}
			{...props}
		/>
	);
}

type SectionHeadingProps = Omit<ComponentProps<"div">, "title"> & {
	eyebrow?: string;
	title: React.ReactNode;
	description?: React.ReactNode;
	align?: "left" | "center";
};

export function SectionHeading({
	eyebrow,
	title,
	description,
	align = "left",
	className,
	children,
	...props
}: SectionHeadingProps) {
	const centered = align === "center";

	return (
		<div
			className={cn(
				"flex flex-col gap-5",
				centered && "items-center text-center",
				className,
			)}
			{...props}
		>
			{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
			<h2
				className={cn(
					"heading-tight max-w-[900px] text-h2 text-ink",
					centered && "mx-auto",
				)}
			>
				{title}
			</h2>
			{description && (
				<p
					className={cn(
						"max-w-[600px] text-body-lg leading-[1.5] tracking-[-0.01em] text-ink-soft",
						centered && "mx-auto",
					)}
				>
					{description}
				</p>
			)}
			{children}
		</div>
	);
}
