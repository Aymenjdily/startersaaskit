import { cn } from "@/lib/utils";

/**
 * A stack of choices, single or multiple.
 *
 * Real `<input type="radio">` and `type="checkbox"` inside a `<label>`, not
 * styled divs: it keeps the roles, the arrow-key behaviour within a radio
 * group, the space-to-toggle, and the label-clicks-the-control association —
 * all of which a div would have to reimplement, badly.
 *
 * Shared by the onboarding wizard and the starter dialog, which ask different
 * questions in the same shape.
 */
export function OptionList({
	multiple = false,
	name,
	onChange,
	options,
	value,
}: {
	multiple?: boolean;
	/** Groups the radios, so only one in this list can be chosen. */
	name: string;
	onChange: (value: string | string[]) => void;
	options: readonly { id: string; label: string }[];
	value: string | string[] | undefined;
}) {
	const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);

	function toggle(id: string) {
		if (!multiple) {
			onChange(id);
			return;
		}

		const next = new Set(selected);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}

		/* Rebuilt in the list's own order, so the value does not depend on the
		   order someone happened to click things in. */
		onChange(options.map((option) => option.id).filter((id) => next.has(id)));
	}

	return (
		<div className="flex flex-col gap-2">
			{options.map((option) => {
				const checked = selected.has(option.id);

				return (
					<label
						className={cn(
							"flex cursor-pointer items-center gap-3 rounded-[8px] border px-4 py-3 text-[14px] transition-colors duration-200",
							checked
								? "border-brand/60 bg-brand/10 text-ink"
								: "border-white/8 bg-black/25 text-ink-soft hover:border-white/25 hover:bg-black/40",
						)}
						key={option.id}
					>
						<input
							checked={checked}
							className="size-4 accent-brand"
							name={name}
							onChange={() => toggle(option.id)}
							type={multiple ? "checkbox" : "radio"}
						/>
						{option.label}
					</label>
				);
			})}
		</div>
	);
}
