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
 * where the image slots sit — because copy at this size is illegible noise.
 * Every picture on the real page is a plain placeholder slot, so every one
 * of them is a plain bordered box here too.
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
					<Showcase />
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

/** An image slot: the bordered grey box the real page fills with a picture. */
function Slot({ className }: { className?: string }) {
	return (
		<div
			className={`rounded-[6px] border border-[#e5e5e5] bg-[#ececec] ${className ?? ""}`}
		/>
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
		<div>
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
			</div>

			{/* One wide image slot, ruled off from the copy above it. */}
			<div className="border-[#e5e5e5] border-t px-[60px] pt-10 pb-4">
				<Slot className="h-[420px] w-full" />
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

			{/* Two slots side by side, the first ringed in the accent, each
			    with its numbered callout and caption. */}
			<div className="mt-12 flex gap-6">
				{[0, 1].map((i) => (
					<div className="relative flex-1" key={i}>
						<div
							className={
								i === 0
									? "h-[300px] rounded-[8px] border-2 border-[#e0562c] bg-[#ececec]"
									: "h-[300px] rounded-[8px] border border-[#e5e5e5] bg-[#ececec]"
							}
						/>
						<span className="-top-2.5 -left-2.5 absolute size-5 rounded-full bg-[#e0562c]" />
						<div className="mt-3">
							<Line height={8} width={i === 0 ? "90px" : "170px"} />
						</div>
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

			<div className="mt-12 rounded-[8px] border border-[#e5e5e5] bg-[#f6f5f4] p-1.5">
				<div className="grid grid-cols-5 gap-1.5">
					{Array.from({ length: 15 }, (_, i) => (
						<div
							className="aspect-square rounded-[3px] border border-[#e5e5e5] bg-[#ececec]"
							// biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative grid, never reordered
							key={i}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function Showcase() {
	return (
		<div className="px-[60px] py-20">
			<div className="flex flex-col gap-3">
				<Line height={26} width="440px" />
				<Line height={26} width="360px" />
			</div>
			<div className="mt-4 flex flex-col gap-2">
				<Line height={8} width="400px" />
			</div>

			{/* Three slots, each with a ruled-off caption line under it. */}
			<div className="mt-12 grid grid-cols-3 gap-6">
				{[0, 1, 2].map((i) => (
					<div className="flex flex-col" key={i}>
						<Slot className="h-[190px] w-full rounded-[10px]" />
						<div className="mt-4 flex items-center gap-3 border-[#e5e5e5] border-t pt-3">
							<div className="h-2 w-4 rounded-[2px] bg-[#e0562c]" />
							<Line height={9} width="70px" />
							<div className="ml-auto">
								<Line height={7} width="60px" />
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

function Directions() {
	return (
		<div className="px-[60px] py-20">
			<div className="flex flex-col gap-3">
				<Line height={26} width="480px" />
				<Line height={26} width="380px" />
			</div>
			<div className="mt-4 flex items-center gap-2">
				<Line height={8} width="300px" />
			</div>
			<Slot className="mt-12 h-[420px] w-full rounded-[10px]" />
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
