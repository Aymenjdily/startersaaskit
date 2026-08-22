import { type ReactNode, useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { cn } from "@/lib/utils";
import { SUITE_STATS } from "@/test/suite-stats";

/**
 * Section 10 — `uc-home-section`: breadth, shown rather than listed.
 *
 * Oversized names on the left, one panel on the right that cross-fades to the
 * screen belonging to whichever name is lit. The panel is sticky, so the list
 * scrolls past a picture that stays put.
 *
 * Every screen is drawn from something in this repo — the columns are the
 * columns `db/schema.ts` declares, the run is the run the suite last reported,
 * the provisioning steps are the ones `neon-vite-plugin.ts` configures. That is
 * what `use-cases.test.tsx` checks, so a screen cannot drift from the thing it
 * is a picture of.
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
			<div className="flex items-center gap-1.5 border-b border-white/6 px-4 py-3">
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

/**
 * The first start, in the order `neon-vite-plugin.ts` makes it happen. Both the
 * env key and the seed path are read back out of that file by the tests.
 */
export const PROVISION_STEPS = [
	{ text: "reading DATABASE_URL", done: true },
	{ text: "provisioning Postgres", done: true },
	{ text: "seeding db/init.sql", done: true },
	{ text: "ready — nothing to sign up for", done: true },
];

function ProvisionScreen() {
	return (
		<Screen label="pnpm dev">
			<div className="font-mono text-[11px] leading-[2.2] sm:text-[12px]">
				<p className="text-ink-soft">
					<span aria-hidden="true" className="mr-2 select-none text-brand">
						$
					</span>
					pnpm dev
				</p>
				{PROVISION_STEPS.map((step) => (
					<p className="flex items-center gap-2 text-ink-muted" key={step.text}>
						<span aria-hidden="true" className="text-sage">
							✓
						</span>
						{step.text}
					</p>
				))}
			</div>
		</Screen>
	);
}

const RUN_ROWS = Object.entries(SUITE_STATS.byDir);

function GreenRunScreen() {
	return (
		<Screen label="pnpm test">
			<div className="font-mono text-[11px] leading-[2.1] sm:text-[12px]">
				{RUN_ROWS.map(([dir, count]) => (
					<p className="flex items-center gap-2.5" key={dir}>
						<span aria-hidden="true" className="text-sage">
							✓
						</span>
						<span className="flex-1 truncate text-ink-muted">{dir}</span>
						<span className="text-ink-soft">{count}</span>
					</p>
				))}
				<p className="mt-3 border-t border-line pt-3 text-sage">
					{SUITE_STATS.total} passed ({SUITE_STATS.files} files)
				</p>
			</div>
		</Screen>
	);
}

/** Modules that have a spec sitting next to them, checked against disk. */
export const SPEC_PAIRS = [
	"src/lib/utils.ts",
	"src/components/landing/hero.tsx",
	"src/db/schema.ts",
];

/** `src/lib/utils.ts` → `src/lib/utils.test.ts`. */
export const specFor = (module: string) =>
	module.replace(/\.tsx?$/, (extension) => `.test${extension}`);

function SpecPairScreen() {
	return (
		<Screen label=".cursorrules">
			<div className="flex flex-col gap-2.5">
				{SPEC_PAIRS.map((module) => (
					<div
						className="rounded-[10px] border border-line bg-elevated px-3.5 py-3"
						key={module}
					>
						<p className="truncate font-mono text-[11px] text-ink-soft">
							{module.split("/").pop()}
						</p>
						<p className="mt-1.5 flex items-center gap-2 truncate font-mono text-[11px] text-ink-muted">
							<span aria-hidden="true" className="text-brand">
								└
							</span>
							{specFor(module).split("/").pop()}
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
		text: "Sign-in and cookie sessions are already configured, so the account model is the first thing you extend rather than the first thing you build.",
		Screen: SignInScreen,
	},
	{
		title: "Internal tools",
		text: "Typed queries over Postgres and a table browser you did not have to write. Most of these need a schema and a form, not a landing page.",
		Screen: StudioScreen,
	},
	{
		title: "Side projects",
		text: "No account to create and no key to paste before it runs. The database provisions itself on the first start.",
		Screen: ProvisionScreen,
	},
	{
		title: "Client work",
		text: "Strict TypeScript and a suite that is green on the clone, so what you hand over has a baseline the next person can check.",
		Screen: GreenRunScreen,
	},
	{
		title: "AI apps",
		text: "The conventions are written down and every module has a spec beside it, so when an agent writes the next feature something exists to catch it.",
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
						title="The same starting point, whatever you are building"
					/>
				</FadeUp>

				<div className="grid gap-8 md:grid-cols-2 md:gap-12">
					<FadeUp
						className="order-2 flex flex-col justify-between gap-8 md:order-1"
						step={1}
					>
						<p className="max-w-[420px] text-body-lg leading-[1.5] tracking-[-0.01em] text-ink-soft">
							Nothing here is a vertical template. It is the plumbing every one
							of these needs, already wired and already tested.
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
												active ? "text-ink" : "text-white/35",
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
						<div className="relative aspect-[4/3] overflow-hidden rounded-[16px] border border-white/6 bg-[#0a0a0a] md:sticky md:top-[100px] md:aspect-square">
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
