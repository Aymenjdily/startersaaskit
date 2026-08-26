# Product Model — StarterSaaSKit

Agreed 2026-08-22. This supersedes the "open-source starter template" framing in
`overview.md` and the narrative in `landing-page-plan.md`.

## What the product is

StarterSaaSKit is a **SaaS that generates a customized starter repo and delivers it to the
user's GitHub**. It is not itself a starter template you clone.

The user answers a short series of questions — framework, database, ORM, auth, billing —
and receives a repo assembled to those answers, arriving with a green test suite.

## Two repos, never conflated

**The product** — this repository. Marketing site today; auth, onboarding, dashboard,
wizard, generator and delivery to come. It happens to be built on TanStack Start. That is
an implementation detail of ours, invisible to users, and it privileges nothing about what
we generate.

**The template inventory** — separate, versioned artifacts that get generated and shipped.
Chosen on market demand, not on what the product itself is written in. Does not exist yet.

## The user flow

```
sign in (GitHub / Google / email)
  → onboarding
  → dashboard → "Generate starter"
      1. Framework      Next.js · TanStack Start          ← grows over time
      2. Database       Neon · Supabase
      3. ORM            Drizzle · Prisma
      4. Auth           filtered by step 2 — illegal pairs never shown
      5. Billing        Stripe · none
      6. Project        repo name, package name, description
  → preview: file tree + the test count it will ship with
  → generate
  → deliver to GitHub (zip first, GitHub App second)
```

Steps are ordered so earlier answers constrain later ones. Choosing Supabase makes
Supabase Auth available and removes Neon Auth, so an invalid combination is unreachable
rather than merely rejected.

The preview is not decoration. The file tree plus "ships with N passing tests" is where
the user decides to trust us, and it is the cheapest high-value screen in the product.

## The binding constraint

Our differentiator is *fully tested*. The moment we generate variants, that promise is
per-variant: **every legal combination must arrive green**, or we have sold the one thing
we cannot deliver.

This — not the wizard UI — is the expensive part of the company, and it is what the
architecture below exists to make affordable.

## Architecture

Framework is a dropdown that grows over time. It grows by doing work, not by adding a
config entry, so the cost of framework #3 is the thing to design against.

**Modules are mostly framework-agnostic, with a thin adapter per framework.**

```
frameworks/
  nextjs/                  base app
  tanstack-start/          base app

modules/
  db-drizzle/
    core/                  schema, migrations, config, query helpers      ~90%
    adapters/nextjs/       where server code lives, how env is read       ~10%
    adapters/tanstack-start/
  db-prisma/
  auth-better-auth/
  auth-supabase/
  billing-stripe/

compat.json                which combinations are legal
```

Adding a framework then costs one base app plus a handful of small adapters, not a
re-implementation of the whole catalogue. Without this, every module bugfix has to be
applied once per framework, forever — that is the version that collapses at three
frameworks.

**Extension points, not text merging.** Every module wants to touch the same few files:
`package.json`, the env example, the root provider/layout, the middleware chain. Each base
declares named extension points — root providers, server middleware, env vars,
dependencies, scripts — and modules contribute to them. Generation is then a structured
data merge plus a rename, never a text diff.

**Presets** are named coordinates in this system — pre-filled answer sets — never static
branches. Branches cannot grow into an overlay system and would be thrown away.

## Testing strategy

- **Per module:** tests written against the module's contract, not against Drizzle's or
  Supabase's API. One suite validates every implementation of that layer.
- **Per combination:** a thin smoke suite — boots, migrates, signs a user in, serves a
  page, handles a billing webhook where enabled.
- **CI:** full matrix on merge to `main`, smoke suite on pull requests. The matrix is the
  real infrastructure bill, not generation itself.

## Build order

Deliberately the opposite of the obvious one. Steps 1–4 are the product; 5–6 are a UI over
it. Building the wizard first produces a beautiful form that ships repos which do not
compile, which for us is fatal.

1. Two base templates, hand-written, both genuinely green — same features, same suite.
2. Extract the extension points by diffing those two. The seams are learned from real
   code, not designed in the abstract.
3. Module system, compatibility matrix, and a local generator CLI. No UI.
4. CI matrix keeping every legal combination green.
5. The SaaS shell — auth, onboarding, dashboard, wizard — calling that same generator.
6. Delivery, then re-aim the landing page.

## Commercial

Free for a minimum of three months from 2026-08-22. Because of that, delivery ships as a
zip download first; the GitHub App, repo-creation permissions and Git push pipeline come
second, once demand is demonstrated.

## The product's own stack

Supabase for auth. The rest of the product's stack is our own convenience and carries no
implication for the inventory.
