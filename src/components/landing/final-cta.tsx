import { buttonVariants } from "@/components/ui/button";
import { FadeUp } from "@/components/ui/fade-up";
import { SIGN_UP_HREF } from "@/lib/brand";
import { QUESTION_COUNT_WORD } from "@/lib/starter-questions";

/**
 * Section 11 — `deck-cta`: one 640px column, centred, on flat black.
 *
 * Heading, one line under it, two buttons, and then nothing — the section has
 * no bottom padding, so the dot field runs off the edge of the page instead of
 * ending. The field fades in rather than starting, which is what keeps the
 * space under the buttons from reading as a gap.
 */

/** Fades in downwards, so the empty space under the buttons stays empty. */
function DotField() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-x-0 bottom-0 h-[180px] [background-image:radial-gradient(circle,rgba(255,255,255,0.10)_1px,transparent_1px)] [background-size:15px_15px] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_65%)] md:h-[220px]"
			data-dots
		/>
	);
}

export function FinalCta() {
	return (
		<section className="relative flex min-h-[620px] items-center justify-center overflow-hidden border-white/8 border-y bg-base pb-0 text-center md:min-h-[720px]">
			{/* The field is out of flow. In flow it pushed the ask into the top
			    third, because most of its height is masked away and the eye does
			    not count space it cannot see. */}
			<div className="w-full px-gutter py-14 md:px-6">
				<FadeUp className="mx-auto w-full max-w-[640px]">
					<h2 className="heading-tight mx-auto mb-5 max-w-[560px] text-[clamp(32px,5vw,70px)] font-medium tracking-[-0.03em] text-ink">
						Start with the tests already written
					</h2>
					<p className="mb-7 text-[clamp(15px,1.5vw,18px)] leading-[1.5] text-ink-soft">
						Answer {QUESTION_COUNT_WORD} questions. The whole repo downloads,
						ready to push wherever you like, with the suite already green. Free
						while in beta.
					</p>

					<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
						<a
							className={`group ${buttonVariants({ variant: "primary" })}`}
							href={SIGN_UP_HREF}
						>
							Generate your starter
							<span className="transition-transform duration-300 group-hover:translate-x-[3px]">
								→
							</span>
						</a>
						<a
							className={buttonVariants({ variant: "secondary" })}
							href="#how-it-works"
						>
							See how it works
						</a>
					</div>
				</FadeUp>
			</div>

			<DotField />
		</section>
	);
}
