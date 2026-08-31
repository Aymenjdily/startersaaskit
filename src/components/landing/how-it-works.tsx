import type { LucideIcon } from "lucide-react";
import { Check, Eye, ListChecks, Loader2, PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { NeutralGlyph } from "@/components/ui/option-cards";
import { Section, SectionHeading } from "@/components/ui/section";
import {
	QUESTION_COUNT_WORD,
	QUESTION_COUNT_WORD_CAPITALISED,
	STARTER_QUESTIONS,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";
import { BrandGlyph } from "./brand-glyph";
import type { BrandIcon } from "./brand-icons";

/**
 * Section 09 — `cu-section`: header above one wide visual.
 *
 * This section used to be a terminal transcript of `pnpm install && pnpm dev`,
 * back when the product was a repo you cloned. It is now the wizard, because
 * the wizard *is* the product and this is the only place on the page that
 * shows it working.
 *
 * The answers below are one legal path through `compat.json` — see
 * `context/product-model.md`. They are deliberately a combination we intend to
 * support rather than a screenshot of something shipping today.
 */

export type Step = {
	/** Displayed as the card's ordinal. */
	n: string;
	icon: LucideIcon;
	title: string;
	text: string;
};

export const STEPS: Step[] = [
	{
		n: "01",
		icon: ListChecks,
		title: `Answer ${QUESTION_COUNT_WORD} questions`,
		text: "Framework, components, database, ORM, auth, billing, and a name. Each answer narrows the next, so a combination that does not work is never offered in the first place.",
	},
	{
		n: "02",
		icon: Eye,
		title: "See it before it exists",
		text: "The full file tree and the suite it ships with, laid out before anything is generated. Nothing is built until you approve it.",
	},
	{
		n: "03",
		icon: PackageOpen,
		title: "Take delivery",
		text: "A zip of the whole repo, yours to unpack and push wherever you like. Install, run the suite, and it is green on the first run.",
	},
];

/** One question the wizard asks, and the answer this demo picks. */
export type Answer = { label: string; value: string };

export const ANSWERS: Answer[] = [
	{ label: "Framework", value: "Next.js" },
	{ label: "Components", value: "shadcn/ui" },
	{ label: "Database", value: "Neon" },
	{ label: "ORM", value: "Drizzle" },
	{ label: "Auth", value: "Better Auth" },
	{ label: "Billing", value: "Stripe" },
	{ label: "Email", value: "Resend" },
	{ label: "Landing page", value: "Editorial" },
	{ label: "Package manager", value: "pnpm" },
	{ label: "Project", value: "my-app" },
];

/**
 * The mark each answer would carry in the wizard, looked up from the real
 * question set rather than listed here — a value this demo prints that the
 * wizard does not offer resolves to the neutral glyph instead of a wrong logo.
 * "Project" is free text, so it has no mark to look up.
 */
function iconFor({ label, value }: Answer): BrandIcon | null {
	const question = STARTER_QUESTIONS.find((q) => q.label === label);
	const option = question?.options?.find((o) => o.label === value);

	return option?.icon ?? null;
}

type Line = {
	/** Index into `STEPS` — drives which card is highlighted. */
	step: number;
	kind: "answer" | "out" | "ok";
	/** How long this line sits on screen before the next one appears. */
	hold: number;
};

/**
 * The answers are step 01, resolving them is step 02, delivery is step 03.
 * Built from `ANSWERS` so the panel and the count in the copy cannot disagree.
 */
const LINES: Line[] = [
	...ANSWERS.map(() => ({ step: 0, kind: "answer" as const, hold: 620 })),
	{ step: 1, kind: "out", hold: 900 },
	{ step: 2, kind: "ok", hold: 2600 },
];

const LAST_LINE = LINES.length - 1;

/** Index of the "resolving" line, which is the first one past the answers. */
const RESOLVING_AT = ANSWERS.length;

/**
 * `shown` is a count, not an index: 0 means an empty panel, which is what the
 * server renders. Everything after that happens in an effect, so the first
 * paint is identical on both sides.
 */
function useWizard() {
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

const PROJECT = ANSWERS[ANSWERS.length - 1].value;

/**
 * Every row exists from the first paint — only `revealed` changes as the
 * wizard runs. A panel that instead grew one `<div>` per answer had nothing
 * to reserve space for, so it either sat empty (state gone the moment the
 * loop resets) or was floored to the fully-grown height, leaving a slab of
 * dead space through most of the cycle. Ten stable rows, each filling in
 * place, means the panel is never taller or shorter than it was a moment ago.
 */
function AnswerRow({ label, value, revealed }: Answer & { revealed: boolean }) {
	const icon = revealed ? iconFor({ label, value }) : null;

	return (
		<div className="flex items-center justify-between gap-4 border-line/60 border-b py-2.5 last:border-0">
			<span className="flex min-w-0 items-center gap-2.5">
				<span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-white/6 text-white/70">
					{revealed ? (
						icon ? (
							<BrandGlyph className="tile-in size-3.5" icon={icon} />
						) : (
							<NeutralGlyph className="tile-in size-3.5" />
						)
					) : (
						<span
							aria-hidden="true"
							className="size-1.5 rounded-full bg-white/15"
						/>
					)}
				</span>
				<span
					className={cn(
						"shrink-0 transition-colors duration-500",
						revealed ? "text-ink-muted" : "text-ink-muted/30",
					)}
				>
					{label}
				</span>
			</span>
			{revealed ? (
				<span className="tile-in min-w-0 truncate text-ink" key={value}>
					{value}
				</span>
			) : (
				<span aria-hidden="true" className="skeleton h-3 w-14 rounded-[3px]" />
			)}
		</div>
	);
}

function WizardPanel({ shown }: { shown: number }) {
	const resolving = shown > RESOLVING_AT && shown <= RESOLVING_AT + 1;
	const done = shown > RESOLVING_AT + 1;

	return (
		<div
			aria-hidden="true"
			className="rounded-[12px] border border-line bg-gradient-to-b from-elevated to-elevated/70 p-4 font-mono text-[12px] sm:p-6 sm:text-[13px]"
			data-wizard
		>
			<div className="mb-4 flex items-center gap-1.5">
				<span className="size-2 rounded-full bg-[#ff5f57]/70" />
				<span className="size-2 rounded-full bg-[#febc2e]/70" />
				<span className="size-2 rounded-full bg-[#28c840]/70" />
				<span className="ml-2 text-[11px] text-ink-muted">New starter</span>
			</div>

			{ANSWERS.map((answer, i) => (
				<AnswerRow key={answer.label} revealed={i < shown} {...answer} />
			))}

			{/* Reserved for one status line, so resolving-then-delivered — the only
			    two states left that do not already have a row of their own — cannot
			    move the panel either. */}
			<div className="min-h-[38px] pt-4">
				{resolving && (
					<p className="tile-in flex items-center gap-2 text-ink-muted">
						<Loader2
							aria-hidden="true"
							className="size-3.5 motion-safe:animate-spin"
						/>
						resolving {QUESTION_COUNT_WORD} answers into a template
					</p>
				)}

				{done && (
					<p className="tile-in flex items-center gap-2 text-sage">
						<Check aria-hidden="true" className="size-3.5" />
						delivered as {PROJECT}.zip
					</p>
				)}
			</div>
		</div>
	);
}

export function HowItWorks() {
	const shown = useWizard();
	const active = activeStep(shown);

	return (
		<Section id="how-it-works" tone="base">
			<Container>
				<FadeUp className="mb-12 md:mb-14">
					<SectionHeading
						align="center"
						eyebrow="How it works"
						title={`${QUESTION_COUNT_WORD_CAPITALISED} answers and the repo is on your machine`}
						description="Every question narrows the next one, so you cannot assemble a stack that does not fit together. You see the whole repo before it is created."
					/>
				</FadeUp>

				<FadeUp
					className="rounded-[20px] border border-white/6 bg-white/3 p-3 sm:p-4 md:p-5"
					step={1}
				>
					<WizardPanel shown={shown} />
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
							<div className="flex items-center justify-between">
								<span
									className={cn(
										"flex size-9 items-center justify-center rounded-[9px] transition-colors duration-500",
										i === active
											? "bg-brand/15 text-brand"
											: "bg-white/6 text-ink-muted",
									)}
								>
									<step.icon aria-hidden="true" className="size-4" />
								</span>
								<span
									className={cn(
										"font-mono text-[12px] transition-colors duration-500",
										i === active ? "text-brand" : "text-ink-muted",
									)}
								>
									{step.n}
								</span>
							</div>
							<div>
								<h3 className="font-medium text-[17px] text-ink tracking-[-0.01em]">
									{step.title}
								</h3>
								<p className="mt-1.5 text-[14px] text-ink-muted leading-[1.55]">
									{step.text}
								</p>
							</div>
						</FadeUp>
					))}
				</div>

				<FadeUp step={2}>
					<p className="mt-6 max-w-[640px] text-[14px] text-ink-muted leading-[1.6]">
						Where it deploys is the one question we do not ask. Guessing your
						host would only give you a config file to delete, so the repo
						arrives without one.
					</p>
				</FadeUp>
			</Container>
		</Section>
	);
}
