import { NavGlyph } from "@/components/console/nav-icon";
import { buttonVariants } from "@/components/ui/button";
import { FEEDBACK_REWARD, type Quota, remaining } from "@/lib/quota";
import { cn } from "@/lib/utils";

/**
 * What this account has left, and how to get more of it.
 *
 * The balance belongs before the wizard rather than after: finding out you are
 * on your last generation while answering ten questions is the wrong moment.
 *
 * The offer stands from the first visit. It was gated on having spent a
 * generation, on the reasoning that feedback before you have used the thing is
 * worth less — but that reasoning was mine, not the product's, and it hid the
 * button from exactly the people who most need the extra credits: somebody
 * looking at five and wondering whether it is enough to bother starting.
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
				className="w-full rounded-[12px] border border-white/8 bg-white/5 px-4 py-3.5 text-[12px] text-ink-muted"
				role="alert"
			>
				{error}
			</p>
		) : null;
	}

	const left = remaining(quota);
	/* Always offered, up until it is taken. */
	const offered = !quota.rewarded;
	const pct = quota.limit > 0 ? Math.round((left / quota.limit) * 100) : 0;

	return (
		<div className="relative w-full overflow-hidden rounded-[16px] border border-white/8 bg-gradient-to-br from-elevated to-elevated/60 p-5 sm:p-6">
			{/* A glow rather than a flat fill — the same treatment the landing
			    page's own cards use, so the console does not read as a plainer
			    product than the site that sold it. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute -top-12 -right-12 size-44 rounded-full bg-brand/10 blur-[70px]"
			/>

			<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex min-w-0 items-center gap-4">
					<span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-brand/20 bg-brand-dim text-brand">
						<NavGlyph className="size-5" icon="spark" />
					</span>

					<div className="min-w-0">
						<p className="flex items-baseline gap-1.5">
							<span className="font-medium text-[32px] text-ink leading-none tabular-nums">
								{left}
							</span>
							<span className="text-[13px] text-ink-muted">
								of {quota.limit} generation{quota.limit === 1 ? "" : "s"} left
							</span>
						</p>

						<div
							aria-hidden="true"
							className="mt-2.5 h-1.5 w-40 max-w-full overflow-hidden rounded-full bg-white/10"
						>
							<div
								className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
								style={{ width: `${pct}%` }}
							/>
						</div>
					</div>
				</div>

				{offered && (
					<button
						className={cn(
							buttonVariants({ variant: "primary", size: "md" }),
							"shrink-0 rounded-[8px]",
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

			<p className="relative mt-4 text-[12px] text-ink-muted">
				{left > 0
					? "Re-downloading a starter you already made is always free."
					: "Your starters stay downloadable — the balance only limits new ones."}
			</p>

			{error && (
				<p className="relative mt-2 text-[12px] text-diagram-red" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}
