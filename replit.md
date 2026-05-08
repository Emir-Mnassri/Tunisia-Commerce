# TunisShop — E-Commerce Tunisien Premium

Une plateforme e-commerce haut de gamme pour le marché tunisien : catalogue produits, panier, checkout multimode (livraison / Flouci mock), localisé en français avec les 24 gouvernorats tunisiens.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/storefront run dev` — run the storefront (uses $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `FLOUCI_MOCK_TOKEN` — mock Flouci dev token (set in secrets)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (wouter routing, TanStack Query, shadcn/ui, Tailwind CSS, framer-motion)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle schema (categories, products, orders)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/storefront/src/` — React frontend

## Architecture decisions

- Contract-first: OpenAPI spec gates all API development
- Cart is local state (CartContext + localStorage) — no server-side cart
- Flouci payment is a complete mock: generates a paymentId, simulates redirect, auto-confirms after 2s
- Shipping fee of 7 DT applied only for "Paiement à la livraison"
- All prices stored with 3 decimal precision (TND standard)
- `lib/api-zod/src/index.ts` is patched post-codegen to remove the orphan `./generated/api.schemas` export (Orval bug with zod+schemas+split mode)

## Product

- Product catalog with categories, search, and pagination
- Mobile-first responsive design in French
- TND (DT) currency throughout
- 24 Tunisian governorates in checkout dropdown
- Dual payment: Cash on Delivery (+7 DT) or Flouci mock (online)
- Order tracking by ID on success page

## User preferences

- French as primary language for all UI text
- Currency: TND / DT with 3 decimal places
- Modern Minimalist aesthetic, high-contrast typography

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen`
- The codegen script patches `lib/api-zod/src/index.ts` after Orval runs (removes invalid `./generated/api.schemas` export)
- Do not add `./generated/api.schemas` back to `lib/api-zod/src/index.ts` — it does not exist for the zod client
- Images use Unsplash URLs for seed data

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
