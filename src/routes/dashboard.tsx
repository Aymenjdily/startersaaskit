import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	ConsoleShell,
	useOpenReport,
} from "@/components/console/console-shell";
import { GenerationBalance } from "@/components/console/generation-balance";
import { NavGlyph } from "@/components/console/nav-icon";
import { ActionCard, Panel, Section } from "@/components/console/panel";
import {
	RecentStartersHead,
	RecentStartersSkeleton,
} from "@/components/console/skeletons";
import { CreateStarterDialog } from "@/components/starters/create-starter-dialog";
import { StackMarks } from "@/components/starters/stack-marks";
import { buttonVariants } from "@/components/ui/button";
import { CONSOLE_HREF } from "@/lib/console-nav";
import { createStarter } from "@/lib/generate/download";
import { listStarters, type StarterRecord } from "@/lib/generate/starters";
import { claimFeedbackReward, generationQuota, type Quota } from "@/lib/quota";
import { pageHead } from "@/lib/seo";
import {
	QUESTION_COUNT_WORD,
	type StarterAnswers,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
	head: () =>
		pageHead({
			path: "/dashboard",
			title: "Console",
			description: "Your generated starters and account.",
			noIndex: true,
		}),
	component: Dashboard,
});

/** The most recent few, so the page has something of yours on it. */
const RECENT = 4;

function Dashboard() {
	const [starters, setStarters] = useState<StarterRecord[] | null>(null);
	const [quota, setQuota] = useState<Quota | null>(null);
	const [claiming, setClaiming] = useState(false);
	const [claimError, setClaimError] = useState<string | null>(null);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		listStarters()
			.then(setStarters)
			.catch(() => setStarters([]));
		/* The overview has no room to explain a failure, so it keeps the old
		   behaviour of showing no number rather than a wrong one. */
		generationQuota()
			.then(setQuota)
			.catch(() => setQuota(null));
	}, []);

	/**
	 * Takes the reward, once the dialog says a report was actually written.
	 *
	 * Failures are shown rather than swallowed: somebody who has just typed out
	 * feedback in exchange for ten generations should be told if they did not
	 * arrive, not left counting.
	 */
	async function rewardForFeedback() {
		setClaiming(true);
		setClaimError(null);
		try {
			const limit = await claimFeedbackReward();
			setQuota((current) =>
				current ? { ...current, limit, rewarded: true } : current,
			);
		} catch (thrown) {
			setClaimError(
				thrown instanceof Error ? thrown.message : "Could not claim that.",
			);
		} finally {
			setClaiming(false);
		}
	}

	/**
	 * Generates the starter and goes to its page — the same handoff
	 * `starters.index.tsx` makes, so opening the wizard from the overview
	 * lands somewhere with the guide and the download button on it, not back
	 * on this page with nothing new to show for it.
	 */
	async function submit(answers: StarterAnswers) {
		const created = await createStarter(answers);
		window.location.assign(`/starters/${created.id}`);
	}

	const recent = (starters ?? []).slice(0, RECENT);

	return (
		<ConsoleShell
			currentPath={CONSOLE_HREF}
			onReportSent={rewardForFeedback}
			title="Overview"
		>
			<div className="flex flex-col gap-10">
				<Balance claiming={claiming} error={claimError} quota={quota} />

				<Section
					description={`Answer ${QUESTION_COUNT_WORD} questions and the project is yours to download.`}
					title="Start something"
				>
					<div className="grid gap-3 sm:grid-cols-2">
						<ActionCard
							description="Pick a stack and take delivery as a zip."
							icon={<NavGlyph icon="stack" />}
							onClick={() => setOpen(true)}
							title="Generate a starter"
							variant="primary"
						/>
						<ActionCard
							description="Not built yet. Your account settings will live here."
							disabled
							icon={<NavGlyph icon="sliders" />}
							title="Settings"
						/>
					</div>
				</Section>

				<Section
					action={
						recent.length > 0 ? (
							<a
								className="text-[13px] text-ink-muted underline underline-offset-4 transition-colors duration-200 hover:text-ink"
								href="/starters"
							>
								View all
							</a>
						) : undefined
					}
					title="Recent starters"
				>
					{starters === null ? (
						<RecentStartersSkeleton rows={RECENT} />
					) : recent.length === 0 ? (
						<Panel className="flex flex-col items-center gap-3 px-5 py-16 text-center">
							<span className="flex size-10 items-center justify-center rounded-[10px] border border-white/8 bg-white/6 text-ink-muted">
								<NavGlyph icon="stack" />
							</span>
							<p className="text-[14px] text-ink">Nothing generated yet</p>
							<p className="max-w-[42ch] text-[13px] text-ink-muted">
								Answer {QUESTION_COUNT_WORD} questions and the project is yours
								to download.
							</p>
							<button
								className={cn(
									buttonVariants({ variant: "primary", size: "sm" }),
									"mt-1 rounded-[8px]",
								)}
								onClick={() => setOpen(true)}
								type="button"
							>
								Generate a starter
							</button>
						</Panel>
					) : (
						<Panel>
							<table className="w-full text-left">
								<RecentStartersHead />
								<tbody>
									{recent.map((record) => (
										<tr
											className="border-white/8 border-b transition-colors duration-150 last:border-0 hover:bg-white/5"
											key={record.id}
										>
											<td className="px-5 py-3">
												<a
													className="text-[13px] text-ink underline-offset-4 hover:underline"
													href={`/starters/${record.id}`}
												>
													{record.project}
												</a>
											</td>
											<td className="px-5 py-3">
												<StackMarks record={record} size="sm" />
											</td>
											<td className="px-5 py-3 text-right text-[12px] text-ink-muted">
												{new Date(record.created_at).toLocaleDateString(
													undefined,
													{ year: "numeric", month: "short", day: "numeric" },
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</Panel>
					)}
				</Section>
			</div>

			<CreateStarterDialog
				onClose={() => setOpen(false)}
				onSubmit={submit}
				open={open}
			/>
		</ConsoleShell>
	);
}

/**
 * The balance, connected to the shell's report dialog.
 *
 * A component rather than a hook call in `Dashboard`, because `Dashboard`
 * *renders* `ConsoleShell` and therefore sits above the provider inside it —
 * `useOpenReport` there returned the default no-op and the button did nothing
 * when clicked. This renders as a child of the shell, which is where the
 * context actually is. Same split `starters.index.tsx` uses for the same
 * reason.
 */
function Balance(props: {
	claiming: boolean;
	error: string | null;
	quota: Quota | null;
}) {
	const openReport = useOpenReport();

	/* Opened as feedback, not as a bug: the button offered generations for an
	   opinion, and the dialog has to ask for the thing that was offered for. */
	return (
		<GenerationBalance {...props} onReport={() => openReport("feedback")} />
	);
}
