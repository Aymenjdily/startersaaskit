import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { REPO_SLUG } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Section 09 — `cu-section`: header above one wide visual.
 *
 * The plan called this "clone → configure → deploy". Deploy came out: this repo
 * has no CI workflow and no host config, so a deploy step would be the one
 * claim on the page that nothing backs. What is left is stronger anyway —
 * there is genuinely no env file to fill in, because `neon-vite-plugin.ts`
 * provisions Postgres and writes `DATABASE_URL` on first `pnpm dev`.
 *
 * Every command shown either is a script in `package.json` or is pnpm's own,
 * and the suite checks which. No test or file counts appear here on purpose —
 * section 06 already carries those, and printing them twice would double the
 * surface that rots.
 */

export type Step = {
	/** Displayed as the card's ordinal. */
	n: string;
	title: string;
	/** A `pnpm` script or built-in — `sixty-seconds.test.tsx` checks which. */
	cmd: string;
	text: string;
};

export const STEPS: Step[] = [
	{
		n: "01",
		title: "Clone and install",
		cmd: "pnpm install",
		text: "One lockfile, one command. Nothing prompts you and nothing is left half-configured afterwards.",
	},
	{
		n: "02",
		title: "Start it",
		cmd: "pnpm dev",
		text: "A Postgres branch is provisioned on the first run and DATABASE_URL is written for you. There is no env file to fill in and no account to create first.",
	},
	{
		n: "03",
		title: "Check it's green",
		cmd: "pnpm test",
		text: "The whole suite runs before you have written a line, so you know the baseline you are starting from is real.",
	},
];

type Line = {
	/** Index into `STEPS` — drives which card is highlighted. */
	step: number;
	kind: "cmd" | "out" | "ok";
	text: string;
	/** How long this line sits on screen before the next one appears. */
	hold: number;
};

const LINES: Line[] = [
	{ step: 0, kind: "cmd", text: "pnpm install", hold: 900 },
	{ step: 0, kind: "out", text: "resolving from pnpm-lock.yaml", hold: 600 },
	{ step: 0, kind: "ok", text: "dependencies installed", hold: 900 },
	{ step: 1, kind: "cmd", text: "pnpm dev", hold: 900 },
	{
		step: 1,
		kind: "out",
		text: "neon: provisioning a Postgres branch",
		hold: 700,
	},
	{ step: 1, kind: "out", text: "neon: wrote DATABASE_URL to .env", hold: 700 },
	{ step: 1, kind: "ok", text: "ready on localhost:3000", hold: 900 },
	{ step: 2, kind: "cmd", text: "pnpm test", hold: 900 },
	{ step: 2, kind: "out", text: "vitest: unit, component, schema", hold: 700 },
	{ step: 2, kind: "ok", text: "every suite passed", hold: 2600 },
];

const LAST_LINE = LINES.length - 1;

/**
 * `shown` is a count, not an index: 0 means an empty prompt, which is what the
 * server renders. Everything after that happens in an effect, so the first
 * paint is identical on both sides.
 */
function useTranscript() {
	const [shown, setShown] = useState(0);

	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setShown(LINES.length);
			return;
		}

		let timer: ReturnType<typeof setTimeout>;

		const advance = (count: number) => {
			const wait = count === 0 ? 500 : LINES[count - 1].hold;
			timer = setTimeout(() => {
				const next = count > LAST_LINE ? 0 : count + 1;
				setShown(next);
				advance(next);
			}, wait);
		};
		advance(0);

		return () => clearTimeout(timer);
	}, []);

	return shown;
}

const activeStep = (shown: number) =>
	shown === 0 ? 0 : LINES[Math.min(shown, LINES.length) - 1].step;

const KIND_CLASS = {
	cmd: "text-ink",
	out: "text-ink-muted",
	ok: "text-sage",
} as const;

function Transcript({ shown }: { shown: number }) {
	return (
		<div
			aria-hidden="true"
			className="rounded-[12px] border border-line bg-elevated p-4 font-mono text-[12px] leading-[2] sm:p-6 sm:text-[13px]"
			data-transcript
		>
			<div className="mb-4 flex items-center gap-1.5">
				<span className="size-2 rounded-full bg-white/10" />
				<span className="size-2 rounded-full bg-white/10" />
				<span className="size-2 rounded-full bg-white/10" />
				{/* The directory a clone of the repo actually leaves you in. */}
				<span className="ml-2 text-[11px] text-ink-muted">{REPO_SLUG}</span>
			</div>

			{/* Fixed height so lines fill in without shoving the page around. */}
			<div className="min-h-[280px] sm:min-h-[300px]">
				{LINES.slice(0, shown).map((line, i) => (
					<p
						className="flex items-baseline gap-2"
						key={`${line.text}-${line.kind}`}
					>
						<span
							aria-hidden="true"
							className={cn(
								"shrink-0",
								line.kind === "cmd" ? "text-brand" : "text-transparent",
							)}
						>
							{line.kind === "cmd" ? "$" : "·"}
						</span>
						<span className={cn("min-w-0", KIND_CLASS[line.kind])}>
							{line.text}
						</span>
						{i === shown - 1 && (
							<span
								className="ml-0.5 inline-block h-[13px] w-[7px] shrink-0 bg-brand caret-blink"
								data-caret
							/>
						)}
					</p>
				))}

				{shown === 0 && (
					<p className="flex items-baseline gap-2">
						<span className="shrink-0 text-brand">$</span>
						<span
							className="inline-block h-[13px] w-[7px] bg-brand caret-blink"
							data-caret
						/>
					</p>
				)}
			</div>
		</div>
	);
}

export function SixtySeconds() {
	const shown = useTranscript();
	const active = activeStep(shown);

	return (
		<Section tone="base">
			<Container>
				<FadeUp className="mb-12 md:mb-14">
					<SectionHeading
						align="center"
						eyebrow="Setup"
						title="Running in three commands"
						description="Clone, start, and check. The database provisions itself on first run, so there is no env file to fill in before anything works."
					/>
				</FadeUp>

				<FadeUp
					className="rounded-[20px] border border-white/6 bg-white/3 p-3 sm:p-4 md:p-5"
					step={1}
				>
					<Transcript shown={shown} />
				</FadeUp>

				<div className="mt-2.5 grid gap-2.5 md:grid-cols-3" data-steps>
					{STEPS.map((step, i) => (
						<FadeUp
							className={cn(
								"flex flex-col gap-3 rounded-[14px] border p-5 transition-colors duration-500 sm:p-6",
								i === active
									? "border-brand/30 bg-brand-dim"
									: "border-white/6 bg-white/3",
							)}
							key={step.n}
							step={(i % 4) as 0 | 1 | 2 | 3}
						>
							<div className="flex items-center gap-3">
								<span
									className={cn(
										"font-mono text-[12px] transition-colors duration-500",
										i === active ? "text-brand" : "text-ink-muted",
									)}
								>
									{step.n}
								</span>
								<code className="rounded-[5px] border border-line-bright bg-base px-2 py-0.5 font-mono text-[12px] text-ink-soft">
									{step.cmd}
								</code>
							</div>
							<div>
								<h3 className="text-[17px] font-medium tracking-[-0.01em] text-ink">
									{step.title}
								</h3>
								<p className="mt-1.5 text-[14px] leading-[1.55] text-ink-muted">
									{step.text}
								</p>
							</div>
						</FadeUp>
					))}
				</div>

				<FadeUp step={2}>
					<p className="mt-6 max-w-[640px] text-[14px] leading-[1.6] text-ink-muted">
						Deploying is the part the kit deliberately leaves alone.{" "}
						<code className="font-mono text-ink-soft">pnpm build</code> emits a
						server bundle, but no CI workflow or host config ships with it —
						guessing your target would only give you something to delete.
					</p>
				</FadeUp>
			</Container>
		</Section>
	);
}
