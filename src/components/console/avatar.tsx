import { useState } from "react";
import { initialsFor } from "@/lib/console-nav";
import { cn } from "@/lib/utils";

/**
 * The signed-in account's picture, or its initials when there is none.
 *
 * Shared by the rail and Settings' account section — both draw the same
 * account the same way, just at different sizes, so `className` is where a
 * caller changes that rather than a second copy of the fallback logic.
 */
export function Avatar({
	className,
	name,
	src,
}: {
	className?: string;
	name: string;
	src: string | null;
}) {
	const [broken, setBroken] = useState(false);

	if (!src || broken) {
		return (
			<span
				aria-hidden="true"
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] text-ink",
					className,
				)}
			>
				{initialsFor(name)}
			</span>
		);
	}

	return (
		<img
			alt=""
			className={cn("size-8 shrink-0 rounded-full object-cover", className)}
			height={32}
			onError={() => setBroken(true)}
			referrerPolicy="no-referrer"
			src={src}
			width={32}
		/>
	);
}
