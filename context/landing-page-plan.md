# Landing Page Plan — StarterSaaSKit

Section-by-section blueprint for the storefront. Design language comes from `reference-ui.md`; the
product model it sells is in `product-model.md`. The narrative and copy below are ours.

**Product:** a SaaS that *generates* a customized starter repo and delivers it to your GitHub.
Not a template you clone. See `product-model.md` — the distinction drives every line of copy here.

**Promise:** answer six questions, get a repo with your stack wired together and the suite already
green.

**Audience:** developers and small teams starting a new SaaS.

**Narrative arc:** you should not have to pick someone else's stack → here is what arrives wired →
here is the proof it is tested → here is how little of it is locked in → here is how it works →
start now.

### Copy rules this page lives by

- **Never say "clone this repo."** Nothing on the page asks the reader to take *this* codebase.
- **Never privilege a framework.** This storefront happens to be TanStack Start; that is an
  implementation detail and appears nowhere as a selling point. Next.js and TanStack Start are
  named as peers everywhere, in that order as often as not.
- **Never print a number the repo cannot back.** Where a count is shown it is derived from the same
  exported data the tests read, so the page cannot drift from itself. Prefer deleting an
  unverifiable number over hand-syncing it.
- The tone is "your stack, already assembled" — not "our stack, take it."

---

## Section order

| #  | Section           | Archetype               | Job                                                  |
| -- | ----------------- | ----------------------- | ---------------------------------------------------- |
| 01 | Navbar            | fixed nav               | Wayfinding + persistent Sign in / Get started          |
| 02 | Hero              | `hero`                  | State the promise, one primary CTA                     |
| 03 | Trust strip       | `trusted-section`       | The stack you can *pick from*, not the stack we chose  |
| 04 | Statement         | `marquee-statement`     | Palate cleanser, reinforce the promise                 |
| 05 | What's wired      | `agent-grid-section`    | The catalogue a generated repo draws from              |
| 06 | Tested by default | `auth-section`          | Deep-dive: the CI matrix, animated                     |
| 07 | Swap anything     | `split-section`         | Deep-dive: the seams the wizard actually asks about    |
| 08 | AI reads it correctly | `split-section reverse` | Deep-dive: structured for AI assistants            |
| 09 | How it works      | `cu-section`            | Deep-dive: the wizard, six answers → GitHub            |
| 10 | Use cases         | `uc-home-section`       | Breadth — what people generate it for                  |
| 11 | Final CTA         | `split-section`         | Convert                                                |
| 12 | Footer            | footer                  | Links, docs, legal                                     |

Rendered in this order by `src/routes/index.tsx`.

---

## 02 — Hero

- **Eyebrow:** `Free while in beta` — the actual commercial position, not a license badge.
- **H1:** *Skip the boilerplate. Keep your stack. Ship the product.* Three clauses; "keep your
  stack" is load-bearing, because it is what separates this from a template.
- **Subtitle:** names the six questions and the outcome — *"Answer a few questions — framework,
  database, ORM, auth, billing — and a repo lands in your GitHub with all of it wired together and
  the test suite already passing."*
- **CTAs:** primary `Generate your starter` → sign-up. Secondary ghost → `#how-it-works`. Both
  same-tab: these are the product, not a repo, so a new tab would break the flow.
- **Visual:** `hero-preview.tsx` — the wizard's answers resolving into a file tree.

## 03 — Trust strip

Muted logo row, labelled **"Pick the tools you already trust."** The label is the section's whole
job: this is a *menu*, not a stack declaration. Deliberately carries both frameworks (TanStack
Start, Next.js) and both ORMs (Drizzle, Prisma) side by side, since no single generated repo
contains all ten.

## 04 — Statement

Static centred `h2` on the page background — **not** a scrolling marquee, despite the reference's
`marquee-statement` class name. **"Any stack. Any provider. Already wired."** Three parallel
clauses, broken onto separate lines below 768px. Verified against the reference's CSS; see
`reference-ui.md`.

## 05 — What's wired

Looping tile grid (`agTileIn` / `agTileOut`), no heading — the tiles are the statement. `TASKS` is
the **catalogue a generated starter draws from**, not an inventory of this repo: Next.js beside
TanStack Start, Prisma beside Drizzle. The grid is the menu; the wizard is what picks from it.

Supabase and Stripe belong here but have no brand glyph yet, so they stay out rather than borrow
another mark.

## 06 — Tested by default

The strongest differentiator, so the most elaborate treatment. Animated CI run: every
framework × stack **combination** goes green in sequence, then the summary count, then the quality
gates, then the banner.

`COMBINATIONS` and `SPEC_PAIRS` are exported from here and **imported by section 10**, so the two
sections cannot tell different stories. The summary count is asserted by reading it back out of the
rendered DOM — comparing it to `COMBINATIONS.length` would be vacuous, since that is what renders it.

Pillars: tests ship with the feature · strict by default · coverage from day one.

## 07 — Swap anything

`split-section`. `SEAMS` are the four layers the wizard genuinely asks about — Framework, Database,
ORM, Auth — each with its options and the files the answer lands in. A test asserts every
`SEAMS.layer` is an `ANSWERS.label` from section 09; a tab with no question behind it would be the
page selling a choice nobody is ever offered.

The panel counts *places that change* rather than lines of code. Line counts were retired with the
"clone this one" pitch — they measured this repo, which is no longer what is being sold.

## 08 — AI reads it correctly

`split-section reverse`. Eyebrow "Built for assistants". A generated repo's file tree with an
assistant resolving questions to files. `TREE` is deliberately framework-neutral (`db/`, `lib/`,
no `app/` or `routes/`).

Every `LOOKUPS.path` must be a node in `TREE`, and every node label must be unique — otherwise the
highlight points at empty air or lands ambiguously. `TS_FLAGS` is still checked against this repo's
real `tsconfig.json`, because that claim is still about a file we ship.

Does **not** claim CLAUDE.md or a rules file; a test enforces the absence until one exists.

## 09 — How it works

The wizard demo. Eyebrow "How it works", title **"Six answers and it is in your GitHub."**
`ANSWERS` are the canonical six: Framework · Database · ORM · Auth · Billing · Project. This is the
page's source of truth for what the wizard asks — section 07 imports from it.

## 10 — Use cases

Auto-rotating name list (stops on click or focus, holds still under reduced motion) with a screen
per case: B2B SaaS, Internal tools, Side projects, Client work, AI apps. Heading: **"Your starting
point, whatever you are building."**

The screens picture a *generated* repo, so disk proves nothing about them. What replaces the old
fs-backed guards is agreement with section 06: the matrix and the spec pairs are imported, so a
screen that quietly stopped rendering them would leave two parts of the page contradicting each
other. `DELIVERY_STEPS` ends in the reader's GitHub, and a test pins that last step.

## 11 — Final CTA

**"Start with the tests already written."** Sub: *"Answer six questions. The repo lands in your
GitHub with the suite already green. Free while in beta."* Primary → sign-up, secondary →
`#how-it-works`. No clone command — there is nothing to clone.

## 12 — Footer

Five columns: Product, Repository, Stack, Tooling, and "Point your agent at it". Its numbers and
package names are still measured against real files in this repo, so unlike the sections above it
kept its fs-backed guards. The status line names the repo it counts ("on this site") because an
unqualified test count reads as a promise about the generated starter.

There is no Legal column and no `/terms` or `/privacy` route, so nothing else on the site may link
to one.

---

## Guardrails

- Headings are **weight 500** with `-0.03em` tracking. Never bold.
- Butter accent is for CTAs and highlights only — if more than ~3 things per viewport are butter,
  it's overused.
- Alternate `base` and `forest` section backgrounds; alternate split-section sides.
- Every section gets `fade-up` on scroll; every looping animation respects reduced motion.
- Every animated section must render identically across two server renders — state starts at 0 and
  all motion lives in `useEffect`, or hydration mismatches.
- Copy stays ours. Match the reference's *structure and restraint*, not its wording.
