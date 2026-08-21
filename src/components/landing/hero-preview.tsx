export function HeroPreview() {
	return (
		<div className="overflow-hidden rounded-xl border border-line bg-elevated">
			<div className="flex items-center gap-2 border-b border-line px-4 py-3">
				<span className="size-2.5 rounded-full bg-white/15" />
				<span className="size-2.5 rounded-full bg-white/15" />
				<span className="size-2.5 rounded-full bg-white/15" />
				<span className="ml-2 font-mono text-[12px] text-ink-muted">
					my-app — localhost:3000
				</span>
			</div>

			<div className="relative flex aspect-[16/10] items-center justify-center sm:aspect-[16/9]">
				<div
					aria-hidden
					className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px]"
				/>
				<div className="relative flex flex-col items-center gap-3 px-6 text-center">
					<span className="font-mono text-[12px] tracking-[0.12em] text-sage uppercase">
						Product preview
					</span>
					<p className="text-body-lg text-ink-muted">
						A walkthrough of the kit is on the way.
					</p>
				</div>
			</div>
		</div>
	);
}
