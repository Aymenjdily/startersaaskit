import { useEffect, useState } from "react";
import {
	BRAND,
	DOCS_HREF,
	LOGO_SRC,
	SIGN_IN_HREF,
	SIGN_UP_HREF,
} from "@/lib/brand";
import {
	avatarFor,
	CONSOLE_HREF,
	displayNameFor,
	initialsFor,
} from "@/lib/console-nav";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

/**
 * Rooted at `/`, not bare fragments.
 *
 * These sections exist on the home page only, so `#features` from `/privacy`
 * scrolled nowhere and the whole menu was dead on any standalone page. Rooting
 * them costs nothing where they already worked: a link to the current path with
 * a different fragment is still a same-document scroll, not a reload.
 */
const navLinks = [{ label: "Features", href: "/#features" }];

type NavUser = { name: string; avatar: string | null };

/**
 * Who is looking at the marketing site, if anyone. Starts signed-out so the
 * server and the first paint agree, then resolves once the browser has a
 * session to ask about.
 *
 * `getSupabase()` throws synchronously when the env is not configured — true
 * in tests, and in any preview build missing its keys — so that call is
 * guarded rather than left to crash a page that has nothing to do with auth.
 */
function useNavUser(): NavUser | null {
	const [user, setUser] = useState<NavUser | null>(null);

	useEffect(() => {
		let cancelled = false;

		try {
			getSupabase()
				.auth.getUser()
				.then(({ data }) => {
					if (cancelled || !data.user) return;
					setUser({
						name: displayNameFor(data.user),
						avatar: avatarFor(data.user),
					});
				})
				.catch(() => {});
		} catch {
			/* Not configured — render as signed out rather than crash the page. */
		}

		return () => {
			cancelled = true;
		};
	}, []);

	return user;
}

function NavAvatar({ user }: { user: NavUser }) {
	const [broken, setBroken] = useState(false);

	if (!user.avatar || broken) {
		return (
			<span
				aria-hidden="true"
				className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] text-ink"
			>
				{initialsFor(user.name)}
			</span>
		);
	}

	return (
		<img
			alt=""
			className="size-6 shrink-0 rounded-full object-cover"
			height={24}
			onError={() => setBroken(true)}
			referrerPolicy="no-referrer"
			src={user.avatar}
			width={24}
		/>
	);
}

export function Navbar() {
	const [menuOpen, setMenuOpen] = useState(false);
	const user = useNavUser();

	return (
		<>
			<nav className="fixed inset-x-0 top-0 z-[1000] flex h-[56px] items-center bg-base px-gutter transition-colors duration-300 md:h-[68px] md:px-6">
				<div className="mx-auto flex w-full max-w-content items-center justify-between">
					<a href="/" className="flex shrink-0 items-center">
						<img src={LOGO_SRC} alt={BRAND} className="h-10 w-auto md:h-13" />
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

						{/* On-site, so it stays in the tab like every other product link. */}
						<a
							href={DOCS_HREF}
							className="text-[14px] text-white/70 transition-colors duration-300 hover:text-ink"
						>
							Docs
						</a>

						<span className="h-4 w-px bg-white/20" />

						{user ? (
							<a
								href={CONSOLE_HREF}
								className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1.5 pr-4 pl-1.5 text-[14px] font-medium text-ink transition-colors duration-300 hover:bg-white/10"
							>
								<NavAvatar user={user} />
								Workspace
							</a>
						) : (
							/* Both go into the product, so neither opens a new tab. */
							<div className="flex items-center gap-4">
								<a
									href={SIGN_IN_HREF}
									className="text-[14px] text-white/70 transition-colors duration-300 hover:text-ink"
								>
									Sign in
								</a>
								<a
									href={SIGN_UP_HREF}
									className="rounded-[4px] bg-brand px-3 py-2 text-[14px] font-medium text-ink-inverse transition-opacity duration-300 hover:opacity-85"
								>
									Get started
								</a>
							</div>
						)}
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

					<a
						href={DOCS_HREF}
						onClick={() => setMenuOpen(false)}
						className="border-b border-white/6 py-3.5 text-[18px] text-white/70 transition-colors hover:text-ink"
					>
						Docs
					</a>
					{user ? (
						<a
							href={CONSOLE_HREF}
							onClick={() => setMenuOpen(false)}
							className="mt-5 flex items-center justify-center gap-2.5 rounded-full bg-brand px-6 py-3 text-center text-[16px] font-medium text-ink-inverse"
						>
							<NavAvatar user={user} />
							Go to workspace
						</a>
					) : (
						<>
							<a
								href={SIGN_IN_HREF}
								className="border-b border-white/6 py-3.5 text-[18px] text-white/70 transition-colors hover:text-ink"
							>
								Sign in
							</a>
							<a
								href={SIGN_UP_HREF}
								className="mt-5 rounded-full bg-brand px-6 py-3 text-center text-[16px] font-medium text-ink-inverse"
							>
								Get started
							</a>
						</>
					)}
				</div>
			)}
		</>
	);
}
