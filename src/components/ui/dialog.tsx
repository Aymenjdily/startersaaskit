import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A modal dialog.
 *
 * Hand-built rather than the native `<dialog>` element, which would give focus
 * trapping and Escape for free — jsdom does not implement `showModal`, so a
 * native dialog could not be covered by this suite at all. The behaviours it
 * would have provided are therefore implemented and tested here instead:
 *
 * - focus moves into the panel on open and returns to the trigger on close
 * - Tab cycles inside the panel rather than escaping to the page behind
 * - Escape closes, as does a click on the backdrop
 * - the page behind cannot scroll while it is open
 *
 * Renders nothing when closed, which also keeps it out of the server render.
 */
const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
	children,
	className,
	description,
	dismissOnBackdrop = true,
	onClose,
	open,
	title,
}: {
	children: React.ReactNode;
	className?: string;
	description?: string;
	/**
	 * Whether a click on the backdrop closes this dialog.
	 *
	 * True suits a dialog you can only read or a form you can only lose a
	 * sentence to. Set it false when the panel holds work that a mis-aimed
	 * click should not be able to end — the backdrop is the easiest thing on
	 * screen to hit by accident, and it sits directly beside every control.
	 *
	 * Escape and the close button stay live either way: both are deliberate,
	 * and a modal that cannot be dismissed from the keyboard is a trap.
	 */
	dismissOnBackdrop?: boolean;
	onClose: () => void;
	open: boolean;
	title: string;
}) {
	const panel = useRef<HTMLDivElement>(null);
	const titleId = useId();
	const descriptionId = useId();

	useEffect(() => {
		if (!open) return;

		/* Whatever opened the dialog is where focus belongs when it shuts —
		   usually the trigger button, which may not exist by then, hence the
		   `isConnected` check on the way out. */
		const opener = document.activeElement as HTMLElement | null;
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";

		const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
		(first ?? panel.current)?.focus();

		return () => {
			document.body.style.overflow = overflow;
			if (opener?.isConnected) opener.focus();
		};
	}, [open]);

	if (!open) return null;

	function onKeyDown(event: React.KeyboardEvent) {
		if (event.key === "Escape") {
			event.stopPropagation();
			onClose();
			return;
		}
		if (event.key !== "Tab") return;

		const focusable = [
			...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []),
		];
		if (focusable.length === 0) return;

		const edge = event.shiftKey
			? focusable[0]
			: focusable[focusable.length - 1];

		/* Only intervene at the ends; in between, the browser does it better. */
		if (document.activeElement === edge) {
			event.preventDefault();
			(event.shiftKey ? focusable[focusable.length - 1] : focusable[0]).focus();
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
			{/* `mousedown`, not `click`: a drag that starts inside the panel and
			    releases out here should not be read as "dismiss". */}
			<div
				aria-hidden="true"
				className="fixed inset-0 bg-black/70 backdrop-blur-sm"
				onMouseDown={dismissOnBackdrop ? onClose : undefined}
			/>

			<div
				aria-describedby={description ? descriptionId : undefined}
				aria-labelledby={titleId}
				aria-modal="true"
				className={cn(
					"relative my-auto w-full max-w-[520px] rounded-[16px] border border-white/8 bg-base/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl",
					className,
				)}
				onKeyDown={onKeyDown}
				ref={panel}
				role="dialog"
				tabIndex={-1}
			>
				<div className="mb-6 pr-10">
					<h2
						className="text-[17px] font-medium text-ink leading-[1.3]"
						id={titleId}
					>
						{title}
					</h2>
					{description && (
						<p className="mt-1 text-[13px] text-ink-muted" id={descriptionId}>
							{description}
						</p>
					)}
				</div>

				{children}

				{/* Last in the DOM, top-right on screen. Placed before the content it
				    would take the opening focus and the first tab stop, pushing the
				    question someone came here to answer into second place. */}
				<button
					aria-label="Close"
					className="absolute top-5 right-5 rounded-[8px] p-1.5 text-ink-muted transition-colors duration-200 hover:bg-white/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					onClick={onClose}
					type="button"
				>
					<svg
						aria-hidden="true"
						className="size-4"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeWidth="1.5"
						viewBox="0 0 24 24"
					>
						<path d="M6 6l12 12M18 6L6 18" />
					</svg>
				</button>
			</div>
		</div>
	);
}
