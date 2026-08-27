import { buttonVariants } from "@/components/ui/button";
import { SIGN_UP_HREF } from "@/lib/brand";
import type { StarterPreview } from "@/lib/starter-preview";
import { HeroGenerator } from "./hero-generator";

export function Hero({ previews }: { previews: StarterPreview[] }) {
	return (
		<section className="relative flex flex-col items-center overflow-hidden px-gutter pt-[180px] pb-[30px] sm:pt-[200px] sm:pb-10 md:px-6 md:pt-[240px] md:pb-8">
			<div className="relative z-10 mb-8 w-full max-w-content text-left md:mb-15">
				<p
					className="hero-in mb-4 text-[14px] font-medium text-white/70"
					style={{ animationDelay: "0s" }}
				>
					Free while in beta
				</p>

				<h1
					className="hero-in mb-9 max-w-[900px] text-hero heading-tight text-ink"
					style={{ animationDelay: "0.05s" }}
				>
					Skip the boilerplate. Keep your stack. Ship the product.
				</h1>

				<div className="grid items-start gap-6 md:grid-cols-[2fr_1fr] md:gap-10">
					<p
						className="hero-in max-w-[600px] text-body-lg leading-[1.5] tracking-[-0.01em] text-white/80"
						data-subtitle
						style={{ animationDelay: "0.2s" }}
					>
						Answer a few questions — framework, components, database, ORM, auth,
						billing, email, landing page, package manager — and the whole repo
						downloads, wired together, with its test suite already written and
						green on the first run.
					</p>

					<div
						className="hero-in flex flex-wrap items-start gap-3 md:justify-end"
						style={{ animationDelay: "0.35s" }}
					>
						<a
							href={SIGN_UP_HREF}
							className={`group ${buttonVariants({ variant: "primary" })}`}
						>
							Generate your starter
							<span className="transition-transform duration-300 group-hover:translate-x-[3px]">
								→
							</span>
						</a>
						<a
							href="#how-it-works"
							className={buttonVariants({ variant: "secondary" })}
						>
							See how it works
						</a>
					</div>
				</div>
			</div>

			<div className="hero-image-in relative z-10 w-full max-w-content">
				<div
					aria-hidden
					className="-z-10 pointer-events-none absolute inset-x-[10%] top-[10%] bottom-[20%] rounded-full bg-pine/20 blur-[120px]"
				/>
				<HeroGenerator previews={previews} />
			</div>
		</section>
	);
}
