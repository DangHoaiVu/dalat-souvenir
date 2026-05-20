# Docker

Docker is used to package the Next.js application into a reproducible runtime.
Production deployment can still use Vercel CI/CD; these files are for local
container testing, staging, and the final project containerization requirement.

## Required environment

Create `.env.local` from `.env.example` and fill in the Supabase/Gemini values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

## Run

```bash
docker compose up --build
```

Open `http://localhost:3000`.

## Notes

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are also passed
  as build arguments because Next.js reads public variables during `next build`.
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` are runtime-only secrets and
  must not use the `NEXT_PUBLIC_` prefix.
- Vercel does not need Docker for this project; it continues to deploy with
  `npm install` and `npm run build`.
