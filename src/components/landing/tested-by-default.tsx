import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/utils";

/**
 * Section 06 — "Tested by default". Mirrors the reference's `.auth-section`:
 * a two-column header, a rounded stage holding two synced animated mocks,
 * then three pillar cards.
 *
 * The reference drives its loop with pure CSS keyframes and negative delays;
 * we use a JS timeline (same pattern as WiredGrid) so the sequence is
 * testable with fake timers and the first paint is SSR-deterministic.
 *
 * Scope note: every label here names tooling that exists in this repo today
 * (Vitest, Testing Library, Biome, strict TS, v8 coverage). E2E and CI stay
 * out of the copy until they actually land — same rule as WiredGrid.
 */

type Suite = { name: string; files: string; tests: number };

/**
 * Real counts from `pnpm test`, not illustrative ones. If you add or remove
 * tests, update these — the whole point of the section is that the numbers on
 * the page are the numbers the suite actually produces.
 */
const SUITES: Suite[] = [
	{ name: "Unit", files: "src/lib", tests: 17 },
	{ name: "Component", files: "src/components", tests: 140 },
	{ name: "Schema", files: "src/db", tests: 5 },
];

const TOTAL_TESTS = SUITES.reduce((sum, s) => sum + s.tests, 0);
const TOTAL_FILES = 11;

type Gate = { cmd: string; label: string };

const GATES: Gate[] = [
	{ cmd: "biome check", label: "Lint + format" },
	{ cmd: "tsc --noEmit", label: "Strict types" },
	{ cmd: "vitest run", label: "All suites" },
	{ cmd: "vitest run --coverage", label: "Coverage report" },
];

/**
 * Step timeline: 0 = fresh run, 1–3 = suites pass in order, 4 = summary,
 * 5–8 = gates flip, 9 = ready banner, then it holds and restarts.
 * `STEP_MS[i]` is how long step `i` is shown before advancing.
 */
const STEP_MS = [900, 800, 800, 700, 600, 500, 500, 500, 600, 2800];
const LAST_STEP = STEP_MS.length - 1;

const suitePassed = (step: number, i: number) => step > i;
const summaryShown = (step: number) => step >= 4;
const gatePassed = (step: number, i: number) => step >= 5 + i;
const bannerShown = (step: number) => step >= LAST_STEP;

function useTestCycle() {
	const [step, setStep] = useState(0);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setStep(LAST_STEP);
			return;
		}

		const advance = (current: number) => {
			timer.current = setTimeout(() => {
				const next = current >= LAST_STEP ? 0 : current + 1;
				setStep(next);
				advance(next);
			}, STEP_MS[current]);
		};
		advance(0);

		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, []);

	return step;
}

/** Small window chrome, kept consistent with HeroPreview. */
function MockChrome({ label }: { label: string }) {
	return (
		<div className="mb-4 flex items-center gap-1.5">
			<span className="size-2 rounded-full bg-white/10" />
			<span className="size-2 rounded-full bg-white/10" />
			<span className="size-2 rounded-full bg-white/10" />
			<span className="ml-2 text-[11px] text-ink-muted">{label}</span>
		</div>
	);
}

/** Two stacked labels crossfading in the same grid cell. */
function SwapLabel({
	shown,
	hidden,
	showSecond,
}: {
	shown: string;
	hidden: string;
	showSecond: boolean;
}) {
	return (
		<span className="ml-auto grid shrink-0 text-right">
			<span
				className={cn(
					"[grid-area:1/1] transition-opacity duration-300",
					showSecond ? "opacity-0" : "text-white/30",
				)}
			>
				{hidden}
			</span>
			<span
				className={cn(
					"[grid-area:1/1] transition-opacity duration-300",
					showSecond ? "text-sage" : "opacity-0",
				)}
			>
				{shown}
			</span>
		</span>
	);
}

function StatusDot({ passed }: { passed: boolean }) {
	return (
		<span className="grid size-4 shrink-0 place-items-center">
			<span
				className={cn(
					"size-1.5 rounded-full bg-brand transition-opacity duration-300 [grid-area:1/1]",
					passed ? "opacity-0" : "dot-pulse",
				)}
			/>
			<Check
				className={cn(
					"size-3.5 text-sage transition-all duration-300 [grid-area:1/1]",
					passed ? "scale-100 opacity-100" : "scale-50 opacity-0",
				)}
			/>
		</span>
	);
}

function TestRunnerMock({ step }: { step: number }) {
	const showSummary = summaryShown(step);

	return (
		<div aria-hidden="true" data-mock>
			<div className="mb-3 flex items-center gap-2">
				<span className="size-1.5 rounded-full bg-brand" />
				<span className="font-mono text-[12px] text-ink-muted">
					Test run — unit, component, schema
				</span>
			</div>

			<div className="rounded-xl border border-line bg-elevated p-4 font-mono text-[12px] sm:p-5 sm:text-[13px]">
				<MockChrome label="vitest" />

				<div className="divide-y divide-line/60">
					{SUITES.map((suite, i) => (
						<div key={suite.name} className="flex items-center gap-3 py-2.5">
							<StatusDot passed={suitePassed(step, i)} />
							<span className="w-[76px] shrink-0 text-ink-soft">
								{suite.name}
							</span>
							<span className="hidden shrink-0 text-ink-muted sm:inline">
								{suite.files}
							</span>
							<SwapLabel
								hidden="running"
								shown={`${suite.tests} passed`}
								showSecond={suitePassed(step, i)}
							/>
						</div>
					))}
				</div>

				<div
					className={cn(
						"mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-[11px] transition-all duration-500 sm:text-[12px]",
						showSummary
							? "translate-y-0 opacity-100"
							: "translate-y-1 opacity-0",
					)}
				>
					<span className="text-ink-muted">
						Test Files <span className="text-sage">{TOTAL_FILES} passed</span> (
						{TOTAL_FILES})
					</span>
					<span className="text-ink-muted">
						Tests <span className="text-sage">{TOTAL_TESTS} passed</span> (
						{TOTAL_TESTS})
					</span>
					<span className="text-ink-muted">Duration 3.17s</span>
				</div>
			</div>
		</div>
	);
}

function QualityGatesMock({ step }: { step: number }) {
	const ready = bannerShown(step);

	return (
		<div aria-hidden="true" data-mock>
			<div className="mb-3 flex items-center gap-2">
				<span className="size-1.5 rounded-full bg-sage" />
				<span className="font-mono text-[12px] text-ink-muted">
					Quality gates — lint, types, coverage
				</span>
			</div>

			<div className="rounded-xl border border-line bg-elevated p-4 font-mono text-[12px] sm:p-5 sm:text-[13px]">
				<MockChrome label="checks" />

				<div className="divide-y divide-line/60">
					{GATES.map((gate, i) => (
						<div key={gate.cmd} className="flex items-center gap-3 py-2.5">
							<span className="grid size-4 shrink-0 place-items-center">
								<span
									className={cn(
										"size-3 rounded-full border border-white/15 transition-opacity duration-300 [grid-area:1/1]",
										gatePassed(step, i) && "opacity-0",
									)}
								/>
								<Check
									className={cn(
										"size-3.5 text-sage transition-all duration-300 [grid-area:1/1]",
										gatePassed(step, i)
											? "scale-100 opacity-100"
											: "scale-50 opacity-0",
									)}
								/>
							</span>
							<span className="shrink-0 text-ink-soft">{gate.cmd}</span>
							<span className="hidden shrink-0 text-ink-muted md:inline">
								{gate.label}
							</span>
							<SwapLabel
								hidden="queued"
								shown="passed"
								showSecond={gatePassed(step, i)}
							/>
						</div>
					))}
				</div>

				<div
					className={cn(
						"mt-4 flex items-center gap-2 rounded-[8px] border px-3 py-2 text-[11px] transition-all duration-500 sm:text-[12px]",
						ready
							? "translate-y-0 border-sage/40 bg-sage/10 text-sage opacity-100"
							: "translate-y-1 border-line/60 text-ink-muted opacity-0",
					)}
				>
					<Check className="size-3.5" />
					All checks passed — ready to ship
				</div>
			</div>
		</div>
	);
}

/**
 * Real module/spec pairs, given as repo-relative paths so the suite can check
 * both halves still exist. Deliberately no per-file test count: `it.each`
 * expands at runtime, so a number here could not be verified without running
 * the suite, and an unverifiable number is exactly what this section argues
 * against.
 */
export const SPEC_PAIRS = [
	{ dir: "src/lib", module: "utils.ts", spec: "utils.test.ts" },
	{
		dir: "src/components/landing",
		module: "wired-grid.tsx",
		spec: "wired-grid.test.tsx",
	},
	{ dir: "src/db", module: "schema.ts", spec: "schema.test.ts" },
];

function SpecPairsVisual() {
	return (
		<div className="flex h-full flex-col justify-center gap-2.5">
			{SPEC_PAIRS.map((pair) => (
				<div key={pair.module} className="flex items-center gap-2">
					<Check className="size-3 shrink-0 text-sage" />
					<span className="text-ink-soft">{pair.module}</span>
					<span className="text-ink-muted">→</span>
					<span className="text-sage">{pair.spec}</span>
				</div>
			))}
		</div>
	);
}

function StrictGatesVisual() {
	const lines = [
		"lint — 0 problems",
		"format — all files clean",
		"types — 0 errors",
	];
	return (
		<div className="flex h-full flex-col justify-center gap-2">
			<p>
				<span className="text-ink-muted">$</span>{" "}
				<span className="text-ink-soft">pnpm check</span>
			</p>
			{lines.map((line) => (
				<p key={line} className="flex items-center gap-2">
					<Check className="size-3 shrink-0 text-sage" />
					<span className="text-ink-muted">{line}</span>
				</p>
			))}
		</div>
	);
}

const COVERAGE_METRICS = ["Statements", "Branches", "Functions", "Lines"];

/**
 * Deliberately shows *what* the reporter measures rather than a headline
 * percentage. A number printed here would be a snapshot that silently rots the
 * moment anyone touches the suite, and a coverage figure means nothing without
 * the repo it was measured against — so the claim is that coverage is wired and
 * one command away, which is a claim the repo can actually keep.
 */
function CoverageVisual() {
	return (
		<div className="flex h-full flex-col justify-center gap-2.5">
			<p>
				<span className="text-ink-muted">$</span>{" "}
				<span className="text-ink-soft">pnpm test:coverage</span>
			</p>
			<p className="text-ink-muted">Coverage report from v8</p>
			<div className="flex flex-wrap gap-x-3 gap-y-1">
				{COVERAGE_METRICS.map((metric) => (
					<span key={metric} className="flex items-center gap-1 text-ink-muted">
						<Check className="size-3 shrink-0 text-sage" />
						{metric}
					</span>
				))}
			</div>
		</div>
	);
}

const PILLARS = [
	{
		title: "Tests ship with the feature",
		text: "Every module lands with a spec file beside it, so new code starts covered instead of catching up later.",
		visual: <SpecPairsVisual />,
	},
	{
		title: "Strict by default",
		text: "Strict TypeScript and Biome come preconfigured — one command lints, formats, and type-checks the repo.",
		visual: <StrictGatesVisual />,
	},
	{
		title: "Coverage from day one",
		text: "v8 coverage is already wired in. Run one script and see exactly what the suite proves.",
		visual: <CoverageVisual />,
	},
];

export function TestedByDefault() {
	const step = useTestCycle();

	return (
		<Section tone="forest">
			<Container>
				<FadeUp className="mb-12 grid items-end gap-6 md:mb-14 md:grid-cols-2 md:gap-10">
					<h2 className="heading-tight text-h2 text-ink">Tested by default</h2>
					<p className="max-w-[550px] text-body-lg leading-[1.55] text-ink-soft md:justify-self-end">
						Every module ships with its own Vitest suite — unit and component
						tests, strict types, and lint wired into a single command. You clone
						at green, and every change has to stay there.
					</p>
				</FadeUp>

				<FadeUp
					step={1}
					className="rounded-[20px] border border-white/6 bg-base p-4 sm:p-6 md:p-8"
				>
					<div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
						<TestRunnerMock step={step} />
						<QualityGatesMock step={step} />
					</div>
				</FadeUp>

				<div className="mt-2.5 grid gap-2.5 lg:grid-cols-3">
					{PILLARS.map((pillar, i) => (
						<FadeUp
							key={pillar.title}
							step={(i % 4) as 0 | 1 | 2 | 3}
							className="flex flex-col gap-5 rounded-[14px] border border-white/6 bg-white/3 p-5 sm:p-6"
						>
							<div
								aria-hidden="true"
								className="min-h-[132px] rounded-[10px] border border-line bg-elevated px-4 py-3 font-mono text-[11px] sm:text-[12px]"
							>
								{pillar.visual}
							</div>
							<div>
								<h3 className="text-[17px] font-medium tracking-[-0.01em] text-ink">
									{pillar.title}
								</h3>
								<p className="mt-1.5 text-[14px] leading-[1.55] text-ink-muted">
									{pillar.text}
								</p>
							</div>
						</FadeUp>
					))}
				</div>
			</Container>
		</Section>
	);
}
