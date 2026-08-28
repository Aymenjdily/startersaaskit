import { useState } from "react";
import { FormError } from "@/components/auth/controls";
import { buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
	DETAIL_MAX,
	fileReport,
	REPORT_KINDS,
	type ReportKind,
	SUMMARY_MAX,
	summaryProblem,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

const KIND_LABELS: Record<ReportKind, string> = {
	bug: "Something is broken",
	idea: "An idea",
	question: "A question",
};

/**
 * The report form.
 *
 * ## Why the page and the browser are not asked for
 *
 * They are captured in `fileReport`. "Which page were you on" and "which
 * browser" are the two questions a bug report most often answers wrongly, and
 * both are already known — asking costs the reporter effort and buys worse
 * data.
 *
 * ## Why it stays open on failure
 *
 * Someone who has just typed out what went wrong should not lose it to a
 * network error. The dialog clears only after the row is written.
 */
export function ReportDialog({
	onClose,
	onSent,
	open,
}: {
	onClose: () => void;
	/**
	 * Called once a report has actually been written, not merely submitted.
	 *
	 * The distinction is what the feedback reward hangs off: paying out on the
	 * click would pay for a failed insert, and paying out on close would pay
	 * for opening the dialog and changing your mind.
	 */
	onSent?: () => void;
	open: boolean;
}) {
	const [kind, setKind] = useState<ReportKind>("bug");
	const [summary, setSummary] = useState("");
	const [detail, setDetail] = useState("");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	/* Only complain once there is something to complain about. */
	const problem = summary === "" ? null : summaryProblem(summary);
	const ready = summaryProblem(summary) === null;

	function close() {
		setKind("bug");
		setSummary("");
		setDetail("");
		setError(null);
		setSent(false);
		onClose();
	}

	async function send() {
		setBusy(true);
		setError(null);

		try {
			await fileReport({ kind, summary, detail });
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
					: "It goes straight to us with the page you are on attached."
			}
			onClose={close}
			open={open}
			title={sent ? "Thank you" : "Report a problem"}
		>
			{sent ? (
				<div className="flex flex-col gap-6">
					<p className="text-[14px] text-white/70 leading-[1.6]">
						Logged, with the page and browser attached. If it needs a reply we
						will use the address on your account.
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
							What is it?
						</legend>
						<div className="flex flex-wrap gap-2">
							{REPORT_KINDS.map((option) => (
								<button
									aria-pressed={option === kind}
									className={cn(
										"rounded-[8px] border px-3 py-2 text-[13px] transition-colors duration-200",
										option === kind
											? "border-brand/40 bg-brand/15 text-ink"
											: "border-white/12 text-white/70 hover:border-white/25 hover:text-ink",
									)}
									key={option}
									onClick={() => setKind(option)}
									type="button"
								>
									{KIND_LABELS[option]}
								</button>
							))}
						</div>
					</fieldset>

					<div className="flex flex-col gap-1.5">
						<label
							className="font-medium text-[13px] text-ink"
							htmlFor="report-summary"
						>
							In one line
						</label>
						<input
							aria-describedby="report-summary-hint"
							aria-invalid={problem !== null}
							autoComplete="off"
							className="h-11 w-full rounded-[8px] border border-white/12 bg-black/25 px-3 text-[14px] text-ink transition-colors duration-200 placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
							id="report-summary"
							maxLength={SUMMARY_MAX}
							onChange={(event) => setSummary(event.target.value)}
							placeholder="The download button did nothing"
							value={summary}
						/>
						<p
							className={cn(
								"text-[12px]",
								problem ? "text-diagram-red" : "text-ink-muted",
							)}
							id="report-summary-hint"
						>
							{problem ?? `${summary.length}/${SUMMARY_MAX}`}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<label
							className="font-medium text-[13px] text-ink"
							htmlFor="report-detail"
						>
							Anything else <span className="text-ink-muted">(optional)</span>
						</label>
						<textarea
							className="min-h-[110px] w-full resize-y rounded-[8px] border border-white/12 bg-black/25 px-3 py-2.5 text-[14px] text-ink transition-colors duration-200 placeholder:text-ink-muted focus:border-white/25 focus:outline-2 focus:outline-offset-2 focus:outline-brand"
							id="report-detail"
							maxLength={DETAIL_MAX}
							onChange={(event) => setDetail(event.target.value)}
							placeholder="What you expected, and what happened instead."
							value={detail}
						/>
					</div>

					<FormError message={error} />

					<div className="flex items-center gap-3">
						<button
							className={cn(
								buttonVariants({ variant: "secondary" }),
								"h-11 rounded-[8px]",
							)}
							disabled={busy}
							onClick={close}
							type="button"
						>
							Cancel
						</button>
						<button
							className={cn(
								buttonVariants({ variant: "primary" }),
								"h-11 flex-1 rounded-[8px]",
							)}
							disabled={!ready || busy}
							onClick={send}
							type="button"
						>
							{busy ? "Sending…" : "Send report"}
						</button>
					</div>
				</div>
			)}
		</Dialog>
	);
}
