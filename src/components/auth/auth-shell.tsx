import { BRAND, LOGO_SIZE, LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { AuthBackdrop } from "./auth-backdrop";

/**
 * The frame both console pages sit in: scenery, wordmark, and the glass card.
 * Sign-in and sign-up differ only in what goes inside the card, and when they
 * each owned a copy of this the two drifted apart on card width the first time
 * one of them was touched.
 *
 * The card is what lifts the column off the scene — a dark pane, a hair of
 * border, and a blur so the hills read through without competing with the
 * controls.
 */
export function AuthShell({
	children,
	eyebrow,
	size = "narrow",
	tagline,
	title,
}: {
	children: React.ReactNode;
	/** Small line above the title — the onboarding wizard puts its progress here. */
	eyebrow?: React.ReactNode;
	/** Onboarding lists options, which need more room than a two-field form. */
	size?: "narrow" | "wide";
	tagline: string;
	title: string;
}) {
	return (
		<main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-base px-gutter py-20 md:px-6">
			<AuthBackdrop />

			<a className="absolute top-8 left-8 z-10" href="/">
				<img
					alt={BRAND}
					className="h-11 w-auto"
					height={LOGO_SIZE.height}
					src={LOGO_SRC}
					width={LOGO_SIZE.width}
				/>
			</a>

			<div
				className={cn(
					"relative z-10 flex w-full flex-1 flex-col justify-center",
					size === "wide" ? "max-w-[560px]" : "max-w-[440px]",
				)}
			>
				<div className="rounded-[16px] border border-white/12 bg-black/45 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
					<header className="mb-8">
						{eyebrow}
						<h1 className="text-[20px] font-medium leading-[1.3] text-ink">
							{title}
						</h1>
						<p className="text-[20px] leading-[1.3] text-white/60">{tagline}</p>
					</header>

					{children}
				</div>
			</div>
		</main>
	);
}
