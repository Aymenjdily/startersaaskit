import type { LucideIcon } from "lucide-react";
import {
	Boxes,
	FileCode2,
	Folder,
	Sparkles,
	SquareTerminal,
	TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Section 08 — `split-section reverse`: visual left, text right.
 *
 * The pitch is that an assistant can *guess* correctly in the repo you receive,
 * because the layout is predictable and the compiler catches a wrong guess. The
 * tree below therefore describes a generated starter, not this codebase.
 *
 * That means it is deliberately framework-neutral: `src/db` and `src/lib` are
 * shared by every combination we generate, whereas the routing layer is the one
 * part that differs between Next.js and TanStack Start. Showing a route path
 * here would make the panel true of exactly one answer to question one.
 *
 * Note there is deliberately no mention of a CLAUDE.md or a rules file: we do
 * not generate either yet, and inventing one would undercut the whole point.
 */

type Lookup = {
	/** What someone (or something) is trying to find. */
	ask: string;
	/** The file that answers it. Must be a node in `TREE`, or nothing highlights. */
	path: string;
	/** The convention that makes it findable without searching. */
	because: string;
};

export const LOOKUPS: Lookup[] = [
	{
		ask: "Where is authentication configured?",
		path: "src/lib/auth.ts",
		because:
			"One module per integration, named after the thing it integrates. Nothing else reaches for the provider.",
	},
	{
		ask: "What behaviour does checkout guarantee?",
		path: "src/lib/checkout.test.ts",
		because:
			"The spec sits beside the module and runs, so intent is executable rather than described in a stale comment.",
	},
	{
		ask: "Where are the database tables defined?",
		path: "src/db/schema.ts",
		because:
			"One schema module, whichever ORM you picked. The adapter changes underneath it; the place you look does not.",
	},
	{
		ask: "Where do the brand colours come from?",
		path: "src/styles.css",
		because:
			"A single @theme block defines every token. Components reference names, never raw hex.",
	},
];

/**
 * Flat node list — cheaper to render and to reason about than nesting.
 * Exported so the spec can check every lookup actually lands on a node.
 */
export const TREE: { depth: number; label: string; path?: string }[] = [
	{ depth: 0, label: "src/" },
	{ depth: 1, label: "db/" },
	{ depth: 2, label: "client.ts", path: "src/db/client.ts" },
	{ depth: 2, label: "schema.ts", path: "src/db/schema.ts" },
	{ depth: 2, label: "schema.test.ts", path: "src/db/schema.test.ts" },
	{ depth: 1, label: "lib/" },
	{ depth: 2, label: "auth.ts", path: "src/lib/auth.ts" },
	{ depth: 2, label: "auth.test.ts", path: "src/lib/auth.test.ts" },
	{ depth: 2, label: "checkout.ts", path: "src/lib/checkout.ts" },
	{ depth: 2, label: "checkout.test.ts", path: "src/lib/checkout.test.ts" },
	{ depth: 1, label: "styles.css", path: "src/styles.css" },
];

/**
 * Read off this repo's `tsconfig.json`, which is the config we generate from —
 * so the suite can hold the printed list against a real file. It proves the
 * flags are ones we actually run under, not that your repo has been built yet.
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
				const folder = node.label.endsWith("/");
				const Icon = folder ? Folder : FileCode2;

				return (
					<li
						className={cn(
							"relative flex items-center gap-2 rounded-[5px] pr-2 transition-colors duration-300",
							active && "bg-brand/10",
						)}
						key={node.label + node.depth}
						style={{ paddingLeft: `${node.depth * 14 + 8}px` }}
					>
						{active && (
							<span
								aria-hidden="true"
								className="-translate-y-1/2 absolute top-1/2 left-0 h-[60%] w-[2px] rounded-full bg-brand"
							/>
						)}
						<Icon
							aria-hidden="true"
							className={cn(
								"size-3.5 shrink-0 transition-colors duration-300",
								active ? "text-brand" : "text-ink-muted/50",
							)}
						/>
						<span
							className={cn(
								"transition-colors duration-300",
								active
									? "text-brand"
									: folder
										? "text-ink-soft"
										: "text-ink-muted",
							)}
						>
							{node.label}
						</span>
					</li>
				);
			})}
		</ul>
	);
}

/**
 * The three claims on the right, each with a mark. `flags` renders the real
 * tsconfig list in place of a sentence — the spec holds those against the
 * actual file, so the card cannot advertise a flag we do not run under.
 */
const PILLARS: {
	icon: LucideIcon;
	title: string;
	text?: string;
	flags?: boolean;
}[] = [
	{
		icon: Boxes,
		title: "One module per concern",
		text: "Every integration gets a file named after it, in the same place in every repo we generate. There is no registry to keep in sync and no indirection to trace before making a change.",
	},
	{
		icon: TriangleAlert,
		title: "Wrong guesses fail loudly",
		flags: true,
	},
	{
		icon: SquareTerminal,
		title: "Intent is executable",
		text: "Each module's test file states what it must do. That is context an assistant can run, not prose it has to trust.",
	},
];

export function AiOptimized() {
	const index = useLookupCycle(LOOKUPS.length);
	const lookup = LOOKUPS[index];

	return (
		<Section className="overflow-hidden border-white/6 border-y" tone="base">
			<Container>
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					{/* Visual sits left on desktop, but text leads on mobile. */}
					<FadeUp
						className="order-2 overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-b from-elevated to-elevated/70 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset] lg:order-1"
						step={1}
					>
						{/* Window chrome, plus a dot per question so the loop has a face. */}
						<div className="flex items-center justify-between border-white/6 border-b px-4 py-3 sm:px-5">
							<div aria-hidden="true" className="flex items-center gap-1.5">
								<span className="size-2.5 rounded-full bg-[#ff5f57]/70" />
								<span className="size-2.5 rounded-full bg-[#febc2e]/70" />
								<span className="size-2.5 rounded-full bg-[#28c840]/70" />
							</div>
							<div aria-hidden="true" className="flex items-center gap-1.5">
								{LOOKUPS.map((l, i) => (
									<span
										className={cn(
											"h-1.5 rounded-full transition-all duration-300",
											i === index ? "w-4 bg-brand" : "w-1.5 bg-white/15",
										)}
										key={l.path}
									/>
								))}
							</div>
						</div>

						<div className="p-4 sm:p-6">
							<div
								aria-live="polite"
								className="mb-4 flex min-h-[52px] items-start gap-2.5 rounded-[10px] border border-white/8 bg-black/20 px-3.5 py-3"
							>
								<span className="mt-px flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-brand/15 text-brand">
									<Sparkles aria-hidden="true" className="size-3.5" />
								</span>
								<p className="pt-0.5 text-[14px] leading-[1.5] text-ink-soft sm:text-[15px]">
									{lookup.ask}
								</p>
							</div>

							<div className="rounded-[12px] border border-line bg-black/25 p-4">
								<FileTree activePath={lookup.path} />
							</div>

							{/* The border and padding live on this wrapper, constant for
							    every lookup, so they cannot eat into the `lh` budget below —
							    a `min-h-[3lh]` that shared a box with them would reserve
							    three lines with border-and-padding sized right out of the
							    space, and grow anyway. Clamped and floored the same way as
							    the note in the swap-anything panel: three lines at the
							    desktop width this card renders at, more below `sm` where the
							    same text wraps across more lines. Neither a longer nor a
							    shorter lookup can move the card's height. */}
							<div className="mt-4 border-line border-t pt-4">
								<p className="line-clamp-5 min-h-[5lh] text-[13px] leading-[1.6] text-ink-muted sm:line-clamp-3 sm:min-h-[3lh]">
									<span className="font-mono text-sage">{lookup.path}</span>
									<br />
									{lookup.because}
								</p>
							</div>
						</div>
					</FadeUp>

					<FadeUp className="order-1 lg:order-2">
						<SectionHeading
							eyebrow="Built for assistants"
							title="AI reads it correctly"
							description="Every repo we generate has the same shape: predictable layout, typed boundaries, and a spec beside every module. An assistant can guess where something lives — and when it guesses wrong, the compiler says so before you run anything."
						/>

						<ul className="mt-8 flex flex-col gap-2.5">
							{PILLARS.map((pillar) => (
								<li
									className="flex gap-4 rounded-[12px] border border-white/10 bg-elevated p-4 transition-colors duration-300 hover:border-brand/25 hover:bg-elevated/80"
									key={pillar.title}
								>
									<span className="flex size-9 shrink-0 items-center justify-center rounded-[9px] border border-brand/20 bg-brand-dim text-brand">
										<pillar.icon aria-hidden="true" className="size-4" />
									</span>
									<div>
										<h3 className="text-[15px] font-medium text-ink">
											{pillar.title}
										</h3>
										{pillar.text && (
											<p className="mt-1 text-[14px] leading-[1.6] text-ink-muted">
												{pillar.text}
											</p>
										)}
										{pillar.flags && (
											<p className="mt-2 flex flex-wrap gap-1.5">
												{TS_FLAGS.map((flag) => (
													<span
														className="rounded-[5px] border border-brand/30 bg-brand-dim px-2 py-0.5 font-mono text-[11px] text-brand"
														key={flag}
													>
														{flag}
													</span>
												))}
											</p>
										)}
									</div>
								</li>
							))}
						</ul>
					</FadeUp>
				</div>
			</Container>
		</Section>
	);
}
