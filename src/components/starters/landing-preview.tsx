/**
 * A scale model of the landing page the generator can include.
 *
 * ## Why this is drawn rather than screenshotted or embedded
 *
 * The template's components exist in this repository as *strings* — the
 * generator writes them into someone else's project, and nothing here can
 * execute them. A screenshot would be a binary asset that silently goes stale,
 * with no way to tell from the code that it had. This is markup, so it is
 * reviewed like markup and shows up in a diff when the page it describes moves
 * on without it.
 *
 * It is a preview of the *composition*: real palette, real band order, real
 * proportions taken from the built page. It carries no copy, because copy at
 * this size is illegible noise and would only invite someone to read it.
 *
 * ## `zoom`, not `transform: scale`
 *
 * `zoom` affects layout, so the scroll container gets the shrunken height for
 * free. `scale` leaves the box at full size, which would mean hard-coding a
 * pixel height here and updating it by hand every time a band changes — the
 * exact drift this component exists to avoid.
 */
export function LandingPreview({ className }: { className?: string }) {
	return (
		<div aria-hidden="true" className={className} data-testid="landing-preview">
			{/* The page is composed at its real width and then shrunk, so every
			    proportion below is the one the built page actually has. */}
			<div className="w-[1440px] bg-[#efedeb]" style={{ zoom: 0.29 }}>
				<Hero />
				<ClientStrip />
				<Services />
				<Proof />
				<Workflow />
				<Quote />
				<Assurance />
				<Problem />
				<Integrations />
				<Cta />
				<Footer />
			</div>
		</div>
	);
}

/** A line of "text", as a bar. Width is a percentage of its column. */
function Line({
	dark,
	height = 12,
	width,
}: {
	dark?: boolean;
	height?: number;
	width: string;
}) {
	return (
		<div
			className={dark ? "rounded-[3px] bg-white/70" : "rounded-[3px] bg-ink/70"}
			style={{ height, width }}
		/>
	);
}

function Hero() {
	return (
		<div className="relative flex h-[752px] bg-[#1a1716]">
			{/* The nav sits over the hero rather than above it — the same
			    out-of-flow arrangement the real page uses. */}
			<div className="absolute inset-x-0 top-0 flex h-[72px] items-center gap-6 px-[100px]">
				<div className="size-6 rounded-[6px] bg-[#efedeb]" />
				<Line dark width="60px" />
				<Line dark width="44px" />
				<Line dark width="52px" />
				<div className="ml-auto h-9 w-[110px] rounded-[4px] bg-[#474440]" />
			</div>

			<div className="flex w-1/2 flex-col justify-center gap-6 px-[100px]">
				<div className="flex flex-col gap-3">
					<Line dark height={34} width="72%" />
					<Line dark height={34} width="84%" />
					<Line dark height={34} width="66%" />
					<Line dark height={34} width="48%" />
				</div>
				<div className="mt-4 flex flex-col gap-2">
					<Line dark height={9} width="88%" />
					<Line dark height={9} width="80%" />
				</div>
				<div className="mt-4 h-10 w-[150px] rounded-[4px] bg-white" />

				<div className="mt-16 flex items-center gap-4">
					<div className="h-[84px] w-[134px] rounded-[3px] bg-white/15" />
					<div className="flex flex-col gap-2">
						<Line dark height={8} width="150px" />
						<Line dark height={8} width="120px" />
					</div>
				</div>
			</div>

			{/* The image half, with the two floating cards over it. */}
			<div className="relative w-1/2 bg-[#d8d2c8]">
				<div className="absolute top-1/2 left-[20%] flex w-[378px] -translate-y-1/2 flex-col gap-1">
					<div className="flex flex-col gap-3 rounded-[4px] bg-white p-3">
						<div className="flex items-center gap-3">
							<div className="size-8 rounded-full bg-[#c9c2b8]" />
							<div className="flex flex-col gap-1.5">
								<Line height={8} width="120px" />
								<Line height={7} width="80px" />
							</div>
						</div>
						<Line height={8} width="60%" />
					</div>
					<div className="flex items-center gap-3 rounded-[4px] bg-white p-3">
						<div className="size-7 rounded-[6px] bg-[#1a1716]" />
						<Line height={8} width="55%" />
					</div>
				</div>
			</div>
		</div>
	);
}

function ClientStrip() {
	return (
		<div className="flex items-center gap-12 border-[#d9d5d1] border-b px-[100px] py-7">
			<div className="flex w-[240px] shrink-0 flex-col gap-2">
				<Line height={8} width="100%" />
				<Line height={8} width="70%" />
			</div>
			<div className="flex gap-4 overflow-hidden">
				{Array.from({ length: 9 }, (_, i) => (
					<div
						className="h-[51px] w-[124px] shrink-0 rounded-[6px] bg-[rgba(84,82,82,0.06)]"
						// biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative grid, never reordered
						key={i}
					/>
				))}
			</div>
		</div>
	);
}

function Services() {
	return (
		<div className="px-[100px] pt-20">
			<div className="flex flex-col gap-3">
				<Line height={30} width="520px" />
				<Line height={30} width="470px" />
			</div>

			<div className="mt-12 flex gap-8">
				<div className="flex w-[278px] shrink-0 flex-col gap-4">
					{[0, 1, 2].map((i) => (
						<div
							className="flex flex-col gap-2 border-[#d9d5d1] border-b pb-4"
							key={i}
						>
							<Line height={10} width={i === 0 ? "70%" : "45%"} />
							{i === 0 && <Line height={8} width="95%" />}
						</div>
					))}
				</div>

				<div className="flex flex-1 gap-2.5">
					{[0, 1, 2].map((i) => (
						<div className="flex flex-1 flex-col gap-4" key={i}>
							<div
								className={
									i === 1
										? "h-[398px] rounded-[4px] bg-[#1a1716]"
										: "h-[398px] rounded-[4px] bg-[#e8e5e3]"
								}
							/>
							<Line height={9} width="80%" />
							<Line height={8} width="95%" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

function Proof() {
	return (
		<div className="px-[100px] pt-[120px]">
			<div className="flex justify-between gap-[211px]">
				<div className="flex w-[471px] shrink-0 flex-col justify-between gap-20">
					<div className="flex flex-col gap-3">
						<Line height={22} width="90%" />
						<Line height={22} width="60%" />
					</div>
					<div className="flex gap-15">
						{[0, 1].map((i) => (
							<div className="flex flex-col gap-2" key={i}>
								<Line height={16} width="90px" />
								<Line height={8} width="130px" />
							</div>
						))}
					</div>
				</div>
				<div className="flex flex-1 flex-col justify-between gap-20">
					<div className="flex flex-col gap-2.5">
						<Line height={11} width="100%" />
						<Line height={11} width="95%" />
						<Line height={11} width="70%" />
					</div>
					<div className="flex items-center gap-3">
						<div className="size-12 rounded-[4px] bg-[#c9c2b8]" />
						<div className="flex flex-col gap-2">
							<Line height={8} width="110px" />
							<Line height={8} width="150px" />
						</div>
					</div>
				</div>
			</div>
			<div className="mt-10 aspect-[173/100] rounded-[4px] bg-[#2a2523]" />
		</div>
	);
}

/** The tabbed "what it does, per audience" band, between Proof and Quote. */
function Workflow() {
	return (
		<div className="px-[100px] pt-[120px]">
			<div className="flex flex-col gap-3">
				<Line height={28} width="620px" />
				<Line height={28} width="420px" />
			</div>
			<div className="mt-6 flex flex-col gap-2">
				<Line height={9} width="380px" />
				<Line height={9} width="320px" />
			</div>

			<div className="mt-16 flex gap-10">
				{[0, 1].map((i) => (
					<div className="flex items-center gap-3" key={i}>
						<div
							className={
								i === 0
									? "size-11 rounded-[4px] bg-[rgba(84,82,82,0.12)]"
									: "size-11 rounded-[4px] bg-[rgba(84,82,82,0.06)]"
							}
						/>
						<Line height={12} width="90px" />
					</div>
				))}
			</div>

			<div className="mt-6 flex gap-6 rounded-[4px] bg-[#e8e5e3] p-6">
				<div className="flex w-[420px] shrink-0 flex-col gap-8">
					<div className="flex flex-col gap-2">
						<Line height={20} width="95%" />
						<Line height={20} width="70%" />
					</div>
					<div className="flex flex-col">
						{[0, 1].map((i) => (
							<div
								className="flex items-center justify-between gap-4 border-[#d9d5d1] border-t py-4 first:border-t-0"
								key={i}
							>
								<div className="flex flex-col gap-1.5">
									<Line height={9} width="140px" />
									<Line height={7} width="180px" />
								</div>
								<div className="size-9 shrink-0 rounded-full border border-[#d9d5d1]" />
							</div>
						))}
					</div>
				</div>
				<div className="min-w-0 flex-1 rounded-[4px] bg-white p-5">
					<div className="flex items-center justify-between">
						<Line height={9} width="90px" />
						<div className="flex items-center gap-1.5">
							<div className="size-1.5 rounded-full bg-[#3f8f5f]" />
							<Line height={7} width="30px" />
						</div>
					</div>
					<div className="mt-5 flex flex-col gap-2.5">
						{[0, 1, 2, 3].map((i) => (
							<Line height={8} key={i} width={i % 2 === 0 ? "90%" : "65%"} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function Quote() {
	return (
		<div className="flex flex-col items-center gap-4 px-[100px] py-[120px]">
			<Line height={18} width="600px" />
			<Line height={18} width="520px" />
			<div className="mt-10 size-12 rounded-[4px] bg-[#c9c2b8]" />
			<Line height={8} width="110px" />
			<Line height={8} width="180px" />
		</div>
	);
}

function Assurance() {
	return (
		<div className="bg-[#1a1716] p-[100px]">
			<div className="flex flex-col gap-3">
				<Line dark height={22} width="620px" />
				<Line dark height={22} width="540px" />
			</div>
			<div className="mt-6 flex flex-col gap-2">
				<Line dark height={9} width="500px" />
				<Line dark height={9} width="420px" />
			</div>
			<div className="mt-5 h-9 w-[110px] rounded-[4px] bg-white" />

			<div className="mt-[92px] flex gap-1.5">
				{[0, 1, 2, 3].map((i) => (
					<div
						className="flex h-[350px] flex-1 flex-col justify-between rounded-[4px] bg-white/5 p-5"
						key={i}
					>
						<div className="size-15 rounded-[8px] bg-white/15" />
						<div className="flex flex-col gap-2">
							<Line dark height={11} width="70%" />
							<Line dark height={8} width="100%" />
							<Line dark height={8} width="85%" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/** The scroll-driven band, shown at its resting state rather than mid-reveal. */
function Problem() {
	return (
		<div className="flex h-[560px] items-center gap-16 bg-[#1a1716] px-[100px]">
			<div className="flex w-[809px] shrink-0 flex-col gap-4">
				<Line dark height={28} width="95%" />
				<Line dark height={28} width="88%" />
				<div className="h-7 w-[70%] rounded-[3px] bg-white/15" />
				<div className="h-7 w-[80%] rounded-[3px] bg-white/15" />
			</div>
			<div className="flex flex-1 flex-col gap-4">
				{[0, 1, 2].map((i) => (
					<div
						className="flex flex-col gap-2 rounded-[4px] bg-white p-3.5"
						key={i}
					>
						<Line height={8} width="60%" />
						<div className="h-6 rounded-[3px] bg-[#f4f2ef]" />
						<div className="h-6 rounded-[3px] bg-[#f4f2ef]" />
					</div>
				))}
			</div>
		</div>
	);
}

/** The tools mosaic, between Problem and Cta. */
function Integrations() {
	return (
		<div className="relative overflow-hidden pt-[120px]">
			<div className="flex flex-col items-center gap-3">
				<Line height={30} width="440px" />
				<Line height={30} width="380px" />
			</div>
			<div className="relative mt-15 flex flex-col gap-3">
				{[0, 1, 2].map((row) => (
					<div className="-ml-16 flex gap-3" key={row}>
						{Array.from({ length: 18 }, (_, i) => (
							<div
								className="size-20 shrink-0 rounded-[4px] bg-[#e4e1df]"
								// biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative grid, never reordered
								key={i}
							/>
						))}
					</div>
				))}
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="size-24 rounded-[8px] bg-[#1a1716]" />
				</div>
			</div>
		</div>
	);
}

function Cta() {
	return (
		<div className="px-[100px] pt-[120px]">
			<div className="flex justify-between gap-16">
				<div className="flex w-[652px] flex-col gap-3">
					<Line height={30} width="90%" />
					<Line height={30} width="75%" />
				</div>
				<div className="flex w-[363px] flex-col gap-2">
					<Line height={9} width="100%" />
					<Line height={9} width="90%" />
					<div className="mt-3 h-9 w-[130px] rounded-[4px] bg-[#474440]" />
				</div>
			</div>

			{/* The console, at the larger 12px radius the real one uses. */}
			<div className="mt-12 overflow-hidden rounded-[12px] bg-[#1a1716]">
				<div className="flex items-center gap-2 border-white/8 border-b px-4 py-3">
					<div className="size-2.5 rounded-full bg-white/15" />
					<div className="size-2.5 rounded-full bg-white/15" />
					<div className="size-2.5 rounded-full bg-white/15" />
				</div>
				{[0, 1, 2, 3].map((i) => (
					<div
						className="flex items-center gap-6 border-white/8 border-t px-4 py-3.5"
						key={i}
					>
						<Line dark height={8} width="30%" />
						<Line dark height={8} width="26%" />
						<Line dark height={8} width="8%" />
						<div className="h-6 w-[70px] rounded-[3px] bg-white/8" />
					</div>
				))}
			</div>
		</div>
	);
}

function Footer() {
	return (
		<div className="px-[100px] pt-16 pb-10">
			<div className="flex justify-between gap-16">
				<div className="flex w-[603px] flex-col gap-5">
					<div className="flex items-center gap-2.5">
						<div className="size-6 rounded-[6px] bg-[#1a1716]" />
						<Line height={12} width="70px" />
					</div>
					<Line height={8} width="199px" />
					<div className="flex gap-3">
						<div className="size-15 rounded-full border border-[#d9d5d1]" />
						<div className="size-15 rounded-full border border-[#d9d5d1]" />
					</div>
				</div>
				<div className="flex flex-1 gap-[72px]">
					{[0, 1, 2].map((column) => (
						<div className="flex flex-col gap-3" key={column}>
							<Line height={9} width="80px" />
							{Array.from({ length: 4 }, (_, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative grid, never reordered
								<Line height={8} key={i} width="110px" />
							))}
						</div>
					))}
				</div>
			</div>
			<div className="mt-16 flex justify-between">
				<Line height={8} width="220px" />
				<Line height={8} width="150px" />
			</div>
		</div>
	);
}
