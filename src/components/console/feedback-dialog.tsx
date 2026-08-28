import { useId, useState } from "react";
import { FormError } from "@/components/auth/controls";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
	BUILDING_MAX,
	leaveFeedback,
	MESSAGE_MAX,
	messageProblem,
	RATING_LABELS,
	RATINGS,
	type Rating,
} from "@/lib/product-feedback";
import { FEEDBACK_REWARD } from "@/lib/quota";
import { cn } from "@/lib/utils";

/**
 * Asks how it went, in exchange for generations.
 *
 * Its own dialog rather than the bug report form wearing a different title.
 * They ask different questions — this one wants a rating and an opinion, that
 * one wants a defect and a page — and they are stored in different tables, so
 * sharing a form would have meant a form that half-fits both.
 *
 * ## Why the rating is required and the rest is not
 *
 * The number is the only field that can be counted, and a scale nobody is made
 * to answer produces a column of nulls. "What are you building" is optional
 * because it is the most useful answer and the most intrusive question, and
 * making it compulsory is how you get "stuff" typed into it.
 */
export function FeedbackDialog({
	onClose,
	onSent,
	open,
}: {
	onClose: () => void;
	/** Called once a row has been written, which is what the reward pays for. */
	onSent?: () => void;
	open: boolean;
}) {
	const [rating, setRating] = useState<Rating | null>(null);
	const [message, setMessage] = useState("");
	const [building, setBuilding] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);
	const messageId = useId();
	const buildingId = useId();
	const countId = useId();

	/* Only complain once there is something to complain about. */
	const problem = message === "" ? null : messageProblem(message);
	const ready = rating !== null && messageProblem(message) === null;

	function close() {
		setRating(null);
		setMessage("");
		setBuilding("");
		setError(null);
		setSent(false);
		onClose();
	}

	async function send() {
		if (rating === null) return;

		setBusy(true);
		setError(null);

		try {
			await leaveFeedback({ building, message, rating });
			setSent(true);
			onSent?.();
		} catch (thrown) {
			setError(
				thrown instanceof Error ? thrown.message : "Could not send that.",
			);
		} finally {
			setBusy(false);
		}
	}

	return (
		<Dialog
			description={
				sent
					? undefined
					: `Two questions. Sending it adds ${FEEDBACK_REWARD} generations to your account.`
			}
			/* There is typing in here worth more than a mis-aimed click. */
			dismissOnBackdrop={rating === null && message === ""}
			onClose={close}
			open={open}
			title={sent ? "Thank you" : "How is it going?"}
		>
			{sent ? (
				<div className="flex flex-col gap-6">
					<p className="text-[14px] text-white/70 leading-[1.6]">
						{FEEDBACK_REWARD} generations are on your account. We read every one
						of these — it is the whole reason the button exists.
					</p>
					<button
						className={cn(
							buttonVariants({ variant: "primary" }),
							"h-11 rounded-[8px]",
						)}
						onClick={close}
						type="button"
					>
						Done
					</button>
				</div>
			) : (
				<div className="flex flex-col gap-6">
					<fieldset className="flex flex-col gap-2.5">
						<legend className="mb-2.5 font-medium text-[13px] text-ink">
							How useful was the starter we generated?
						</legend>
						<div className="flex flex-wrap gap-2">
							{RATINGS.map((option) => (
								<button
									aria-pressed={option === rating}
									className={cn(
										"rounded-[8px] border px-3 py-2 text-[13px] transition-colors duration-200",
										option === rating
											? "border-brand/40 bg-brand/15 text-ink"
											: "border-white/12 text-white/70 hover:border-white/25 hover:text-ink",
									)}
									key={option}
									onClick={() => setRating(option)}
									type="button"
								>
									{RATING_LABELS[option]}
								</button>
							))}
						</div>
					</fieldset>

					<div className="flex flex-col gap-1.5">
						<label
							className="font-medium text-[13px] text-ink"
							htmlFor={messageId}
						>
							What would make it better?
						</label>
						<textarea
							aria-describedby={countId}
							aria-invalid={problem !== null}
							className="min-h-[104px] w-full resize-y rounded-[8px] border border-white/12 bg-black/25 px-3 py-2.5 text-[14px] text-ink transition-colors duration-200 placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
							id={messageId}
							maxLength={MESSAGE_MAX}
							onChange={(event) => setMessage(event.target.value)}
							placeholder="What got in the way, what you expected, what you would have shipped without."
							value={message}
						/>
						<p
							className={cn(
								"text-[12px]",
								problem ? "text-diagram-red" : "text-ink-muted",
							)}
							id={countId}
						>
							{problem ?? `${message.trim().length} of ${MESSAGE_MAX}`}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							className="font-medium text-[13px] text-ink"
							htmlFor={buildingId}
						>
							What are you building?{" "}
							<span className="font-normal text-ink-muted">Optional</span>
						</label>
						<input
							autoComplete="off"
							className="h-11 w-full rounded-[8px] border border-white/12 bg-black/25 px-3 text-[14px] text-ink transition-colors duration-200 placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
							id={buildingId}
							maxLength={BUILDING_MAX}
							onChange={(event) => setBuilding(event.target.value)}
							placeholder="A booking tool for dance studios"
							value={building}
						/>
					</div>

					<FormError message={error} />

					<button
						className={cn(
							buttonVariants({ variant: "primary" }),
							"h-11 rounded-[8px]",
						)}
						disabled={!ready || busy}
						onClick={send}
						type="button"
					>
						{busy ? "Sending…" : `Send and get ${FEEDBACK_REWARD} generations`}
					</button>
				</div>
			)}
		</Dialog>
	);
}
