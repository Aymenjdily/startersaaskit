import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Section 07 — modularity.
 *
 * The claim is deliberately narrow, because the broad version ("swap providers
 * with no work") would be false: this repo ships no pre-built adapters. What it
 * genuinely has is a very small seam per third-party service — `auth.ts` is 9
 * lines, `db/index.ts` is 5 — so the surface you rewrite to move providers is
 * one readable file rather than a grep across the app. The panel states the
 * line counts, and the footnote says outright that adapters aren't included.
 *
 * Line counts below are real. If these files grow, update them.
 */

type Seam = {
	/** Tab label. */
	layer: string;
	/** What the repo ships with today. */
	shipped: string;
	/** Plausible replacements. Framed as targets, never as included adapters. */
	targets: string[];
	/**
	 * `scope` narrows the count to part of a file. `styles.css` is 331 lines
	 * overall; only its `@theme` block is the seam, and printing "51 lines"
	 * against the bare filename would read as a claim about the whole file.
	 */
	files: { path: string; lines: number; scope?: string }[];
	/** Why the seam holds — a concrete mechanism, not a slogan. */
	note: string;
};

/** Exported so `swap-anything.test.tsx` can check every count against the real file. */
export const SEAMS: Seam[] = [
	{
		layer: "Authentication",
		shipped: "Better Auth",
		targets: ["Clerk", "Auth.js", "Lucia"],
		files: [
			{ path: "src/lib/auth.ts", lines: 9 },
			{ path: "src/lib/auth-client.ts", lines: 3 },
			{ path: "src/routes/api/auth/$.ts", lines: 11 },
		],
		note: "The provider is named in three files: server config, browser client, and the catch-all route handler. Nothing else imports it.",
	},
	{
		layer: "Database",
		shipped: "Postgres + Drizzle",
		targets: ["Neon", "PlanetScale", "Supabase"],
		files: [
			{ path: "src/db/index.ts", lines: 5 },
			{ path: "src/db/schema.ts", lines: 7 },
		],
		note: "Changing host means changing one Drizzle driver import. The query API is identical across drivers, so call sites never move.",
	},
	{
		layer: "Design system",
		shipped: "Tailwind v4 tokens",
		targets: ["Any palette", "Any type scale"],
		files: [{ path: "src/styles.css", lines: 51, scope: "@theme block" }],
		note: "Colour, type, and spacing are declared once in a single @theme block. Components reference tokens, never raw hex.",
	},
];

/** How long each seam is shown before the panel advances. */
const CYCLE_MS = 4200;

/**
 * Advances through the seams on a loop. Starts at 0 so the server and the
 * client's first paint agree, and stops permanently once the reader picks a tab
 * themselves — an auto-advancing panel that fights your click is hostile.
 */
function useSeamCycle(count: number) {
	const [index, setIndex] = useState(0);
	const [pinned, setPinned] = useState(false);

	useEffect(() => {
		if (pinned) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const id = setInterval(() => {
			setIndex((i) => (i + 1) % count);
		}, CYCLE_MS);

		return () => clearInterval(id);
	}, [count, pinned]);

	return {
		index,
		pin: (next: number) => {
			setIndex(next);
			setPinned(true);
		},
	};
}

function Chip({
	children,
	tone,
}: {
	children: React.ReactNode;
	tone: "shipped" | "target";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-[6px] border px-2.5 py-1 font-mono text-[12px] whitespace-nowrap",
				tone === "shipped"
					? "border-brand/40 bg-brand-dim text-brand"
					: "border-line-bright bg-white/3 text-ink-muted",
			)}
		>
			{children}
		</span>
	);
}

function SeamPanel({ seam }: { seam: Seam }) {
	const total = seam.files.reduce((sum, f) => sum + f.lines, 0);

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center gap-2">
				<Chip tone="shipped">{seam.shipped}</Chip>
				<span aria-hidden="true" className="text-ink-muted text-[13px]">
					&rarr;
				</span>
				{seam.targets.map((t) => (
					<Chip key={t} tone="target">
						{t}
					</Chip>
				))}
			</div>

			<ul className="flex flex-col gap-px overflow-hidden rounded-[10px] border border-line bg-line">
				{seam.files.map((file) => (
					<li
						key={file.path}
						className="flex items-center justify-between gap-4 bg-elevated px-3.5 py-2.5 font-mono text-[12px] sm:text-[13px]"
					>
						<span className="truncate text-ink-soft">
							{file.path}
							{file.scope && (
								<span className="text-ink-muted"> {file.scope}</span>
							)}
						</span>
						<span className="shrink-0 text-sage">{file.lines} lines</span>
					</li>
				))}
			</ul>

			<p className="text-[14px] leading-[1.6] text-ink-muted">{seam.note}</p>

			<p className="border-line border-t pt-4 font-mono text-[12px] text-ink-muted">
				<span className="text-ink-soft">{total} lines</span> to rewrite &middot;
				routes, components, and business logic untouched
			</p>
		</div>
	);
}

export function SwapAnything() {
	const { index, pin } = useSeamCycle(SEAMS.length);
	const seam = SEAMS[index];

	return (
		<Section tone="base">
			<Container>
				<div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
					<FadeUp>
						<SectionHeading
							eyebrow="Modularity"
							title="Swap anything"
							description="Every third-party service sits behind a file you can read in one sitting. Moving off Better Auth or Postgres means rewriting that file — not refactoring your application."
						/>
						<p className="mt-6 max-w-[520px] text-[14px] leading-[1.6] text-ink-muted">
							No pre-built adapters are included, and that is the honest version
							of this claim. What the template gives you is a small, named seam
							per service, so the cost of changing your mind is bounded and you
							can see exactly where it lands.
						</p>
					</FadeUp>

					<FadeUp
						step={1}
						className="rounded-[20px] border border-white/6 bg-forest p-4 sm:p-6"
					>
						{/*
						 * A tablist rather than decorative dots: the panel auto-advances,
						 * but a reader who wants the database seam should not have to wait
						 * for the carousel to come back around.
						 */}
						<div
							aria-label="Swappable layers"
							className="mb-5 flex flex-wrap gap-1.5"
							role="tablist"
						>
							{SEAMS.map((s, i) => (
								<button
									aria-controls="seam-panel"
									aria-selected={i === index}
									className={cn(
										"rounded-[6px] px-3 py-1.5 text-[13px] transition-colors",
										i === index
											? "bg-card-deep text-ink"
											: "text-ink-muted hover:bg-white/5 hover:text-ink-soft",
									)}
									id={`seam-tab-${s.layer}`}
									key={s.layer}
									onClick={() => pin(i)}
									role="tab"
									type="button"
								>
									{s.layer}
								</button>
							))}
						</div>

						<div
							aria-labelledby={`seam-tab-${seam.layer}`}
							id="seam-panel"
							role="tabpanel"
						>
							<SeamPanel seam={seam} />
						</div>
					</FadeUp>
				</div>
			</Container>
		</Section>
	);
}
