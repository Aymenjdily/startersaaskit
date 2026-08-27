import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/ui/container";

/**
 * The frame both legal pages sit in.
 *
 * ## Why these are pages and not a PDF or a Notion link
 *
 * A privacy policy has to be reachable, readable on a phone, and linkable to a
 * specific clause. It is also the page a Google OAuth review actually opens, and
 * a link that redirects off-site to a document behind someone else's login is a
 * common reason that review comes back.
 *
 * ## The date is not decoration
 *
 * "Last updated" is the only thing a reader can use to tell whether a policy
 * covers what the product does today. It is a required field here rather than
 * an optional prop so a page cannot ship without one.
 */
export function LegalPage({
	children,
	intro,
	title,
	updated,
}: {
	children: React.ReactNode;
	intro: string;
	title: string;
	/** ISO date. Rendered in the reader's locale, sorted as text elsewhere. */
	updated: string;
}) {
	return (
		<>
			<Navbar />
			<main className="min-h-screen bg-base pt-[140px] pb-24 md:pt-[180px]">
				<Container>
					{/* 68 characters, not the page width. Legal text is read in full or
					    not at all, and a 1300px measure is what makes it "not at all". */}
					<div className="max-w-[68ch]">
						{/* `text-h3`, not a bigger step: the scale's upper rungs reach 60px,
						    which is a landing-page size. This is the top of a document, and
						    it only has to outrank the 20px clause headings under it. */}
						<h1 className="heading-tight text-h3 text-ink">{title}</h1>

						<p className="mt-4 font-mono text-[13px] text-ink-muted">
							Last updated{" "}
							<time dateTime={updated}>
								{new Date(updated).toLocaleDateString(undefined, {
									day: "numeric",
									month: "long",
									year: "numeric",
								})}
							</time>
						</p>

						<p className="mt-8 text-body-lg text-ink-soft leading-[1.6]">
							{intro}
						</p>

						<div className="mt-12 flex flex-col gap-10">{children}</div>
					</div>
				</Container>
			</main>
			<Footer />
		</>
	);
}

/** One numbered clause. The heading is what a link to a clause points at. */
export function Clause({
	children,
	id,
	title,
}: {
	children: React.ReactNode;
	/** Stable across edits — an external link to a clause must keep working. */
	id: string;
	title: string;
}) {
	return (
		<section className="scroll-mt-28" id={id}>
			<h2 className="text-[20px] font-medium text-ink tracking-[-0.01em]">
				{title}
			</h2>
			<div className="mt-3 flex flex-col gap-3 text-[15px] text-ink-soft leading-[1.7]">
				{children}
			</div>
		</section>
	);
}

/** A list inside a clause. */
export function Points({ items }: { items: React.ReactNode[] }) {
	return (
		<ul className="flex list-disc flex-col gap-2 pl-5">
			{items.map((item, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: fixed prose, never reordered
				<li key={index}>{item}</li>
			))}
		</ul>
	);
}
