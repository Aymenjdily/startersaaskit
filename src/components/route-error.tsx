import { Link } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";

/**
 * The boundary when a route throws instead of renders.
 *
 * Without one, an unhandled error in any route unmounts the whole document
 * and leaves a white screen. The message is deliberately unspecific — the
 * detail belongs in logs, not in front of the reader.
 */
export function RouteError() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base px-6 text-center">
			<h1 className="font-semibold text-3xl text-white tracking-tight">
				Something went wrong.
			</h1>
			<p className="max-w-sm text-[15px] text-ink-muted leading-relaxed">
				The page failed to load. Reloading usually fixes it; if it keeps
				happening, the report dialog in the console is the fastest way to reach
				us.
			</p>
			<div className="flex items-center gap-3">
				<button
					className={buttonVariants({ variant: "primary" })}
					onClick={() => window.location.reload()}
					type="button"
				>
					Reload
				</button>
				<Link className={buttonVariants({ variant: "secondary" })} to="/">
					Home
				</Link>
			</div>
		</main>
	);
}
