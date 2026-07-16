# TalyerLedger

A modern repair estimate, invoice, payment, and vehicle record management system for automotive and machine repair shops.

## Architecture

### Tech Stack

| Layer        | Technology                                         |
| ------------ | -------------------------------------------------- |
| Frontend     | Next.js 16, React 19, TypeScript                   |
| Styling      | TailwindCSS v4, shadcn/ui                          |
| Forms        | React Hook Form, Zod                               |
| Data Fetching| TanStack Query v5                                  |
| Backend      | Supabase (PostgreSQL, Auth, Storage, REST API)     |
| PDF          | @react-pdf/renderer                                |
| Charts       | Recharts                                           |
| Icons        | Lucide React                                       |
| Hosting      | Vercel                                             |
| Image Store  | Cloudflare R2 (Phase 2)                            |

### Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, register)
│   └── (dashboard)/        # Dashboard pages (customers, vehicles, jobs, settings)
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, header, dashboard shell
│   ├── forms/              # Shared form components
│   └── pdf/                # Invoice PDF component
├── db/
│   └── migrations/         # SQL migration files
├── features/               # Feature-based modules
│   ├── auth/               # Authentication
│   ├── customers/          # Customer CRUD
│   ├── vehicles/           # Vehicle CRUD
│   ├── jobs/               # Job/Estimate CRUD
│   ├── line-items/         # Line items management
│   ├── photos/             # Photo management (Phase 2)
│   └── payments/           # Payment ledger (Phase 3)
├── hooks/                  # Shared hooks
├── lib/
│   ├── supabase/           # Supabase client setup
│   ├── types.ts            # TypeScript type definitions
│   ├── utils.ts            # Utility functions
│   └── constants.ts        # Constants and enums
├── middleware.ts            # Auth middleware (renamed to proxy.ts for Next.js 16)
└── proxy.ts                # Next.js 16 proxy (auth middleware)
```

## Database Schema

### Tables

- **customers** — Client/customer records with soft delete
- **vehicles** — Vehicle records linked to customers
- **jobs** — Estimates, repair orders, and invoices
- **line_items** — Individual line items grouped by category
- **photos** — Repair photos linked to vehicles/jobs/items (Phase 2)
- **payments** — Payment records (Phase 3)
- **shop_settings** — Shop configuration (single row)

### Key Design Decisions

- **Customer table separate from Job** — Repeat customers don't require retyping
- **Service history timeline** — Vehicles link to all their jobs
- **Inventory flag** — Line items can later link to stocked parts (`is_inventory` column)
- **Auto estimate numbering** — Format: `EST-YYYY-XXXXX` (e.g., `EST-2026-00001`)
- **Audit logs** — `created_at`, `updated_at`, `created_by`, `updated_by` on every table
- **Soft deletes** — `deleted_at` column instead of permanent removal
- **Row Level Security** — All tables have RLS policies for authenticated users
- **Database migrations** — SQL files managed from day one

### ERD

```
customers 1──* vehicles
customers 1──* jobs
vehicles  1──* jobs
jobs      1──* line_items
jobs      1──* photos
jobs      1──* payments
vehicles  1──* photos
line_items 1──* photos
```

### Running Migrations

Apply migrations via Supabase SQL editor or by running:

```bash
# Using Supabase CLI (if configured)
supabase db push

# Or manually via SQL editor - copy contents of:
# src/db/migrations/00001_initial_schema.sql
```

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2 (Phase 2)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=talyer-ledger
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env.local` and fill in values
3. Install dependencies: `npm install`
4. Apply database migrations to your Supabase project
5. Run the dev server: `npm run dev`

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start development server       |
| `npm run build`   | Production build                |
| `npm run start`   | Start production server         |
| `npm run lint`    | Run ESLint                     |

## Phase 1 Features (Complete)

- [x] Authentication (login/register/logout)
- [x] Customer CRUD with soft delete
- [x] Vehicle CRUD with customer association
- [x] Job/Estimate CRUD with auto numbering (EST-YYYY-XXXXX)
- [x] Line items with auto totals and category subtotals
- [x] Professional invoice PDF generation
- [x] Responsive dashboard UI with sidebar
- [x] Mobile-first layout with collapsible sidebar
- [x] Skeleton loaders and empty states
- [x] Soft deletes on all tables
- [x] Audit trails (created_by, updated_by)
- [x] RLS policies on all tables
- [x] Database migrations

## Phase 2 (Planned)

- [ ] Photo management with camera capture
- [ ] Image compression and EXIF removal
- [ ] Before/after comparisons
- [ ] Photo gallery

## Phase 3 (Planned)

- [ ] Payment ledger with partial payments
- [ ] Running balance
- [ ] Automatic status updates

## Phase 4 (Planned)

- [ ] Dashboard analytics and charts
- [ ] Search and filters
- [ ] CSV export
- [ ] Shareable read-only receipts

## Phase 5 (Planned)

- [ ] Capacitor (Android)
- [ ] Tauri (Desktop)
- [ ] PWA support

## License

Private — All rights reserved.
