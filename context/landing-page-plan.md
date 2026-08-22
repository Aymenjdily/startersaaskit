# Landing Page Plan — StarterSaaSKit

Section-by-section blueprint. Design language comes from `reference-ui.md`; the narrative and copy
below are ours, written for StarterSaaSKit.

**Product:** an open-source, fully-tested SaaS starter template on TanStack Start.
**Promise:** skip the 2–4 weeks of auth/billing/testing/CI boilerplate; clone and customize in 60 seconds.
**Audience:** developers and small teams starting a new SaaS.

**Narrative arc:** the cost of boilerplate → what you get instead → proof it's real → how fast it is → start now.

---

## Section order

| #  | Section        | Archetype             | Job                                              |
| -- | -------------- | --------------------- | ------------------------------------------------ |
| 01 | Navbar         | fixed nav             | Wayfinding + persistent CTA                      |
| 02 | Hero           | `hero`                | State the promise, one primary CTA                |
| 03 | Trust strip    | `trusted-section`     | Show the stack it's built on                      |
| 04 | Statement      | `marquee-statement`   | Palate cleanser, reinforce the promise            |
| 05 | What's wired   | `agent-grid-section`  | The modules you'd otherwise build by hand         |
| 06 | Tested by default | `auth-section`     | Deep-dive: the testing story, animated            |
| 07 | Swap anything  | `split-section`       | Deep-dive: modularity                             |
| 08 | AI-optimized   | `split-section reverse` | Deep-dive: structured for AI assistants        |
| 09 | 60 seconds     | `cu-section`          | Deep-dive: clone → configure → deploy             |
| 10 | Use cases      | `uc-home-section`     | Breadth — what people ship with it                |
| 11 | Final CTA      | `split-section`       | Convert                                           |
| 12 | Footer         | footer                | Links, repo, license                              |

---

## 02 — Hero

- **H1** (`text-hero`, weight 500, tracking `-0.03em`, `max-w-[900px]`): lead with the outcome —
  shipping a production SaaS, not assembling one. Three short clauses works well with this type
  treatment.
- **Subtitle** (`text-body-lg`, `max-w-[600px]`, `rgba(255,255,255,0.8)`): one sentence naming the
  concrete inclusions — auth, billing, tests, CI.
- **CTAs:** primary = butter background, dark text (`Get started` / copy the clone command).
  Secondary = ghost, `ink-soft` (`View on GitHub`).
- **Visual:** terminal / editor mock with a soft glow behind it (`hero-image-glow` equivalent).
  A scaffold command running and tests going green is the strongest single image for this product.
- Padding: ~`200px` top to clear the fixed navbar.

## 03 — Trust strip

Low-emphasis logo row of the stack: TanStack Start, Neon, Drizzle, Better Auth, Vercel, Biome.
Muted (`ink-muted`), small, no card chrome. Frames it as "built on tools you already trust."

## 04 — Statement

Static centred `h2` on the page background — **not** a scrolling marquee, despite the reference's
`marquee-statement` class name. Three short parallel clauses, broken onto separate lines below 768px.
Purely rhythmic — no CTA, no detail. Verified against the reference's CSS; see `reference-ui.md`.

## 05 — What's wired

Tile grid of the modules included out of the box: auth, billing/subscriptions, database + migrations,
email, CI pipeline, testing, rate limiting, env validation. Tiles animate in/out on a loop
(`agTileIn` / `agTileOut` equivalent). Each tile = icon + label + one-line description.

## 06 — Tested by default

The strongest differentiator, so it gets the most elaborate treatment. Header + animated mock of a
test suite: unit → component → E2E, going green in sequence, then CI passing. Supporting points:
every feature ships with tests; CI gates every merge; coverage is visible from day one.

## 07 — Swap anything

`split-section`. Modularity: change auth provider, database, billing, or UI library without
rewriting business logic. Visual: a module block swapping its label/logo while the surrounding
architecture stays fixed.

## 08 — AI-optimized

`split-section reverse`. Codebase structured so AI assistants understand it immediately —
predictable layout, typed boundaries, documented modules, context files. Visual: an assistant
correctly navigating the file tree.

## 09 — 60 seconds

Three numbered steps: clone → add env vars → push. Wide visual, ideally a real terminal transcript.
Concrete and literal; this section answers "how much work is this actually."

## 10 — Use cases

Grid of short cards: B2B SaaS, internal tools, side projects, client work, AI apps. Two lines each,
no imagery. Establishes breadth cheaply.

## 11 — Final CTA

Restate the promise in one line, primary butter CTA, and the clone command in a copyable code block.

## 12 — Footer

Multi-column: Product, Docs, Community, Legal. Repo link, license, social. Muted throughout.

---

## Build order

Ship top-to-bottom so the page is always viewable end-to-end:

1. Design tokens + UI primitives *(done — see `src/styles.css`, `src/components/ui/`)*
2. Navbar + Hero + Footer — establishes the frame
3. Trust strip + Statement — cheap, high visual payoff
4. Feature deep-dives (05–09), each with its own animated visual
5. Use cases + Final CTA
6. Responsive pass, then `prefers-reduced-motion` pass

---

## Guardrails

- Headings are **weight 500** with `-0.03em` tracking. Never bold.
- Butter accent is for CTAs and highlights only — if more than ~3 things per viewport are butter,
  it's overused.
- Alternate `base` and `forest` section backgrounds; alternate split-section sides.
- Every section gets `fade-up` on scroll; every looping animation respects reduced motion.
- Copy stays ours. Match the reference's *structure and restraint*, not its wording.
