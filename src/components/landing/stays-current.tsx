import { Check, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";

/**
 * The objection the page was losing people to, answered where it happens.
 *
 * The hero says "skip the boilerplate", and a reader who has been burned by
 * one hears *another boilerplate* — then leaves before `SwapAnything` gets to
 * explain that there is no template to fork. That reaction arrived verbatim in
 * public: "these things usually get old fast". It is the correct instinct about
 * the category and the wrong conclusion about this, and until now the rebuttal
 * existed only in the architecture, not on the page.
 *
 * So it sits third, immediately after the trust strip: late enough that the
 * reader knows what the product is, early enough to catch them before they
 * decide it is a template shop.
 *
 * ## Why the last line concedes something
 *
 * A page that answers "does it go stale?" with an unqualified no is lying, and
 * the reader who has maintained a fork knows it. A repo already downloaded is
 * frozen — nothing here reaches back into it, and no generator can. Naming that
 * boundary is what makes the three rows above it believable; without it this is
 * one more landing page insisting it has no downsides.
 */

/**
 * The pairs, exported so the spec asserts against this rather than a copy.
 *
 * Ordered as objection → answer: each `generated` line answers the `forked`
 * line beside it, which is why they live in one structure instead of two
 * lists that could drift apart.
 */
export type Contrast = { forked: string; generated: string };

export const CONTRASTS: Contrast[] = [
	{
		forked:
			"Upgrades become yours the moment you clone, months after whoever wrote it moved on.",
		generated:
			"Upgrades land in the generator, once. The next repo out already has them.",
	},
	{
		forked:
			"Your changes and theirs collide. You rebase onto a stranger's decisions, or you drift.",
		generated:
			"Nothing to rebase. There is no upstream — the tree is yours from the first commit.",
	},
	{
		forked:
			"It passed on the day it was published, in whichever configuration the author ran.",
		generated:
			"Every combination is generated and run in CI before it is offered to anyone.",
	},
];

type ColumnProps = {
	title: string;
	lines: string[];
	tone: "forked" | "generated";
};

function Column({ title, lines, tone }: ColumnProps) {
	const generated = tone === "generated";
	const Icon = generated ? Check : Minus;

	return (
		<article
			className={
				generated
					? "rounded-[20px] border border-white/8 bg-elevated p-7 md:p-8"
					: "rounded-[20px] border border-white/8 bg-base p-7 md:p-8"
			}
			data-column={tone}
		>
			<h3
				className={
					generated
						? "font-mono text-[13px] text-sage uppercase tracking-[0.12em]"
						: "font-mono text-[13px] text-ink-muted uppercase tracking-[0.12em]"
				}
			>
				{title}
			</h3>

			<ul className="mt-6 flex flex-col gap-4">
				{lines.map((line) => (
					<li
						className={
							generated
								? "flex items-start gap-2.5 text-[14px] text-ink-soft leading-[1.5]"
								: "flex items-start gap-2.5 text-[14px] text-ink-muted leading-[1.5]"
						}
						key={line}
					>
						<Icon
							aria-hidden="true"
							className={
								generated
									? "mt-0.5 size-4 shrink-0 text-brand"
									: "mt-0.5 size-4 shrink-0 text-ink-muted"
							}
						/>
						{line}
					</li>
				))}
			</ul>
		</article>
	);
}

export function StaysCurrent() {
	return (
		/* Top border only. `Statement` below supplies its own, and two rules
		   meeting between the bands would read as a seam rather than a divider. */
		<Section className="border-white/8 border-t" tone="base">
			<Container>
				<FadeUp>
					<SectionHeading
						description="A template ages because you forked it: the copy in your repo stops moving the day you download it. There is no template here to fork. The repo is assembled when you ask for it, from a generator that gets fixed in one place."
						eyebrow="Generated, not forked"
						title="A fork goes stale. A generator does not."
					/>
				</FadeUp>

				<FadeUp className="mt-10" step={1}>
					<div className="grid gap-4 md:grid-cols-2 md:gap-6">
						<Column
							lines={CONTRASTS.map((row) => row.forked)}
							title="A template you fork"
							tone="forked"
						/>
						<Column
							lines={CONTRASTS.map((row) => row.generated)}
							title="A repo we generate"
							tone="generated"
						/>
					</div>
				</FadeUp>

				<FadeUp className="mt-8" step={2}>
					<p className="max-w-[720px] text-[14px] text-ink-muted leading-[1.6]">
						What this does not claim: a starter you have already downloaded is
						yours and stays exactly as delivered — nothing here reaches back
						into it. The promise is narrower, and it is the one that matters
						before you start: what you are handed is current on the day you ask
						for it.
					</p>
				</FadeUp>
			</Container>
		</Section>
	);
}
