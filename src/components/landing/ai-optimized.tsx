import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Section 08 — `split-section reverse`: visual left, text right.
 *
 * The pitch is that an assistant can *guess* correctly here, because the layout
 * is predictable and the compiler catches it when the guess is wrong. That is a
 * claim about structure, so every path the panel shows is a real file and the
 * suite asserts it still exists — a lookup pointing at a deleted file would be
 * the exact failure the section says cannot happen.
 *
 * Note there is deliberately no mention of a CLAUDE.md or a rules file: this
 * repo has neither worth advertising, and inventing one would undercut the
 * whole point.
 */

type Lookup = {
	/** What someone (or something) is trying to find. */
	ask: string;
	/** The file that answers it. Must exist — `ai-optimized.test.tsx` checks. */
	path: string;
	/** The convention that makes it findable without searching. */
	because: string;
};

export const LOOKUPS: Lookup[] = [
	{
		ask: "Which file renders the home page?",
		path: "src/routes/index.tsx",
		because:
			"File-based routing, so the path on disk is the path in the URL. There is no central route table to read first.",
	},
	{
		ask: "Where is authentication configured?",
		path: "src/lib/auth.ts",
		because:
			"One module per integration, named after the thing it integrates. Nothing else reaches for the provider.",
	},
	{
		ask: "What behaviour does the tile grid guarantee?",
		path: "src/components/landing/wired-grid.test.tsx",
		because:
			"The spec sits beside the module and runs, so intent is executable rather than described in a stale comment.",
	},
	{
		ask: "Where do the brand colours come from?",
		path: "src/styles.css",
		because:
			"A single @theme block defines every token. Components reference names, never raw hex.",
	},
];

/** Flat node list — cheaper to render and to reason about than nesting. */
const TREE: { depth: number; label: string; path?: string }[] = [
	{ depth: 0, label: "src/" },
	{ depth: 1, label: "routes/" },
	{ depth: 2, label: "__root.tsx" },
	{ depth: 2, label: "index.tsx", path: "src/routes/index.tsx" },
	{ depth: 1, label: "components/" },
	{ depth: 2, label: "landing/" },
	{
		depth: 3,
		label: "wired-grid.tsx",
		path: "src/components/landing/wired-grid.tsx",
	},
	{
		depth: 3,
		label: "wired-grid.test.tsx",
		path: "src/components/landing/wired-grid.test.tsx",
	},
	{ depth: 1, label: "lib/" },
	{ depth: 2, label: "auth.ts", path: "src/lib/auth.ts" },
	{ depth: 2, label: "utils.ts", path: "src/lib/utils.ts" },
	{ depth: 1, label: "styles.css", path: "src/styles.css" },
];

/**
 * Real flags from `tsconfig.json`. These are what turn a wrong guess into a
 * build error instead of a runtime surprise.
 */
export const TS_FLAGS = [
	"strict",
	"noUnusedLocals",
	"noUnusedParameters",
	"noFallthroughCasesInSwitch",
	"noUncheckedSideEffectImports",
	"verbatimModuleSyntax",
];

const CYCLE_MS = 3800;

function useLookupCycle(count: number) {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const id = setInterval(() => {
			setIndex((i) => (i + 1) % count);
		}, CYCLE_MS);

		return () => clearInterval(id);
	}, [count]);

	return index;
}

function FileTree({ activePath }: { activePath: string }) {
	return (
		<ul className="font-mono text-[12px] leading-[1.9] sm:text-[13px]">
			{TREE.map((node) => {
				const active = node.path === activePath;

				return (
					<li
						className={cn(
							"rounded-[5px] pr-2 transition-colors duration-300",
							active ? "bg-brand-dim text-brand" : "text-ink-muted",
						)}
						key={node.label + node.depth}
						style={{ paddingLeft: `${node.depth * 14 + 8}px` }}
					>
						{node.label}
					</li>
				);
			})}
		</ul>
	);
}

export function AiOptimized() {
	const index = useLookupCycle(LOOKUPS.length);
	const lookup = LOOKUPS[index];

	return (
		<Section tone="forest">
			<Container>
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					{/* Visual sits left on desktop, but text leads on mobile. */}
					<FadeUp
						className="order-2 rounded-[20px] border border-white/6 bg-base p-4 sm:p-6 lg:order-1"
						step={1}
					>
						<div
							aria-live="polite"
							className="mb-4 flex min-h-[44px] items-start gap-2.5"
						>
							<span
								aria-hidden="true"
								className="mt-px shrink-0 font-mono text-[13px] text-sage"
							>
								&gt;
							</span>
							<p className="text-[14px] leading-[1.5] text-ink-soft sm:text-[15px]">
								{lookup.ask}
							</p>
						</div>

						<div className="rounded-[12px] border border-line bg-elevated p-4">
							<FileTree activePath={lookup.path} />
						</div>

						<p className="mt-4 border-line border-t pt-4 text-[13px] leading-[1.6] text-ink-muted">
							<span className="font-mono text-sage">{lookup.path}</span>
							<br />
							{lookup.because}
						</p>
					</FadeUp>

					<FadeUp className="order-1 lg:order-2">
						<SectionHeading
							eyebrow="Built for assistants"
							title="AI reads it correctly"
							description="Predictable layout, typed boundaries, and a spec beside every module. An assistant can guess where something lives — and when it guesses wrong, the compiler says so before you run anything."
						/>

						<dl className="mt-8 flex flex-col gap-5">
							<div>
								<dt className="text-[15px] font-medium text-ink">
									The path is the route
								</dt>
								<dd className="mt-1 text-[14px] leading-[1.6] text-ink-muted">
									Routes are files. There is no registry to keep in sync and no
									indirection to trace before making a change.
								</dd>
							</div>
							<div>
								<dt className="text-[15px] font-medium text-ink">
									Wrong guesses fail loudly
								</dt>
								<dd className="mt-2 flex flex-wrap gap-1.5">
									{TS_FLAGS.map((flag) => (
										<span
											className="rounded-[5px] border border-line-bright bg-white/3 px-2 py-0.5 font-mono text-[11px] text-ink-muted"
											key={flag}
										>
											{flag}
										</span>
									))}
								</dd>
							</div>
							<div>
								<dt className="text-[15px] font-medium text-ink">
									Intent is executable
								</dt>
								<dd className="mt-1 text-[14px] leading-[1.6] text-ink-muted">
									Each module's test file states what it must do. That is
									context an assistant can run, not prose it has to trust.
								</dd>
							</div>
						</dl>
					</FadeUp>
				</div>
			</Container>
		</Section>
	);
}
