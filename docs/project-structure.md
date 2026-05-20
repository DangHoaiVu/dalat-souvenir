# Project Structure

The project is organized as a full-stack modular Next.js application.

```txt
app/                 Route groups, pages, layouts, and API routes
components/          Reusable UI and feature-facing React components
features/            Business logic grouped by domain
features/auth/       Auth helpers, admin checks, authenticated fetch
features/products/   Product queries, mappers, product mock fallback data
features/cart/       Cart-specific helpers
features/orders/     Reserved for order workflow logic
features/ai/         Reserved for AI integration helpers
lib/                 Shared utilities and compatibility exports
lib/supabase/        Supabase browser/admin client setup
stores/              Zustand stores
types/               Shared TypeScript types
supabase/            SQL seed and migration/reference files
docker/              Docker usage notes
docs/                Report materials and screenshots
public/              Static assets
```

Compatibility export files remain in `lib/` so existing screens can continue
using stable imports while the domain logic lives in `features/`.
