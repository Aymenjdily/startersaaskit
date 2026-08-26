import { useEffect, useId, useRef, useState } from "react";
import { BrandGlyph } from "@/components/landing/brand-glyph";
import type { BrandIcon } from "@/components/landing/brand-icons";
import { cn } from "@/lib/utils";

/**
 * A dropdown that is ours rather than the browser's.
 *
 * A native `<select>` cannot show a logo beside an option, and its popup is
 * drawn by the operating system — so it arrives in whatever shape Windows,
 * macOS and Android each feel like, none of which is this console's. That is
 * the whole reason to replace it, and the price is that everything a native
 * control does for free has to be done here on purpose:
 *
 * - `role="listbox"` and `role="option"` with `aria-selected`, so a screen
 *   reader is told what this is rather than hearing a pile of buttons.
 * - Arrow keys, Home and End move an *active* option; Enter or Space commits
 *   it; Escape closes without committing. The active option is published
 *   through `aria-activedescendant`, which is how the pattern reports the
 *   highlight while focus itself stays on the trigger.
 * - Focus returns to the trigger on close, so keyboard order is not lost.
 * - Clicking outside closes it. Pointer-down rather than click, or a press
 *   that starts outside and ends inside would count as an outside click.
 *
 * The list is only mounted while open. A hidden-but-present listbox is
 * reachable by screen readers and by `Tab`, which is worse than not having it.
 */

export type SelectMenuOption = {
	id: string;
	label: string;
	/** The vendor's mark, where the choice is a product. */
	icon?: BrandIcon | null;
};

export function SelectMenu({
	className,
	label,
	onChange,
	options,
	value,
}: {
	className?: string;
	/** Names the control, and is what the trigger reads when nothing is set. */
	label: string;
	onChange: (value: string) => void;
	/** The "any" choice is added here — callers pass only the real options. */
	options: readonly SelectMenuOption[];
	value: string;
}) {
	const id = useId();
	const [open, setOpen] = useState(false);
	const [active, setActive] = useState(0);
	const trigger = useRef<HTMLButtonElement>(null);
	const list = useRef<HTMLUListElement>(null);

	/* The empty id is "any", and it is a real row rather than a separate way to
	   clear: a reader looking for "any framework" should find it in the list
	   where they are already looking. */
	const rows: SelectMenuOption[] = [
		{ id: "", label: `Any ${label.toLowerCase()}` },
		...options,
	];

	const chosen = options.find((option) => option.id === value);
	const selectedIndex = Math.max(
		rows.findIndex((row) => row.id === value),
		0,
	);

	function openWith(index: number) {
		setActive(index);
		setOpen(true);
	}

	function commit(index: number) {
		const row = rows[index];
		if (row) onChange(row.id);
		setOpen(false);
		trigger.current?.focus();
	}

	/* Closing on an outside press, and on the scroll that takes the trigger
	   away from where the list is drawn. */
	useEffect(() => {
		if (!open) return;

		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			if (
				!list.current?.contains(target) &&
				!trigger.current?.contains(target)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [open]);

	function onKeyDown(event: React.KeyboardEvent) {
		if (!open) {
			if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
				event.preventDefault();
				openWith(selectedIndex);
			}
			return;
		}

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				setActive((current) => Math.min(current + 1, rows.length - 1));
				break;
			case "ArrowUp":
				event.preventDefault();
				setActive((current) => Math.max(current - 1, 0));
				break;
			case "Home":
				event.preventDefault();
				setActive(0);
				break;
			case "End":
				event.preventDefault();
				setActive(rows.length - 1);
				break;
			case "Enter":
			case " ":
				event.preventDefault();
				commit(active);
				break;
			case "Escape":
				event.preventDefault();
				setOpen(false);
				trigger.current?.focus();
				break;
			case "Tab":
				/* Not prevented — moving on should work, and leaving the control
				   without committing is the same as Escape. */
				setOpen(false);
				break;
			default:
				break;
		}
	}

	return (
		<div className={cn("relative", className)}>
			<button
				aria-controls={open ? `${id}-list` : undefined}
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label={label}
				className={cn(
					"flex h-9 w-full items-center gap-2 rounded-[8px] border px-3 text-[13px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
					chosen
						? "border-brand/50 bg-brand-dim text-ink hover:border-brand/70"
						: "border-white/10 bg-black/25 text-ink hover:border-white/25",
				)}
				onClick={() => (open ? setOpen(false) : openWith(selectedIndex))}
				onKeyDown={onKeyDown}
				ref={trigger}
				type="button"
			>
				{chosen?.icon && (
					<BrandGlyph className="size-3.5 shrink-0" icon={chosen.icon} />
				)}
				<span className="truncate">{chosen ? chosen.label : label}</span>
				<Chevron
					className={cn(
						"ml-auto size-3.5 shrink-0 transition-transform duration-200",
						chosen ? "text-brand" : "text-ink-muted",
						open && "rotate-180",
					)}
				/>
			</button>

			{open && (
				<ul
					aria-activedescendant={`${id}-option-${active}`}
					aria-label={label}
					className="absolute top-[calc(100%+4px)] left-0 z-50 max-h-[280px] w-full min-w-[180px] overflow-auto rounded-[10px] border border-white/12 bg-surface-raised p-1 shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
					id={`${id}-list`}
					ref={list}
					role="listbox"
					tabIndex={-1}
				>
					{rows.map((row, index) => {
						const isSelected = row.id === value;

						return (
							<li
								aria-selected={isSelected}
								className={cn(
									"flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-[13px]",
									index === active
										? "bg-white/10 text-ink"
										: "text-white/75 hover:bg-white/6",
									isSelected && "text-ink",
								)}
								id={`${id}-option-${index}`}
								key={row.id || "any"}
								/* Pointer, not click: the outside-press listener runs on
								   pointerdown, so a click handler here would fire after
								   the menu had already been told to close. */
								onPointerUp={() => commit(index)}
								onMouseEnter={() => setActive(index)}
								role="option"
							>
								{row.icon ? (
									<BrandGlyph className="size-3.5 shrink-0" icon={row.icon} />
								) : (
									<span aria-hidden="true" className="size-3.5 shrink-0" />
								)}
								<span className="truncate">{row.label}</span>
								{isSelected && <Tick className="ml-auto size-3.5 text-brand" />}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}

function Chevron({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
			viewBox="0 0 24 24"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	);
}

function Tick({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
			viewBox="0 0 24 24"
		>
			<path d="m5 13 4 4L19 7" />
		</svg>
	);
}
