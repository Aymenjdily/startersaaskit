import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

/**
 * The page a wrong address lands on.
 *
 * Set as `notFoundComponent` on the root route, so it also covers any route
 * that throws `notFound()` — a starter detail for a deleted record reaches
 * the same room as a typo'd URL.
 */
export function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base px-6 text-center">
			<p className="font-mono text-[13px] text-ink-muted tracking-[0.2em] uppercase">
				404
			</p>
			<h1 className="font-semibold text-3xl text-white tracking-tight">
				That page does not exist.
			</h1>
			<p className="max-w-sm text-[15px] text-ink-muted leading-relaxed">
				The link may be old, or the address mistyped. The front door still
				works.
			</p>
			<Link className={buttonVariants({ variant: "secondary" })} to="/">
				Back to the home page
			</Link>
		</main>
	);
}
