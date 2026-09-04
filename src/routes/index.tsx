import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { AiOptimized } from "@/components/landing/ai-optimized";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Reels } from "@/components/landing/reels";
import { Statement } from "@/components/landing/statement";
import { StaysCurrent } from "@/components/landing/stays-current";
import { SwapAnything } from "@/components/landing/swap-anything";
import { TrustStrip } from "@/components/landing/trust-strip";
import { WiredGrid } from "@/components/landing/wired-grid";
import { Navbar } from "@/components/Navbar";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
	head: () =>
		pageHead({
			path: "/",
		}),
	component: Home,
});

function Home() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base">
				<Hero />
				<TrustStrip />
				<StaysCurrent />
				<Statement />
				<WiredGrid />
				<SwapAnything />
				<AiOptimized />
				<HowItWorks />
				<Reels />
				<Pricing />
				<FinalCta />
			</main>
			<Footer />
		</>
	);
}
