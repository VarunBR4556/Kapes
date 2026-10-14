# Kapes — Vehicle Capacity Marketplace

A platform connecting drivers with unused vehicle capacity to customers who need
shipping space. Drivers post a trip and the space they have free; customers
search by route and date, then book the space they need. The goal is fewer empty
runs, lower shipping costs, and more trust in logistics.

## Overview

Kapes matches **unused vehicle capacity** (return trips, partially loaded
vehicles) with **shipping demand**. The system is a single React application on
top of a Supabase backend:

- **Customers** search open trips, book shipment space, follow their bookings,
  and report problems in transit.
- **Drivers** post trips, manage their bookings and statuses, and upload the
  documents needed to be verified.
- **Admins** review driver documents, moderate accounts (warn / hold / block),
  and triage the reports that come in.

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Routing** | React Router DOM v6 |
| **State** | React context stores + TanStack Query |
| **Forms** | React Hook Form + Zod |
| **UI** | Radix UI primitives + shadcn/ui patterns, lucide-react icons |
| **Styling** | Tailwind CSS v3 + CSS variables (light/dark) |
| **Animation / Charts** | Framer Motion, Recharts |
| **Backend** | Supabase — PostgreSQL, Auth, Storage, Realtime |
| **Dates** | date-fns, React Day Picker |
| **Build / QA** | Vite, TypeScript, ESLint, esbuild + `node:test` |

## Features

### Authentication & accounts
- Email/password sign-up and sign-in via Supabase Auth, with email
  confirmation.
- Role-based access (`customer`, `driver`, `admin`) enforced on routes and by
  Postgres RLS.
- Editable profile: name, phone, profile photo (stored in the public `avatars`
  bucket), and a profile-activity feed.

### Drivers
- Post a trip: route, date/time, vehicle type, capacity (kg), price per kg, and
  cargo-room dimensions.
- Manage bookings on their trips and move them through
  `pending → confirmed → in_transit → delivered` (or `cancelled`).
- Vehicles: add/remove vehicles and manage cargo-room dimensions; each vehicle
  needs an approved RC to be used.
- Verification: upload a driving licence and per-vehicle RC PDFs; a driver only
  appears in public search once every document is approved.

### Customers
- Search open trips by origin, destination, and date, with nearby/related route
  suggestions.
- Book space against a trip; the booking total is derived from weight × price.
- Customer dashboard listing their bookings with live statuses.
- Report a transit issue against a booking.

### Admin
- Review submitted driver documents (approve / reject with a note).
- Moderate accounts: warn, place on hold, or block; each action is timestamped.
- Rejected-document and per-user history views.
- Triage in-transit issue reports and bug reports.

### Platform
- Public driver directory (`public_drivers` view) so unauthenticated visitors
  can see verified drivers.
- SEO: per-route metadata, prerendered home page, `robots.txt` and
  `sitemap.xml`.
- Security headers + SPA rewrites configured in `vercel.json`.

## Project Structure

```
src/
├── App.tsx                 # Route table + role guards
├── AppProviders.tsx        # Query client, auth and store providers
├── main.tsx                # Client entry point
├── entry-server.tsx        # SSR entry used for prerendering
├── lib/                    # Domain logic and Supabase stores
│   ├── supabase.ts         # Supabase client + storage helpers
│   ├── auth-context.tsx    # Session/user context
│   ├── auth.ts             # roleHome()
│   ├── trips.ts            # Trip types, vehicle types, cargo room
│   ├── trips-store.tsx     # Trip CRUD
│   ├── bookings-store.tsx  # Booking CRUD + status rules
│   ├── users-store.tsx     # Profiles, vehicles, documents, moderation
│   ├── reports-store.tsx   # Transit issues + bug reports
│   ├── search.ts           # Availability + matching logic
│   ├── format.ts           # Date/number/initial formatting
│   ├── image.ts            # Image resize helpers
│   ├── *-fixtures.ts       # Fixtures for the node:test suites
│   └── *.test.ts           # Unit/QA suites (run by esbuild + node:test)
├── components/
│   ├── admin/ auth/ driver/ landing/ profile/ reports/ trips/
│   └── ui/                 # shadcn/ui components
├── pages/                  # Home, Login, Trips, BookPage, dashboards, Settings, 404
├── hooks/
└── index.css               # Tailwind + CSS variables
supabase/
├── migrations/             # 0001–0006 (see Database)
└── seed-sample-data.py     # QA data seeder
scripts/
└── prerender.mjs           # Post-build home-page prerender
```

### Routes

| Path | Access | Page |
|------|--------|------|
| `/` | public | Landing |
| `/login` | public | Sign in / register |
| `/trips` | public | Search trips |
| `/settings` | any signed-in user | Profile settings |
| `/book/:tripId` | customer | Booking form |
| `/account` | customer | Customer dashboard |
| `/driver` | driver | Driver dashboard |
| `/admin` | admin | Admin dashboard |
| `*` | public | 404 |

## Getting Started

### Prerequisites
- Node.js 18+ (tested on 20)
- npm
- A Supabase project (or the Supabase CLI for a local stack)

### Installation

```bash
npm install
```

### Environment

Create `.env` from the template and fill in your project values:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The client prefers `VITE_SUPABASE_PUBLISHABLE_KEY` and falls back to
`VITE_SUPABASE_ANON_KEY`; both are the same public key under different names.
Only public keys belong in these variables.

### Database

Apply the migrations in `supabase/migrations/` **in order**:

| File | Purpose |
|------|---------|
| `0001_init.sql` | Tables, indexes, helper functions, RLS policies, storage buckets |
| `0002_security_role_clamp.sql` | Hardens role/privilege escalation paths; sets `public_drivers` to `security_invoker` |
| `0003_booking_capacity_guard.sql` | Trigger preventing over-capacity bookings |
| `0004_public_driver_directory.sql` | `public_drivers` view for anonymous visitors |
| `0005_align_booking_capacity.sql` | Aligns the capacity trigger with the client (delivered/cancelled free space) |
| `0006_trip_driver_snapshot.sql` | Adds the denormalised `trips.driver_name` / `driver_vehicle` columns |

Tables: `profiles`, `vehicles`, `driver_documents`, `trips`, `bookings`,
`transit_issues`, `bug_reports`, `profile_activity`, plus the `public_drivers`
view. Storage buckets: `avatars` (public) and `documents` (private).

### Sample data (optional)

`supabase/seed-sample-data.py` populates a broad QA dataset — every Karnataka
district headquarters, every vehicle type, and every status, with 50 drivers and
50 customers (all `@kapes.in`). It talks to the Supabase Management API, so it
needs a Supabase personal access token:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...      # Supabase PAT, not a service_role key
python3 supabase/seed-sample-data.py --reset
```

`--reset` first deletes previously seeded `@kapes.in` accounts (cascading to
their data); the real admin account is never touched. The shared password for
seeded accounts is defined at the top of the script.

### Development

```bash
npm run dev
```

Runs on `http://localhost:8080`.

### Build

```bash
npm run build        # Production build (client + SSR prerender → dist/)
npm run build:dev    # Development-mode build
npm run preview      # Serve the production build
```

## Testing

The suites are plain TypeScript bundled with esbuild and executed by Node's
built-in `node:test` runner — no test framework dependency.

| Command | Suite | Covers |
|---------|-------|--------|
| `npm test` | `src/lib/search.test.ts` | Trip availability and route matching |
| `npm run test:qa` | `src/lib/qa.test.ts` | Verification gates, vehicle approval, booking/cargo formatting, routing |
| `npm run test:form` | `src/lib/posttrip.test.ts` | Post-trip form validation wiring |

```bash
npm test
npm run test:qa
npm run test:form
npm run typecheck    # tsc -b
npm run lint         # ESLint
```

## Environment & Deployment

Deployed on Vercel (`vercel.json`):

- `npm run build` output in `dist/`.
- SPA rewrite sends non-asset routes to `index.html`.
- Security headers include a Content-Security-Policy. The CSP's `connect-src`
  lists the Supabase host explicitly — update it if you point the app at a
  different project (or add `https://*.supabase.co` to keep it portable).

Add the `VITE_*` variables in the Vercel project settings before deploying.

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/amazing-feature`.
3. Commit your changes.
4. Push the branch and open a Pull Request.

## License

MIT.
