import { createFileRoute } from "@tanstack/react-router";
import { ConsoleShell } from "@/components/console/console-shell";
import { Panel, Section } from "@/components/console/panel";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/generate")({
	head: () => ({ meta: [{ title: `Generate · ${BRAND}` }] }),
	component: GeneratePage,
});

/**
 * A placeholder that says so. The sidebar links here because a rail pointing at
 * a 404 is worse than one pointing at an honest empty room.
 */
function GeneratePage() {
	return (
		<ConsoleShell currentPath="/generate" title="Generate">
			<Section
				description="This page is a placeholder. The rail links here so nothing points at a 404."
				title="Not built yet"
			>
				<Panel className="px-5 py-10 text-center">
					<p className="text-[13px] text-white/50">Nothing to show here yet.</p>
				</Panel>
			</Section>
		</ConsoleShell>
	);
}
