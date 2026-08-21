import { FadeUp } from "@/components/ui/fade-up";

/**
 * Mirrors the reference's `.marquee-statement`. Despite the name it does not
 * scroll: it is a static, centred h2 on the page background.
 *
 *   .marquee-statement { padding: 80px 24px 0; max-width: calc(1300px + 48px); margin: 0 auto }
 *   .marquee-title     { font-size: clamp(28px, 4.5vw, 60px); weight 500;
 *                        line-height: 1.15; letter-spacing: -0.03em; text-align: center }
 *   @max-768  .marquee-statement { padding: 60px 16px 0 }
 *             .marquee-title     { font-size: clamp(22px, 6vw, 36px) }
 *             .mobile-br         { display: block }
 *   @max-480  .marquee-title     { font-size: 8vw }
 *
 * Note there is no bottom padding — the following section supplies its own.
 */

/** Empty span that becomes a block below 768px, breaking the line after a clause. */
function MobileBr() {
	return <span className="hidden max-md:block" />;
}

export function Statement() {
	return (
		<section className="mx-auto w-full max-w-[1348px] px-4 pt-15 pb-0 md:px-6 md:pt-20">
			<FadeUp>
				<h2 className="w-full text-center font-medium text-[clamp(22px,6vw,36px)] leading-[1.15] tracking-[-0.03em] text-ink max-[480px]:text-[8vw] md:text-h2">
					Any stack.
					<MobileBr /> Any provider.
					<MobileBr /> Already wired.
				</h2>
			</FadeUp>
		</section>
	);
}
