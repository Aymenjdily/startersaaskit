# StarterSaaSKit

Answer a few questions — framework, components, database, ORM, auth, billing, email — and download a repository with all of it wired together and its test suite already green.

This repository is the product itself: the marketing site, the console, and the starter generator.

## Stack

- **Framework:** TanStack Start + TanStack Router + TanStack Query (React 19)
- **Styling:** Tailwind CSS 4, shadcn-style components
- **Auth & database:** Supabase (email/password + Google OAuth, Postgres with RLS)
- **Tests:** Vitest + Testing Library
- **Lint/format:** Biome
- **Zips:** fflate

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
pnpm dev
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the project URL and anon key (Project Settings → API) into `.env.local`. Only the **anon/publishable** key goes behind a `VITE_` prefix — never the service-role key.
3. Apply the migrations in order:

   ```bash
   supabase db push   # or run each file by hand, in order:
   # supabase/migrations/0001_profiles.sql
   # supabase/migrations/0002_starters.sql
   # supabase/migrations/0003_feedback.sql
   # supabase/migrations/0004_generation_quota.sql
   # supabase/migrations/0005_create_starter_ambiguity.sql
   # supabase/migrations/0006_feedback_reward.sql
   # supabase/migrations/0007_product_feedback.sql
   ```

   `0007` adds the `product_feedback` table and repoints the reward at it, so
   the ten generations are paid for the feedback the button asks for rather
   than for filing a bug.

   `0006` moves the allowance onto the account so feedback can raise it, and
   narrows the column privileges on `profiles` — before it, the owner policy
   from 0001 let any browser reset its own `generations_used`.

   `0004` is not optional. Creating a starter goes through `create_starter()`,
   which that migration defines — without it every generation fails with
   "Built it, but could not save the record", because the same migration drops
   the direct insert policy that would otherwise let the quota be bypassed.

4. (Optional) Seed an admin account for the feedback board:

   ```bash
   # edit the email in supabase/seed-admin.sql first, then paste it into the
   # Supabase SQL editor — or, with a direct connection string to *this*
   # project (Project Settings → Database), not whatever DATABASE_URL happens
   # to hold:
   psql "<supabase-connection-string>" -f supabase/seed-admin.sql
   ```

5. (Optional) Enable Google OAuth: add the provider in Supabase Auth → Providers, and set the redirect URL to `<SITE_URL>/auth/callback`.

## Scripts

```bash
pnpm dev              # dev server on :3000
pnpm build            # production build
pnpm test             # full test suite
pnpm test:coverage    # coverage report
pnpm check            # biome lint + format check
pnpm generate-routes  # regenerate src/routeTree.gen.ts after adding routes
```

## Project layout

- `src/routes/` — file-based routes (`index` landing, auth, console, `api/generate`, `robots.txt`, `sitemap.xml`)
- `src/components/` — `landing/`, `console/`, `auth/`, `starters/`, `ui/`
- `src/lib/generate/` — the starter generator: `build-starter.ts` assembles the repo, `fragments.ts` holds the per-stack file templates, `zip.ts` packs it
- `src/lib/seo.ts` — every page's metadata in one place; `SITE_URL` is the deployed domain
- `src/lib/brand.ts` — product name, logo, and repo URL in one place
- `supabase/migrations/` — schema, applied in numeric order; all access is enforced by RLS
- `context/` — product and design docs

## Deployment

Any host that runs a TanStack Start production build (`pnpm build`). Set the `VITE_SUPABASE_*` env vars, and keep `SITE_URL` in `src/lib/seo.ts` matching the deployed domain — canonical URLs, Open Graph cards, robots.txt and the sitemap are all built from it.
