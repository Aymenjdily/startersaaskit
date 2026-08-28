import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { AiOptimized } from "@/components/landing/ai-optimized";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Statement } from "@/components/landing/statement";
import { SwapAnything } from "@/components/landing/swap-anything";
import { TrustStrip } from "@/components/landing/trust-strip";
import { WiredGrid } from "@/components/landing/wired-grid";
import { Navbar } from "@/components/Navbar";
import { pageHead } from "@/lib/seo";
import { starterPreviews } from "@/lib/starter-preview";

/**
 * The hero's previews are built here rather than in the component.
 *
 * `starterPreviews` runs the real generator, which is 412KB of template
 * strings. A loader keeps that on the server: the result is serialised into the
 * page alongside the HTML, so the browser receives file paths and never the
 * machine that produced them.
 */
export const Route = createFileRoute("/")({
	head: () =>
		pageHead({
			path: "/",
		}),
	component: Home,
	loader: () => starterPreviews(),
});

function Home() {
	const previews = Route.useLoaderData();

	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base">
				<Hero previews={previews} />
				<TrustStrip />
				<Statement />
				<WiredGrid />
				<SwapAnything />
				<AiOptimized />
				<HowItWorks />
				<FinalCta />
			</main>
			<Footer />
		</>
	);
}
