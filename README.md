# Kapes - Vehicle Capacity Marketplace

A platform connecting drivers with unused vehicle capacity to customers needing shipping space. Reduce empty runs, lower shipping costs, and build trust in logistics.

## Overview

Kapes is a marketplace that matches **unused vehicle capacity** (return trips, partially loaded vehicles) with **shipping demand**. Drivers post their routes and available space; customers search and book space for their shipments.

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Routing** | React Router DOM v6 |
| **State Management** | TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod validation |
| **UI Components** | Radix UI primitives + shadcn/ui patterns |
| **Styling** | Tailwind CSS v3 + CSS Variables (light/dark mode) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Backend/Database** | Supabase (PostgreSQL, Auth, Realtime) |
| **Date Handling** | date-fns, React Day Picker |
| **Build/Lint** | ESLint, TypeScript, SWC |

## Project Structure

```
src/
├── App.tsx                 # App routes (Home, 404)
├── main.tsx                # Entry point (providers, router)
├── index.css               # Tailwind + CSS variables (theme)
├── lib/
│   └── utils.ts            # cn() helper (clsx + tailwind-merge)
├── components/
│   └── ui/                 # shadcn/ui components (button, card, toast, etc.)
├── pages/
│   ├── Home.tsx            # Landing page
│   └── NotFound.tsx        # 404 page
├── hooks/
│   └── use-toast.ts        # Toast hook
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```
Runs on `http://localhost:8080`

### Build

```bash
npm run build        # Production build
npm run build:dev    # Development build
```

### Lint

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note:** Supabase is installed but not yet integrated. These variables will be needed when implementing auth, database, and realtime features.

## Current Features (Implemented)

- [x] Landing page with hero, how-it-works, value props, CTAs
- [x] Responsive design with Tailwind CSS
- [x] Light/dark mode support (via CSS variables)
- [x] shadcn/ui component library (Button, Card, Toast, Tooltip, etc.)
- [x] React Router setup with 404 handling
- [x] TanStack Query provider configured
- [x] Toast notifications (Sonner + custom Toaster)
- [x] TypeScript + ESLint + Prettier configuration

## Planned Features (Not Yet Implemented)

### Core Marketplace
- [ ] Driver: Post trip/capacity (route, vehicle type, capacity, pricing, dates)
- [ ] Customer: Search capacity (pickup, dropoff, date, shipment details)
- [ ] Matching algorithm (route overlap, capacity fit, timing)
- [ ] Booking flow (request, confirm, payment, tracking)

### Authentication & User Management
- [ ] Supabase Auth (email/password, OAuth)
- [ ] Driver profile (vehicle details, verification, ratings)
- [ ] Customer profile (company, billing, shipment history)
- [ ] Role-based access (driver vs customer dashboards)

### Real-time & Communication
- [ ] Real-time trip updates (Supabase Realtime)
- [ ] In-app messaging between driver/customer
- [ ] Push/email notifications

### Payments & Trust
- [ ] Stripe integration for payments
- [ ] Escrow/hold funds until delivery confirmation
- [ ] Rating & review system
- [ ] Driver verification (license, insurance, vehicle docs)

### Analytics & Admin
- [ ] Driver dashboard (earnings, trips, utilization)
- [ ] Customer dashboard (shipments, costs, savings)
- [ ] Admin panel (users, disputes, platform metrics)

## Design System

### Colors (CSS Variables)
Defined in `src/index.css` using HSL values for full Tailwind integration:
- `primary` - Main brand color (blue)
- `secondary`, `muted`, `accent` - Supporting neutrals
- `destructive` - Error/danger states
- All colors have `foreground` variants for text on colored backgrounds

### Components
All UI components in `src/components/ui/` follow shadcn/ui patterns:
- Built on Radix UI primitives
- Styled with Tailwind + `cn()` utility
- Fully typed with TypeScript
- Support `className` prop for customization
- `asChild` prop for composition (via Radix Slot)

### Adding New Components
```bash
# Example: npx shadcn@latest add dialog
# Then import from "@/components/ui/dialog"
```

## Supabase Schema (Planned)

```sql
-- Users (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users primary key,
  role text check (role in ('driver', 'customer')) not null,
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Drivers (additional info)
create table drivers (
  id uuid references profiles primary key,
  license_number text unique,
  vehicle_type text,
  vehicle_capacity_kg numeric,
  vehicle_dimensions jsonb, -- {length, width, height}
  verified boolean default false,
  rating numeric default 0,
  total_trips int default 0
);

-- Trips/Capacity posts
create table trips (
  id uuid default gen_random_uuid() primary key,
  driver_id uuid references drivers not null,
  origin text not null,
  destination text not null,
  departure_date date not null,
  departure_time time not null,
  available_capacity_kg numeric not null,
  price_per_kg numeric not null,
  status text check (status in ('open', 'matched', 'completed', 'cancelled')) default 'open',
  created_at timestamp with time zone default now()
);

-- Bookings
create table bookings (
  id uuid default gen_random_uuid() primary key,
  trip_id uuid references trips not null,
  customer_id uuid references profiles not null,
  shipment_weight_kg numeric not null,
  shipment_dimensions jsonb,
  pickup_address text not null,
  dropoff_address text not null,
  status text check (status in ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')) default 'pending',
  total_price numeric not null,
  created_at timestamp with time zone default now()
);
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Development build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Deployment

### Vercel (Recommended)
1. Connect GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - feel free to use for your own projects.

## Contact

Project: Kapes - Vehicle Capacity Marketplace