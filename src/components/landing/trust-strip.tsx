import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { BrandGlyph } from "./brand-glyph";
import type { BrandIcon } from "./brand-icons";

const STACK: { icon: BrandIcon; label: string }[] = [
	{ icon: "tanstack", label: "TanStack Start" },
	{ icon: "nextdotjs", label: "Next.js" },
	{ icon: "react", label: "React 19" },
	{ icon: "neon", label: "Neon" },
	{ icon: "drizzle", label: "Drizzle ORM" },
	{ icon: "prisma", label: "Prisma" },
	{ icon: "betterauth", label: "Better Auth" },
	{ icon: "tailwindcss", label: "Tailwind CSS" },
	{ icon: "biome", label: "Biome" },
	{ icon: "vercel", label: "Vercel" },
];

export function TrustStrip() {
	return (
		<section className="relative bg-base pt-10 pb-14 md:pt-14 md:pb-20">
			<Container>
				<FadeUp className="flex flex-col items-center gap-8 md:gap-10">
					<p className="text-center text-[13px] tracking-[-0.01em] text-ink-muted">
						Built on tools you already trust
					</p>

					{/* Gaps are tuned so all ten fit one line at >=1280px without an orphan row. */}
					<ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-6 md:gap-x-8">
						{STACK.map((item) => (
							<li
								key={item.label}
								className="flex items-center gap-2.5 text-ink-muted"
							>
								<BrandGlyph icon={item.icon} className="size-5" />
								<span className="whitespace-nowrap text-[14px] tracking-[-0.01em]">
									{item.label}
								</span>
							</li>
						))}
					</ul>
				</FadeUp>
			</Container>
		</section>
	);
}
