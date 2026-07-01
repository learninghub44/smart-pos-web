# Smart POS

A multi-tenant, offline-first Point of Sale system for Kenyan retail businesses. Built with Next.js, Neon Postgres, and Tailwind CSS, and deployed on Cloudflare Workers.

## Overview

Smart POS is a SaaS point-of-sale platform: each tenant (shop) gets its own branded workspace, staff accounts, branches, and billing subscription, while running on shared infrastructure. The app is designed to keep working at the till even when the internet drops — sales are queued locally and synced automatically once connectivity returns.

## Features

- **Point of Sale** — fast product search, cart management, and checkout with barcode scanning (USB scanner or device camera)
- **Multi-branch support** — manage inventory and sales across multiple shop locations under one tenant
- **Inventory management** — products, categories, brands, suppliers, stock counts, and low-stock alerts
- **Sales & returns** — full sales history, receipt lookup by PIN, and an approval-based returns workflow
- **Payments** — cash, M-Pesa, card, bank transfer, and mixed/split payments
- **Billing** — subscription plans and payments via Paystack, with KES pricing tiers
- **Reporting** — dashboard analytics, revenue and stock reports
- **Offline-first** — IndexedDB-backed local cache; the app keeps working without a connection and syncs when it's back
- **Role-based access** — tenant admin, cashier, and platform super-admin roles, enforced at the middleware layer
- **Thermal receipt printing** — tuned for 58mm and 80mm printers

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | [Neon](https://neon.tech) (serverless Postgres) via `@neondatabase/serverless` |
| Auth | JWT cookies (`jsonwebtoken` server-side, Web Crypto in middleware) + `bcryptjs` |
| Offline storage | IndexedDB (via `idb`) |
| Payments | Paystack |
| Hosting | Cloudflare Workers, via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) |
| Icons | Lucide React |
| Printing | `react-to-print` |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database (free tier is sufficient to start)
- A Paystack account for billing (test keys work for local development)

### Installation

```bash
git clone https://github.com/learninghub44/smart-pos-web.git
cd smart-pos-web
npm install
```

### Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (Dashboard → Connection Details → Pooled connection) |
| `JWT_SECRET` | Random 64-char string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (`sk_test_...` for development, `sk_live_...` in production) |
| `NODE_ENV` | `development` locally, `production` when deployed |

### Set up the database

In the Neon console's SQL Editor, run `database/migrations/FULL_MIGRATION.sql`. This single script creates the full schema on a fresh database — you don't need to run `database/schema.sql` or the individual migration files separately (those are kept for reference/history).

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/            # Routes (App Router) — pages + /api handlers
  components/      # Shared UI components
  hooks/           # Custom React hooks
  lib/             # DB client, auth, sync, business logic
  middleware.ts    # Tenant auth, route protection, subscription gating
database/
  schema.sql            # Base schema
  migrations/            # Incremental migrations (historical)
  migrations/FULL_MIGRATION.sql   # Consolidated schema for a fresh database
```

## Deployment

The app deploys to Cloudflare Workers using OpenNext's Cloudflare adapter.

```bash
npm run cf:build     # Build the Next.js app and transform it for Workers
npm run cf:preview   # Build and run locally against the real Workers runtime
npm run cf:deploy    # Build and deploy
```

Before deploying, set the required secrets in Cloudflare:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put PAYSTACK_SECRET_KEY
```

Configuration lives in `wrangler.jsonc` and `open-next.config.ts`.

> **Next.js version note:** this project is pinned to Next.js 15.5.x rather than 16.x. Next 16 renamed Middleware to "Proxy" and made it Node.js-runtime-only with no Edge option, which `@opennextjs/cloudflare` doesn't yet support (tracked upstream: [opennextjs-cloudflare#962](https://github.com/opennextjs/opennextjs-cloudflare/issues/962)). Revisit this pin once that lands.

## Offline Behavior

Products, categories, and other reference data are cached in IndexedDB. Sales made while offline are queued and automatically synced once the connection is restored — nothing is lost, and no special action is needed from the cashier.

## Security

- JWT-based session cookies, verified in middleware using the Web Crypto API
- Role-based access control (tenant admin / cashier / platform super-admin)
- Tenant isolation enforced at the API layer
- Subscription status (active / pending payment / suspended / cancelled) gates access to the app outside of billing and auth routes

## Troubleshooting

**Barcode scanner not detected** — confirm the USB scanner is in keyboard-wedge mode, or use the manual barcode entry field.

**Products not syncing / stale data** — check the network connection, then use Settings → Force Sync from Server to clear the local cache and re-pull from the API.

**Printing issues** — confirm the printer is connected and selected in the browser's print dialog; try switching between 58mm and 80mm layouts.

## License

MIT
