import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/landing/hero";
import { Statement } from "@/components/landing/statement";
import { SwapAnything } from "@/components/landing/swap-anything";
import { TestedByDefault } from "@/components/landing/tested-by-default";
import { TrustStrip } from "@/components/landing/trust-strip";
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
			</main>
		</>
	);
}
