import { BRAND, REPO_URL } from "@/lib/brand";
import type { Fragment } from "./fragments";
import { BASE_STYLES } from "./styles";

/**
 * Pre-built landing pages.
 *
 * A starter that boots to a list of its own dependencies is a developer's
 * idea of a home page. The point of this question is that the first thing a
 * buyer's own visitors see should already be a real page — so the work left is
 * changing the words, not building the thing that holds them.
 *
 * ## How a template is put together
 *
 * Three rules, and they are what make one of these worth shipping:
 *
 * 1. **Copy is data.** Every string lives in `content.ts`. Editing the page
 *    means editing one object, not hunting through JSX — and it means the
 *    sections can be reordered, dropped or reused without touching prose.
 * 2. **Sections are components.** One file per band of the page, so deleting
 *    the testimonial is deleting a file and one line, not surgery.
 * 3. **No framework imports.** These are plain React components using plain
 *    anchors, so the identical files work under Next, TanStack Start and a
 *    Vite SPA. Only the route that renders `<Landing />` differs, and that is
 *    supplied per framework below.
 *
 * ## On the design
 *
 * `editorial` follows a design system measured off a live site rather than
 * guessed at: warm paper rather than white, a deep warm black rather than a
 * cool one, and — the choice that actually distinguishes it — display type at
 * 60px in **weight 400**. Oversized and light, where most SaaS pages go
 * oversized and bold. Sections alternate paper and near-black on a 120px
 * rhythm, and prose columns narrow to ~650px while full-bleed bands run to
 * ~1065px.
 *
 * The words are original. A template ships to every buyer of this generator,
 * so it carries copy written for a placeholder product — which is what a
 * template needs regardless, since the buyer is selling something else.
 */

/** The palette, added to the base stylesheet as Tailwind v4 theme tokens. */
const EDITORIAL_STYLES = `${BASE_STYLES}
/**
 * The landing palette.
 *
 * Named rather than inlined so a rebrand is this block, not a search for hex
 * codes. \`paper\` is deliberately not white and \`deep\` is deliberately not
 * black — both are warm, and that warmth is most of the character.
 */
@theme {
	--color-paper: #efedeb;
	--color-ink: #1e1e1e;
	--color-ink-soft: #55504d;
	--color-deep: #1a1716;
	--color-deep-soft: #a8a19d;
	--color-rule: #d9d5d1;
	--color-accent: #1a1716;
}

body {
	background-color: var(--color-paper);
	color: var(--color-ink);
	font-family: Inter, ui-sans-serif, system-ui, sans-serif;
	-webkit-font-smoothing: antialiased;
}

/**
 * The page gutter, and it is fluid rather than fixed.
 *
 * Content caps at 1312px. Above that width the gutter grows to absorb the
 * rest; below it the gutter floors at 100px and the content shrinks. So:
 *
 *     1265px viewport -> 100px gutter, 1065px content
 *     1878px viewport -> 283px gutter, 1312px content
 *
 * A fixed \`padding: 0 100px\` is only right at one width — on a wide monitor
 * the page runs to the edges and the measure becomes unreadable. A plain
 * \`max-width\` container is only right the other way, leaving no gutter at all
 * on a laptop. This is both rules at once, which is why it is one declaration
 * rather than a stack of breakpoints.
 *
 * \`100%\` rather than \`100vw\`: a percentage resolves against the containing
 * block, so it excludes the scrollbar. \`100vw\` includes it and would shift the
 * whole page sideways by ~15px whenever content is tall enough to scroll.
 */
.gutter {
	padding-inline: 24px;
}

/** Only the leading edge, for the hero's left half of a full-bleed split. */
.gutter-start {
	padding-inline-start: 24px;
}

@media (min-width: 768px) {
	.gutter {
		padding-inline: max(100px, calc((100% - 1312px) / 2));
	}

	.gutter-start {
		padding-inline-start: max(100px, calc((100% - 1312px) / 2));
	}
}

/**
 * The entrance: the page arriving rather than appearing.
 *
 * ## The hidden state lives in the keyframe, never on the element
 *
 * \`from { opacity: 0 }\` inside \`@keyframes\`, not \`opacity: 0\` in \`.rise\`
 * itself. It looks like a pointless distinction and is the whole safety of the
 * effect: turning the animation off under reduced motion then reverts to the
 * element's own styles, which are fully visible.
 *
 * Put the zero on the class instead and \`animation: none\` leaves it there —
 * every reader who asked for less motion gets a blank hero and no way to know
 * there was ever anything in it. That is the standard way this effect ships
 * broken.
 *
 * ## Why \`both\`
 *
 * The fill mode holds the first frame during the delay. Without it a staggered
 * word is drawn in its final position, waits its turn, then snaps back to
 * hidden to start — a flicker that gets worse the longer the stagger.
 *
 * The easing is a strong ease-out: almost all the distance is covered early,
 * so the text reads as settling into place rather than gliding.
 */
@keyframes rise {
	from {
		opacity: 0;
		transform: translateY(0.42em);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes settle {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.rise {
	animation: rise 850ms cubic-bezier(0.22, 1, 0.36, 1) both;
	/* One step per word, set inline by the component. 55ms is slow enough to
	   read as a sequence and quick enough that the last word of a four-line
	   headline is not still arriving a second later. */
	animation-delay: calc(var(--step, 0) * 55ms);
}

.settle {
	animation: settle 700ms ease-out both;
}

.settle-late {
	animation: settle 1000ms ease-out both;
	animation-delay: 120ms;
}

@media (prefers-reduced-motion: reduce) {
	.rise,
	.settle,
	.settle-late {
		animation: none;
	}
}

/**
 * Display type: large and *light*. The whole look rests on this — the same
 * sizes at weight 600 read as a different, much louder page.
 *
 * Declared inside \`@layer components\` so a utility can still override it.
 * Tailwind puts its utilities in \`@layer utilities\`, and an *unlayered* rule
 * beats every layered one no matter how specific — so an unlayered \`.display\`
 * would quietly swallow a \`leading-[60px]\` sitting right beside it in the same
 * class list. That is not a hypothetical: this exact block held a headline at
 * 63px while the class next to it asked for 60, and nothing in the markup
 * explained why.
 */
@layer components {
	.display {
		font-weight: 400;
		letter-spacing: -0.02em;
		line-height: 1.05;
	}
}
`;

/** The ink every placeholder mark is drawn in — one step lighter than body copy. */
const LOGO_INK = "#3d3936";

/**
 * Eight invented customer marks: a geometric glyph and the company name.
 *
 * Invented, and drawn here rather than downloaded. A template has no licence to
 * ship anybody's real logo, and a strip of recognisable brands the buyer has no
 * relationship with is a lie printed at the top of their homepage. These say
 * "a logo goes here" in the shape of a logo, which a row of grey boxes does not.
 *
 * Each is an <img>, not inline SVG, so replacing one is dropping a file into
 * `public/logos/` and changing a path — no component to edit, and the buyer's
 * real marks arrive as the files their designer already sent them.
 */
const LOGO_MARKS: readonly { name: string; glyph: string }[] = [
	{ name: "Northwind", glyph: `<path d="M12 2.5 21.5 20.5h-19L12 2.5Z" />` },
	{
		name: "Halcyon",
		glyph: `<rect height="19" rx="5" width="19" x="2.5" y="2.5" />`,
	},
	{
		name: "Meridian",
		glyph: `<circle cx="12" cy="12" fill="none" r="8" stroke="${LOGO_INK}" stroke-width="3" />`,
	},
	{ name: "Kestrel", glyph: `<path d="M12 2 22 12 12 22 2 12 12 2Z" />` },
	{ name: "Lumen", glyph: `<circle cx="12" cy="12" r="9.5" />` },
	{
		name: "Ardent",
		glyph: `<path d="M12 2.5 20.7 7.5v9L12 21.5 3.3 16.5v-9L12 2.5Z" />`,
	},
	{
		name: "Vantage",
		glyph: `<rect height="6" rx="3" width="19" x="2.5" y="4" /><rect height="6" rx="3" width="12" x="2.5" y="14" />`,
	},
	{
		name: "Fernbank",
		glyph: `<path d="M2.5 21.5A19 19 0 0 1 21.5 2.5v19h-19Z" />`,
	},
	{
		name: "Cobalt",
		glyph: `<path d="M12 2 22 12 12 22 2 12 12 2Zm0 6.5L6.5 12 12 15.5 17.5 12 12 8.5Z" fill-rule="evenodd" />`,
	},
	{
		name: "Sable",
		glyph: `<circle cx="8.5" cy="12" r="6.5" /><circle cx="16.5" cy="12" fill="none" r="6.5" stroke="${LOGO_INK}" stroke-width="2.5" />`,
	},
	{
		name: "Orbit",
		glyph: `<circle cx="12" cy="12" fill="none" r="9" stroke="${LOGO_INK}" stroke-width="2.5" /><circle cx="12" cy="12" r="3.5" />`,
	},
	{
		name: "Verdant",
		glyph: `<path d="M12 2.5c5 4.5 9 9 9 13a9 9 0 0 1-18 0c0-4 4-8.5 9-13Z" />`,
	},
	{
		name: "Quill",
		glyph: `<path d="M4 20 20 4v6.5L10.5 20H4Z" />`,
	},
	{
		name: "Bramble",
		glyph: `<rect fill="none" height="18" rx="9" stroke="${LOGO_INK}" stroke-width="2.5" width="18" x="3" y="3" /><rect height="7" rx="3.5" width="7" x="8.5" y="8.5" />`,
	},
];

/** `Northwind` -> `northwind`, the file name and the half of the path that varies. */
function logoSlug(name: string): string {
	return name.toLowerCase();
}

/**
 * One placeholder mark as a standalone SVG file.
 *
 * The width is reserved from the character count and then *enforced* with
 * `textLength` + `lengthAdjust`, because an SVG loaded through <img> is an
 * isolated document: it cannot see the page's webfont, so it falls back to
 * whatever the system has. Without the reserved length a wider fallback face
 * would run past the viewBox and be clipped mid-word, and the eight marks would
 * each land at a different size on a machine that happens to lack Inter.
 */
function logoSvg(mark: { name: string; glyph: string }): string {
	const textWidth = Math.round(mark.name.length * 8.4);
	const width = 32 + textWidth;

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 24" width="${width}" height="24" role="img" aria-label="${mark.name}">
	<g fill="${LOGO_INK}">${mark.glyph}</g>
	<text x="32" y="17" fill="${LOGO_INK}" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="500" letter-spacing="-0.3" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${mark.name}</text>
</svg>
`;
}

/** `public/logos/northwind.svg` and its seven siblings. */
const LOGO_FILES: Record<string, string> = Object.fromEntries(
	LOGO_MARKS.map((mark) => [
		`public/logos/${logoSlug(mark.name)}.svg`,
		logoSvg(mark),
	]),
);

/**
 * The same eight, spelled into `content.ts` as data.
 *
 * Generated from `LOGO_MARKS` rather than typed out beside it, so a name can
 * never point at a file that was not written.
 */
const LOGO_CONTENT: string = LOGO_MARKS.map(
	(mark) =>
		`\t\t\t{ name: "${mark.name}", src: "/logos/${logoSlug(mark.name)}.svg" },`,
).join("\n");

/**
 * The photographs the page ships with, hosted by Unsplash.
 *
 * Free to use under the Unsplash License, including commercially and without
 * attribution. Each id below was fetched and looked at before it was written
 * here — a plausible-looking id that 404s renders as a broken image in the
 * hero, which is a worse first impression than no photograph at all.
 *
 * ## Two things to change before you launch
 *
 * 1. These are hotlinked. That is fine for a template and wrong for a business:
 *    it puts someone else's CDN in the render path of the first thing every
 *    visitor sees, and the image disappears the day the photographer removes
 *    it. Download the ones you keep into `public/` and serve them yourself.
 *
 * 2. The portrait beside the testimonial is a real person who has never heard
 *    of you. Pairing their face with a quote they did not give implies an
 *    endorsement they did not make — the Unsplash License does not cover that,
 *    whatever it permits about the file. Replace it with a customer who
 *    actually said the words, or drop the portrait.
 *
 * The query string does the cropping, so the browser is never handed a 4000px
 * original to shrink into a 32px circle. `crop=faces` asks Unsplash to centre
 * the crop on the face rather than the middle of the frame, which is the
 * difference between a portrait and a picture of somebody's forehead.
 */
const UNSPLASH = "https://images.unsplash.com/photo-";

/** A square portrait, cropped to the face, at twice its display size. */
function portrait(id: string, size: number): string {
	return `${UNSPLASH}${id}?w=${size * 2}&h=${size * 2}&fit=crop&crop=faces&q=80`;
}

/** A landscape still at twice its display size. */
function still(id: string, width: number, height: number): string {
	return `${UNSPLASH}${id}?w=${width * 2}&h=${height * 2}&fit=crop&q=80`;
}

const CONTENT = `/**
 * Every word on the landing page.
 *
 * Copy is data here, not JSX. Changing the page is changing this file, which
 * means a non-developer can do it, the sections can be reordered without
 * touching prose, and a second language is a second object rather than a
 * second set of components.
 *
 * Written for a design and engineering studio. Replace all of it — these are
 * placeholders for a company that does not exist, sized so the layout holds
 * when yours goes in.
 */

export const content = {
	brand: "{{project}}",

	nav: {
		/**
		 * Each href has to match an id a section actually sets — the shipped
		 * test checks it, because a nav link that scrolls nowhere is the first
		 * thing a visitor clicks.
		 *
		 * A \`menu\` is optional. Add one and the link grows a chevron and a
		 * dropdown; leave it off and the link stays a link. No component changes
		 * either way.
		 */
		links: [
			{
				label: "Services",
				href: "#product",
				menu: {
					featured: {
						title: "How an engagement runs",
						body: "A team of two or three, in your repo and your standup, shipping to production from the second week.",
						href: "#product",
					},
					items: [
						{
							label: "Product design",
							body: "Research through to a design system",
							href: "#product",
						},
						{
							label: "Web engineering",
							body: "React, Next.js and TypeScript",
							href: "#product",
						},
						{
							label: "Platform",
							body: "APIs, infrastructure, migrations",
							href: "#product",
						},
						{
							label: "Rescue work",
							body: "Projects that have stalled",
							href: "#proof",
						},
						{
							label: "Design systems",
							body: "Built to be handed over",
							href: "#product",
						},
						{
							label: "Retainers",
							body: "Ongoing capacity, month to month",
							href: "#contact",
						},
					],
				},
			},
			{ label: "Work", href: "#proof" },
			{ label: "Contact", href: "#contact" },
		],
		/**
		 * The word that sits where your logo goes.
		 *
		 * Left as literal placeholder text rather than the studio name: a brand
		 * name in the corner already looks finished, so nobody replaces it. This
		 * asks to be replaced. See nav.tsx for swapping in an image.
		 */
		logo: "Logo",
		signIn: { label: "Sign in", href: "/sign-in" },
		action: { label: "Book a call", href: "#contact" },
	},

	hero: {
		/**
		 * Composed line breaks, not automatic ones — each entry renders as its
		 * own block, and each word inside it rises on its own beat.
		 *
		 * Keep them inside roughly sixteen characters. The column is capped at
		 * 459px and the type is 60px, so a longer line wraps *itself* and the
		 * composition you wrote turns back into a paragraph.
		 */
		headline: [
			"We build the",
			"software your",
			"roadmap keeps",
			"postponing.",
		],
		body: "{{project}} is a design and engineering studio. We take the work that never reaches the top of the backlog and ship it — in your stack, alongside your team, to production.",
		action: { label: "Start a project", href: "#contact" },

		/**
		 * The two cards floating over the hero image.
		 *
		 * Real elements rather than part of the picture: they stay legible at
		 * any crop, the text can be selected and translated, and changing them
		 * is editing this file like everything else on the page.
		 *
		 * The top card fades between these projects and the bottom one types
		 * through the phrases. Add or remove entries freely — the component
		 * reads the lengths rather than assuming any.
		 */
		cards: {
			badge: "Live",
			conversations: [
				{
					person: "Ana Ruiz",
					company: "Northwind",
					status: "Design review today",
					avatar: "${portrait("1500648767791-00dcc994a43e", 32)}",
				},
				{
					person: "Priya Raman",
					company: "Halcyon",
					status: "Staging deploy passed",
					avatar: "${portrait("1494790108377-be9c29b29330", 32)}",
				},
				{
					person: "Marcus Bello",
					company: "Meridian",
					status: "Sprint 4 · day two",
					avatar: "${portrait("1507003211169-0a1dd7228f2d", 32)}",
				},
			],
			checking: {
				label: "Shipping",
				phrases: [
					"the new checkout…",
					"a design system…",
					"their billing migration…",
					"a public API…",
				],
			},
		},

		/** The secondary path, demoted to the foot of the column. */
		video: {
			thumbnail: "${still("1543269865-cbf427effbad", 134, 100)}",
			caption: "How we rebuilt a checkout in six weeks, without a freeze.",
			label: "Watch the tour",
			href: "#proof",
		},
	},

	logos: {
		caption: "Studios, scale-ups and platform teams we have shipped with.",
		/**
		 * Placeholder marks, invented for the template — swap the files in
		 * \`public/logos/\` for your clients' real ones and change the names here.
		 * Anything 24px tall drops straight in; the chip does the sizing.
		 *
		 * Never show a client's logo without asking, however good the strip looks
		 * with it.
		 *
		 * Keep at least twelve. The row is meant to run past the right edge and
		 * fade out: eight came to roughly 920px against 952px of space, so it
		 * stopped just short and the fade had nothing to crop — which reads as a
		 * row that ran out rather than one that continues.
		 */
		marks: [
${LOGO_CONTENT}
		],
	},

	features: {
		id: "product",
		/**
		 * Two lines, held apart in an array rather than left to wrap.
		 *
		 * Where a display headline breaks is a typographic decision, and at 60px
		 * the difference between a good break and the one the browser picks is
		 * the difference between a designed page and a wide paragraph.
		 */
		title: ["One studio for design,", "engineering and the rest"],

		/**
		 * Three tabs, each with its own set of cards.
		 *
		 * ## The shape of a preview, and why every one is identical
		 *
		 * Each card carries a \`preview\` describing a small mocked screen:
		 *
		 *     tone     "light" or "dark" — which of the two card backgrounds
		 *     heading  the figure and its caption, along the top
		 *     groups   captioned lists of rows, each row a label and a tag
		 *
		 * Every preview has all four keys, and every row has both of its own.
		 * That is deliberate rather than tidy: TypeScript infers the type of
		 * \`cards\` as the union of the objects written in it, so one card with an
		 * extra field and one without makes that field unreachable on the union
		 * and the component stops compiling. Uniform keys keep the inference flat
		 * and the component free of optional-chaining for data that is right here
		 * in this file.
		 *
		 * The screens are built from real elements rather than screenshots, so
		 * they stay sharp on any display, translate with the rest of the page,
		 * and cost nothing to edit — this is the file you edit.
		 */
		tabs: [
			{
				id: "design",
				label: "Product design",
				body: "Research, interface design and a system your engineers can build from without asking twice.",
				cards: [
					{
						title: "Research that fits the sprint",
						body: "Five conversations and a written finding, in the week you asked — not a sixty-page deck a month later.",
						preview: {
							tone: "light",
							heading: { value: "5 calls", label: "week one" },
							groups: [
								{
									caption: "What we heard",
									rows: [
										{ label: "Nobody finishes the second step", tag: "4 of 5" },
										{ label: "Pricing page answers nothing", tag: "3 of 5" },
									],
								},
								{
									caption: "What we changed",
									rows: [
										{ label: "Split the form across two screens", tag: "Shipped" },
										{ label: "Rewrote the plan comparison", tag: "Shipped" },
									],
								},
							],
						},
					},
					{
						title: "A design system, not a sticker sheet",
						body: "Tokens, components and the states nobody draws — empty, loading, error — handed over as code your team already uses.",
						preview: {
							tone: "dark",
							heading: { value: "48 components", label: "in the library" },
							groups: [
								{
									caption: "Built and documented",
									rows: [
										{ label: "Button · 6 variants, 4 states", tag: "Done" },
										{ label: "Data table · sort, empty, error", tag: "Done" },
									],
								},
								{
									caption: "In review",
									rows: [
										{ label: "Date range picker", tag: "Fri" },
										{ label: "Toast and inline alerts", tag: "Fri" },
									],
								},
							],
						},
					},
					{
						title: "Prototypes you can click",
						body: "Built in the real framework rather than a design tool, so the thing you approve is the thing that ships.",
						preview: {
							tone: "light",
							heading: { value: "Preview 14", label: "deployed 3m ago" },
							groups: [
								{
									caption: "On this branch",
									rows: [
										{ label: "New onboarding, steps 1–3", tag: "Live" },
										{ label: "Feature flag: off in prod", tag: "Safe" },
									],
								},
								{
									caption: "Waiting on you",
									rows: [{ label: "Sign-off on the empty state", tag: "1" }],
								},
							],
						},
					},
				],
			},
			{
				id: "engineering",
				label: "Engineering",
				body: "React and TypeScript in your repository, with tests, review and a deploy that runs without us.",
				cards: [
					{
						title: "We work in your repository",
						body: "Same branch protection, same review, same CI. No handover of a codebase nobody on your team has read.",
						preview: {
							tone: "dark",
							heading: { value: "27 PRs", label: "merged this month" },
							groups: [
								{
									caption: "Open now",
									rows: [
										{ label: "feat: checkout address step", tag: "Review" },
										{ label: "fix: retry on 429 from billing", tag: "Review" },
									],
								},
								{
									caption: "Checks",
									rows: [
										{ label: "Types, tests, lint", tag: "Green" },
										{ label: "Preview deployed", tag: "Green" },
									],
								},
							],
						},
					},
					{
						title: "The migration nobody wants",
						body: "Framework upgrades, database moves, the payment provider swap — done incrementally, behind flags, without a code freeze.",
						preview: {
							tone: "light",
							heading: { value: "0 downtime", label: "across 11 releases" },
							groups: [
								{
									caption: "Moved so far",
									rows: [
										{ label: "Auth · 100% of traffic", tag: "Done" },
										{ label: "Billing · 40% of traffic", tag: "Rolling" },
									],
								},
								{
									caption: "Still on the old path",
									rows: [{ label: "Legacy admin, read only", tag: "Q3" }],
								},
							],
						},
					},
					{
						title: "Tests that earn their runtime",
						body: "Enough coverage that a Friday deploy is boring, and not so much that changing a button breaks forty specs.",
						preview: {
							tone: "dark",
							heading: { value: "4m 12s", label: "full suite" },
							groups: [
								{
									caption: "What runs on every push",
									rows: [
										{ label: "Unit and integration", tag: "612" },
										{ label: "End to end, critical paths", tag: "18" },
									],
								},
								{
									caption: "Nightly",
									rows: [{ label: "Visual diff across breakpoints", tag: "3" }],
								},
							],
						},
					},
				],
			},
			{
				id: "platform",
				label: "Platform",
				body: "The parts underneath: pipelines, environments, and the monitoring that tells you before a customer does.",
				cards: [
					{
						title: "A pipeline your team can run",
						body: "Preview environments per branch, one-command rollback, and a deploy that does not need a person who knows the trick.",
						preview: {
							tone: "light",
							heading: { value: "11 min", label: "commit to production" },
							groups: [
								{
									caption: "Every branch gets",
									rows: [
										{ label: "Its own URL and database", tag: "Auto" },
										{ label: "Seeded, realistic data", tag: "Auto" },
									],
								},
								{
									caption: "Rollback",
									rows: [{ label: "One command, no rebuild", tag: "40s" }],
								},
							],
						},
					},
					{
						title: "You find out first",
						body: "Alerts wired to the things customers actually feel — checkout errors, slow queries, failed webhooks — not CPU graphs.",
						preview: {
							tone: "dark",
							heading: { value: "3 alerts", label: "last 30 days" },
							groups: [
								{
									caption: "Caught before support did",
									rows: [
										{ label: "Webhook retries piling up", tag: "12m" },
										{ label: "Search p95 over 2s", tag: "under 1h" },
									],
								},
								{
									caption: "Muted on purpose",
									rows: [{ label: "Nightly batch, known slow", tag: "Noise" }],
								},
							],
						},
					},
					{
						title: "Costs that stay explainable",
						body: "Infrastructure sized to what you run today, with the line items named so nobody is afraid to turn something off.",
						preview: {
							tone: "light",
							heading: { value: "−38%", label: "monthly spend" },
							groups: [
								{
									caption: "Turned off",
									rows: [
										{ label: "Idle staging cluster", tag: "$1,240" },
										{ label: "Duplicated log pipeline", tag: "$880" },
									],
								},
								{
									caption: "Kept, and why",
									rows: [{ label: "Read replica for reporting", tag: "Needed" }],
								},
							],
						},
					},
				],
			},
		],
	},

	/**
	 * The proof band: the claim and its numbers on one side, someone saying it
	 * in their own words on the other, and the work underneath.
	 *
	 * Two figures rather than three. Three fit the width only by shrinking, and
	 * a reader who is scanning stops at two anyway — the third is there for the
	 * writer, not for them.
	 *
	 * The quote and the attribution are placeholders and read like it, which is
	 * deliberate. A template that ships an invented client with a real-sounding
	 * name and job title is handing you a testimonial you never received, and
	 * those are the words most likely to survive to launch unedited.
	 */
	proof: {
		id: "proof",
		title: "What changes when a team ships weekly",
		stats: [
			{ value: "6 weeks", label: "to the first release" },
			{ value: "3x", label: "more releases per month" },
		],
		quote:
			"We stopped arguing about estimates. Something goes live every week, and the conversation moved on to what we should build next — which is the one we should have been having.",
		attribution: {
			avatar: "${portrait("1438761681033-6461ffad8d80", 48)}",
			name: "A. Product Lead",
			role: "Head of Product, placeholder company",
		},
		media: {
			poster: "${still("1541746972996-4e0b0f43e02a", 800, 462)}",
			label: "Watch the tour",
			href: "#product",
		},
	},

	workflow: {
		title: ["Embedded, fixed scope,", "or a rescue mission."],
		lead: "Three ways to work with us, and the honest answer about which one suits a piece of work is usually the cheapest one.",
		tabs: [
			{
				id: "embedded",
				icon: "shield",
				label: "Embedded team",
				statement:
					"Two or three of us in your standup, your repo and your release train.",
				links: [
					{
						title: "In your tools from day one",
						body: "Your board, your repository, your review process.",
						href: "#product",
					},
					{
						title: "Shipping in week two",
						body: "Something small and real, in production, before we plan anything large.",
						href: "#product",
					},
					{
						title: "Month to month",
						body: "No twelve-month minimum. Stop when the work is done.",
						href: "#contact",
					},
				],
				screen: {
					title: "This week",
					badge: "Live",
					steps: [
						{
							title: "Checkout address step",
							meta: "Behind a flag, 10% of traffic",
							tag: "Live",
						},
						{
							title: "Design system · data table",
							meta: "Sort, empty and error states",
							tag: "Review",
						},
						{
							title: "Billing retry logic",
							meta: "Handles 429s from the provider",
							tag: "Merged",
						},
						{
							title: "Preview environments",
							meta: "One per branch, seeded",
							tag: "Done",
						},
					],
				},
			},
			{
				id: "scoped",
				icon: "trend",
				label: "Fixed scope",
				statement:
					"One clearly bounded thing, a price agreed up front, and a date we hold to.",
				links: [
					{
						title: "A week of shaping first",
						body: "Paid, and yours to keep whether or not we build it.",
						href: "#product",
					},
					{
						title: "One price, one date",
						body: "Change requests are priced separately rather than absorbed quietly.",
						href: "#product",
					},
					{
						title: "Handover is part of the scope",
						body: "Documentation and a walkthrough, not a zip file and good luck.",
						href: "#proof",
					},
				],
				screen: {
					title: "Marketing site rebuild",
					badge: "Week 4 of 6",
					steps: [
						{
							title: "Shaping and scope",
							meta: "Written, priced, signed",
							tag: "Done",
						},
						{
							title: "Design system and pages",
							meta: "12 templates, 40 components",
							tag: "Done",
						},
						{
							title: "CMS and content migration",
							meta: "310 entries moved and checked",
							tag: "Now",
						},
						{
							title: "Handover session",
							meta: "Recorded, with written docs",
							tag: "Week 6",
						},
					],
				},
			},
		],
	},

	/**
	 * The second quote on the page, and deliberately a different voice from the
	 * one in the proof band: that one is a product lead talking about their own
	 * team, this one is a founder describing what the studio is.
	 *
	 * Same warning as the other, and it matters more at this size: the portrait
	 * is a real person who has never heard of you. A face this large beside a
	 * quote they did not give reads as an endorsement they did not make.
	 * Replace it with a client who actually said the words, or drop the
	 * portrait and keep the name.
	 */
	quote: {
		text: "They joined the standup in week one, shipped something real in week two, and left us with a codebase our own engineers were happy to keep working in.",
		attribution: {
			avatar: "${portrait("1544005313-94ddf0286df2", 48)}",
			name: "B. Founder",
			role: "Co-founder, placeholder company",
		},
	},

	/**
	 * ## Read this before you publish
	 *
	 * Every line below is a claim about *your* studio, not about this template.
	 * A certification you have not been audited for, an IP term your contract
	 * does not actually grant — these are the assertions a client's legal team
	 * checks, and they are the easiest words on the whole page to leave
	 * unedited.
	 *
	 * Delete any card you cannot stand behind today. Three true ones are worth
	 * more than four, and an empty grid is better than a false one.
	 */
	assurance: {
		title: ["What you own when", "the engagement ends."],
		body: "The code, the design files and the decisions behind them, handed over in a state your own team can pick up without calling us.",
		action: { label: "Read the terms", href: "#contact" },
		cards: [
			{
				icon: "lock",
				title: "You own the work",
				body: "Copyright assigns to you on payment. No licence back to us, and nothing held hostage in our accounts.",
			},
			{
				icon: "region",
				title: "In your accounts",
				body: "Your repository, your cloud, your domain registrar. We work inside them rather than in front of them.",
			},
			{
				icon: "shut",
				title: "No lock-in",
				body: "Ordinary tools and ordinary patterns. Nothing here needs us next quarter to keep running.",
			},
			{
				icon: "shield",
				title: "NDA and DPA on file",
				body: "Signed before the first call if you need it, and we carry professional indemnity cover.",
			},
		],
	},

	/**
	 * The sentence that lights up as the page scrolls.
	 *
	 * Kept as prose, not an array of words — the component does the splitting,
	 * so this stays something a writer can read aloud and rewrite. Roughly
	 * twenty-five to thirty-five words: shorter and the effect is over before
	 * it registers, longer and the reader is scrolling through a paragraph one
	 * word at a time.
	 *
	 * \`at\` is where each card appears, as a fraction of the way through the
	 * section. Keep them inside 0.15–0.8: earlier and the card is already there
	 * before anyone starts reading, later and it arrives as the section leaves.
	 */
	problem: {
		text: "Every roadmap has a section nobody reaches. The rebuild that never starts, the design system half finished, the integration everyone quietly works around. It stays there because the team is already full.",
		cards: [
			{
				at: 0.2,
				title: "Started, not finished",
				meta: "8 months",
				lines: [
					"Design system · 40% built",
					"Two engineers moved to other work",
				],
			},
			{
				at: 0.45,
				title: "Worked around",
				meta: "every sprint",
				lines: [
					"Manual export, twice a week",
					"Nobody has time to automate it",
				],
			},
			{
				at: 0.68,
				title: "Postponed again",
				meta: "3 quarters",
				lines: ["Framework upgrade, still pending", "Blocking four other tickets"],
			},
		],
	},

	/**
	 * The stack the mosaic shows.
	 *
	 * Names only — no borrowed logos. Saying which technologies you work in is
	 * ordinary descriptive use; reproducing a project's mark implies they
	 * endorse you, and several of these are trademarks whose guidelines say so
	 * explicitly. The tiles pair each name with a generic glyph drawn for this
	 * template.
	 *
	 * The two lists in \`integrations.tsx\` are matched by position, so adding a
	 * name here means adding a shape there.
	 */
	integrations: {
		title: ["Runs on the stack", "you already have."],
		body: "We join the codebase you have rather than proposing a rewrite. These are the tools we are fastest in, and the list is not a requirement.",
		tools: [
			"React",
			"Next.js",
			"TypeScript",
			"Node",
			"Postgres",
			"Tailwind",
			"AWS",
			"Figma",
			"Stripe",
			"GitHub",
		],
	},

	cta: {
		id: "contact",
		title: ["Tell us what is stuck.", "We will tell you how long."],
		body: "A thirty-minute call, your actual backlog, no deck. You will leave with a scope and a number even if you never hire us.",
		action: { label: "Book a call", href: "mailto:hello@example.com" },

		/**
		 * The mocked board under the call to action.
		 *
		 * Invented rows, and they should stay invented until you have real work
		 * to show — but keep them *plausible*. Placeholder text like "Lorem
		 * ipsum" or "Row 1" here tells a visitor the studio has never shipped
		 * anything, which is the opposite of what this block is for.
		 */
		console: {
			label: "Current engagements",
			columns: ["Workstream", "Client", "Sprint", "Status"],
			rows: [
				{
					conversation: "Checkout rebuild",
					rule: "Northwind Trading",
					score: "4 / 6",
					status: "Shipping",
					flagged: false,
				},
				{
					conversation: "Design system",
					rule: "Halcyon Financial",
					score: "2 / 8",
					status: "In build",
					flagged: false,
				},
				{
					conversation: "Postgres migration",
					rule: "Meridian Credit",
					score: "6 / 6",
					status: "Blocked",
					flagged: true,
				},
				{
					conversation: "Public API",
					rule: "Fernbank Group",
					score: "1 / 5",
					status: "Shaping",
					flagged: false,
				},
			],
		},
	},

	footer: {
		tagline: "A design and engineering studio for teams with more roadmap than people.",
		columns: [
			{
				title: "Services",
				links: [
					{ label: "Product design", href: "#product" },
					{ label: "Web engineering", href: "#product" },
					{ label: "Platform", href: "#product" },
					{ label: "Design systems", href: "#product" },
					{ label: "Rescue work", href: "#proof" },
				],
			},
			{
				title: "Studio",
				links: [
					{ label: "Work", href: "#proof" },
					{ label: "How we work", href: "#product" },
					{ label: "Careers", href: "#contact" },
					{ label: "Contact", href: "#contact" },
				],
			},
			{
				title: "Legal",
				links: [
					{ label: "Terms of business", href: "/terms" },
					{ label: "Privacy policy", href: "/privacy" },
					{ label: "Sub-processors", href: "/sub-processors" },
				],
			},
		],

		/** Labels only — see the note in \`footer.tsx\` before shipping real ones. */
		badges: ["ISO 27001", "Cyber Ess."],

		/**
		 * The year is not stored here. It is read from the clock at render time,
		 * because a hard-coded one is the classic stale detail: correct the day
		 * the site ships and wrong every January afterwards.
		 */
		legal: {
			entity: "Placeholder Studio Ltd.",
			/**
			 * The attribution line, and it names the generator rather than this
			 * site — \`{{project}}\` is the studio, which would have it credit
			 * itself for its own footer.
			 *
			 * Delete the whole \`builtWith\` object if you would rather not carry
			 * it. The footer checks for it and renders nothing when it is gone.
			 */
			builtWith: { label: "Built with ${BRAND}", href: "${REPO_URL}" },
		},
	},
};
`;

const HERO_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1400" width="800" height="1400" role="presentation">
	<defs>
		<filter id="plaster" x="0" y="0" width="100%" height="100%">
			<feTurbulence
				type="fractalNoise"
				baseFrequency="0.009 0.016"
				numOctaves="5"
				seed="11"
				result="noise"
			/>
			<feDiffuseLighting in="noise" lighting-color="#efe8dc" surfaceScale="5">
				<feDistantLight azimuth="115" elevation="52" />
			</feDiffuseLighting>
		</filter>
		<linearGradient id="depth" x1="0" y1="0" x2="0.5" y2="1">
			<stop offset="0%" stop-color="#1a1716" stop-opacity="0.06" />
			<stop offset="55%" stop-color="#1a1716" stop-opacity="0" />
			<stop offset="100%" stop-color="#1a1716" stop-opacity="0.16" />
		</linearGradient>
	</defs>

	<rect width="800" height="1400" fill="#e7dfd2" />
	<rect width="800" height="1400" filter="url(#plaster)" opacity="0.92" />
	<rect width="800" height="1400" fill="url(#depth)" />
</svg>
`;

/** The video teaser's thumbnail. Same reasoning, smaller frame. */
const TYPEWRITER = `"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Whether this reader has asked for less motion.
 *
 * Read as state rather than in a media query, because the animation it gates
 * is JavaScript rather than CSS — there is no \`@media\` to hang it on. The
 * listener matters as much as the first read: the setting can change while the
 * page is open, and a page that keeps typing at someone who has just asked it
 * to stop is worse than one that never animated.
 *
 * \`false\` on the server and on the first client render, so the two agree and
 * React does not warn about a hydration mismatch. The effect corrects it
 * before anything has moved.
 */
export function usePrefersReducedMotion() {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => setReduced(query.matches);

		sync();
		query.addEventListener("change", sync);
		return () => query.removeEventListener("change", sync);
	}, []);

	return reduced;
}

type Options = {
	/** Milliseconds per character while typing. */
	typeMs?: number;
	/** Per character while deleting — faster than typing reads as natural. */
	deleteMs?: number;
	/** How long a finished phrase sits before it starts clearing. */
	holdMs?: number;
};

/**
 * Types a list of phrases, one after another, forever.
 *
 * One timer, scheduled from the current state, rather than an interval. An
 * interval keeps firing while the tab is in the background and the whole queue
 * arrives at once when it wakes, which makes the text lurch.
 *
 * The delay is chosen *before* scheduling, from the state the effect can
 * already see — whether the phrase is complete, whether it is clearing. An
 * earlier version asked the callback to return the next delay, which meant the
 * pause on a finished phrase was computed after the timer had already been set
 * with the typing delay, and the hold never happened.
 *
 * Returns the first phrase in full and unanimated under reduced motion: the
 * words are the point, the movement is decoration.
 */
export function useTypewriter(
	phrases: readonly string[],
	{ typeMs = 55, deleteMs = 26, holdMs = 1800 }: Options = {},
) {
	const [index, setIndex] = useState(0);
	const [text, setText] = useState("");
	const [clearing, setClearing] = useState(false);
	const reduced = usePrefersReducedMotion();
	const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	useEffect(() => {
		if (reduced || phrases.length === 0) return;

		const phrase = phrases[index % phrases.length] ?? "";
		const complete = !clearing && text.length === phrase.length;
		const empty = clearing && text.length === 0;

		const delay = complete ? holdMs : clearing ? deleteMs : typeMs;

		timer.current = setTimeout(() => {
			if (complete) {
				setClearing(true);
				return;
			}
			if (empty) {
				setClearing(false);
				setIndex((current) => current + 1);
				return;
			}
			setText(
				clearing
					? phrase.slice(0, text.length - 1)
					: phrase.slice(0, text.length + 1),
			);
		}, delay);

		return () => clearTimeout(timer.current);
	}, [text, clearing, index, phrases, reduced, typeMs, deleteMs, holdMs]);

	if (reduced) return phrases[0] ?? "";

	return text;
}
`;

const LOGO = `import { content } from "./content";

/**
 * The placeholder mark, and the lockup that pairs it with the name.
 *
 * ## Why this is a component and not a file in \`public/\`
 *
 * The mark is drawn in \`currentColor\`, so it takes the colour of whatever it
 * sits in: light on the dark hero bar, dark on the white card floating over the
 * image. Shipped as an image it would need two files, one per background, and
 * the day the brand colour changes there are two things to remember.
 *
 * To use your own artwork instead, replace the \`<svg>\` below with your paths —
 * keep the \`fill="currentColor"\` and the 24-unit viewBox and nothing around it
 * moves. If your mark is a fixed-colour raster, swap the whole component for:
 *
 *     <img alt="" className="h-6 w-auto" src="/logo.svg" />
 *
 * and drop the \`text-paper\` inheritance it no longer needs.
 */
export function LogoMark({ className }: { className?: string }) {
	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="currentColor"
			viewBox="0 0 24 24"
		>
			{/* A rounded square with a circular counter punched out of it, low and
			    right of centre. \`evenodd\` is what makes the inner subpath a hole
			    rather than a second filled shape sitting on top. */}
			<path
				clipRule="evenodd"
				d="M5 1.5h14A3.5 3.5 0 0 1 22.5 5v14a3.5 3.5 0 0 1-3.5 3.5H5A3.5 3.5 0 0 1 1.5 19V5A3.5 3.5 0 0 1 5 1.5Zm8.5 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"
				fillRule="evenodd"
			/>
		</svg>
	);
}

/**
 * Mark plus wordmark, which is what the bar and the footer both want.
 *
 * The word is still \`content.nav.logo\` — literally "Logo" — because a
 * placeholder that reads as a design decision is one that survives into
 * production. The mark beside it is the same bet: obviously generic, obviously
 * a slot.
 */
export function Logo() {
	return (
		<span className="flex items-center gap-2.5">
			<LogoMark className="size-6 shrink-0" />
			<span className="text-[17px] tracking-[-0.01em]">{content.nav.logo}</span>
		</span>
	);
}
`;

const NAV = `"use client";

import { useEffect, useState } from "react";
import { content } from "./content";
import { Logo } from "./logo";

/**
 * The bar over the hero.
 *
 * Absolutely positioned rather than sticky, and transparent rather than
 * papered: it sits *on* the dark hero as part of it, which is why the links
 * are light. A sticky bar with its own background would draw a horizontal line
 * across the top of the composition and break the full-bleed image.
 *
 * Because it is out of flow it costs no layout height — so the hero owns the
 * top spacing for both of them. If you change the 72px here, change the hero's
 * top padding to match or the headline slides underneath.
 *
 * Full-bleed on the shared \`.gutter\`, not a centred container: the hero splits
 * edge to edge, so a centred nav would sit inside the split and the logo would
 * stop lining up with the headline beneath it.
 */
export function Nav() {
	const [open, setOpen] = useState(false);
	const [pinned, setPinned] = useState(false);

	/**
	 * The bar changes character the moment the page moves.
	 *
	 * At the very top it is transparent and out of flow, sitting *on* the hero
	 * as part of the composition. Scroll at all and it becomes a real bar: fixed
	 * to the top, on its own pale surface, and 12px shorter — so it reads as
	 * furniture rather than as the hero's top edge that happens to have followed
	 * you down the page.
	 *
	 * Eight pixels rather than \`> 0\`. Touch devices rubber-band past zero and
	 * report fractional offsets, and pinning on the first sub-pixel makes the
	 * bar flicker between the two states while a thumb rests on the screen.
	 *
	 * \`passive: true\` tells the browser this listener will never call
	 * \`preventDefault\`, which lets it keep scrolling on the compositor instead
	 * of waiting to see what the handler does. On a scroll listener that is the
	 * difference between smooth and not.
	 *
	 * Read once on mount as well as on scroll: a reload halfway down the page,
	 * or a back-navigation that restores the old position, both start with a
	 * scrolled window and no scroll event coming.
	 */
	useEffect(() => {
		const sync = () => setPinned(window.scrollY > 8);

		sync();
		window.addEventListener("scroll", sync, { passive: true });
		return () => window.removeEventListener("scroll", sync);
	}, []);

	/**
	 * Escape closes the mobile panel.
	 *
	 * Bound only while it is open, so the page is not listening for keystrokes
	 * it has no use for the other ninety-nine percent of the time.
	 */
	useEffect(() => {
		if (!open) return;

		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") setOpen(false);
		};

		/* The overlay is \`fixed\`, so without this the page keeps scrolling
		   underneath it on touch — the menu stays put while the hero slides
		   about behind it, which feels broken. The previous value is restored
		   rather than assumed to be empty, in case a modal elsewhere set it. */
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [open]);

	/**
	 * Three appearances, and the menu wins.
	 *
	 * \`papered\` is the scrolled bar. It is deliberately \`pinned && !open\`: with
	 * the menu open the bar has to stay dark and stay 72px, because the overlay
	 * below it is anchored at \`top-[72px]\` and coloured \`#141110\`. Let it go
	 * pale and short while the sheet is open and you get a white strip floating
	 * above a dark panel, with a 12px gap where the page shows through.
	 */
	const papered = pinned && !open;

	return (
		/**
		 * Always \`fixed\`, at every scroll position — including the top.
		 *
		 * The obvious build is \`absolute\` over the hero and \`fixed\` once you
		 * scroll, and that is what this was. It is not smooth, and cannot be:
		 * \`position\` is not an animatable property, so at the threshold the bar
		 * teleports. Worse, by the time it flips it has already been carried 8px
		 * up out of view, so it lands 8px lower than it was the frame before —
		 * a visible hop precisely when the eye is on it.
		 *
		 * Fixed the whole way removes the discontinuity rather than trying to
		 * smooth it. At the top a transparent fixed bar and a transparent
		 * absolute one are pixel-identical — it sits at y=0 either way — so
		 * nothing is given up, and what changes on scroll is only background,
		 * height and colour, all of which *do* animate.
		 */
		<header
			className={
				papered
					? "fixed inset-x-0 top-0 z-50 bg-[#f9f8f7]/90 backdrop-blur-[12px] transition-colors duration-300 motion-reduce:transition-none"
					: open
						? "fixed inset-x-0 top-0 z-50 bg-[#141110] transition-colors duration-300 motion-reduce:transition-none"
						: "fixed inset-x-0 top-0 z-50 transition-colors duration-300 motion-reduce:transition-none"
			}
		>
			{/* 72 to 60 on scroll. The bar is out of flow, so the height change
			    moves nothing on the page beneath and there is no shift to
			    absorb. */}
			<nav
				className={
					papered
						? "settle gutter flex h-[60px] items-center transition-[height] duration-300 motion-reduce:transition-none"
						: "settle gutter flex h-[72px] items-center transition-[height] duration-300 motion-reduce:transition-none"
				}
			>
				{/* The anchor is the sizing box, and the colour it carries is what
				    paints the mark — see \`logo.tsx\`, which draws in
				    \`currentColor\` precisely so this one class can flip it. */}
				<a
					className={
						papered
							? "flex items-center text-ink transition-colors duration-300 motion-reduce:transition-none"
							: "flex items-center text-paper transition-colors duration-300 motion-reduce:transition-none"
					}
					href="/"
				>
					<Logo />
				</a>

				<ul className="ml-12 hidden items-center gap-7 lg:flex">
					{content.nav.links.map((link) => (
						/**
						 * The dropdown opens on hover *and* on focus, with no
						 * JavaScript and no state.
						 *
						 * \`group-focus-within\` is what makes it reachable by keyboard:
						 * tabbing to the trigger opens the panel, and tabbing through
						 * its links keeps it open because focus is still inside the
						 * group. A hover-only menu is invisible to anyone not using a
						 * mouse.
						 *
						 * The gap between link and panel is padding *inside* the
						 * trigger rather than margin on the panel, or the menu closes
						 * as the pointer crosses the gap.
						 *
						 * Symmetric \`py-4\`, not \`pb-4\`. Bottom-only padding centres
						 * the anchor's *box* in the bar while leaving its text in the
						 * top half of it — the links sat 8px above the logo, which is
						 * the kind of misalignment you see at once and cannot name.
						 */
						<li className="group relative" key={link.href}>
							<a
								className={
									papered
										? "flex items-center gap-1.5 py-4 text-[14px] text-ink/60 leading-6 tracking-[-0.09px] transition-colors duration-300 hover:text-ink motion-reduce:transition-none"
										: "flex items-center gap-1.5 py-4 text-[14px] text-paper/85 leading-6 tracking-[-0.09px] transition-colors duration-300 hover:text-paper motion-reduce:transition-none"
								}
								href={link.href}
							>
								{link.label}
								{link.menu && (
									<svg
										aria-hidden="true"
										className="size-3 transition-transform duration-200 group-focus-within:rotate-180 group-hover:rotate-180"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.6"
										viewBox="0 0 24 24"
									>
										<path d="m6 9 6 6 6-6" />
									</svg>
								)}
							</a>

							{link.menu && (
								/* \`invisible\` as well as \`opacity-0\`: a pane that is only
								   transparent still swallows the clicks of whatever is under
								   it, and is still read out by a screen reader.

								   Left edge aligned to the trigger, not centred under it.
								   Centring works only while there is half a panel of room on
								   both sides — this one is 619px wide and its trigger sits
								   about 220px from the edge, so the left third hung off the
								   screen at every width the menu is visible at. Anchoring
								   left means the panel grows in the direction there is room.

								   \`max-w\` is the backstop for the other end: a trigger
								   further along the bar, or a narrower window, and the panel
								   clips itself to the viewport instead of pushing a
								   horizontal scrollbar onto the page. */
								<div className="invisible absolute top-full left-0 w-[619px] max-w-[calc(100vw-3rem)] translate-y-1 rounded-[4px] bg-white opacity-0 shadow-[0_16px_48px_rgba(0,0,0,0.13)] transition-[opacity,transform] duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
									<a
										className="flex items-center gap-4 rounded-t-[4px] border-rule border-b bg-[#f4f2ef] p-6 transition-colors hover:bg-[#eeebe6]"
										href={link.menu.featured.href}
									>
										<span
											aria-hidden="true"
											className="size-[70px] shrink-0 rounded-[4px] bg-deep"
										/>
										<span className="flex flex-col gap-1">
											<span className="font-medium text-[14px] text-ink">
												{link.menu.featured.title}
											</span>
											<span className="max-w-[42ch] text-[13px] text-ink-soft leading-[1.5]">
												{link.menu.featured.body}
											</span>
										</span>
									</a>

									<div className="grid grid-cols-2 gap-x-[60px] gap-y-1 p-6">
										{link.menu.items.map((item) => (
											<a
												className="rounded-[4px] px-2 py-2 transition-colors hover:bg-[#f4f2ef]"
												href={item.href}
												key={item.href}
											>
												<span className="block text-[14px] text-ink">
													{item.label}
												</span>
												<span className="block text-[13px] text-ink-soft leading-[1.45]">
													{item.body}
												</span>
											</a>
										))}
									</div>
								</div>
							)}
						</li>
					))}
				</ul>

				<div className="ml-auto flex items-center gap-4">
					{/* Visible at every width, not \`hidden sm:block\`.

					    Hiding it below 640px meant the one link a returning customer
					    comes to the page for disappeared on a phone — recoverable only
					    by opening the menu, which is not where anyone looks for it. It
					    is two words and it fits. */}
					{/**
					 * Light below \`lg\`, dark at \`lg\` and above — because the surface
					 * underneath it changes there.
					 *
					 * The hero splits at that breakpoint and the right half becomes the
					 * cream image, which is exactly where this link lands. White on
					 * that plaster measures about 1.2:1; the link was on the page and
					 * effectively invisible. Below \`lg\` the image drops into flow
					 * beneath the copy, the bar is over the dark panel again, and light
					 * is the readable choice.
					 *
					 * The button beside it needs no such switch: it carries its own
					 * dark background and reads on either surface. That is the general
					 * fix if you restyle this row — give the link a background, or keep
					 * the colour tied to what is behind it.
					 */}
					<a
						className={
							papered
								? "text-[14px] text-ink transition-opacity duration-300 hover:opacity-80 motion-reduce:transition-none"
								: "text-[14px] text-paper transition-opacity duration-300 hover:opacity-80 motion-reduce:transition-none lg:text-ink"
						}
						href={content.nav.signIn.href}
					>
						{content.nav.signIn.label}
					</a>

					{/* 4px, not a pill. The page uses a small radius throughout, and
					    one rounded-full button in the corner is the detail that makes
					    a considered layout look like a template. */}
					<a
						className="rounded-[4px] bg-[#474440] px-3.5 py-1.5 text-[14px] text-[#f7f7f4] leading-6 transition-opacity hover:opacity-90"
						href={content.nav.action.href}
					>
						{content.nav.action.label}
					</a>

					{/**
					 * The mobile trigger.
					 *
					 * A real \`<button>\` with \`aria-expanded\` and \`aria-controls\`, not
					 * a div with a click handler: the button gives keyboard activation
					 * and the right role for free, and the two attributes are what tell
					 * a screen reader that pressing it reveals the panel below.
					 *
					 * The label changes with the state, because "Menu" announced while
					 * the menu is already open tells the reader nothing.
					 *
					 * \`aria-controls\` is set only while the panel exists. The sheet is
					 * rendered on open, so a permanent one spends most of its life
					 * naming an element that is not in the document — a promise to
					 * assistive technology that there is somewhere to move to.
					 * \`aria-expanded\` carries the state on its own either way.
					 */}
					<button
						aria-controls={open ? "mobile-menu" : undefined}
						aria-expanded={open}
						aria-label={open ? "Close menu" : "Open menu"}
						className={
							papered
								? "-mr-2 flex size-9 items-center justify-center rounded-[4px] text-ink transition-colors duration-300 hover:bg-ink/10 motion-reduce:transition-none lg:hidden"
								: "-mr-2 flex size-9 items-center justify-center rounded-[4px] text-paper transition-colors duration-300 hover:bg-paper/10 motion-reduce:transition-none lg:hidden"
						}
						onClick={() => setOpen((current) => !current)}
						type="button"
					>
						<svg
							aria-hidden="true"
							className="size-5"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeWidth="1.6"
							viewBox="0 0 24 24"
						>
							{open ? (
								<path d="M6 6l12 12M18 6L6 18" />
							) : (
								<path d="M4 7h16M4 12h16M4 17h16" />
							)}
						</svg>
					</button>
				</div>
			</nav>

			{/**
			 * The mobile panel, as a full-height overlay.
			 *
			 * Pinned below the 72px bar and stretched to the bottom of the
			 * viewport, so opening the menu replaces the page rather than pushing
			 * a short card over the top of it. A panel that covers half the
			 * screen leaves the hero showing underneath and reads as a dropdown
			 * that has gone wrong.
			 *
			 * A shade darker than the hero (\`#141110\` against \`#1a1716\`) so the
			 * overlay is visibly its own surface rather than the same panel
			 * extended.
			 *
			 * \`z-40\` — under the bar's \`z-50\`, so the close button stays above
			 * the sheet it closes.
			 *
			 * Rendered only while open rather than hidden with a class: a panel
			 * that is merely off-screen is still in the tab order and still read
			 * aloud, which is how a "hidden" menu ends up trapping a keyboard user
			 * in links they cannot see.
			 *
			 * \`overflow-y-auto\` because the list can outgrow a short viewport in
			 * landscape, and \`min-h-full\` on the inner column so the footer
			 * actions sit at the bottom of the screen rather than under the last
			 * link.
			 *
			 * A submenu becomes an indented list rather than a second level to
			 * open. On a phone the extra tap buys nothing, and a nested disclosure
			 * is one more thing to get wrong.
			 */}
			{open && (
				<div
					className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto bg-[#141110] lg:hidden"
					id="mobile-menu"
				>
					<div className="gutter flex min-h-full flex-col py-6">
						<ul className="flex flex-col">
							{content.nav.links.map((link) => (
								<li className="border-paper/10 border-b" key={link.href}>
									<a
										className="block py-4 text-[22px] text-paper tracking-[-0.01em]"
										href={link.href}
										onClick={() => setOpen(false)}
									>
										{link.label}
									</a>

									{link.menu && (
										<ul className="-mt-1 flex flex-col gap-1 pb-4 pl-4">
											{link.menu.items.map((item) => (
												<li key={item.href}>
													<a
														className="block py-1.5 text-[15px] text-paper/60"
														href={item.href}
														onClick={() => setOpen(false)}
													>
														{item.label}
													</a>
												</li>
											))}
										</ul>
									)}
								</li>
							))}
						</ul>

						{/* \`mt-auto\` puts these at the foot of the screen, where a
						    thumb is, rather than immediately under the last link. */}
						<div className="mt-auto flex flex-col gap-3 pt-10">
							<a
								className="rounded-[4px] bg-white px-4 py-3 text-center text-[15px] text-[#454343]"
								href={content.nav.action.href}
								onClick={() => setOpen(false)}
							>
								{content.nav.action.label}
							</a>
							<a
								className="rounded-[4px] border border-paper/20 px-4 py-3 text-center text-[15px] text-paper"
								href={content.nav.signIn.href}
								onClick={() => setOpen(false)}
							>
								{content.nav.signIn.label}
							</a>
						</div>
					</div>
				</div>
			)}
		</header>
	);
}
`;

const HERO = `"use client";

import { type CSSProperties, Fragment, useEffect, useState } from "react";
import { content } from "./content";
import { LogoMark } from "./logo";
import { usePrefersReducedMotion, useTypewriter } from "./use-typewriter";

/**
 * The hero: copy in the page gutter, image bled to the right edge.
 *
 * ## Why this is not a grid
 *
 * It was, and the alignment broke above ~1512px. The gutter is a percentage —
 * \`max(100px, (100% - 1312px) / 2)\` — and a percentage resolves against the
 * *containing block*. Inside a grid that is the cell, not the page, so the
 * headline stayed pinned at 100px while the nav above moved out to 283px. The
 * logo and the headline stopped lining up, which is the one alignment on a
 * page a reader actually notices.
 *
 * So the copy sits in an ordinary \`.gutter\` container whose containing block
 * *is* the full-width section, and the image is taken out of flow against the
 * right half. Both follow the same rule as the nav at every width.
 *
 * ## The type, which is the whole design
 *
 * - Headline 60px at **weight 400**, line-height **56px** — tighter than the
 *   font size. Negative leading is what makes a large, light face read as a
 *   block rather than a loose paragraph.
 * - Tracking -1.8px; at this size the default spacing looks slack.
 * - Capped at 459px so it *wraps* into four short lines. Letting it run wide
 *   undoes the effect entirely.
 * - Body 16px on 24px at 80% opacity. The step down in both size and contrast
 *   is what keeps the headline dominant.
 *
 * One filled call to action, with the secondary path demoted to the video
 * teaser at the foot. Two equally weighted buttons make the reader choose
 * before they have read anything, and neither gets pressed.
 */
export function Hero() {
	/* Numbered once, before the markup, rather than with a counter mutated
	   inside the JSX — a render that increments a variable while mapping is the
	   kind of thing that quietly breaks the day it runs twice. */
	let step = 0;
	const steps = content.hero.headline.map((line) =>
		line.split(" ").map((word) => ({ word, step: step++ })),
	);

	return (
		<section className="relative overflow-hidden bg-deep lg:min-h-[744px]">
			{/* The nav is out of flow and costs no height, so this padding is the
			    only thing stopping the headline sliding under it — and it has to
			    clear 72px at *every* width. It was \`pt-16\` (64px), which left the
			    headline eight pixels under the bar on a phone while looking
			    correct on a laptop, where the \`lg\` value took over.

			    Top-aligned rather than centred: centring drifts as the copy
			    changes. */}
			<div className="gutter relative flex flex-col pt-[112px] pb-16 lg:min-h-[744px] lg:pt-[144px]">
				{/**
				 * Every word gets its own \`<span>\` so it can rise on its own beat.
				 *
				 * \`inline-block\` because \`transform\` does nothing to an inline box —
				 * the words would fade without moving, which is the tell that this
				 * was written and never watched.
				 *
				 * The space has to sit *outside* the span, which is why each word is
				 * wrapped in a \`<Fragment>\` rather than rendered bare. Trailing
				 * whitespace inside an inline-block collapses to nothing — put the
				 * space in there and every word runs into the next one, while
				 * \`textContent\` still reads correctly and hides the bug from any
				 * test that checks the text rather than the layout.
				 *
				 * The step is numbered across the whole headline rather than per
				 * line, so the stagger reads as one sentence arriving instead of
				 * four lines each starting over.
				 */}
				<h1 className="max-w-[459px] font-normal text-[40px] text-[#f7f7f4] leading-[1.05] tracking-[-1.2px] md:text-[52px] lg:text-[60px] lg:leading-[56px] lg:tracking-[-1.8px]">
					{steps.map((line, lineIndex) => (
						<span
							className="block"
							// biome-ignore lint/suspicious/noArrayIndexKey: composed lines, fixed and never reordered
							key={lineIndex}
						>
							{line.map(({ word, step }) => (
								<Fragment key={\`\${word}-\${step}\`}>
									<span
										className="rise inline-block"
										style={{ "--step": step } as CSSProperties}
									>
										{word}
									</span>{" "}
								</Fragment>
							))}
						</span>
					))}
				</h1>

				<p className="mt-8 max-w-[508px] text-[16px] text-[#f7f7f4]/80 leading-6 tracking-[-0.09px]">
					{content.hero.body}
				</p>

				<div className="mt-8">
					<a
						className="inline-block rounded-[4px] bg-white px-3.5 py-1.5 text-[14px] text-[#454343] leading-6 transition-opacity hover:opacity-90"
						href={content.hero.action.href}
					>
						{content.hero.action.label}
					</a>
				</div>

				{/**
				 * The whole block is one link, not a caption with a link under it.
				 *
				 * The thumbnail is the biggest, most obviously clickable thing here,
				 * and in the old markup it was the one part that did nothing. Wrapping
				 * everything makes the target match what it looks like, and it is the
				 * reason the hover state can be shared: \`group\` on the anchor lets
				 * the image, the scrim and the label all respond to one pointer.
				 *
				 * Spans rather than \`<p>\` inside, because a paragraph inside an
				 * anchor is invalid and browsers will silently reparent it.
				 *
				 * \`mt-auto\` pins it to the foot of the column, so the gap above
				 * grows with the viewport instead of the block floating mid-air.
				 */}
				<a
					className="group mt-auto flex items-stretch gap-4 pt-16"
					href={content.hero.video.href}
				>
					{/**
					 * The still runs the full height of the text beside it — from the
					 * top of the caption down to the baseline of the link.
					 *
					 * That is what \`items-stretch\` on the row buys: the picture has a
					 * fixed 134px width and *no* height of its own, so it takes
					 * whatever the column next to it turns out to be. Pin it to 84px
					 * instead and the pairing only lines up for a caption of exactly
					 * three lines; translate the page, or write a fourth line, and the
					 * image is suddenly a stamp floating beside a taller block.
					 *
					 * \`min-h\` is the floor for the opposite case — a one-line caption
					 * would otherwise squash it to a strip.
					 *
					 * The image is \`absolute inset-0\` rather than \`h-full\`. A
					 * percentage height needs a parent with a definite one, and this
					 * parent's height comes from the flex line, so \`h-full\` resolves
					 * against nothing and the image collapses to its intrinsic ratio.
					 *
					 * No scrim and no play badge on top: at this size an overlay
					 * covers the faces, which are the only reason a thumbnail this
					 * small says anything. The play affordance goes on the label,
					 * where it costs no picture.
					 */}
					<span className="relative block min-h-[84px] w-[134px] shrink-0 overflow-hidden rounded-[3px] bg-[#f7f7f4]/10">
						<img
							alt=""
							className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
							src={content.hero.video.thumbnail}
						/>
					</span>

					{/* \`min-w-0\` so the column may shrink below its text on a narrow
					    phone rather than pushing the row wider than the screen. */}
					<span className="flex min-w-0 max-w-[175px] flex-col">
						<span className="block text-[12px] text-[#f7f7f4]/75 leading-[18px] transition-colors group-hover:text-[#f7f7f4]/90 motion-reduce:transition-none">
							{content.hero.video.caption}
						</span>
						{/* \`mt-auto\` drops the link to the foot of the column, so the
						    picture's bottom edge and the link's baseline agree. */}
						<span className="mt-auto inline-flex items-center gap-2 pt-3.5 text-[12px] text-[#f7f7f4] leading-4 underline-offset-4 group-hover:underline">
							{/* A triangle rather than an icon font: one path, no
							    dependency, and it cannot fail to load. */}
							<svg
								aria-hidden="true"
								className="size-2.5 shrink-0"
								fill="currentColor"
								viewBox="0 0 12 12"
							>
								<path d="M2.5 1.5v9l8-4.5-8-4.5Z" />
							</svg>
							{content.hero.video.label}
						</span>
					</span>
				</a>
			</div>

			{/**
			 * The visual half, out of flow so the copy beside it can use the page
			 * gutter rather than a column of its own.
			 *
			 * Second in the DOM, and that is load-bearing on small screens. Above
			 * \`lg\` this is absolutely positioned, so the order is invisible. Below
			 * it, the image drops into normal flow — and when it came *first* it
			 * landed under the overlaid nav, putting a near-white logo on a cream
			 * photograph. Copy first also gives a screen reader the words before
			 * the decoration.
			 *
			 * Served from \`public/\` rather than hotlinked: a template that fetches
			 * its hero from someone else's CDN breaks the day they move it, and
			 * puts a third party in the render path of the first thing every
			 * visitor sees.
			 *
			 * For a video instead, the same box takes:
			 *
			 *     <video
			 *     	autoPlay className="h-full w-full object-cover"
			 *     	loop muted playsInline poster="/hero.svg" src="/hero.mp4"
			 *     />
			 *
			 * \`muted\` is not optional — browsers refuse to autoplay with sound,
			 * and the poster is what shows on the ones that refuse anyway.
			 */}
			<div className="settle-late relative h-[360px] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-1/2">
				<img alt="" className="h-full w-full object-cover" src="/hero.svg" />
				<LiveCards />
			</div>
		</section>
	);
}

/**
 * The product, told in two cards rather than a screenshot.
 *
 * Real elements over the image, not baked into it: they stay legible at any
 * crop, the text is selectable and translatable, and changing the words is
 * editing \`content.ts\` like everything else on the page.
 *
 * ## What moves, and why it is safe to
 *
 * The top card fades between conversations; the bottom one types out what is
 * being checked. Together they say "this is running right now" in a way a
 * static screenshot cannot.
 *
 * Three things keep it from being an irritation:
 *
 * - Reduced motion stops all of it. The first conversation and the first
 *   phrase render in full, and nothing animates.
 * - \`aria-hidden\` on the whole block. A screen reader announcing a caret
 *   character every 55ms is unusable, and the page says nothing here that it
 *   does not also say in the headline beside it.
 * - Fixed heights on the rows that change. Text of different lengths would
 *   otherwise resize the cards on every tick, and the panel would jitter.
 */
function LiveCards() {
	const { conversations, checking, badge } = content.hero.cards;
	const reduced = usePrefersReducedMotion();
	const [index, setIndex] = useState(0);
	const [visible, setVisible] = useState(true);
	const typed = useTypewriter(checking.phrases);

	useEffect(() => {
		if (reduced) return;

		/* Fade out, swap while invisible, fade back in — so the words never
		   change in front of the reader mid-fade. */
		const out = setTimeout(() => setVisible(false), 4200);
		const swap = setTimeout(() => {
			setIndex((current) => (current + 1) % conversations.length);
			setVisible(true);
		}, 4600);

		return () => {
			clearTimeout(out);
			clearTimeout(swap);
		};
	}, [index, reduced, conversations.length]);

	const current = conversations[index % conversations.length];

	if (!current) return null;

	return (
		<div
			aria-hidden="true"
			className="absolute inset-x-6 bottom-6 flex max-w-[378px] flex-col gap-1 lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-[20%] lg:w-[378px] lg:-translate-y-1/2"
		>
			{/* No shadow. The surface underneath already separates them, and a drop
			    shadow on a textured photograph reads as a sticker. */}
			<div className="rounded-[4px] bg-white px-3 pt-2 pb-3">
				<div
					className={
						visible
							? "opacity-100 transition-opacity duration-400"
							: "opacity-0 transition-opacity duration-400"
					}
				>
					<div className="flex items-center gap-3">
						{/* Empty \`alt\`: the name is in the line beside it, and the
						    whole block is \`aria-hidden\` anyway. */}
						<img
							alt=""
							className="size-8 shrink-0 rounded-full object-cover"
							src={current.avatar}
						/>
						<span className="flex flex-col">
							<span className="text-[14px] text-ink leading-5">
								{current.person}
							</span>
							<span className="text-[13px] text-ink-soft leading-5">
								{current.company}
							</span>
						</span>
					</div>

					<div className="mt-3 flex h-5 items-center justify-between gap-4">
						<span className="text-[14px] text-ink">{current.status}</span>
						<span className="text-[13px] text-ink-soft/70">{badge}</span>
					</div>
				</div>
			</div>

			<div className="flex items-center gap-3 rounded-[4px] bg-white p-3">
				{/* The product's own mark, on a white card — \`text-deep\` is what
				    makes the same \`currentColor\` artwork read dark here and light
				    in the bar above. */}
				<LogoMark className="size-7 shrink-0 text-deep" />
				{/* A fixed height, because the typed phrase changes length on every
				    character and an auto-height row would resize the card 55 times a
				    second. */}
				<span className="flex h-5 min-w-0 items-center text-[14px] text-ink">
					{checking.label}{" "}
					<span className="ml-1 truncate text-ink-soft/60">{typed}</span>
					{!reduced && (
						<span
							className="ml-0.5 inline-block h-[14px] w-px shrink-0 animate-pulse bg-ink-soft/60"
							style={{ animationDuration: "1s" }}
						/>
					)}
				</span>
			</div>
		</div>
	);
}
`;

const USE_TABS = `"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";

/**
 * The WAI-ARIA tab contract, in one place.
 *
 * Two sections on this page are tabbed, and both need the same unglamorous
 * things: ids that survive hydration, roving tabindex, arrow keys that wrap,
 * and focus that follows the selection. Written twice, they drift — one grows
 * a Home key, the other keeps a stale \`aria-controls\` — and the second copy
 * is always the one nobody tests.
 *
 * A \`.ts\` file, not \`.tsx\`: it renders nothing. Everything it returns is
 * plumbing the component spends on markup.
 */
export function useTabs(count: number) {
	const [active, setActive] = useState(0);
	const base = useId();
	const triggers = useRef<(HTMLButtonElement | null)[]>([]);

	/**
	 * \`useId\` rather than a counter or a random string: it produces the same
	 * value on the server and on the client, so the \`aria-controls\` in the sent
	 * markup is the one React finds on hydration. Anything else differs between
	 * the two and React throws the server's markup away.
	 */
	const tabId = (index: number) => \`\${base}-tab-\${index}\`;

	/**
	 * One panel id, shared by every tab, because there is one panel.
	 *
	 * Only the selected panel is rendered, so per-tab \`aria-controls\` would
	 * point at ids that are not in the document. A dangling \`aria-controls\` is
	 * not a harmless extra — it promises assistive technology somewhere to go.
	 */
	const panelId = \`\${base}-panel\`;

	/** Selects a tab and takes focus with it, wrapping at both ends. */
	const select = (index: number) => {
		const wrapped = (index + count) % count;

		setActive(wrapped);
		triggers.current[wrapped]?.focus();
	};

	/**
	 * Arrow keys move, Home and End jump.
	 *
	 * Bound on the tablist rather than on each trigger: the event bubbles, so
	 * one handler serves every tab and there is one place to read.
	 *
	 * Both axes are accepted whichever way the list is laid out. The reader has
	 * no way to know the orientation from the keyboard, and an arrow key that
	 * does nothing is a dead end rather than a hint.
	 */
	const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		let next: number;

		switch (event.key) {
			case "ArrowDown":
			case "ArrowRight":
				next = active + 1;
				break;
			case "ArrowUp":
			case "ArrowLeft":
				next = active - 1;
				break;
			case "Home":
				next = 0;
				break;
			case "End":
				next = count - 1;
				break;
			default:
				return;
		}

		/* Only after a key this actually handles, or it would swallow the page's
		   own scrolling. */
		event.preventDefault();
		select(next);
	};

	/**
	 * Collects the trigger elements so \`select\` can move focus.
	 *
	 * The callback body is wrapped in braces deliberately: a concise arrow would
	 * *return* the assignment, and React reads a returned value from a ref
	 * callback as a cleanup function.
	 */
	const register = (index: number) => (node: HTMLButtonElement | null) => {
		triggers.current[index] = node;
	};

	return { active, setActive, tabId, panelId, onKeyDown, register };
}
`;

const WORKFLOW = `"use client";

import { content } from "./content";
import { useTabs } from "./use-tabs";

type WorkflowTab = (typeof content.workflow.tabs)[number];

/**
 * Two glyphs, drawn here rather than pulled from an icon package.
 *
 * A landing page that installs an icon library to render two 20px shapes has
 * traded a kilobyte of markup for a dependency, a version to keep current and
 * a tree-shaking configuration to get wrong. Add a key here for a third tab.
 */
const ICONS: Record<string, string> = {
	shield: "M12 3 20 6.2v5.4c0 4.4-3.2 7.6-8 9.4-4.8-1.8-8-5-8-9.4V6.2L12 3Z",
	trend: "M4 15.5 9.5 10l3.5 3.5L20 6.5M20 6.5h-4.5M20 6.5V11",
};

/**
 * The second tabbed band: what the product does, per part of the business.
 *
 * ## Why it is tabbed and the features section above is too
 *
 * They answer different questions. Up there the tabs sort *capabilities*; here
 * they sort *audiences* — the same product described to the team that cares
 * about compliance and the team that cares about revenue. A visitor belongs to
 * one of those and reads one panel.
 *
 * Both use \`useTabs\`, so the keyboard behaves identically in the two places.
 * A page where one tablist wraps on arrow-down and the other stops dead is
 * worse than one with no keyboard support at all: the first taught you a rule
 * the second breaks.
 *
 * ## The left column is links, not a third level of tabs
 *
 * Each row goes somewhere. Making them tabs-inside-tabs would give the page
 * three levels of selection and the reader no idea which one they last moved.
 */
export function Workflow() {
	const { title, lead, tabs } = content.workflow;
	const { active, setActive, tabId, panelId, onKeyDown, register } = useTabs(
		tabs.length,
	);

	const current = tabs[active];

	if (!current) return null;

	return (
		<section className="gutter pt-[120px]">
			<h2 className="display max-w-[838px] text-[32px] leading-9 tracking-[-1.2px] lg:text-[60px] lg:leading-[56px] lg:tracking-[-1.8px]">
				{title.map((line) => (
					<span className="block" key={line}>
						{line}
					</span>
				))}
			</h2>

			<p className="mt-6 max-w-[428px] text-[14px] text-deep leading-5 tracking-[-0.09px]">
				{lead}
			</p>

			{/* \`overflow-x-auto\` with the gutter cancelled and re-applied as
			    padding: on a narrow phone the two labels are wider than the screen,
			    and a strip that scrolls sideways beats labels that wrap into each
			    other. The negative margin is what lets the row bleed to the screen
			    edge so the scroll looks intentional. */}
			<div
				className="-mx-6 mt-20 flex gap-8 overflow-x-auto px-6 lg:mx-0 lg:gap-[60px] lg:overflow-visible lg:px-0"
				onKeyDown={onKeyDown}
				role="tablist"
			>
				{tabs.map((tab, index) => (
					<button
						aria-controls={panelId}
						aria-selected={index === active}
						className="flex shrink-0 items-center gap-4 text-left"
						id={tabId(index)}
						key={tab.id}
						onClick={() => setActive(index)}
						ref={register(index)}
						role="tab"
						tabIndex={index === active ? 0 : -1}
						type="button"
					>
						<span
							className={
								index === active
									? "flex size-11 shrink-0 items-center justify-center rounded-[4px] bg-[rgba(84,82,82,0.12)] text-ink transition-colors"
									: "flex size-11 shrink-0 items-center justify-center rounded-[4px] bg-[rgba(84,82,82,0.06)] text-ink/35 transition-colors"
							}
						>
							<svg
								aria-hidden="true"
								className="size-5"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="1.5"
								viewBox="0 0 24 24"
							>
								<path d={ICONS[tab.icon]} />
							</svg>
						</span>

						<span
							className={
								index === active
									? "font-medium text-[16px] text-ink tracking-[-0.18px] transition-colors"
									: "font-medium text-[16px] text-ink/35 tracking-[-0.18px] transition-colors"
							}
						>
							{tab.label}
						</span>
					</button>
				))}
			</div>

			<div
				aria-labelledby={tabId(active)}
				className="mt-8 rounded-[4px] bg-[#e8e5e3]"
				id={panelId}
				role="tabpanel"
				tabIndex={0}
			>
				<Panel tab={current} />
			</div>
		</section>
	);
}

/** One tab's contents: the claim and its links, beside the screen. */
function Panel({ tab }: { tab: WorkflowTab }) {
	return (
		<div className="flex flex-col gap-10 lg:flex-row">
			<div className="flex min-w-0 flex-col p-6 lg:w-[563px] lg:shrink-0">
				<p className="max-w-[454px] font-normal text-[26px] leading-8 tracking-[-0.5px] lg:text-[36px] lg:leading-[41px]">
					{tab.statement}
				</p>

				{/* \`mt-auto\` so the list sits at the foot of the column whatever
				    height the screen beside it turns out to be. */}
				<ul className="mt-auto flex flex-col pt-14">
					{tab.links.map((link) => (
						<li
							className="border-rule border-t first:border-t-0"
							key={link.title}
						>
							<a
								className="group flex items-center gap-6 py-5"
								href={link.href}
							>
								<span className="min-w-0 flex-1">
									<span className="block font-medium text-[16px] text-ink tracking-[-0.18px]">
										{link.title}
									</span>
									<span className="mt-1 block text-[14px] text-ink-soft leading-5">
										{link.body}
									</span>
								</span>

								{/* The circle is the affordance; it fills on hover rather
								    than the row changing colour, which would compete with
								    the panel's own surface. */}
								<span className="flex size-[47px] shrink-0 items-center justify-center rounded-full border border-rule text-ink transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
									<svg
										aria-hidden="true"
										className="size-4"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.6"
										viewBox="0 0 24 24"
									>
										<path d="M5 12h14M13 6l6 6-6 6" />
									</svg>
								</span>
							</a>
						</li>
					))}
				</ul>
			</div>

			<div className="min-w-0 flex-1 p-2.5 pt-0 lg:pt-2.5">
				<Screen screen={tab.screen} />
			</div>
		</div>
	);
}

/**
 * The mocked screen on the right: a run log rather than a dashboard.
 *
 * Built from real elements and driven by \`content.ts\`, like every other
 * illustration on this page — sharp at any size, translatable, and edited
 * where the rest of the copy lives.
 *
 * \`aria-hidden\`, because the figures are invented. The claim it decorates is
 * stated truthfully in the column beside it.
 */
function Screen({ screen }: { screen: WorkflowTab["screen"] }) {
	return (
		<div
			aria-hidden="true"
			className="h-full rounded-[4px] bg-white p-6"
		>
			<div className="flex items-baseline justify-between gap-4">
				<span className="font-medium text-[16px] text-ink tracking-[-0.18px]">
					{screen.title}
				</span>
				<span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
					{/* A dot, not the word "live" alone — the pairing is what makes a
					    status read as a status. */}
					<span className="size-1.5 rounded-full bg-[#3f8f5f]" />
					{screen.badge}
				</span>
			</div>

			<ol className="mt-6 flex flex-col">
				{screen.steps.map((step, index) => (
					<li
						className="flex gap-4 border-rule border-t py-4 first:border-t-0 first:pt-0"
						key={step.title}
					>
						{/* Tabular numerals so the indices do not shift the titles
						    sideways as the list passes nine. */}
						<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f1efed] text-[11px] text-ink-soft tabular-nums">
							{index + 1}
						</span>

						<span className="min-w-0 flex-1">
							<span className="block text-[14px] text-ink leading-5">
								{step.title}
							</span>
							<span className="mt-0.5 block truncate text-[13px] text-ink-soft leading-5">
								{step.meta}
							</span>
						</span>

						<span className="shrink-0 self-center rounded-[4px] bg-[#f1efed] px-2 py-1 text-[11px] text-ink-soft">
							{step.tag}
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}
`;

const QUOTE = `import { content } from "./content";

/**
 * A single centred pull quote, and nothing else in the band.
 *
 * ## Why it is allowed to be this empty
 *
 * 120px of air above and below, one paragraph, one face. The whole point is
 * the pause: it separates two dense working sections, and a reader who has
 * been parsing tabbed panels gets one short thing to read at a larger size.
 * Filling the space would spend the effect it exists to create.
 *
 * ## Weight 300, which is why the font is loaded now
 *
 * At 32px the difference between Light and Regular is most of the character
 * here. That only holds if a light face actually arrives — see the \`@import\`
 * at the top of \`styles.css\`, added because the stack named Inter for a long
 * time without anyone fetching it, and every weight quietly resolved to the
 * same generic sans.
 *
 * ## A \`<figure>\`, not a div with a big paragraph in it
 *
 * \`<blockquote>\` and \`<figcaption>\` are siblings inside it, so the attribution
 * is attached to the words rather than merely sitting beneath them. Read
 * aloud, the quote arrives with its author instead of anonymously.
 */
export function Quote() {
	const { text, attribution } = content.quote;

	return (
		<section className="gutter py-[120px]">
			<figure className="flex flex-col items-center text-center">
				{/* The quotation marks are typed here rather than stored in
				    \`content.ts\`, so the copy stays punctuation-free and nobody ends
				    up with two sets of them. */}
				<blockquote className="max-w-[651px] font-light text-[24px] leading-8 tracking-[-0.72px] md:text-[32px] md:leading-[38px] md:tracking-[-0.96px]">
					“{text}”
				</blockquote>

				<figcaption className="mt-15 flex flex-col items-center">
					{/* Empty \`alt\`: the name is the next line of text, and
					    "photograph of" read before it is noise. */}
					<img
						alt=""
						className="size-12 rounded-[4px] object-cover"
						src={attribution.avatar}
					/>
					<span className="mt-3 text-[14px] text-ink leading-5 tracking-[-0.09px]">
						{attribution.name}
					</span>
					<span className="mt-1 text-[14px] text-ink/50 leading-5 tracking-[-0.09px]">
						{attribution.role}
					</span>
				</figcaption>
			</figure>
		</section>
	);
}
`;

const ASSURANCE = `import { content } from "./content";

type Card = (typeof content.assurance.cards)[number];

/**
 * The glyphs, drawn at 60 units and stroked in \`currentColor\`.
 *
 * Four shapes is not worth an icon dependency — a package to keep current, a
 * tree-shaking config to get wrong, and a network of transitive versions, all
 * to render outlines that fit in this object. Add a key here for a fifth card.
 */
const ICONS: Record<string, string> = {
	shield: "M30 7 49 14v13c0 11-7.6 19.4-19 23.5C18.6 46.4 11 38 11 27V14L30 7Zm-8.5 22.5 6 6 11-11",
	region: "M30 8a22 22 0 1 0 0 44 22 22 0 0 0 0-44Zm0 0c-6 5.5-9 12.9-9 22s3 16.5 9 22m0-44c6 5.5 9 12.9 9 22s-3 16.5-9 22M9 30h42",
	shut: "M30 9a21 21 0 1 0 0 42 21 21 0 0 0 0-42Zm-14.8 6.2 29.6 29.6",
	lock: "M18 27v-5a12 12 0 0 1 24 0v5m-27 0h30a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V30a3 3 0 0 1 3-3Zm15 11v4",
};

/**
 * The dark band: the questions a security review asks, answered up front.
 *
 * ## Why it inverts
 *
 * Everything above it is paper. This is the one section a reader arrives at
 * with a different job — checking rather than being persuaded — and the change
 * of surface is what tells them the register has changed. It is also the only
 * place on the page a white button is the obvious call to action.
 *
 * ## The cards bottom-align their text
 *
 * Icon at the top, copy against the floor, air in between: with four cards
 * side by side and descriptions of different lengths, aligning the text to the
 * top leaves four titles at four heights. Pinning to the bottom means the
 * ragged edge is the *air*, which nobody reads.
 */
export function Assurance() {
	const { title, body, action, cards } = content.assurance;

	return (
		<section className="gutter bg-deep py-[100px] text-paper">
			<h2 className="display max-w-[852px] text-[32px] text-white leading-9 tracking-[-0.8px] lg:text-[40px] lg:leading-[44px]">
				{title.map((line) => (
					<span className="block" key={line}>
						{line}
					</span>
				))}
			</h2>

			<p className="mt-6 max-w-[575px] text-[16px] text-white/55 leading-6 tracking-[-0.09px]">
				{body}
			</p>

			<a
				className="mt-5 inline-flex rounded-[4px] bg-white px-3.5 py-[7px] text-[14px] text-deep leading-5 transition-opacity hover:opacity-90"
				href={action.href}
			>
				{action.label}
			</a>

			{/* 6px, not a comfortable gutter. The cards are meant to read as one
			    block cut into four, which is what a hairline gap does and a 24px
			    one does not. */}
			<div className="mt-[92px] grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
				{cards.map((card) => (
					<Panel card={card} key={card.title} />
				))}
			</div>
		</section>
	);
}

function Panel({ card }: { card: Card }) {
	return (
		/* Height only from \`lg\`. Four 350px cards stacked on a phone is 1,400px
		   of scrolling for four sentences, so below that they take the height
		   their copy needs. */
		<div className="flex flex-col justify-between gap-16 rounded-[4px] bg-white/5 p-5 lg:h-[350px] lg:gap-0">
			<svg
				aria-hidden="true"
				className="size-15 shrink-0 text-white/70"
				fill="none"
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="1.5"
				viewBox="0 0 60 60"
			>
				<path d={ICONS[card.icon]} />
			</svg>

			<div>
				<p className="text-[20px] text-white leading-7">{card.title}</p>
				<p className="mt-3 text-[14px] text-white/50 leading-5">{card.body}</p>
			</div>
		</div>
	);
}
`;

const USE_SCROLL = `"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * How far a tall element has been scrolled through, from 0 to 1.
 *
 * 0 when its top edge reaches the top of the viewport, 1 when its bottom edge
 * does. Pair it with a \`sticky\` child and the number becomes a timeline: the
 * child holds still on screen while this counts the distance the page travels
 * past it.
 *
 * ## Why it measures instead of remembering
 *
 * Everything comes from \`getBoundingClientRect\` on each frame rather than from
 * a stored offset. Offsets go stale the moment anything above the element
 * changes height — an image finally loads, a font swaps in, a menu opens — and
 * a stale origin makes the animation start early or never finish. Reading the
 * live rect costs a layout query and is always right.
 *
 * ## One measurement per frame
 *
 * Scroll fires far more often than the screen repaints, so the listener does
 * nothing but book a frame; the work happens in the callback, and further
 * events while one is pending are dropped. Measuring per *event* would query
 * layout dozens of times for a single painted frame, which is the classic way
 * a scroll effect turns a smooth page into a stuttering one.
 *
 * \`passive: true\` promises the listener will never call \`preventDefault\`, so
 * the browser can keep scrolling on the compositor instead of waiting to find
 * out.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const element = ref.current;

		if (!element) return;

		let frame = 0;

		const measure = () => {
			frame = 0;

			const rect = element.getBoundingClientRect();
			/* The scrollable distance is everything past one screenful. If the
			   element is shorter than the viewport there is nothing to travel, so
			   treat it as finished rather than dividing by zero. */
			const distance = rect.height - window.innerHeight;

			if (distance <= 0) {
				setProgress(1);
				return;
			}

			setProgress(Math.min(1, Math.max(0, -rect.top / distance)));
		};

		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(measure);
		};

		measure();
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			if (frame) cancelAnimationFrame(frame);
		};
	}, [ref]);

	return progress;
}
`;

const PROBLEM = `"use client";

import { useRef } from "react";
import { content } from "./content";
import { useScrollProgress } from "./use-scroll-progress";
import { usePrefersReducedMotion } from "./use-typewriter";

/**
 * Where each card sits in the right-hand column.
 *
 * Offsets rather than absolute coordinates: the cards should look dropped
 * rather than ruled, and a column with three different indents does that
 * without any of them being positioned against the viewport. Absolute
 * placement looks identical at the width you designed it and nowhere else.
 */
const OFFSETS = ["lg:mr-16", "lg:ml-12", "lg:mr-6"];

/**
 * The problem, read one word at a time as the page scrolls.
 *
 * ## The mechanic
 *
 * A tall section holds a \`sticky\` child. The child stays on screen while the
 * page travels past it, and that travel is the timeline: words go from dim to
 * lit in order, and three cards arrive at fixed points along the way.
 *
 * The reveal finishes at 75% rather than 100%, so the last words land while
 * there is still room to read them. Run it to the very end and the closing
 * clause lights up as the section is already leaving.
 *
 * ## What happens when the reader has asked for less motion
 *
 * Everything renders in its final state — every word lit, every card in
 * place — *and the tall spacer collapses*. Leaving the height in place would
 * hand them two and a half screens of empty scrolling past a sentence that no
 * longer changes, which is worse than the animation was.
 *
 * ## What it does not do
 *
 * It never hijacks the scroll. The page moves at the speed the reader moves
 * it; only the appearance of the text is bound to position. Scroll-jacking is
 * the thing that makes sections like this hated.
 */
export function Problem() {
	const { text, cards } = content.problem;
	const section = useRef<HTMLElement>(null);
	const reduced = usePrefersReducedMotion();
	const progress = useScrollProgress(section);

	/* Split here rather than storing an array, so the copy in \`content.ts\`
	   stays a sentence somebody can read and rewrite. */
	const words = text.split(" ");
	const lit = reduced
		? words.length
		: Math.round(Math.min(1, progress / 0.75) * words.length);

	return (
		<section
			className={reduced ? "bg-deep" : "h-[242vh] bg-deep"}
			ref={section}
		>
			<div
				className={
					reduced
						? "gutter flex flex-col gap-16 py-[120px] lg:flex-row lg:items-center"
						: "gutter sticky top-0 flex h-screen flex-col justify-center gap-16 py-20 lg:flex-row lg:items-center"
				}
			>
				<p className="max-w-[809px] font-normal text-[28px] leading-[1.15] tracking-[-0.6px] md:text-[40px] lg:text-[60px] lg:leading-[60px] lg:tracking-[-1.8px]">
					{words.map((word, index) => (
						/**
						 * Opacity, not colour.
						 *
						 * Animating \`color\` between two whites means interpolating in a
						 * colour space, and on this warm dark ground the midpoint goes
						 * faintly grey-green. Fading the same white is a single channel
						 * and stays neutral the whole way.
						 *
						 * The index is a legitimate key here: the list is a fixed
						 * sentence that is never reordered, and words repeat.
						 */
						<span
							className={
								index < lit
									? "text-white transition-opacity duration-500 motion-reduce:transition-none"
									: "text-white/20 transition-opacity duration-500 motion-reduce:transition-none"
							}
							// biome-ignore lint/suspicious/noArrayIndexKey: a fixed sentence, and words repeat
							key={\`\${word}-\${index}\`}
						>
							{word}{" "}
						</span>
					))}
				</p>

				{/* Hidden below \`lg\`: on a phone the sentence already fills the
				    screen, and three cards under it would push the reveal off the
				    bottom of the sticky frame where nobody would see it finish. */}
				<div className="hidden min-w-0 flex-1 flex-col gap-4 lg:flex">
					{cards.map((card, index) => (
						<Card
							card={card}
							key={card.title}
							offset={OFFSETS[index % OFFSETS.length] ?? ""}
							shown={reduced || progress >= card.at}
						/>
					))}
				</div>
			</div>
		</section>
	);
}

type Note = (typeof content.problem.cards)[number];

function Card({
	card,
	offset,
	shown,
}: {
	card: Note;
	offset: string;
	shown: boolean;
}) {
	return (
		<div
			className={
				shown
					? \`\${offset} translate-y-0 rounded-[4px] bg-white p-3.5 opacity-100 transition-all duration-700 motion-reduce:transition-none\`
					: \`\${offset} translate-y-6 rounded-[4px] bg-white p-3.5 opacity-0 transition-all duration-700 motion-reduce:transition-none\`
			}
		>
			<div className="flex items-center gap-2">
				<span className="size-2 shrink-0 rounded-full bg-[#c2554a]" />
				<span className="text-[13px] text-ink">{card.title}</span>
				<span className="ml-auto text-[12px] text-ink-soft">{card.meta}</span>
			</div>

			<ul className="mt-3 flex flex-col gap-1.5">
				{card.lines.map((line) => (
					<li
						className="truncate rounded-[3px] bg-[#f4f2ef] px-2.5 py-1.5 text-[12px] text-ink-soft"
						key={line}
					>
						{line}
					</li>
				))}
			</ul>
		</div>
	);
}
`;

const INTEGRATIONS = `import { content } from "./content";
import { LogoMark } from "./logo";

/**
 * One outline per tool, drawn at 24 units and stroked in \`currentColor\`.
 *
 * Order matters: a tool takes the glyph at its own index in
 * \`content.integrations.tools\`, so adding a name here means adding a shape
 * there. Ten shapes for ten names, and the grid repeats them.
 */
const GLYPHS: string[] = [
	"M4 4h6.5v6.5H4V4Zm9.5 9.5H20V20h-6.5v-6.5Zm0-9.5H20v6.5h-6.5V4ZM4 13.5h6.5V20H4v-6.5Z",
	"M12 3.5v11m0-11 4 4m-4-4-4 4M4 16.5v2.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5",
	"M9.5 4H8.5a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h1m5-14h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a2 2 0 0 1-2 2h-1",
	"M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z",
	"M12 4c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm-8 3v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7m-16 5c0 1.7 3.6 3 8 3s8-1.3 8-3",
	"M3 8.5c3-3 6 3 9 0s6-3 9 0M3 16c3-3 6 3 9 0s6-3 9 0",
	"M7 18.5a4.2 4.2 0 0 1 .6-8.4 5.6 5.6 0 0 1 10.7 1.7A3.6 3.6 0 0 1 17.4 18.5H7Z",
	"m12 3 8.5 4.75L12 12.5 3.5 7.75 12 3Zm8.5 8.75L12 16.5l-8.5-4.75m17 4.5L12 21l-8.5-4.75",
	"M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Zm0 3.5h18",
	"M6.5 7.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v9m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm11-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 0v2.5a4 4 0 0 1-4 4h-5",
];
/** Three rows, each starting further along the list so no two line up. */
const ROWS = [0, 1, 2];

/**
 * How many tiles a row carries.
 *
 * Enough to overrun any monitor, because the row must be *wider* than the
 * screen for the edge gradients to have something to fade out. Thirty tiles at
 * a 92px pitch is 2,748px — past the point where a browser window is usually
 * dragged. Too few and the mosaic ends in mid-air with paper either side of it,
 * which reads as a bug rather than as a crop.
 */
const PER_ROW = 30;

/**
 * The integrations mosaic: a wall of tools with the product sitting in it.
 *
 * ## Full bleed, and the crop is the point
 *
 * The rows are deliberately wider than the viewport and run off both edges.
 * Nothing is meant to be counted — the impression is "and many more", which a
 * neatly centred row of nine logos does not give.
 *
 * Two gradients in the page colour sit over the ends and fade the tiles out.
 * A \`mask-image\` would do the same and is the more modern tool, but this band
 * sits directly on the page background, so painting the background colour over
 * the ends gets the identical result with no compositing layer.
 *
 * ## It does not move
 *
 * A drifting version of this is easy and was the obvious guess. The reference
 * holds still, and it is right to: three rows sliding at different speeds
 * behind a headline is motion competing with reading, and it would need a
 * reduced-motion path for something that communicates nothing.
 */
export function Integrations() {
	const { title, body, tools } = content.integrations;

	return (
		<section className="overflow-hidden pt-[120px]">
			<div className="gutter text-center">
				<h2 className="display text-[32px] leading-9 tracking-[-1.2px] lg:text-[60px] lg:leading-[60px] lg:tracking-[-1.8px]">
					{title.map((line) => (
						<span className="block" key={line}>
							{line}
						</span>
					))}
				</h2>

				<p className="mx-auto mt-6 max-w-[428px] text-[14px] text-ink leading-5">
					{body}
				</p>
			</div>

			<div className="relative mt-15 flex flex-col gap-3">
				{ROWS.map((row) => (
					/* \`-ml-16\` on every row and a different starting tool for each:
					   the offset pushes the first tile off the left edge so no row
					   begins on a seam, and the rotation stops the three from reading
					   as one repeated pattern. */
					<div className="-ml-16 flex w-max gap-3" key={row}>
						{Array.from({ length: PER_ROW }, (_, index) => {
							const tool = tools[(index + row * 3) % tools.length];

							return (
								/**
								 * The name, not the logo.
								 *
								 * Saying which technologies you work in is ordinary
								 * descriptive use. Reproducing a project's mark is not:
								 * several of these are trademarks whose guidelines say
								 * plainly that their logo must not be used in a way that
								 * suggests they endorse you, which is exactly what a wall of
								 * them on a studio homepage suggests.
								 *
								 * So each tile pairs a generic glyph drawn for this template
								 * with the name set in text — which also survives being
								 * renamed to whatever you actually use.
								 */
								<span
									className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-[4px] bg-[#e4e1df] px-1.5 text-ink/45"
									// biome-ignore lint/suspicious/noArrayIndexKey: a fixed decorative grid, and tools repeat across it
									key={\`\${row}-\${index}\`}
								>
									<svg
										aria-hidden="true"
										className="size-6 shrink-0"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.4"
										viewBox="0 0 24 24"
									>
										<path d={GLYPHS[(index + row * 3) % GLYPHS.length]} />
									</svg>
									{/* \`truncate\` so a long name clips inside its own tile
									    rather than widening it and breaking the grid pitch. */}
									<span className="w-full truncate text-center text-[10px] text-ink/55 leading-3">
										{tool}
									</span>
								</span>
							);
						})}
					</div>
				))}

				{/* \`pointer-events-none\` on all three overlays, or they would sit on
				    top of the grid and swallow every hover and tap meant for it. */}
				<div className="pointer-events-none absolute inset-y-0 left-0 w-[320px] bg-gradient-to-r from-paper from-30% to-transparent" />
				<div className="pointer-events-none absolute inset-y-0 right-0 w-[320px] bg-gradient-to-l from-paper from-30% to-transparent" />

				{/**
				 * The product, sitting among the tools rather than above them.
				 *
				 * A radial wash of the page colour behind it pushes the neighbouring
				 * tiles back, so the mark reads as the centre of the wall without
				 * needing a border or a shadow to separate it.
				 */}
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="absolute size-[420px] rounded-full bg-[radial-gradient(circle,var(--color-paper)_38%,transparent_70%)]" />
					<span className="relative flex size-24 items-center justify-center rounded-[8px] bg-deep text-paper">
						<LogoMark className="size-10" />
					</span>
				</div>
			</div>
		</section>
	);
}
`;

const LOGOS = `import { content } from "./content";

/**
 * The client strip: a caption, then a row of marks running off both edges.
 *
 * ## The marks are placeholders
 *
 * Invented companies, drawn as SVGs in \`public/logos/\`. A studio site has no
 * licence to show a client's mark without asking, and a strip of logos you have
 * not worked with is a lie at the top of your homepage. Replace the files with
 * marks you have permission to use — and not before.
 *
 * The chip is the sizing box and the image is capped at 24px tall, so any
 * replacement lands at the same height whatever its own dimensions are.
 *
 * ## It does not scroll
 *
 * This was a marquee. It looked fine and it was wrong for the job: a strip that
 * slides is a strip you cannot read, and the names are the only reason it is
 * here. The row is simply wider than the screen and fades out at both ends —
 * the crop says "and more" without moving anything.
 */
export function Logos() {
	return (
		<section className="relative overflow-hidden border-rule border-b py-7">
			<div className="gutter flex flex-col gap-5 md:flex-row md:items-center md:gap-12">
				<p className="max-w-[240px] shrink-0 text-[14px] text-ink/80 leading-5">
					{content.logos.caption}
				</p>

				{/* \`w-max\` so the row keeps its natural width and overruns the
				    container rather than squeezing the chips to fit. */}
				<ul className="flex w-max min-w-0 gap-4">
					{content.logos.marks.map((mark) => (
						<li
							className="flex h-[51px] shrink-0 items-center rounded-[6px] bg-[rgba(84,82,82,0.06)] px-4"
							key={mark.name}
						>
							{/* \`h-6 w-auto\` — height fixed, width free. Constraining both
							    would squash a wide wordmark into a narrow one, and a strip
							    where every mark is the same width is the tell of a fake
							    logo row. */}
							<img
								alt=""
								className="h-6 w-auto shrink-0 opacity-70"
								loading="lazy"
								src={mark.src}
								title={mark.name}
							/>
						</li>
					))}
				</ul>
			</div>

			{/* Only the trailing edge needs fading: the row starts at the page
			    gutter like everything else and runs off to the right. */}
			<div className="pointer-events-none absolute inset-y-0 right-0 w-[160px] bg-gradient-to-l from-paper from-40% to-transparent" />
		</section>
	);
}
`;

const FEATURES = `"use client";

import { type KeyboardEvent, useId, useRef, useState } from "react";
import { content } from "./content";

/**
 * The types come from the copy, not from a second declaration beside it.
 *
 * \`typeof content\` means the shape of a card is whatever \`content.ts\` says it
 * is. Add a field there and it is available here; rename one and this file
 * stops compiling, which is the moment you want to hear about it.
 */
type FeatureTab = (typeof content.features.tabs)[number];
type FeatureCard = FeatureTab["cards"][number];
type Preview = FeatureCard["preview"];

/**
 * The product, in three tabs.
 *
 * ## Why tabs rather than nine cards down the page
 *
 * The three groups answer different questions, and a visitor has only one of
 * them. Stacked, the section is a wall a third of which is relevant; tabbed,
 * they pick their own third. The cost is that two thirds start hidden — which
 * is why the tab labels carry a line of copy each, so the value of the other
 * two is legible without opening them.
 *
 * ## This is a real tablist
 *
 * \`role="tablist"\` with \`aria-orientation="vertical"\`, real \`<button>\`s with
 * \`aria-selected\` and \`aria-controls\`, and a panel that names the tab that
 * owns it. Three divs and an \`onClick\` would look identical and be unusable
 * without a mouse.
 *
 * Roving tabindex is the part people leave out: only the selected tab is in
 * the tab order, and the arrow keys move between them. Without it a keyboard
 * user tabs through every trigger to reach the panel, which is exactly the
 * tedium the pattern exists to remove.
 */
export function Features() {
	const { id, title, tabs } = content.features;
	const [active, setActive] = useState(0);
	const base = useId();
	const triggers = useRef<(HTMLButtonElement | null)[]>([]);

	/**
	 * Ids generated per instance rather than hard-coded.
	 *
	 * \`useId\` is stable across server and client render, so the \`aria-controls\`
	 * the server sent is the one React finds on hydration. A counter or a random
	 * string would differ between the two and React would throw the markup away.
	 */
	const tabId = (index: number) => \`\${base}-tab-\${index}\`;

	/**
	 * One panel id, shared by all three tabs, because there is one panel.
	 *
	 * Giving each tab its own \`aria-controls\` reads better and is wrong here:
	 * only the selected panel is in the document, so the other two attributes
	 * would point at ids that do not exist. A dangling \`aria-controls\` is not a
	 * harmless extra — it is a promise to assistive technology that there is
	 * something there to move to.
	 */
	const panelId = \`\${base}-panel\`;

	/** Selects a tab and takes focus with it, wrapping at both ends. */
	const select = (index: number) => {
		const wrapped = (index + tabs.length) % tabs.length;

		setActive(wrapped);
		triggers.current[wrapped]?.focus();
	};

	/**
	 * Arrow keys move, Home and End jump.
	 *
	 * Bound on the tablist rather than on each button: the event bubbles, so one
	 * handler serves every tab and there is one place to read.
	 *
	 * Both axes are accepted. The list is vertical on a wide screen, but the
	 * reader has no way to know that from the keyboard, and a right arrow that
	 * does nothing is a dead end rather than a hint.
	 */
	const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		let next: number;

		switch (event.key) {
			case "ArrowDown":
			case "ArrowRight":
				next = active + 1;
				break;
			case "ArrowUp":
			case "ArrowLeft":
				next = active - 1;
				break;
			case "Home":
				next = 0;
				break;
			case "End":
				next = tabs.length - 1;
				break;
			default:
				return;
		}

		/* Only after a key we actually handle — otherwise this would swallow the
		   page's own scrolling. */
		event.preventDefault();
		select(next);
	};

	const current = tabs[active];

	if (!current) return null;

	return (
		<section className="gutter pt-20" id={id}>
			<h2 className="display text-[32px] leading-9 tracking-[-1.2px] lg:text-[60px] lg:leading-[60px]">
				{title.map((line) => (
					<span className="block" key={line}>
						{line}
					</span>
				))}
			</h2>

			<div className="mt-12 flex flex-col gap-8 lg:flex-row">
				<div
					aria-orientation="vertical"
					className="flex w-full shrink-0 flex-col lg:w-[278px]"
					onKeyDown={onKeyDown}
					role="tablist"
				>
					{tabs.map((tab, index) => (
						<button
							aria-controls={panelId}
							aria-selected={index === active}
							className="border-rule border-b py-4 text-left first:pt-0"
							id={tabId(index)}
							key={tab.id}
							onClick={() => setActive(index)}
							ref={(node) => {
								triggers.current[index] = node;
							}}
							role="tab"
							tabIndex={index === active ? 0 : -1}
							type="button"
						>
							<span
								className={
									index === active
										? "block font-medium text-[14px] text-ink leading-5 tracking-[-0.09px]"
										: "block font-medium text-[14px] text-ink/40 leading-5 tracking-[-0.09px] transition-colors"
								}
							>
								{tab.label}
							</span>

							{/**
							 * The description opens by animating grid rows from \`0fr\` to
							 * \`1fr\`, with the text in a child that hides its overflow.
							 *
							 * The obvious alternative, animating \`max-height\`, needs a
							 * number larger than the content will ever be: too small and
							 * long copy is clipped, too large and the transition spends
							 * most of its duration animating empty space, which reads as
							 * lag. A fractional grid row resolves to the real height, so
							 * this is exact at any length and needs no measuring.
							 *
							 * \`motion-reduce\` drops the transition rather than the panel.
							 * The reader still gets the words, just without the movement.
							 */}
							<span
								className={
									index === active
										? "grid grid-rows-[1fr] transition-[grid-template-rows] duration-300 motion-reduce:transition-none"
										: "grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 motion-reduce:transition-none"
								}
							>
								<span className="overflow-hidden">
									<span className="block pt-1.5 text-[14px] text-ink-soft leading-5 tracking-[-0.09px]">
										{tab.body}
									</span>
								</span>
							</span>
						</button>
					))}
				</div>

				{/**
				 * One panel, re-rendered as the selection changes, rather than three
				 * with two hidden. Hidden panels are still in the document: their
				 * links are still tabbable and their headings still show up in the
				 * outline a screen reader builds, which is how a "closed" tab ends up
				 * being read out.
				 *
				 * \`tabIndex={0}\` because the panel holds no focusable element of its
				 * own — without it, arrowing to a tab gives a keyboard user no way to
				 * reach the content it just revealed.
				 */}
				<div
					aria-labelledby={tabId(active)}
					className="grid min-w-0 flex-1 gap-x-2.5 gap-y-10 md:grid-cols-3"
					id={panelId}
					role="tabpanel"
					tabIndex={0}
				>
					{current.cards.map((card) => (
						<Card card={card} key={card.title} />
					))}
				</div>
			</div>
		</section>
	);
}

/** One feature: a mocked screen, then a title and a line about it. */
function Card({ card }: { card: FeatureCard }) {
	const dark = card.preview.tone === "dark";

	return (
		<article>
			{/* A fixed 398px, so the three titles beneath sit on one line across the
			    row. Letting each card size to its own screen staggers them, and a
			    ragged row of headings is the first thing the eye finds. */}
			<div
				className={
					dark
						? "flex h-[398px] items-center overflow-hidden rounded-[4px] bg-deep px-6"
						: "flex h-[398px] items-center overflow-hidden rounded-[4px] bg-[#e8e5e3] px-6"
				}
			>
				<Screen preview={card.preview} />
			</div>

			<div className="pt-4">
				<h3 className="font-medium text-[14px] text-ink leading-5 tracking-[-0.09px]">
					{card.title}
				</h3>
				<p className="mt-1 text-[14px] text-ink-soft leading-5 tracking-[-0.09px]">
					{card.body}
				</p>
			</div>
		</article>
	);
}

/**
 * The mocked screen inside a card.
 *
 * One component for all nine, driven entirely by \`content.ts\`. Nine bespoke
 * mock-ups would each need maintaining, and the buyer would delete all of them
 * on the first day rather than edit any.
 *
 * \`aria-hidden\`, because it is an illustration. The figures are invented, and
 * a screen reader working through "Refund promised without approval, High" is
 * being read fiction — the card's real title and description sit directly
 * beneath it and say the same thing truthfully.
 *
 * Capped at 280px and centred rather than stretched, so it keeps its
 * proportions whether the card is 327px on a desktop grid or full width on a
 * phone.
 *
 * \`max-w\`, not a fixed \`w\`. A fixed width is a claim the layout cannot always
 * honour — the card is 327px only at the widest breakpoint, and on a 1440px
 * screen it is 298px, leaving 250px inside the padding. A flex item asked for
 * 280px there is simply shrunk to 250, and the number in the class list becomes
 * a lie about what is on screen.
 */
function Screen({ preview }: { preview: Preview }) {
	const dark = preview.tone === "dark";

	return (
		<div aria-hidden="true" className="mx-auto w-full max-w-[280px]">
			<div className="flex items-baseline justify-between gap-3">
				<span
					className={
						dark
							? "text-[21px] text-paper tracking-[-0.02em]"
							: "text-[21px] text-ink tracking-[-0.02em]"
					}
				>
					{preview.heading.value}
				</span>
				<span
					className={
						dark
							? "text-right text-[12px] text-deep-soft leading-4"
							: "text-right text-[12px] text-ink-soft leading-4"
					}
				>
					{preview.heading.label}
				</span>
			</div>

			{preview.groups.map((group) => (
				<div className="mt-4" key={group.caption}>
					<p
						className={
							dark
								? "text-[11px] text-deep-soft uppercase tracking-[0.08em]"
								: "text-[11px] text-ink-soft uppercase tracking-[0.08em]"
						}
					>
						{group.caption}
					</p>

					<ul className="mt-2 flex flex-col gap-1.5">
						{group.rows.map((row) => (
							<li
								className={
									dark
										? "flex h-[42px] items-center justify-between gap-3 rounded-[6px] bg-white/10 px-3"
										: "flex h-[42px] items-center justify-between gap-3 rounded-[6px] bg-white px-3"
								}
								key={row.label}
							>
								{/* \`truncate\` on the label and \`shrink-0\` on the tag: the
								   row is a fixed width, so something has to give, and it
								   should be the end of a sentence rather than the number
								   the row exists to show. */}
								<span
									className={
										dark
											? "truncate text-[12px] text-paper leading-4"
											: "truncate text-[12px] text-ink leading-4"
									}
								>
									{row.label}
								</span>
								<span
									className={
										dark
											? "shrink-0 text-[11px] text-deep-soft leading-4"
											: "shrink-0 text-[11px] text-ink-soft leading-4"
									}
								>
									{row.tag}
								</span>
							</li>
						))}
					</ul>
				</div>
			))}
		</div>
	);
}
`;

const PROOF = `import { content } from "./content";

/**
 * The proof band: a claim with its numbers, a customer saying the same thing
 * in their own words, and the demo they are describing.
 *
 * ## Two columns, not a four-cell grid
 *
 * It looks like a grid — headline and quote across the top, figures and
 * attribution across the bottom — and building it as one would put the quote
 * and the person who said it in different rows, unable to be wrapped together.
 *
 * So it is two flex columns instead, each holding its own pair, which lets the
 * right-hand one be a real \`<figure>\`: the \`<blockquote>\` and its
 * \`<figcaption>\` are siblings, and the attribution is *attached* to the words
 * rather than merely sitting beneath them. Same geometry, and the quote no
 * longer arrives anonymously in a screen reader.
 *
 * \`justify-between\` pins each pair to the top and bottom of a shared height,
 * so the figures and the attribution sit on one line however long the headline
 * and the quote turn out to be. A fixed margin only lines up for the copy that
 * happens to be here today.
 */
export function Proof() {
	const { id, title, stats, quote, attribution, media } = content.proof;

	return (
		<section className="gutter pt-[120px]" id={id}>
			{/* 471 + 211 + 543 = 1225, the full measure. The left column is fixed
			    and the right takes the rest, so the seam between them holds while
			    the page gutter breathes. */}
			<div className="flex flex-col gap-10 lg:flex-row lg:gap-x-[211px]">
				<div className="flex flex-col justify-between gap-10 lg:w-[471px] lg:shrink-0 lg:gap-20">
					<h2 className="display text-[32px] leading-9 tracking-[-0.8px] lg:text-[40px] lg:leading-[44px]">
						{title}
					</h2>

					{/**
					 * A description list, paired the way the element means it: the
					 * label is the term and the figure is its description.
					 *
					 * \`flex-col-reverse\` then puts the figure on top, where it
					 * belongs visually, without reversing the document. Written the
					 * other way round — figure as \`<dt>\` — it reads as "100 percent,
					 * of interactions reviewed", which is a fragment rather than a
					 * fact.
					 */}
					<dl className="flex gap-x-15 gap-y-6">
						{stats.map((stat) => (
							<div className="flex flex-col-reverse gap-1" key={stat.label}>
								<dt className="text-[14px] text-ink/50 leading-5 tracking-[-0.09px]">
									{stat.label}
								</dt>
								{/* Tabular figures, so two stats side by side align on the
								    digits rather than drifting with the glyph widths. */}
								<dd className="text-[28px] leading-6 tabular-nums">
									{stat.value}
								</dd>
							</div>
						))}
					</dl>
				</div>

				<figure className="flex min-w-0 flex-1 flex-col justify-between gap-10 lg:gap-20">
					{/* The quotation marks are typed here rather than left to
					    \`content.ts\`, so the copy stays punctuation-free and nobody
					    ends up with two sets. */}
					<blockquote className="text-[18px] leading-6 lg:text-[20px]">
						“{quote}”
					</blockquote>

					<figcaption className="flex items-center gap-3">
						{/* Empty \`alt\`: the name is right beside it in text, and
						    "photograph of A. Reviewer" read before it is noise. */}
						<img
							alt=""
							className="size-12 shrink-0 rounded-[4px] object-cover"
							src={attribution.avatar}
						/>
						<span className="flex flex-col gap-1">
							<span className="text-[14px] text-ink leading-5 tracking-[-0.09px]">
								{attribution.name}
							</span>
							<span className="text-[14px] text-ink/50 leading-5 tracking-[-0.09px]">
								{attribution.role}
							</span>
						</span>
					</figcaption>
				</figure>
			</div>

			{/**
			 * The demo panel.
			 *
			 * A poster and a link, not an embedded player. A landing page that
			 * autoplays a video costs every visitor the download before they have
			 * decided they want it, and on a phone that is the first impression.
			 *
			 * To play it in place instead, swap the image for:
			 *
			 *     <video
			 *     	className="h-full w-full object-cover" controls
			 *     	poster="/proof.svg" preload="none" src="/proof.mp4"
			 *     />
			 *
			 * \`preload="none"\` is the part that matters — without it the browser
			 * starts fetching the video anyway and the poster was pointless.
			 *
			 * The aspect ratio is declared rather than the height, so the panel
			 * scales from a phone to a wide monitor without ever letterboxing the
			 * poster or cropping the middle out of it.
			 */}
			<div className="relative mt-10 aspect-[173/100] overflow-hidden rounded-[4px] bg-deep">
				<img
					alt=""
					className="h-full w-full object-cover"
					src={media.poster}
				/>

				<a
					className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2 flex items-center gap-2 whitespace-nowrap rounded-[4px] bg-black/40 px-5 py-3.5 font-medium text-[16px] text-white backdrop-blur-[2px] transition-colors hover:bg-black/55"
					href={media.href}
				>
					<svg
						aria-hidden="true"
						className="size-5"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M5 3.5v13l11-6.5-11-6.5Z" />
					</svg>
					{media.label}
				</a>
			</div>
		</section>
	);
}
`;

const CTA = `import { content } from "./content";

/**
 * The last thing on the page before the footer: the ask, and the product.
 *
 * ## Headline left, everything else right
 *
 * \`justify-between\` on a two-column grid rather than a fixed split. The
 * headline is display type and wants to set its own measure; the right column
 * is a fixed 363px because a paragraph at 14px stops being readable much past
 * that. Between them sits whatever is left, which is the only part of this
 * layout that should stretch on a wide monitor.
 *
 * The right column is nudged down 15px so the first line of the paragraph sits
 * on the headline's second baseline rather than level with its cap height.
 * Aligned flush at the top, small text beside display type always looks like
 * it has floated up.
 *
 * ## The console beneath is drawn, not photographed
 *
 * The obvious thing here is a screenshot of the product, and the obvious
 * problem is that a template has no product to photograph. A buyer would ship
 * a placeholder image of somebody else's app, or an empty grey box.
 *
 * This is real markup driven by \`content.ts\`, so it is legible at any width,
 * translates with the page, and is edited rather than re-exported. When you do
 * have a screenshot, the whole block is one \`<img>\` — the frame around it is
 * doing the work, not the contents.
 */
export function Cta() {
	const { id, title, body, action, console: panel } = content.cta;

	return (
		<section className="gutter pt-[120px]" id={id}>
			<div className="grid gap-y-8 lg:grid-cols-[652px_363px] lg:justify-between lg:gap-y-0">
				<h2 className="display text-[32px] leading-9 tracking-[-1.2px] lg:text-[60px] lg:leading-[60px]">
					{title.map((line) => (
						<span className="block" key={line}>
							{line}
						</span>
					))}
				</h2>

				<div className="lg:pt-[15px]">
					<p className="text-[14px] text-ink leading-5 tracking-[-0.09px]">
						{body}
					</p>

					<a
						className="mt-4 inline-flex items-center rounded-[4px] bg-[#474440] px-3.5 py-1.5 text-[14px] text-white leading-6 transition-opacity hover:opacity-90"
						href={action.href}
					>
						{action.label}
					</a>
				</div>
			</div>

			{/**
			 * A 12px radius here, where everything else on the page uses 4.
			 *
			 * Not an inconsistency: this is the one element pretending to be a
			 * window rather than a card, and window corners are rounder. Drop it to
			 * 4 and it stops reading as a screen and starts reading as another
			 * panel like the ones above it.
			 *
			 * \`overflow-hidden\` so the header bar's square top corners are clipped
			 * by the frame instead of poking through it.
			 */}
			<div className="mt-12 overflow-hidden rounded-[12px] bg-deep">
				<div className="flex items-center gap-2 border-white/8 border-b px-4 py-3">
					{/* Three dots, in the page's own palette rather than the usual
					    traffic lights — red, amber and green here would be borrowing
					    another operating system's furniture. */}
					<span className="flex gap-1.5" aria-hidden="true">
						<span className="size-2.5 rounded-full bg-white/15" />
						<span className="size-2.5 rounded-full bg-white/15" />
						<span className="size-2.5 rounded-full bg-white/15" />
					</span>
					<span className="ml-2 text-[12px] text-white/40">{panel.label}</span>
				</div>

				{/**
				 * A real \`<table>\`, because it is one.
				 *
				 * Rows and columns of related values read correctly to a screen
				 * reader here and would be a soup of unlabelled text as nested divs.
				 * The cost is a couple of extra elements; \`table-fixed\` keeps the
				 * columns from resizing themselves around the longest cell.
				 *
				 * It scrolls sideways inside its own frame on a phone rather than
				 * squeezing four columns into 327px.
				 */}
				<div className="overflow-x-auto">
					<table className="w-full min-w-[560px] table-fixed border-collapse text-left">
						<thead>
							<tr>
								{panel.columns.map((column) => (
									<th
										className="px-4 py-3 font-normal text-[12px] text-white/35 first:w-[44%] last:w-[18%]"
										key={column}
										scope="col"
									>
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{panel.rows.map((row) => (
								<tr className="border-white/8 border-t" key={row.conversation}>
									<td className="truncate px-4 py-3.5 text-[13px] text-white/85">
										{row.conversation}
									</td>
									<td className="truncate px-4 py-3.5 text-[13px] text-white/50">
										{row.rule}
									</td>
									<td className="px-4 py-3.5 text-[13px] text-white/85 tabular-nums">
										{row.score}
									</td>
									<td className="px-4 py-3.5">
										<span
											className={
												row.flagged
													? "inline-flex rounded-[3px] bg-[#c2554a]/20 px-2 py-1 text-[11px] text-[#e79a90]"
													: "inline-flex rounded-[3px] bg-white/8 px-2 py-1 text-[11px] text-white/45"
											}
										>
											{row.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</section>
	);
}
`;

const FOOTER = `import { content } from "./content";
import { Logo } from "./logo";

/**
 * The footer: who this is, and everywhere else on the site.
 *
 * ## No rule across the top
 *
 * The band above it already ends in a dark console, and a hairline under that
 * would be a second edge a few pixels below the first. The page's other
 * sections are separated by space rather than lines, and this one keeps to
 * that.
 *
 * ## A wide brand column and a narrower nav block
 *
 * 603 and 622, which looks like an even split and is not. The brand column is
 * mostly air — a lockup, one line, two badges — while the nav block is dense,
 * so giving the dense half slightly more room stops the columns inside it
 * pinching together on a laptop.
 *
 * The nav columns wrap. Four fixed columns would either overflow at 1024 or
 * leave a gap at 1440; \`flex-wrap\` lets the fourth drop to a second row when
 * it needs to, which is what the reference does too.
 */
export function Footer() {
	const { tagline, columns, badges, legal } = content.footer;

	return (
		<footer className="gutter pt-16 pb-10">
			<div className="grid gap-12 lg:grid-cols-[603px_622px] lg:justify-between lg:gap-0">
				<div>
					<div className="flex h-8 items-center text-ink">
						<Logo />
					</div>

					<p className="mt-5 max-w-[199px] text-[14px] text-ink/50 leading-[17px]">
						{tagline}
					</p>

					{/**
					 * The trust badges.
					 *
					 * Drawn as outlines rather than shipped as the certification
					 * bodies' artwork: those marks are trademarks, licensed to the
					 * organisations that passed the audit, and a template has no right
					 * to hand them out. Replace them with the real ones once you have
					 * been certified — and not before, because a SOC 2 badge on a
					 * company that has not been audited is a claim somebody can act on.
					 */}
					<div className="mt-5 flex gap-3">
						{badges.map((badge) => (
							<span
								className="flex size-15 flex-col items-center justify-center gap-1 rounded-full border border-rule text-ink/45"
								key={badge}
							>
								<svg
									aria-hidden="true"
									className="size-4"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1.5"
									viewBox="0 0 24 24"
								>
									<path d="M12 3.5 19 6v6c0 4.6-3 7.9-7 9.5-4-1.6-7-4.9-7-9.5V6l7-2.5Z" />
								</svg>
								<span className="text-[9px] tracking-[0.04em]">{badge}</span>
							</span>
						))}
					</div>
				</div>

				<div className="flex flex-wrap gap-x-[72px] gap-y-8">
					{columns.map((column) => (
						<div key={column.title}>
							{/* 14px and grey, not small-caps. A footer heading that is
							    louder than the links under it inverts the hierarchy — the
							    links are what people came here to click. */}
							<p className="text-[14px] text-ink/50 leading-5">
								{column.title}
							</p>

							<ul className="mt-7 flex flex-col gap-[13px]">
								{column.links.map((link) => (
									<li key={link.href}>
										<a
											className="text-[14px] text-ink leading-5 transition-colors hover:text-ink/60"
											href={link.href}
										>
											{link.label}
										</a>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>

			<div className="mt-16 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				{/* The year comes from the clock, so this cannot be the one line on
				    the site that is quietly wrong every January. */}
				<p className="text-[14px] text-ink/50 leading-[17px]">
					© {legal.entity} {new Date().getFullYear()}
				</p>

				{legal.builtWith && (
					<a
						className="text-[14px] text-ink/50 leading-[17px] transition-colors hover:text-ink"
						href={legal.builtWith.href}
						rel="noreferrer"
						target="_blank"
					>
						{legal.builtWith.label}
					</a>
				)}
			</div>
		</footer>
	);
}
`;

const INDEX = `import { Assurance } from "./assurance";
import { Cta } from "./cta";
import { Features } from "./features";
import { Footer } from "./footer";
import { Hero } from "./hero";
import { Integrations } from "./integrations";
import { Logos } from "./logos";
import { Nav } from "./nav";
import { Problem } from "./problem";
import { Proof } from "./proof";
import { Quote } from "./quote";
import { Workflow } from "./workflow";

/**
 * The landing page, composed.
 *
 * Reordering the page is reordering these lines; removing a band is removing
 * one line and one file. That is the whole reason each section is its own
 * component rather than one long file — the edit a buyer actually makes is
 * "drop the testimonial", and it should cost them a line.
 *
 * No framework imports anywhere beneath this, so the same components render
 * under Next, TanStack Start and a Vite SPA without a fork.
 */
export function Landing() {
	return (
		<>
			<Nav />
			<main>
				<Hero />
				<Logos />
				<Features />
				<Proof />
				<Workflow />
				<Quote />
				<Assurance />
				<Problem />
				<Integrations />
				<Cta />
			</main>
			<Footer />
		</>
	);
}
`;

const TEST = `import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { content } from "./content.js";

/**
 * The landing page is the first thing a visitor sees, so what is worth
 * asserting is not that it renders — a snapshot would do that and then rot —
 * but the two properties that make it a *template*: the copy is all in one
 * place, and the components are portable between frameworks.
 */
describe("the landing page", () => {
	const dir = "src/components/landing";
	const sections = readdirSync(dir).filter(
		(file) => file.endsWith(".tsx") && file !== "index.tsx",
	);

	it("has the sections the page composes", () => {
		expect(sections.length).toBeGreaterThan(5);
	});

	/**
	 * The portability rule. These files are shared by three frameworks, so an
	 * import of \`next/link\` or \`@tanstack/react-router\` compiles under one and
	 * breaks the other two — and it would break them at build time in someone
	 * else's project, not here.
	 */
	it.each(sections)("keeps %s free of framework imports", (file) => {
		const source = readFileSync(\`\${dir}/\${file}\`, "utf8");

		expect(source).not.toMatch(/from "next\\//);
		expect(source).not.toMatch(/from "@tanstack\\//);
		expect(source).not.toMatch(/from "react-router/);
	});

	/**
	 * Copy is data. A string typed straight into JSX is a string the person
	 * rewriting this page will not find in \`content.ts\`, which is where they
	 * were told to look.
	 */
	it.each(sections)("takes its words from content.ts, not from JSX", (file) => {
		const source = readFileSync(\`\${dir}/\${file}\`, "utf8");

		expect(source).toContain('from "./content"');
	});

	it("still has every slot the sections read", () => {
		expect(content.brand).toBeTruthy();
		expect(content.hero.headline.length).toBeGreaterThan(0);
		expect(content.features.tabs.length).toBeGreaterThan(2);

		for (const tab of content.features.tabs) {
			expect(tab.cards.length, \`tab "\${tab.label}" has no cards\`).toBeGreaterThan(
				0,
			);
		}
		expect(content.proof.stats.length).toBeGreaterThan(1);
		expect(content.workflow.tabs.length).toBeGreaterThan(1);
		expect(content.assurance.cards.length).toBeGreaterThan(2);
		expect(content.problem.text.split(" ").length).toBeGreaterThan(15);
		expect(content.integrations.tools.length).toBeGreaterThan(5);

		/**
		 * The cards are placed by scroll fraction, and a value outside the range
		 * does not fail loudly — it just means a card that is already showing
		 * before the section starts, or one that never arrives at all.
		 */
		for (const card of content.problem.cards) {
			expect(card.at, \`card "\${card.title}" is outside the section\`)
				.toBeGreaterThan(0.1);
			expect(card.at, \`card "\${card.title}" appears too late to be read\`)
				.toBeLessThan(0.85);
		}

		for (const tab of content.workflow.tabs) {
			expect(tab.links.length, \`tab "\${tab.label}" has no links\`).toBeGreaterThan(
				0,
			);
			expect(
				tab.screen.steps.length,
				\`tab "\${tab.label}" has an empty screen\`,
			).toBeGreaterThan(0);
		}
	});

	/**
	 * Every image the copy points at is one the template actually ships.
	 *
	 * A path in \`content.ts\` and a file in \`public/\` are edited months apart,
	 * and nothing in the type system connects them — rename the file and the page
	 * still builds, still passes typecheck, and renders a broken image in the
	 * hero. Checked against the real filesystem for that reason.
	 */
	it("ships every image the copy points at", () => {
		const sources = [
			...content.hero.cards.conversations.map((one) => one.avatar),
			content.hero.video.thumbnail,
			...content.logos.marks.map((mark) => mark.src),
			content.proof.attribution.avatar,
			content.proof.media.poster,
			content.quote.attribution.avatar,
		];

		for (const source of sources) {
			/* Remote images cannot be checked here without a network call in a
			   unit test, so the rule for those is narrower: they must at least be
			   https, because a mixed-content image is blocked outright and the
			   page renders a hole where the photograph was. */
			if (source.startsWith("http")) {
				expect(source, "remote images must be https").toMatch(/^https:\\/\\//);
				continue;
			}

			expect(existsSync(\`public\${source}\`), \`missing public\${source}\`).toBe(
				true,
			);
		}
	});

	/**
	 * The anchors the nav points at have to exist, or the first thing a
	 * visitor clicks does nothing. Checked against the ids the sections
	 * actually set rather than against a list typed twice.
	 */
	it("gives every in-page nav link something to land on", () => {
		const ids = [content.features.id, content.proof.id, content.cta.id];

		for (const link of content.nav.links) {
			if (!link.href.startsWith("#")) continue;
			expect(ids, \`nothing has id "\${link.href}"\`).toContain(link.href.slice(1));
		}
	});
});
`;

/** The route each framework needs, rendering the same `<Landing />`. */
const ROUTES: Record<string, Record<string, string>> = {
	nextjs: {
		"src/app/(marketing)/page.tsx": `import { Landing } from "@/components/landing";

export default function Home() {
	return <Landing />;
}
`,
	},
	tanstack_start: {
		"src/routes/index.tsx": `import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "@/components/landing";

export const Route = createFileRoute("/")({ component: Landing });
`,
	},
	react_vite: {
		"src/routes/home.tsx": `import { Landing } from "@/components/landing";

export function Home() {
	return <Landing />;
}
`,
	},
};

const EDITORIAL: Fragment = {
	files: {
		"src/styles.css": EDITORIAL_STYLES,
		/* Served from the site root by all three frameworks. */
		"public/hero.svg": HERO_IMAGE,
		...LOGO_FILES,
		"src/components/landing/assurance.tsx": ASSURANCE,
		"src/components/landing/content.ts": CONTENT,
		"src/components/landing/index.tsx": INDEX,
		"src/components/landing/use-typewriter.ts": TYPEWRITER,
		"src/components/landing/integrations.tsx": INTEGRATIONS,
		"src/components/landing/logo.tsx": LOGO,
		"src/components/landing/use-scroll-progress.ts": USE_SCROLL,
		"src/components/landing/use-tabs.ts": USE_TABS,
		"src/components/landing/workflow.tsx": WORKFLOW,
		"src/components/landing/nav.tsx": NAV,
		"src/components/landing/hero.tsx": HERO,
		"src/components/landing/logos.tsx": LOGOS,
		"src/components/landing/features.tsx": FEATURES,
		"src/components/landing/problem.tsx": PROBLEM,
		"src/components/landing/proof.tsx": PROOF,
		"src/components/landing/quote.tsx": QUOTE,
		"src/components/landing/cta.tsx": CTA,
		"src/components/landing/footer.tsx": FOOTER,
		"src/components/landing/landing.test.ts": TEST,
	},
};

/**
 * The catalogue.
 *
 * One entry, and the question offers exactly what is here. Listing four names
 * and shipping one is the failure this codebase has already made once — three
 * auth providers looked finished, generated an eight-line stub, and the
 * console cheerfully told the reader only their env vars were missing. A
 * second template is a second entry in this object and a second option in
 * `starter-questions.ts`; nothing else changes.
 */
export const LANDINGS: Record<string, Fragment> = {
	editorial: EDITORIAL,
};

export function landingFragment(framework: string, landing: string): Fragment {
	const template = LANDINGS[landing];

	if (!template) return {};

	return {
		...template,
		files: { ...template.files, ...(ROUTES[framework] ?? ROUTES.nextjs) },
	};
}
