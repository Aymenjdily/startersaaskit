import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ConsoleShell } from "@/components/console/console-shell";
import { Panel, Section } from "@/components/console/panel";
import { StarterDetailSkeleton } from "@/components/console/skeletons";
import { StackMarks } from "@/components/starters/stack-marks";
import { StarterGuide } from "@/components/starters/starter-guide";
import { buttonVariants } from "@/components/ui/button";
import { File, Folder, Tree } from "@/components/ui/file-tree";
import { buildStarter } from "@/lib/generate/build-starter";
import { downloadStarter } from "@/lib/generate/download";
import {
	allFolderIds,
	type TreeNode,
	toFileTree,
} from "@/lib/generate/file-tree";
import { starterGuide, starterTour } from "@/lib/generate/guide";
import { getStarter, type StarterRecord } from "@/lib/generate/starters";
import { pageHead } from "@/lib/seo";
import { answerProblems, STARTER_QUESTIONS } from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/starters/$id")({
	head: () =>
		pageHead({
			path: "/starters",
			title: "Starter",
			description: "A generated starter and the guide that ships with it.",
			noIndex: true,
		}),
	component: StarterDetail,
});

/**
 * One generated starter: what it was built from, what is in it, and a way to
 * download it again.
 *
 * The file tree is rebuilt from the stored answers rather than kept anywhere.
 * Generation is deterministic, so the tree shown here is the tree in the zip —
 * and there is no archive sitting in storage going stale or costing money.
 *
 * The tradeoff is honest and worth stating: if the templates improve, an old
 * starter re-downloads with the improvements rather than as first delivered.
 * For a product still filling in its modules that is the better default.
 */
function StarterDetail() {
	const { id } = useParams({ from: "/starters/$id" });
	const [record, setRecord] = useState<StarterRecord | null | undefined>();
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		getStarter(id)
			.then(setRecord)
			.catch((thrown: unknown) => {
				setRecord(null);
				setError(thrown instanceof Error ? thrown.message : "Could not load.");
			});
	}, [id]);

	/**
	 * Rebuilt, not stored — see the note above. Memoised because building runs
	 * the whole generator, and it must not run again on every keystroke.
	 *
	 * Caught rather than left to throw, and the reason is the flip side of
	 * rebuilding: the rules a stored answer set is checked against are today's,
	 * not the ones in force when it was written. They only get stricter — Auth0
	 * stopped being offered beside TanStack Start once it turned out their only
	 * SDK with a server session is the Next one — so a starter generated before
	 * such a change no longer validates. Throwing here took the whole page down
	 * and showed the reader a bare sentence with no way back.
	 */
	const built = useMemo(() => {
		if (!record) {
			return {
				files: {} as ReturnType<typeof buildStarter>,
				paths: [] as string[],
				stale: null as string | null,
			};
		}
		try {
			const files = buildStarter(record.answers);
			return { files, paths: Object.keys(files), stale: null };
		} catch (thrown) {
			return {
				files: {} as ReturnType<typeof buildStarter>,
				paths: [],
				stale:
					thrown instanceof Error
						? thrown.message
						: "This one cannot be built.",
			};
		}
	}, [record]);

	const problems = useMemo(
		() => (record ? answerProblems(record.answers) : []),
		[record],
	);

	/* From the same build as the tree, so the instructions and the file list
	   describe one project rather than two. */
	const guide = useMemo(
		() =>
			record && !built.stale
				? {
						steps: starterGuide(built.files, record.answers),
						tour: starterTour(built.files),
					}
				: null,
		[built, record],
	);
	const tree = useMemo(() => toFileTree(built.paths), [built.paths]);

	async function download() {
		if (!record) return;

		setError(null);
		setBusy(true);
		try {
			await downloadStarter({ starterId: record.id });
		} catch (thrown) {
			setError(
				thrown instanceof Error ? thrown.message : "Could not download that.",
			);
		} finally {
			setBusy(false);
		}
	}

	const back = { href: "/starters", label: "Back to starters" };

	if (record === undefined) {
		return (
			<ConsoleShell back={back} currentPath="/starters" title="Starter">
				<StarterDetailSkeleton />
			</ConsoleShell>
		);
	}

	if (record === null) {
		return (
			<ConsoleShell back={back} currentPath="/starters" title="Starter">
				<Panel className="px-6 py-12 text-center">
					<p className="text-[14px] text-ink" role="alert">
						{error ?? "That starter does not exist, or is not yours."}
					</p>
					<a
						className="mt-3 inline-block text-[13px] text-white/50 underline underline-offset-4 hover:text-ink"
						href="/starters"
					>
						Back to starters
					</a>
				</Panel>
			</ConsoleShell>
		);
	}

	return (
		<ConsoleShell
			actions={
				<button
					className={cn(
						buttonVariants({ variant: "primary", size: "sm" }),
						"rounded-[8px]",
					)}
					/* The endpoint re-validates with the same rules, so a stale
					   record would come back a 422. Better to not offer it. */
					disabled={busy || built.stale !== null}
					onClick={download}
					type="button"
				>
					{busy ? "Preparing…" : "Download zip"}
				</button>
			}
			back={back}
			currentPath="/starters"
			title={record.project}
		>
			<div className="flex flex-col gap-8">
				<div className="flex flex-wrap items-center gap-4">
					<StackMarks record={record} />
					<p className="text-[12px] text-white/45">
						Generated{" "}
						{new Date(record.created_at).toLocaleString(undefined, {
							dateStyle: "medium",
							timeStyle: "short",
						})}
					</p>
				</div>

				{error && (
					<p className="text-[13px] text-diagram-red" role="alert">
						{error}
					</p>
				)}

				{/* Side by side above `lg`: the stack is what the tree is a
				    consequence of, and reading one while scrolling the other is the
				    whole point of the page. */}
				<div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
					<Section title="Stack">
						<Panel>
							<dl className="divide-y divide-white/8">
								{STARTER_QUESTIONS.filter((q) => q.kind === "choice").map(
									(question) => {
										const option = question.options?.find(
											(candidate) =>
												candidate.id === record.answers[question.id],
										);

										return (
											<div
												className="flex items-center justify-between gap-4 px-4 py-2.5"
												key={question.id}
											>
												<dt className="text-[12px] text-white/45">
													{question.label}
												</dt>
												<dd className="text-[13px] text-ink">
													{option?.label ?? "—"}
												</dd>
											</div>
										);
									},
								)}
							</dl>
						</Panel>
					</Section>

					{built.stale ? (
						<Section
							description="The stack this was generated from is no longer one the generator offers, so its files cannot be listed or rebuilt."
							title="Cannot be rebuilt"
						>
							<Panel className="px-5 py-5">
								<ul className="flex flex-col gap-2">
									{problems.map((problem) => (
										<li
											className="flex gap-2 text-[13px] text-ink"
											key={`${problem.id}-${problem.problem}`}
										>
											<span
												aria-hidden="true"
												className="mt-1.5 size-1.5 shrink-0 rounded-full bg-diagram-red"
											/>
											{problem.problem}
										</li>
									))}
								</ul>

								<p className="mt-4 text-[13px] text-ink-muted">
									Nothing is lost — the answers above are the whole record.
									Generate a new starter with a combination that is still
									offered, then delete this one.
								</p>

								<a
									className={cn(
										buttonVariants({ variant: "secondary", size: "sm" }),
										"mt-4 rounded-[8px]",
									)}
									href="/starters"
								>
									Back to starters
								</a>
							</Panel>
						</Section>
					) : (
						<Section
							description="Exactly what the archive contains. No node_modules — a resolved dependency tree is hundreds of megabytes of platform-specific binaries, so you run your own install."
							title={`Files (${built.paths.length})`}
						>
							<Panel className="p-2">
								<Tree
									className="max-h-[420px] overflow-auto"
									/* Open on arrival: a collapsed tree of seventeen files
									   makes the reader click to learn what they already
									   asked for. */
									initialExpandedItems={allFolderIds(tree)}
								>
									{tree.map((node) => (
										<TreeBranch key={node.id} node={node} />
									))}
								</Tree>
							</Panel>
						</Section>
					)}
				</div>

				{guide && <StarterGuide steps={guide.steps} tour={guide.tour} />}
			</div>
		</ConsoleShell>
	);
}

/** One node, and everything under it. Folders recurse; files are leaves. */
function TreeBranch({ node }: { node: TreeNode }) {
	if (!node.children) {
		return (
			<File value={node.id}>
				<span className="text-[13px]">{node.name}</span>
			</File>
		);
	}

	return (
		<Folder element={node.name} value={node.id}>
			{node.children.map((child) => (
				<TreeBranch key={child.id} node={child} />
			))}
		</Folder>
	);
}
