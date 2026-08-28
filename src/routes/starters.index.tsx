import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
	ConsoleShell,
	useOpenReport,
} from "@/components/console/console-shell";
import { GenerationBalance } from "@/components/console/generation-balance";
import { StarterGridSkeleton } from "@/components/console/skeletons";
import { CreateStarterDialog } from "@/components/starters/create-starter-dialog";
import { StarterBrowser } from "@/components/starters/starter-browser";
import { buttonVariants } from "@/components/ui/button";
import { createStarter, downloadStarter } from "@/lib/generate/download";
import {
	deleteStarter,
	listStarters,
	type StarterRecord,
} from "@/lib/generate/starters";
import { claimFeedbackReward, generationQuota, type Quota } from "@/lib/quota";
import { pageHead } from "@/lib/seo";
import {
	QUESTION_COUNT_WORD,
	type StarterAnswers,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/starters/")({
	head: () =>
		pageHead({
			path: "/starters",
			title: "Starters",
			description: "Every starter this account has generated.",
			noIndex: true,
		}),
	component: Starters,
});

export const CREATE_LABEL = "Create your starter";

function Starters() {
	const [open, setOpen] = useState(false);
	const [starters, setStarters] = useState<StarterRecord[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [quota, setQuota] = useState<Quota | null>(null);
	const [claiming, setClaiming] = useState(false);
	const [claimError, setClaimError] = useState<string | null>(null);

	function refresh() {
		listStarters()
			.then(setStarters)
			.catch((thrown: unknown) => {
				setStarters([]);
				setError(thrown instanceof Error ? thrown.message : "Could not load.");
			});
	}

	useEffect(refresh, []);

	/* Read once on arrival, and again whenever the balance could have moved. */
	useEffect(() => {
		generationQuota()
			.then(setQuota)
			.catch((thrown: unknown) =>
				setClaimError(
					thrown instanceof Error
						? thrown.message
						: "Could not read your balance.",
				),
			);
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
	 * Generates the starter and goes to its page.
	 *
	 * No download here any more. Finishing the wizard used to drop a zip into
	 * someone's Downloads folder before they had read anything about what to do
	 * with it — so the guide, which is the useful half, was never seen. The
	 * starter's own page has the guide and the download button on it.
	 */
	async function submit(answers: StarterAnswers) {
		const created = await createStarter(answers);
		window.location.assign(`/starters/${created.id}`);
	}

	async function download(record: StarterRecord) {
		setError(null);
		setBusyId(record.id);
		try {
			await downloadStarter({ starterId: record.id });
		} catch (thrown) {
			setError(
				thrown instanceof Error ? thrown.message : "Could not download that.",
			);
		} finally {
			setBusyId(null);
		}
	}

	async function remove(record: StarterRecord) {
		setError(null);
		setBusyId(record.id);
		try {
			await deleteStarter(record.id);
			/* Dropped locally as well as remotely: refetching alone would leave
			   the card on screen for as long as the round trip takes. */
			setStarters((current) =>
				(current ?? []).filter((other) => other.id !== record.id),
			);
		} catch (thrown) {
			setError(
				thrown instanceof Error ? thrown.message : "Could not delete that.",
			);
		} finally {
			setBusyId(null);
		}
	}

	return (
		<ConsoleShell
			actions={
				<button
					className={cn(
						buttonVariants({ variant: "primary", size: "sm" }),
						"rounded-[8px]",
					)}
					onClick={() => setOpen(true)}
					type="button"
				>
					{CREATE_LABEL}
				</button>
			}
			currentPath="/starters"
			onReportSent={rewardForFeedback}
			title="Starters"
		>
			<div className="flex flex-col items-start gap-6">
				<Balance claiming={claiming} error={claimError} quota={quota} />

				{error && (
					<p className="text-[13px] text-diagram-red" role="alert">
						{error}
					</p>
				)}

				{starters === null ? (
					<StarterGridSkeleton />
				) : starters.length === 0 ? (
					<div className="flex w-full flex-col items-center gap-2 rounded-[12px] border border-white/10 border-dashed px-6 py-16 text-center">
						<p className="text-[14px] text-ink">No starters yet</p>
						<p className="max-w-[42ch] text-[13px] text-ink-muted">
							Answer {QUESTION_COUNT_WORD} questions and the project is yours to
							download.
						</p>
					</div>
				) : (
					<StarterBrowser
						busyId={busyId}
						onDelete={remove}
						onDownload={download}
						starters={starters}
					/>
				)}
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
 * A component rather than a hook call in `Starters`, because `Starters`
 * *renders* `ConsoleShell` and therefore sits above the provider inside it —
 * `useOpenReport` there returned the default no-op and the button did nothing
 * when clicked. This renders as a child of the shell, which is where the
 * context actually is.
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
