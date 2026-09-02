import type { ReactNode } from "react";

/**
 * A scale model of the Gallery landing page — the same technique as
 * {@link import("./landing-preview").LandingPreview}, and the same reason:
 * the template's components exist in this repository as strings, so a
 * screenshot would be a binary asset with no way to tell from the code that
 * it had gone stale. This is markup, drawn at the page's real proportions
 * and palette and then shrunk with `zoom`.
 *
 * It carries no copy, only the composition — band order, the grid rules,
 * where the colour sits — because copy at this size is illegible noise.
 */
export function GalleryLandingPreview({ className }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={className}
			data-testid="gallery-landing-preview"
		>
			<div className="w-[1440px] bg-white" style={{ zoom: 0.29 }}>
				<Frame>
					<Nav />
					<Hero />
					<Mission />
					<Precision />
					<Inspiration />
					<Swatches />
					<Directions />
					<Footer />
				</Frame>
			</div>
		</div>
	);
}

/** The two hairline rules that run the full height of the page. */
function Frame({ children }: { children: ReactNode }) {
	return (
		<div className="mx-auto max-w-[1248px] border-[#e5e5e5] border-x">
			{children}
		</div>
	);
}

/** A line of "text", as a bar. Width is a percentage of its column. */
function Line({ height = 12, width }: { height?: number; width: string }) {
	return (
		<div className="rounded-[3px] bg-black/80" style={{ height, width }} />
	);
}

function Nav() {
	return (
		<div className="flex h-[72px] items-center gap-6 px-[60px]">
			<div className="size-6 rounded-[4px] bg-[#e0562c]" />
			<Line height={10} width="50px" />
			<div className="ml-8 flex gap-6">
				<Line height={8} width="60px" />
				<Line height={8} width="44px" />
				<Line height={8} width="66px" />
			</div>
			<div className="ml-auto h-9 w-[110px] rounded-full bg-black" />
		</div>
	);
}

function Hero() {
	return (
		<div className="flex flex-col items-center px-[60px] pt-16 pb-20 text-center">
			<div className="flex flex-col items-center gap-3">
				<Line height={34} width="420px" />
				<Line height={34} width="460px" />
				<Line height={34} width="380px" />
			</div>
			<div className="mt-6 flex flex-col items-center gap-2">
				<Line height={9} width="380px" />
				<Line height={9} width="320px" />
			</div>
			<div className="mt-8 h-10 w-[150px] rounded-full bg-black" />

			<div className="mt-14 w-full overflow-hidden rounded-[10px]">
				<div
					className="flex flex-col gap-6 p-10"
					style={{
						backgroundImage:
							"linear-gradient(115deg, #ffd23f 0%, #6fcf97 28%, #2f9e8f 52%, #2d6ca6 76%, #1a1a1a 100%)",
					}}
				>
					<div className="mx-auto w-full max-w-[1040px] overflow-hidden rounded-[8px] bg-white">
						<div className="flex items-center gap-1.5 border-black/8 border-b px-4 py-2.5">
							<span className="size-2 rounded-full bg-black/15" />
							<span className="size-2 rounded-full bg-black/15" />
							<span className="size-2 rounded-full bg-black/15" />
						</div>
						<div className="flex gap-6 p-6">
							<div className="h-[180px] flex-1 rounded-[6px] bg-[linear-gradient(135deg,#f4b942,#e0562c)]" />
							<div className="flex w-[160px] flex-col gap-4">
								{[0, 1, 2].map((row) => (
									<div className="flex flex-col gap-2" key={row}>
										<Line height={7} width="50px" />
										<div className="flex gap-1">
											{[0, 1, 2, 3].map((dot) => (
												<span
													className="size-3.5 rounded-full bg-black/10"
													key={dot}
												/>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function Mission() {
	return (
		<div className="px-[60px] py-20">
			<div className="flex flex-col gap-3">
				<Line height={26} width="620px" />
				<Line height={26} width="480px" />
			</div>
		</div>
	);
}

function Precision() {
	return (
		<div className="px-[60px] py-20">
			<div className="flex flex-col gap-3">
				<Line height={26} width="500px" />
				<Line height={26} width="360px" />
			</div>
			<div className="mt-4 flex flex-col gap-2">
				<Line height={8} width="420px" />
				<Line height={8} width="340px" />
			</div>

			<div className="relative mt-12 flex gap-4 rounded-[8px] bg-[#f6f5f4] p-8">
				{[0, 1].map((i) => (
					<div className="relative flex-1" key={i}>
						<div
							className={
								i === 0
									? "h-[150px] rounded-[6px] border-2 border-[#e0562c] bg-white"
									: "h-[150px] rounded-[6px] border border-black/10 bg-white/60"
							}
						/>
						<span className="-top-2.5 -left-2.5 absolute flex size-5 items-center justify-center rounded-full bg-[#e0562c]" />
					</div>
				))}
			</div>
		</div>
	);
}

function Inspiration() {
	return (
		<div className="px-[60px] py-20">
			<div className="flex flex-col gap-3">
				<Line height={26} width="560px" />
				<Line height={26} width="440px" />
			</div>
			<div className="mt-4 flex items-center gap-2">
				<Line height={8} width="260px" />
			</div>

			<div className="mt-12 rounded-[8px] bg-[#f6f5f4] p-1.5">
				<div className="grid grid-cols-5 gap-1.5">
					{Array.from({ length: 15 }, (_, i) => (
						<div
							className={
								i % 7 === 0
									? "aspect-square rounded-[3px] bg-black"
									: i % 5 === 0
										? "aspect-square rounded-[3px] bg-[#e0562c]/60"
										: "aspect-square rounded-[3px] bg-white"
							}
							// biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative grid, never reordered
							key={i}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Swatches() {
	return (
		<div className="grid grid-cols-3 gap-3 px-[60px] py-10">
			<div className="aspect-[16/9] rounded-[8px] bg-[#2f9e8f]" />
			<div className="aspect-[16/9] rounded-[8px] border border-dashed border-black/15" />
			<div className="aspect-[16/9] rounded-[8px] bg-[#e0562c]" />
		</div>
	);
}

function Directions() {
	return (
		<div>
			<div className="px-[60px] py-20">
				<div className="flex flex-col gap-3">
					<Line height={26} width="480px" />
					<Line height={26} width="380px" />
				</div>
				<div className="mt-4 flex items-center gap-2">
					<Line height={8} width="300px" />
				</div>
			</div>

			<div
				className="p-16"
				style={{
					backgroundImage:
						"linear-gradient(115deg, #2d6ca6 0%, #2f9e8f 35%, #f4b942 68%, #e0562c 100%)",
				}}
			>
				<div className="mx-auto max-w-[560px] overflow-hidden rounded-[8px] bg-black">
					<div className="flex items-center gap-1.5 border-white/10 border-b px-4 py-2.5">
						<span className="size-2 rounded-full bg-white/15" />
						<span className="size-2 rounded-full bg-white/15" />
						<span className="size-2 rounded-full bg-white/15" />
					</div>
					<div className="p-4">
						<div className="h-9 rounded-[6px] bg-white/5" />
					</div>
				</div>
			</div>
		</div>
	);
}

function Footer() {
	return (
		<div className="px-[60px] py-16">
			<div className="flex justify-between">
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2">
						<div className="size-5 rounded-[4px] bg-[#e0562c]" />
						<Line height={9} width="50px" />
					</div>
					<Line height={7} width="150px" />
				</div>
				<div className="flex gap-16">
					{[0, 1].map((column) => (
						<div className="flex flex-col gap-2.5" key={column}>
							<Line height={7} width="60px" />
							{[0, 1, 2].map((row) => (
								<Line height={7} key={row} width="80px" />
							))}
						</div>
					))}
				</div>
			</div>
			<div className="mt-12 flex items-center justify-between border-[#e5e5e5] border-t pt-4">
				<Line height={7} width="140px" />
				<div className="size-6 rounded-full bg-black/10" />
			</div>
		</div>
	);
}
