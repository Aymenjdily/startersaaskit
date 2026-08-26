import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ConsoleShell } from "@/components/console/console-shell";
import { NavGlyph } from "@/components/console/nav-icon";
import { ActionCard, Panel, Section } from "@/components/console/panel";
import {
	RecentStartersHead,
	RecentStartersSkeleton,
} from "@/components/console/skeletons";
import { StackMarks } from "@/components/starters/stack-marks";
import { BRAND } from "@/lib/brand";
import { CONSOLE_HREF } from "@/lib/console-nav";
import { listStarters, type StarterRecord } from "@/lib/generate/starters";
import { QUESTION_COUNT_WORD } from "@/lib/starter-questions";

export const Route = createFileRoute("/dashboard")({
	head: () => ({ meta: [{ title: `Console · ${BRAND}` }] }),
	component: Dashboard,
});

/** The most recent few, so the page has something of yours on it. */
const RECENT = 4;

function Dashboard() {
	const [starters, setStarters] = useState<StarterRecord[] | null>(null);

	useEffect(() => {
		listStarters()
			.then(setStarters)
			.catch(() => setStarters([]));
	}, []);

	const recent = (starters ?? []).slice(0, RECENT);

	return (
		<ConsoleShell currentPath={CONSOLE_HREF} title="Overview">
			<div className="flex flex-col gap-10">
				<Section
					description={`Answer ${QUESTION_COUNT_WORD} questions and the project is yours to download.`}
					title="Start something"
				>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						<ActionCard
							description="Pick a stack and take delivery as a zip."
							href="/starters"
							icon={<NavGlyph icon="stack" />}
							title="Generate a starter"
						/>
						<ActionCard
							description="Everything you have generated, with its stack."
							href="/starters"
							icon={<NavGlyph icon="grid" />}
							title="Browse your starters"
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
								className="text-[13px] text-white/50 underline underline-offset-4 transition-colors duration-200 hover:text-ink"
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
						<Panel className="px-5 py-10 text-center">
							<p className="text-[14px] text-ink">Nothing generated yet</p>
							<p className="mt-1 text-[13px] text-white/50">
								Your starters will be listed here.
							</p>
						</Panel>
					) : (
						<Panel>
							<table className="w-full text-left">
								<RecentStartersHead />
								<tbody>
									{recent.map((record) => (
										<tr
											className="border-white/8 border-b last:border-0"
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
											<td className="px-5 py-3 text-right text-[12px] text-white/45">
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
		</ConsoleShell>
	);
}
