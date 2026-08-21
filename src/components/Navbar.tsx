import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
	{ label: "Features", href: "#features" },
	{ label: "Testing", href: "#testing" },
];

const useCases = [
	{ label: "B2B SaaS", href: "#use-cases" },
	{ label: "Internal tools", href: "#use-cases" },
	{ label: "Side projects", href: "#use-cases" },
	{ label: "Client work", href: "#use-cases" },
	{ label: "AI apps", href: "#use-cases" },
];

const DOCS_HREF = "https://github.com/nextsaaskit/nextsaaskit#readme";
const REPO_HREF = "https://github.com/nextsaaskit/nextsaaskit";

export function Navbar() {
	const [menuOpen, setMenuOpen] = useState(false);
	const [useCasesOpen, setUseCasesOpen] = useState(false);

	return (
		<>
			<nav className="fixed inset-x-0 top-0 z-[1000] flex h-[56px] items-center bg-base px-gutter transition-colors duration-300 md:h-[68px] md:px-6">
				<div className="mx-auto flex w-full max-w-content items-center justify-between">
					<a href="/" className="flex shrink-0 items-center">
						<img
							src="/logo-trimmed.png"
							alt="NextSaaS Kit"
							className="h-10 w-auto md:h-13"
						/>
					</a>

					<div className="hidden items-center gap-7 md:flex">
						{navLinks.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="text-[14px] text-white/70 transition-colors duration-300 hover:text-ink"
							>
								{link.label}
							</a>
						))}

						<div className="group relative">
							<span className="flex cursor-pointer items-center gap-1 text-[14px] text-white/70 transition-colors duration-300 group-hover:text-ink">
								Use cases
								<ChevronDown className="size-2.5 opacity-40 transition-[transform,opacity] duration-200 group-hover:rotate-180 group-hover:opacity-70" />
							</span>
							<div className="pointer-events-none absolute left-1/2 top-full z-[1001] -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-[opacity,transform] duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
								<div className="min-w-[180px] rounded-[10px] border border-white/8 bg-[rgba(20,20,20,0.95)] p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-[20px]">
									{useCases.map((item) => (
										<a
											key={item.label}
											href={item.href}
											className="block whitespace-nowrap rounded-md px-3 py-2 text-[13px] text-white/70 transition-colors duration-150 hover:bg-white/8 hover:text-ink"
										>
											{item.label}
										</a>
									))}
								</div>
							</div>
						</div>

						<a
							href={DOCS_HREF}
							target="_blank"
							rel="noreferrer"
							className="group text-[14px] text-white/70 transition-colors duration-300 hover:text-ink"
						>
							Docs
							<span className="ml-0.5 opacity-0 transition-opacity duration-200 group-hover:opacity-60">
								↗
							</span>
						</a>

						<span className="h-4 w-px bg-white/20" />

						<div className="flex items-center gap-4">
							<a
								href={REPO_HREF}
								target="_blank"
								rel="noreferrer"
								className="text-[14px] text-white/70 transition-colors duration-300 hover:text-ink"
							>
								GitHub
							</a>
							<a
								href={REPO_HREF}
								target="_blank"
								rel="noreferrer"
								className="rounded-[4px] bg-brand px-3 py-2 text-[14px] font-medium text-ink-inverse transition-opacity duration-300 hover:opacity-85"
							>
								Get started
							</a>
						</div>
					</div>

					<button
						type="button"
						aria-label="Toggle menu"
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
						className="ml-2 flex size-9 flex-col items-center justify-center gap-[5px] md:hidden"
					>
						<span
							className={cn(
								"h-[1.5px] w-5 rounded-[1px] bg-white/70 transition-all duration-300",
								menuOpen && "translate-y-[6.5px] rotate-45",
							)}
						/>
						<span
							className={cn(
								"h-[1.5px] w-5 rounded-[1px] bg-white/70 transition-all duration-300",
								menuOpen && "opacity-0",
							)}
						/>
						<span
							className={cn(
								"h-[1.5px] w-5 rounded-[1px] bg-white/70 transition-all duration-300",
								menuOpen && "-translate-y-[6.5px] -rotate-45",
							)}
						/>
					</button>
				</div>
			</nav>

			{menuOpen && (
				<div className="fixed inset-x-0 bottom-0 top-[56px] z-[999] flex flex-col overflow-y-auto bg-base p-6 md:hidden">
					{navLinks.map((link) => (
						<a
							key={link.label}
							href={link.href}
							onClick={() => setMenuOpen(false)}
							className="border-b border-white/6 py-3.5 text-[18px] text-white/70 transition-colors hover:text-ink"
						>
							{link.label}
						</a>
					))}

					<div className="flex flex-col">
						<button
							type="button"
							aria-expanded={useCasesOpen}
							onClick={() => setUseCasesOpen((open) => !open)}
							className="flex w-full items-center gap-1.5 border-b border-white/6 py-3.5 text-left text-[18px] text-white/70 transition-colors hover:text-ink"
						>
							Use cases
							<ChevronDown
								className={cn(
									"size-4 opacity-40 transition-transform duration-250",
									useCasesOpen && "rotate-180",
								)}
							/>
						</button>
						{useCasesOpen && (
							<div className="flex flex-col pb-2 pl-3">
								{useCases.map((item) => (
									<a
										key={item.label}
										href={item.href}
										onClick={() => setMenuOpen(false)}
										className="py-2.5 text-[16px] text-white/70 transition-colors hover:text-ink"
									>
										{item.label}
									</a>
								))}
							</div>
						)}
					</div>

					<a
						href={DOCS_HREF}
						target="_blank"
						rel="noreferrer"
						className="border-b border-white/6 py-3.5 text-[18px] text-white/70 transition-colors hover:text-ink"
					>
						Docs
					</a>
					<a
						href={REPO_HREF}
						target="_blank"
						rel="noreferrer"
						className="border-b border-white/6 py-3.5 text-[18px] text-white/70 transition-colors hover:text-ink"
					>
						GitHub
					</a>
					<a
						href={REPO_HREF}
						target="_blank"
						rel="noreferrer"
						className="mt-5 rounded-full bg-brand px-6 py-3 text-center text-[16px] font-medium text-ink-inverse"
					>
						Get started
					</a>
				</div>
			)}
		</>
	);
}
