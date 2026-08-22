import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { AiOptimized } from "@/components/landing/ai-optimized";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { SixtySeconds } from "@/components/landing/sixty-seconds";
import { Statement } from "@/components/landing/statement";
import { SwapAnything } from "@/components/landing/swap-anything";
import { TestedByDefault } from "@/components/landing/tested-by-default";
import { TrustStrip } from "@/components/landing/trust-strip";
import { UseCases } from "@/components/landing/use-cases";
import { WiredGrid } from "@/components/landing/wired-grid";
import { Navbar } from "@/components/Navbar";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base">
				<Hero />
				<TrustStrip />
				<Statement />
				<WiredGrid />
				<TestedByDefault />
				<SwapAnything />
				<AiOptimized />
				<SixtySeconds />
				<UseCases />
				<FinalCta />
			</main>
			<Footer />
		</>
	);
}
