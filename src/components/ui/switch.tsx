import { cn } from "@/lib/utils";

/**
 * A single on/off control, drawn rather than a styled checkbox.
 *
 * `role="switch"` with `aria-checked` rather than `<input type="checkbox">`:
 * a switch is an immediate action ("turn this on now"), where a checkbox is a
 * choice you commit to with a separate submit — screen readers announce the
 * two differently, and this one is the former.
 */
export function Switch({
	checked,
	disabled = false,
	label,
	onChange,
}: {
	checked: boolean;
	disabled?: boolean;
	/** The control's own accessible name — this has no visible label of its own. */
	label: string;
	onChange: (checked: boolean) => void;
}) {
	return (
		<button
			aria-checked={checked}
			aria-label={label}
			className={cn(
				"relative flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
				checked ? "border-brand/40 bg-brand" : "border-white/15 bg-white/10",
				disabled && "cursor-not-allowed opacity-50",
			)}
			disabled={disabled}
			onClick={() => onChange(!checked)}
			role="switch"
			type="button"
		>
			<span
				aria-hidden="true"
				className={cn(
					"size-[18px] rounded-full bg-ink shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform duration-200",
					checked ? "translate-x-[22px]" : "translate-x-[3px]",
				)}
			/>
		</button>
	);
}
