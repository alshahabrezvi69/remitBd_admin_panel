# RemitBD Admin Portal

The RemitBD Admin Portal is a React and Vite operations console for the shared FastAPI/MongoDB service. It has no demo records, quick-login personas, Gemini integration, cached customer data, or local mock API. All dashboard, customer, funding, transfer, content, notification, and configuration data is requested from the configured backend.

## Requirements

Use Node.js 20 or newer and pnpm. The Python API must be reachable over HTTPS for a hosted deployment and must have MongoDB and its authentication environment configured. The portal must be built with the same API origin used by the Android customer application.

## Environment

Create `.env.local` for local development:

```env
VITE_API_BASE_URL=https://remitbd-backend-vercel.vercel.app
```

`VITE_API_BASE_URL` is the only runtime API variable. Vite embeds it into the browser bundle at build time, so changing it requires restarting the development server or rebuilding and redeploying the portal. Do not put administrator passwords, JWT secrets, or MongoDB credentials in this project; those belong only in the backend deployment environment.

## Local development

Install dependencies and start the Vite server:

```bash
pnpm install
pnpm run dev
```

The portal performs a backend health check before rendering any data. If the API URL is missing or unavailable, it displays a server-required error and does not render cached or demo data.

## Production build

Build and type-check the portal before deployment:

```bash
pnpm run lint
VITE_API_BASE_URL=https://remitbd-backend-vercel.vercel.app pnpm run build
```

Deploy the generated `dist/` directory to a static hosting provider. Configure `VITE_API_BASE_URL` in that provider’s build environment, not only in a local shell. The value must be available during the build; it is not read dynamically by an already-generated bundle.

## Authentication and operations

Administrator login uses the real backend administrator account provisioned from the backend’s `ADMIN_EMAIL` and `ADMIN_PASSWORD` variables. The portal stores only the returned admin session token in browser storage, attaches it to `/api/admin` requests, and clears it when the session is rejected. All protected API routes must return an authenticated response before the portal displays operational data.

Customer Configuration is managed under System & Governance. Administrators can configure currencies, corridors, indicative rates, service fees, transfer limits, and supported funding methods. A fresh database intentionally has no customer currencies, corridors, offers, videos, funding accounts, or payment methods until an administrator creates them.

## Deployment checklist

Before opening the portal to staff, verify that the backend `/health` endpoint returns HTTP 200, the backend reports MongoDB connected, the portal build contains the intended HTTPS API origin, the first administrator can sign in, and Customer Configuration can be read and updated. Use the backend runbook for MongoDB backups, secret rotation, audit retention, rate limiting, and production monitoring.
# remitBd_admin_panel
