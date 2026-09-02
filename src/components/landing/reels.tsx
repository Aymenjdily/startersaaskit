import { useState } from "react";
import { Container } from "@/components/ui/container";
import { FadeUp } from "@/components/ui/fade-up";
import { Section, SectionHeading } from "@/components/ui/section";

/**
 * The reels: short vertical clips, played on demand.
 *
 * ## Why nothing autoplays
 *
 * The hero already autoplays a loop, and that is the budget for video above
 * the fold. Each clip here is a couple of megabytes, and two of them starting
 * on their own — plus however many get added later — is a page that costs
 * several megabytes to look at before anyone has asked to watch anything.
 *
 * So each card is a poster frame and a play button, with `preload="none"`:
 * until someone clicks, a reel costs one ~40KB JPEG. The click is also what
 * lets them play with sound — a browser only allows that after a gesture,
 * which is the other reason muted autoplay would have been the wrong default
 * for clips that are mostly someone talking.
 *
 * ## Adding one
 *
 * A reel is an entry in `REELS` and two files in `public/reels/`. Source
 * clips are HEVC straight off a phone, which Chrome and Firefox will not
 * play at all, and hundreds of megabytes besides — transcode before
 * committing:
 *
 *     ffmpeg -i source.mp4 -vf "scale=720:-2,fps=30" -c:v libx264 \
 *       -profile:v high -pix_fmt yuv420p -crf 27 -preset slow \
 *       -c:a aac -b:a 96k -movflags +faststart public/reels/<name>.mp4
 *     ffmpeg -ss 1 -i public/reels/<name>.mp4 -frames:v 1 \
 *       -vf scale=540:-2 -q:v 6 public/reels/<name>.jpg
 */

export type Reel = {
	/** Basename of both the `.mp4` and its `.jpg` poster in `public/reels/`. */
	file: string;
	/**
	 * The clip's own opening line, not a description written around it — the
	 * caption under a video should be what the video says.
	 */
	title: string;
	/** Runtime, `m:ss`, matching the encoded file. */
	length: string;
};

export const REELS: Reel[] = [
	{
		file: "0826",
		title: "Is there a starter kit generator for developers?",
		length: "0:34",
	},
	{
		file: "0830",
		title: "Every time I start a new SaaS…",
		length: "0:22",
	},
];

function ReelCard({ reel }: { reel: Reel }) {
	const [playing, setPlaying] = useState(false);

	return (
		/* Sized up because there are only two. A pair of 260px cards left the
		   band mostly empty gutter; at this width the two of them carry it, and
		   a third or fourth still wraps cleanly into a second row. */
		/* `max-w` is the phone cap only, and has to be dropped from `sm` up —
		   left in place it clamps the wider fixed widths after it and the card
		   silently stays 360px on a desktop. */
		<figure className="w-full max-w-[360px] sm:w-[330px] sm:max-w-none md:w-[380px] lg:w-[420px]">
			<div className="relative aspect-[9/16] overflow-hidden rounded-[14px] border border-line bg-elevated">
				{playing ? (
					/* biome-ignore lint/a11y/useMediaCaption: every clip carries its
					   own burned-in subtitles, which is what the poster frames show —
					   a track file here would caption speech that is already on
					   screen. Add one if a reel ever ships without them. */
					<video
						autoPlay
						className="h-full w-full object-cover"
						controls
						playsInline
						poster={`/reels/${reel.file}.jpg`}
						preload="metadata"
						src={`/reels/${reel.file}.mp4`}
					/>
				) : (
					<button
						aria-label={`Play: ${reel.title}`}
						className="group absolute inset-0 cursor-pointer"
						onClick={() => setPlaying(true)}
						type="button"
					>
						<img
							alt=""
							className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
							loading="lazy"
							src={`/reels/${reel.file}.jpg`}
						/>

						{/* A scrim, so the button reads against whatever frame the
						    poster happens to be. */}
						<span
							aria-hidden="true"
							className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/15"
						/>

						<span
							aria-hidden="true"
							className="absolute inset-0 flex items-center justify-center"
						>
							<span className="flex size-16 items-center justify-center rounded-full bg-white/12 backdrop-blur-sm transition-[transform,background-color] duration-200 group-hover:scale-105 group-hover:bg-white/20 motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:size-18">
								<svg
									aria-hidden="true"
									className="ml-[3px] size-6 text-white md:size-7"
									fill="currentColor"
									viewBox="0 0 12 12"
								>
									<path d="M2.5 1.5v9l8-4.5-8-4.5Z" />
								</svg>
							</span>
						</span>

						<span
							aria-hidden="true"
							className="absolute right-2.5 bottom-2.5 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[11px] text-white/90 backdrop-blur-sm"
						>
							{reel.length}
						</span>
					</button>
				)}
			</div>

			<figcaption className="mt-3.5 text-[15px] leading-[1.45] text-ink-soft">
				{reel.title}
			</figcaption>
		</figure>
	);
}

export function Reels() {
	return (
		<Section className="border-white/8 border-y" id="reels" tone="base">
			<Container>
				<FadeUp className="mb-10 md:mb-14">
					<SectionHeading
						align="center"
						description="Short clips on the problem this exists to solve — and what the generator does about it."
						eyebrow="Reels"
						title="Watch it, rather than read about it"
					/>
				</FadeUp>

				<FadeUp step={1}>
					<div className="flex flex-wrap justify-center gap-6 md:gap-8">
						{REELS.map((reel) => (
							<ReelCard key={reel.file} reel={reel} />
						))}
					</div>
				</FadeUp>
			</Container>
		</Section>
	);
}
