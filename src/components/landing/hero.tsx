import { buttonVariants } from "@/components/ui/button";
import { HeroPreview } from "./hero-preview";

const REPO_HREF = "https://github.com/nextsaaskit/nextsaaskit";

export function Hero() {
	return (
		<section className="relative flex flex-col items-center overflow-hidden px-gutter pt-[180px] pb-[30px] sm:pt-[200px] sm:pb-10 md:px-6 md:pt-[240px] md:pb-8">
			<div className="relative z-10 mb-8 w-full max-w-content text-left md:mb-15">
				<p
					className="hero-in mb-4 text-[14px] font-medium text-white/70"
					style={{ animationDelay: "0s" }}
				>
					Open source · MIT licensed
				</p>

				<h1
					className="hero-in mb-9 max-w-[900px] text-hero heading-tight text-ink"
					style={{ animationDelay: "0.05s" }}
				>
					Skip the boilerplate. Keep the tests. Ship the product.
				</h1>

				<div className="grid items-start gap-6 md:grid-cols-[2fr_1fr] md:gap-10">
					<p
						className="hero-in max-w-[600px] text-body-lg leading-[1.5] tracking-[-0.01em] text-white/80"
						style={{ animationDelay: "0.2s" }}
					>
						An open-source SaaS starter on TanStack Start — auth, billing,
						database, email and CI already wired together, with a test suite
						that proves it.
					</p>

					<div
						className="hero-in flex flex-wrap items-start gap-3 md:justify-end"
						style={{ animationDelay: "0.35s" }}
					>
						<a
							href={REPO_HREF}
							target="_blank"
							rel="noreferrer"
							className={`group ${buttonVariants({ variant: "primary" })}`}
						>
							Get started
							<span className="transition-transform duration-300 group-hover:translate-x-[3px]">
								→
							</span>
						</a>
						<a
							href={REPO_HREF}
							target="_blank"
							rel="noreferrer"
							className={buttonVariants({ variant: "secondary" })}
						>
							View on GitHub
						</a>
					</div>
				</div>
			</div>

			<div className="hero-image-in relative z-10 w-full max-w-content">
				<div
					aria-hidden
					className="-z-10 pointer-events-none absolute inset-x-[10%] top-[10%] bottom-[20%] rounded-full bg-pine/20 blur-[120px]"
				/>
				<HeroPreview />
			</div>
		</section>
	);
}
