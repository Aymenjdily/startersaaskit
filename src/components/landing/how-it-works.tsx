import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import {
	QUESTION_COUNT_WORD,
	QUESTION_COUNT_WORD_CAPITALISED,
} from "@/lib/starter-questions";
import { cn } from "@/lib/utils";

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
	title: string;
	text: string;
};

export const STEPS: Step[] = [
	{
		n: "01",
		title: `Answer ${QUESTION_COUNT_WORD} questions`,
		text: "Framework, components, database, ORM, auth, billing, and a name. Each answer narrows the next, so a combination that does not work is never offered in the first place.",
	},
	{
		n: "02",
		title: "See it before it exists",
		text: "The full file tree and the suite it ships with, laid out before anything is generated. Nothing is built until you approve it.",
	},
	{
		n: "03",
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

function AnswerRow({ label, value }: Answer) {
	return (
		<div className="flex items-baseline justify-between gap-4 border-line/60 border-b py-2.5 last:border-0">
			<span className="shrink-0 text-ink-muted">{label}</span>
			<span className="min-w-0 truncate text-ink">{value}</span>
		</div>
	);
}

function WizardPanel({ shown }: { shown: number }) {
	return (
		<div
			aria-hidden="true"
			className="rounded-[12px] border border-line bg-elevated p-4 font-mono text-[12px] sm:p-6 sm:text-[13px]"
			data-wizard
		>
			<div className="mb-4 flex items-center gap-1.5">
				<span className="size-2 rounded-full bg-white/10" />
				<span className="size-2 rounded-full bg-white/10" />
				<span className="size-2 rounded-full bg-white/10" />
				<span className="ml-2 text-[11px] text-ink-muted">New starter</span>
			</div>

			{/* Fixed height so answers fill in without shoving the page around. */}
			<div className="min-h-[280px] sm:min-h-[300px]">
				{ANSWERS.slice(0, shown).map((answer) => (
					<AnswerRow key={answer.label} {...answer} />
				))}

				{shown > RESOLVING_AT && (
					<p className="pt-4 text-ink-muted">
						resolving {QUESTION_COUNT_WORD} answers into a template
					</p>
				)}

				{shown > RESOLVING_AT + 1 && (
					<p className="pt-1 text-sage">
						delivered to github.com/you/{PROJECT}
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
							<span
								className={cn(
									"font-mono text-[12px] transition-colors duration-500",
									i === active ? "text-brand" : "text-ink-muted",
								)}
							>
								{step.n}
							</span>
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
