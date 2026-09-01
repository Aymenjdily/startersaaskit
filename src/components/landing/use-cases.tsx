import { type ReactNode, useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { QUESTION_COUNT_WORD_CAPITALISED } from "@/lib/starter-questions";
import { cn } from "@/lib/utils";
import { COMBINATIONS, SPEC_PAIRS } from "./tested-by-default";

/**
 * Section 10 — `uc-home-section`: breadth, shown rather than listed.
 *
 * Oversized names on the left, one panel on the right that cross-fades to the
 * screen belonging to whichever name is lit. The panel is sticky, so the list
 * scrolls past a picture that stays put.
 *
 * The screens used to be pictures of this repo, checked back against its files.
 * They are now pictures of a repo we generate, so the matrix and the spec pairs
 * are imported from section 06 rather than restated — one list, one place to be
 * wrong, and the spec holds the two sections together.
 */

const ROTATE_MS = 3600;

/**
 * Advances on its own until the reader picks something, then stops for good:
 * a panel that keeps moving after a deliberate choice reads as broken.
 *
 * Always starts at 0 so the server and the first client render agree.
 */
function useRotation(count: number) {
	const [index, setIndex] = useState(0);
	const [taken, setTaken] = useState(false);

	useEffect(() => {
		if (taken) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const timer = setInterval(
			() => setIndex((current) => (current + 1) % count),
			ROTATE_MS,
		);
		return () => clearInterval(timer);
	}, [count, taken]);

	return {
		index,
		select: (next: number) => {
			setTaken(true);
			setIndex(next);
		},
	};
}

/** Window chrome shared by every screen, captioned with what it is a view of. */
function Screen({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center gap-1.5 border-b border-white/8 px-4 py-3">
				<span className="size-[7px] rounded-full bg-white/12" />
				<span className="size-[7px] rounded-full bg-white/12" />
				<span className="size-[7px] rounded-full bg-white/12" />
				<span className="ml-2 truncate font-mono text-[10px] tracking-[0.04em] text-ink-muted sm:text-[11px]">
					{label}
				</span>
			</div>
			<div className="flex flex-1 flex-col justify-center overflow-hidden p-5 sm:p-7">
				{children}
			</div>
		</div>
	);
}

/** The two fields `src/lib/auth.ts` turns on. */
export const SIGN_IN_FIELDS = ["Email", "Password"];

function SignInScreen() {
	return (
		<Screen label="src/lib/auth.ts">
			<div className="mx-auto w-full max-w-[250px] rounded-[12px] border border-line bg-elevated p-5">
				<p className="mb-4 text-[13px] font-medium text-ink">Sign in</p>
				{SIGN_IN_FIELDS.map((field) => (
					<div className="mb-3" key={field}>
						<p className="mb-1.5 text-[9px] uppercase tracking-[0.12em] text-ink-muted">
							{field}
						</p>
						<div className="h-7 rounded-[6px] border border-line-bright bg-base" />
					</div>
				))}
				<div className="mt-4 flex h-8 items-center justify-center rounded-[6px] bg-brand text-[12px] font-medium text-ink-inverse">
					Continue
				</div>
				<p className="mt-3 text-center text-[10px] text-ink-muted">
					Cookie session, no extra wiring
				</p>
			</div>
		</Screen>
	);
}

/** Exactly the columns `todos` declares in `db/schema.ts`. */
export const TODO_COLUMNS = ["id", "title", "created_at"];

function StudioScreen() {
	return (
		<Screen label="pnpm db:studio">
			<div className="overflow-hidden rounded-[10px] border border-line">
				<div className="grid grid-cols-[44px_1fr_92px] border-b border-line bg-elevated">
					{TODO_COLUMNS.map((column) => (
						<span
							className="truncate px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted"
							key={column}
						>
							{column}
						</span>
					))}
				</div>
				{[0, 1, 2, 3, 4].map((row) => (
					<div
						className="grid grid-cols-[44px_1fr_92px] items-center border-b border-line/60 px-3 py-2.5 last:border-0"
						key={row}
					>
						<span className="font-mono text-[11px] text-ink-muted">
							{row + 1}
						</span>
						<span
							className="mr-6 h-[7px] rounded-full bg-white/10"
							style={{ width: `${[82, 61, 74, 48, 68][row]}%` }}
						/>
						<span className="h-[7px] w-3/5 rounded-full bg-white/6" />
					</div>
				))}
			</div>
		</Screen>
	);
}

/** What happens after the last question, in the order it happens. */
/**
 * What the generator actually does, in order.
 *
 * It used to end "pushed to your GitHub", with "installing dependencies" and
 * "running the suite" along the way. None of the three happen: what ships is a
 * zip of source, and nothing is installed or executed on anyone's behalf. An
 * animation is still a claim, and this one described a product that does not
 * exist yet.
 */
export const DELIVERY_STEPS = [
	"resolving your answers",
	"generating the repo",
	"wiring the test suite",
	"packing the zip",
	"downloaded — ready to push",
];

function DeliveryScreen() {
	return (
		<Screen label="Generating your starter">
			<div className="font-mono text-[11px] leading-[2.2] sm:text-[12px]">
				{DELIVERY_STEPS.map((step) => (
					<p className="flex items-center gap-2 text-ink-muted" key={step}>
						<span aria-hidden="true" className="text-sage">
							✓
						</span>
						{step}
					</p>
				))}
			</div>
		</Screen>
	);
}

function GreenRunScreen() {
	return (
		<Screen label="CI — every combination">
			<div className="font-mono text-[11px] leading-[2.1] sm:text-[12px]">
				{COMBINATIONS.map((combination) => (
					<p
						className="flex items-center gap-2.5"
						key={`${combination.framework} ${combination.stack}`}
					>
						<span aria-hidden="true" className="text-sage">
							✓
						</span>
						<span className="flex-1 truncate text-ink-muted">
							{combination.framework} · {combination.stack}
						</span>
					</p>
				))}
				<p className="mt-3 border-t border-line pt-3 text-sage">
					{COMBINATIONS.length} passed
				</p>
			</div>
		</Screen>
	);
}

function SpecPairScreen() {
	return (
		<Screen label="a spec beside every module">
			<div className="flex flex-col gap-2.5">
				{SPEC_PAIRS.map(({ module, spec }) => (
					<div
						className="rounded-[10px] border border-line bg-elevated px-3.5 py-3"
						key={module}
					>
						<p className="truncate font-mono text-[11px] text-ink-soft">
							{module}
						</p>
						<p className="mt-1.5 flex items-center gap-2 truncate font-mono text-[11px] text-ink-muted">
							<span aria-hidden="true" className="text-brand">
								└
							</span>
							{spec}
						</p>
					</div>
				))}
			</div>
		</Screen>
	);
}

export type UseCase = {
	title: string;
	/** Rendered under the lit name — one line on why this stack fits. */
	text: string;
	Screen: () => ReactNode;
};

export const USE_CASES: UseCase[] = [
	{
		title: "B2B SaaS",
		text: "Sign-in and sessions arrive configured against whichever auth provider you picked, so the account model is the first thing you extend rather than the first thing you build.",
		Screen: SignInScreen,
	},
	{
		title: "Internal tools",
		text: "Typed queries over Postgres and a table browser you did not have to write. Most of these need a schema and a form, not a landing page.",
		Screen: StudioScreen,
	},
	{
		title: "Side projects",
		text: `${QUESTION_COUNT_WORD_CAPITALISED} answers and the repo is on your machine, wired together with its suite already written. The part you were going to procrastinate on is already done.`,
		Screen: DeliveryScreen,
	},
	{
		title: "Client work",
		text: "Pick the stack the client already runs rather than talking them out of it. Every combination we offer has gone green in CI before it is offered.",
		Screen: GreenRunScreen,
	},
	{
		title: "AI apps",
		text: "Every module arrives with a spec beside it, so when an agent writes the next feature something already exists to catch it.",
		Screen: SpecPairScreen,
	},
];

export function UseCases() {
	const { index, select } = useRotation(USE_CASES.length);

	return (
		<Section id="use-cases" tone="forest">
			<Container>
				<FadeUp className="mb-10 md:mb-14">
					<SectionHeading
						eyebrow="Use cases"
						title="Your starting point, whatever you are building"
					/>
				</FadeUp>

				<div className="grid gap-8 md:grid-cols-2 md:gap-12">
					<FadeUp
						className="order-2 flex flex-col justify-between gap-8 md:order-1"
						step={1}
					>
						<p className="max-w-[420px] text-body-lg leading-[1.5] tracking-[-0.01em] text-ink-soft">
							We do not sell a vertical template for each of these. They need
							the same plumbing wired to different choices — which is the one
							thing a generator is better at than a repo you clone.
						</p>

						<div className="flex flex-col" data-cases>
							{USE_CASES.map((useCase, i) => {
								const active = i === index;

								return (
									<button
										aria-current={active}
										className="group flex items-center gap-1.5 py-2 text-left"
										key={useCase.title}
										onClick={() => select(i)}
										onFocus={() => select(i)}
										type="button"
									>
										<span
											aria-hidden="true"
											className={cn(
												"shrink-0 text-[16px] text-brand opacity-0 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100",
												active && "translate-x-[2px] opacity-100",
											)}
										>
											→
										</span>
										<span
											className={cn(
												"text-[17px] font-medium tracking-[-0.02em] transition-colors duration-200 group-hover:text-ink md:text-[24px]",
												active ? "text-ink" : "text-ink-muted/70",
											)}
										>
											{useCase.title}
										</span>
									</button>
								);
							})}
						</div>

						<p
							aria-live="polite"
							className="min-h-[66px] max-w-[420px] text-[14px] leading-[1.55] text-ink-muted"
						>
							{USE_CASES[index].text}
						</p>
					</FadeUp>

					<FadeUp className="order-1 md:order-2" step={2}>
						<div className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-white/8 bg-[#0a0a0a] md:sticky md:top-[100px] md:aspect-square">
							<div
								aria-hidden="true"
								className="-translate-x-1/2 pointer-events-none absolute left-1/2 top-0 size-[420px] rounded-full bg-brand/8 blur-[100px]"
							/>

							{USE_CASES.map((useCase, i) => (
								<div
									aria-hidden={i !== index}
									className={cn(
										"absolute inset-0 transition-opacity duration-300 ease-out",
										i === index
											? "opacity-100"
											: "pointer-events-none opacity-0",
									)}
									key={useCase.title}
								>
									<useCase.Screen />
								</div>
							))}
						</div>
					</FadeUp>
				</div>
			</Container>
		</Section>
	);
}
