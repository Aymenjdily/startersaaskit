/**
 * The scenery behind the console. The reference console sits a glass card on a
 * dusk wallpaper; this draws that scene rather than shipping a photograph, so
 * there is no third-party image to license and nothing extra to download before
 * the card can paint.
 *
 * Every coordinate is a literal — no randomness, no measurement, no state — so
 * the server and the client draw the identical scene and hydration is a no-op.
 *
 * `slice` rather than `meet`: the card must never sit on a letterboxed edge, so
 * the scene is allowed to crop instead of being asked to fit.
 */
/** SVG's `<title>` is its accessible name, so this is real text, not a comment. */
export const SCENE_TITLE = "Dusk over rolling hills";

export function AuthBackdrop() {
	return (
		<div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
			<svg
				className="h-full w-full"
				preserveAspectRatio="xMidYMid slice"
				viewBox="0 0 1440 900"
			>
				<title>{SCENE_TITLE}</title>

				<defs>
					<linearGradient id="auth-sky" x1="0" x2="0.35" y1="0" y2="1">
						<stop offset="0" stopColor="#101a20" />
						<stop offset="0.55" stopColor="#1d2c26" />
						<stop offset="1" stopColor="#33422c" />
					</linearGradient>

					<radialGradient cx="0.72" cy="1" id="auth-glow" r="0.6">
						<stop offset="0" stopColor="#84a060" stopOpacity="0.34" />
						<stop offset="1" stopColor="#84a060" stopOpacity="0" />
					</radialGradient>

					<linearGradient id="auth-ridge" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0" stopColor="#3d5138" />
						<stop offset="1" stopColor="#2a3a2a" />
					</linearGradient>

					<linearGradient id="auth-near" x1="0" x2="0" y1="0" y2="1">
						<stop offset="0" stopColor="#16211a" />
						<stop offset="1" stopColor="#0b0f0d" />
					</linearGradient>
				</defs>

				<rect fill="url(#auth-sky)" height="900" width="1440" />
				<rect fill="url(#auth-glow)" height="900" width="1440" />

				{/* Far ridge — the only layer light enough to read as distance. */}
				<path
					d="M0 470 C 150 400 260 452 380 424 C 520 392 610 300 742 322 C 860 342 940 430 1060 420 C 1180 410 1310 356 1440 386 L1440 900 L0 900 Z"
					fill="url(#auth-ridge)"
				/>

				{/* Mid hill, right-weighted, so the card's left edge stays on sky. */}
				<path
					d="M1440 452 C 1310 436 1190 486 1070 540 C 950 594 860 640 740 656 C 620 672 520 640 380 610 C 250 582 120 596 0 640 L0 900 L1440 900 Z"
					fill="#1c2a20"
				/>

				{/* Near meadow. */}
				<path
					d="M0 700 C 180 660 330 690 480 726 C 650 766 820 800 1010 786 C 1180 774 1320 736 1440 700 L1440 900 L0 900 Z"
					fill="url(#auth-near)"
				/>

				{/* The lit path threading the meadow — the one warm line in the scene. */}
				<path
					d="M1040 900 C 1000 830 900 800 800 782 C 700 764 640 742 610 712"
					fill="none"
					stroke="#84a060"
					strokeLinecap="round"
					strokeOpacity="0.28"
					strokeWidth="14"
				/>
			</svg>

			{/* Sinks the scene under the card without dimming the whole viewport flat. */}
			<div className="absolute inset-0 bg-base/45" />
		</div>
	);
}
