# UI / Design Reference — deck.co

Design language reference for the StarterSaaSKit landing page, derived from **https://deck.co**.

All values below were extracted from the reference site's shipped stylesheet, so they are exact
rather than approximated. We adopt the **design system** (palette, type scale, spacing, motion,
section archetypes). All copy, product visuals, and section content are written for StarterSaaSKit —
we do not reuse the reference's wording.

---

## 1. Character of the design

A dark **forest-green** theme, not a generic neutral dark theme. Three things define the look:

1. **Green-tinted darks.** Backgrounds are near-black with a green cast, stepping up through deep
   forest tones for cards and panels. Almost nothing is pure gray.
2. **A single pale butter-yellow accent.** Used sparingly — primary buttons, highlights, active
   states. It is the only high-chroma color in the core palette, so it carries all the emphasis.
3. **Large, tight, low-contrast-weight headlines.** Display type is weight 500 (medium, not bold)
   with aggressive negative letter-spacing (`-0.03em`) and `line-height: 1`. This reads as calm and
   editorial rather than shouty.

Secondary accents (blue, lavender, mauve, purple) appear only inside illustrative product diagrams,
never in the core UI chrome.

---

## 2. Color palette

Exact values from the reference. The right column is our Tailwind token name (see `src/styles.css`).

### Surfaces

| Reference var     | Hex                          | Our token          | Use                             |
| ----------------- | ---------------------------- | ------------------ | ------------------------------- |
| `--bg-primary`    | `#0D100F`                    | `base`             | Page background                 |
| `--bg-secondary`  | `#152512`                    | `forest`           | Alternating section bands       |
| `--bg-card`       | `#2B4420`                    | `card`             | Cards, panels                   |
| `--bg-card-hover` | `#283A20`                    | `card-hover`       | Card hover state                |
| `--bg-elevated`   | `#1e1e1e`                    | `elevated`         | Popovers, code blocks           |
| `--border-color`  | `#27331F`                    | `line`             | Default borders                 |
| `--border-light`  | `#39482A`                    | `line-bright`      | Emphasized / hover borders      |

### Accent — **we deviate here**

The reference's accent is a pale butter yellow (`#FDFAC3`). We substitute our own brand orange,
sampled from `public/logo.png`:

| Our token    | Hex / value              | Use                                |
| ------------ | ------------------------ | ---------------------------------- |
| `brand`      | `#FD6101`                | Primary CTA background, highlights |
| `brand-dim`  | `rgba(253, 97, 1, 0.1)`  | Accent-tinted fills, subtle glows  |

What carries over from the reference is the *rule*, not the hue: exactly one high-chroma accent,
used sparingly, with **dark** (`#0D100F`, token `ink-inverse`) text on top of it. White text on
`#FD6101` is only 3.1:1 and fails WCAG AA at body sizes; dark text is 6.3:1 and passes.

Because orange is far more saturated than butter, the "no more than ~3 accent things per viewport"
guardrail matters more here, not less.

### Greens — **we deviate here too**

The reference's greens are cool teal-greens. We warm them to a moss/olive family so they sit
next to the brand orange (analogous warm hues) instead of clashing with it:

| Reference var | Our hex   | Our token | Use                          |
| ------------- | --------- | --------- | ---------------------------- |
| `--green-100` | `#84A060` | `sage`    | Muted green text, icons      |
| `--green-200` | `#426C26` | `pine`    | Borders, dividers, fills     |
| `--green-300` | `#2B4420` | `card`    | (same as `--bg-card`)        |
| `--green-400` | `#152512` | `forest`  | (same as `--bg-secondary`)   |

### Diagram accents (illustrations only)

`--blue #547DC5` · `--blue-light #A2B9E2` · `--lavender #D4C5E9` · `--mauve #C77BC1`
`--purple #6C4A99` · `--purple-deep #31205A` · `--orange #fb923c` · `--red #f87171`

### Text

| Reference var      | Hex                     | Our token   | Use                       |
| ------------------ | ----------------------- | ----------- | ------------------------- |
| `--text-primary`   | `#F6F6F6`               | `ink`       | Headings, primary text    |
| `--text-secondary` | `#CDCDCD`               | `ink-soft`  | Body copy                 |
| `--text-muted`     | `#8a8a8a`               | `ink-muted` | Labels, captions, meta    |

Hero subtitles use `rgba(255,255,255,0.8)` rather than a solid token — slightly brighter than
`ink-soft` against the hero's imagery.

---

## 3. Typography

### Families

The reference uses a commercial neo-grotesque (`Plain`). We substitute **Inter**, which shares the
same neutral grotesque skeleton and handles tight tracking well. Mono stack for code is
JetBrains Mono, matching the reference's SF Mono / Fira Code / Cascadia intent.

### Scale — fluid, `clamp()`-based

Every size in the reference is fluid; there are no fixed breakpoint jumps. Our tokens:

| Token           | Value                       | Use                          |
| --------------- | --------------------------- | ---------------------------- |
| `text-display`  | `clamp(32px, 5vw, 70px)`    | Largest statement lines      |
| `text-hero`     | `clamp(32px, 5vw, 60px)`    | Hero H1, major section H2    |
| `text-h2`       | `clamp(28px, 4.5vw, 60px)`  | Section headings             |
| `text-h3`       | `clamp(24px, 3vw, 32px)`    | Card / sub-section headings  |
| `text-h4`       | `clamp(22px, 3vw, 30px)`    | Small headings               |
| `text-body-lg`  | `clamp(16px, 1.4vw, 18px)`  | Hero subtitle, lead paragraphs |
| `text-body`     | `clamp(15px, 1.5vw, 18px)`  | Default body copy            |

### Heading treatment — important

```
font-weight: 500;        /* medium, NOT bold */
line-height: 1;
letter-spacing: -0.03em;
max-width: 900px;        /* headlines wrap, never run edge-to-edge */
```

Body: `font-weight: 400`, `line-height: 1.5`, `letter-spacing: -0.01em`, `max-width: 600px`.

Getting the weight-500 + tight-tracking combination right is the single biggest factor in matching
this reference. Bold headings will look wrong.

---

## 4. Layout & spacing

- **Max content width:** `1300px`, centered.
- **Horizontal gutter:** `16px` on mobile; the container handles larger gutters above.
- **Radii:** `12px` default (`--radius`), `8px` small, `6px` extra-small.
- **Section rhythm:** roughly `80px` top / `60px` bottom on desktop; hero is far taller
  (`~200px` top) to clear the fixed navbar.
- **Navbar:** fixed, `50px` tall on mobile, transparent over the hero.
- **Buttons:** `13px` text, `10px 20px` padding, small radius. Deliberately compact against the
  very large headlines — the size contrast is part of the look.
- **Transition:** `0.3s cubic-bezier(0.4, 0, 0.2, 1)` everywhere. Use the `--transition` token.

---

## 5. Section archetypes

The reference page is built from these block types, in order. We map our own content onto them
(see `landing-page-plan.md`):

| Archetype           | Shape                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| `hero`              | Tall, headline + subtitle + two CTAs, large product image with a glow behind it |
| `trusted-section`   | 14px muted label, `margin-bottom: 50px`, then a `repeat(5, 1fr)` logo grid capped at `--max-width` |
| `marquee-statement` | **Not a marquee — it does not scroll.** Static centred `h2` on the page background: `padding: 80px 24px 0`, `max-width: calc(--max-width + 48px)`, title `clamp(28px,4.5vw,60px)/500/1.15/-0.03em`. Three short parallel clauses split by empty `.mobile-br` spans that flip to `display:block` under 768px |
| `agent-grid-section`| Grid of tiles that animate in/out on a loop                           |
| `auth-section`      | Feature deep-dive with an animated product mock                       |
| `cu-section`        | Feature deep-dive, header + wide visual                               |
| `uc-home-section`   | Use-case grid — many short cards                                      |
| `split-section`     | Two-column text/visual; alternates via a `reverse` variant            |

Pattern: **alternate** heavy visual sections with light text sections, and alternate `split-section`
sides so the eye zig-zags down the page.

---

## 6. Motion

Two distinct layers:

1. **Scroll reveal** — a `fade-up` class with staggered `transition-delay` steps
   (`delay-1` = `0.15s`, `delay-3` = `0.45s`). Applied to section headers and cards. Subtle:
   opacity + small Y translate.
2. **Product demo animations** — each feature section has a bespoke, looping CSS keyframe animation
   that mimics the product doing something (typing, filling a code, connecting, encrypting). These
   are the centerpiece of the page and carry most of its personality.

For our page, the equivalent of layer 2 should demonstrate **StarterSaaSKit** doing its thing —
scaffolding a project, tests going green, CI passing, modules swapping.

Respect `prefers-reduced-motion: reduce` on everything in both layers.

---

## 7. What to reuse vs. what to originate

**Reuse:** palette, type scale and heading treatment, spacing rhythm, radii, transition curve,
section archetypes, the two-layer motion approach.

**Originate:** all copy, all product imagery and diagrams, section ordering specific to our
narrative, and the feature set itself. The page must describe StarterSaaSKit — an open-source,
fully-tested SaaS starter template — in our own words.
