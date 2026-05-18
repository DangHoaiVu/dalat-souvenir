# Da Lat Souvenir

Next.js storefront and admin dashboard for a Da Lat souvenir shop.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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
