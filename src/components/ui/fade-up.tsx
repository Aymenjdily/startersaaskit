import { type ComponentProps, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function useReveal<T extends HTMLElement>(threshold = 0.15) {
	const ref = useRef<T>(null);
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const node = ref.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setVisible(true);
					observer.disconnect();
				}
			},
			{ threshold, rootMargin: "0px 0px -10% 0px" },
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [threshold]);

	return { ref, visible };
}

type FadeUpProps = ComponentProps<"div"> & {
	/** Stagger step. Each step delays the reveal by 150ms. */
	step?: 0 | 1 | 2 | 3;
};

export function FadeUp({ step = 0, className, style, ...props }: FadeUpProps) {
	const { ref, visible } = useReveal<HTMLDivElement>();

	return (
		<div
			ref={ref}
			className={cn("fade-up", visible && "is-visible", className)}
			style={{ transitionDelay: `${step * 150}ms`, ...style }}
			{...props}
		/>
	);
}
