import { buttonVariants } from "@/components/ui/button";
import { FEEDBACK_REWARD, type Quota, remaining } from "@/lib/quota";
import { cn } from "@/lib/utils";

/**
 * What this account has left, and how to get more of it.
 *
 * The balance belongs before the wizard rather than after: finding out you are
 * on your last generation while answering ten questions is the wrong moment.
 *
 * The offer appears only once something has been spent, because "tell us how it
 * went" makes no sense to somebody who has not used the thing yet — there is
 * nothing they could tell us, and asking anyway reads as a toll.
 *
 * Presentational on purpose. Claiming the reward has to happen after the report
 * is written, which only the dialog knows, so the page owns both and this shows
 * what the page hands it.
 *
 * A failed read is drawn, not hidden. The first version returned `null` for
 * both "still loading" and "that query failed", so a database missing
 * `generation_limit` produced an empty space that looked like a component
 * nobody had wired up.
 */
export function GenerationBalance({
	claiming = false,
	error = null,
	onReport,
	quota,
}: {
	/** True while the reward is being taken, so the button can say so. */
	claiming?: boolean;
	error?: string | null;
	/** Opens the report dialog. */
	onReport: () => void;
	/** `null` while it is still loading, or when `error` says why it is absent. */
	quota: Quota | null;
}) {
	/* An error without a balance is worth a line of its own: it is the only
	   state where the reader can actually do something about what they see. */
	if (!quota) {
		return error ? (
			<p
				className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[12px] text-ink-muted"
				role="alert"
			>
				{error}
			</p>
		) : null;
	}

	const left = remaining(quota);
	/* Offered once there is something to give feedback about, and only while it
	   is still there to take. */
	const offered = quota.used > 0 && !quota.rewarded;

	return (
		<div className="flex w-full flex-col gap-3 rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-3.5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<p className="text-[13px] text-ink">
					<span className="font-medium tabular-nums">{left}</span>
					<span className="text-ink-muted">
						{" "}
						of {quota.limit} generation{quota.limit === 1 ? "" : "s"} left
					</span>
				</p>

				{offered && (
					<button
						className={cn(
							buttonVariants({ variant: "secondary", size: "sm" }),
							"rounded-[8px]",
						)}
						disabled={claiming}
						onClick={onReport}
						type="button"
					>
						{claiming
							? "Adding them…"
							: `Leave feedback, get ${FEEDBACK_REWARD} more`}
					</button>
				)}
			</div>

			<p className="text-[12px] text-ink-muted">
				{left > 0
					? "Re-downloading a starter you already made is always free."
					: "Your starters stay downloadable — the balance only limits new ones."}
			</p>

			{error && (
				<p className="text-[12px] text-diagram-red" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
