import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";
import { SIGN_UP_HREF } from "@/lib/brand";
import { DEFAULT_GENERATION_LIMIT, FEEDBACK_REWARD } from "@/lib/quota";

/**
 * Section 10 — one plan, because there is only one plan. A three-column
 * comparison table would be furniture for tiers that do not exist yet; a
 * single centred card says the honest thing, which is that everyone gets the
 * same allowance right now.
 *
 * Every number here is imported, not typed — `DEFAULT_GENERATION_LIMIT` and
 * `FEEDBACK_REWARD` are the same constants the console and the docs page
 * read, and both are checked against the migration that actually enforces
 * them in `quota.sql.test.ts`. This card cannot advertise an allowance the
 * database would refuse to honour.
 */

const FEATURES = [
	`${DEFAULT_GENERATION_LIMIT} generations to start — no card required`,
	`${FEEDBACK_REWARD} more the first time you leave feedback`,
	"Every combination tested green in CI before it ships",
	"Re-downloading a starter you already generated is always free",
];

export function Pricing() {
	return (
		<Section id="pricing" tone="base">
			<Container>
				<SectionHeading
					align="center"
					description="No tiers to compare yet — every account gets the same allowance, and it costs nothing to try."
					eyebrow="Pricing"
					title="One plan"
				/>

				<FadeUp className="mx-auto mt-10 max-w-[420px]" step={1}>
					<div className="rounded-[20px] border border-white/10 bg-elevated p-8">
						<p className="font-mono text-[13px] text-sage uppercase tracking-[0.12em]">
							Free
						</p>
						<p className="mt-3 flex items-baseline gap-2">
							<span className="text-[48px] font-medium text-ink tracking-[-0.02em]">
								$0
							</span>
							<span className="text-[14px] text-ink-muted">
								· free while in beta
							</span>
						</p>

						<ul className="mt-8 flex flex-col gap-3">
							{FEATURES.map((feature) => (
								<li
									className="flex items-start gap-2.5 text-[14px] text-ink-soft leading-[1.5]"
									key={feature}
								>
									<Check
										aria-hidden="true"
										className="mt-0.5 size-4 shrink-0 text-brand"
									/>
									{feature}
								</li>
							))}
						</ul>

						<a
							className={`group mt-8 w-full ${buttonVariants({ variant: "primary" })}`}
							href={SIGN_UP_HREF}
						>
							Get started free
							<span className="transition-transform duration-300 group-hover:translate-x-[3px]">
								→
							</span>
						</a>
					</div>
				</FadeUp>
			</Container>
		</Section>
	);
}
