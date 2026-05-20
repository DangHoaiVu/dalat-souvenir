# Da Lat Souvenir

Next.js storefront and admin dashboard for a Da Lat souvenir shop.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project structure

The app is kept as a full-stack Next.js project, but business logic is grouped by
domain for easier maintenance:

```txt
app/                 Next.js App Router pages, layouts, and API routes
components/          UI components grouped by area: shop, admin, auth, account
features/            Domain logic: auth, products, cart, orders, AI
lib/supabase/        Supabase browser/admin client setup
stores/              Zustand state stores
types/               Shared TypeScript models
supabase/            SQL seed and migration/reference files
docker/              Docker usage notes
docs/                Report notes, screenshots, and schema documentation
```

See `docs/project-structure.md` for the detailed layout.

## Required environment variables

Set these locally in `.env.local` and in Vercel Project Settings -> Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

`GEMINI_API_KEY` is only needed for AI-generated product or promotion descriptions. The Supabase service role key must stay server-side only and must not use the `NEXT_PUBLIC_` prefix.

## Deploy with Vercel + GitHub CI/CD

1. Push the latest `main` branch to GitHub.
2. In Vercel, choose Add New -> Project.
3. Import `DangHoaiVu/dalat-souvenir`.
4. Keep the detected framework as Next.js.
5. Use the default commands:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave empty/default
6. Add the environment variables above for Production, Preview, and Development.
7. Deploy.

After the first deploy, every push to `main` will trigger a production deployment. Pull requests or non-production branches will trigger preview deployments.

## Pre-deploy checks

```bash
npm run lint
npm run build
```

The current `next.config.mjs` allows production builds to continue even if TypeScript or ESLint has non-blocking issues. Tighten that after the Supabase foundation and frontend are stable.

## Docker

Docker is configured for local/staging container runs and for the final project
containerization requirement. Vercel deployment still works normally without
using Docker.

```bash
docker compose up --build
```

Open `http://localhost:3000`.

Make sure `.env.local` contains the required Supabase and Gemini variables before
running the container. More details are in `docker/README.md`.
