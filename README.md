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
| PDF          | @react-pdf/renderer v4                             |
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
│   └── pdf/                # Invoice PDF components
├── db/
│   └── migrations/         # SQL migration files
├── features/               # Feature-based modules
│   ├── auth/               # Authentication
│   ├── customers/          # Customer CRUD
│   ├── vehicles/           # Vehicle CRUD
│   ├── jobs/               # Job/Estimate CRUD
│   ├── line-items/         # Line items management
│   ├── settings/           # Shop settings
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
- **shop_settings** — Shop configuration (single row, stores shop name/address/contact/logo)

### Key Design Decisions

- **Customer table separate from Job** — Repeat customers don't require retyping
- **Service history timeline** — Vehicles link to all their jobs
- **Inventory flag** — Line items can later link to stocked parts (`is_inventory` column)
- **Auto estimate numbering** — Format: `YY-MMDD-XXXXX` (e.g., `26-0716-00001`)
- **Discount support** — Per-job overall discount and per-line-item discount with type (percentage/fixed)
- **Audit logs** — `created_at`, `updated_at`, `created_by`, `updated_by` on every table
- **Soft deletes** — `deleted_at` column instead of permanent removal
- **Row Level Security** — All tables have RLS policies for authenticated users
- **Database migrations** — SQL files managed from day one
- **Unit combobox** — Free-text unit input with predefined dropdown (pc, L, mL, kg, hr, etc.)

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

Apply migrations via Supabase SQL editor in order:

1. `src/db/migrations/00001_initial_schema.sql` — Core schema
2. `src/db/migrations/00002_line_items_enhancements.sql` — Discount columns on jobs & line_items

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
4. Apply database migrations to your Supabase project (in order)
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
- [x] Customer CRUD with soft delete, vehicle count display
- [x] Vehicle CRUD with customer association
- [x] Job/Estimate CRUD with auto numbering (YY-MMDD-XXXXX)
- [x] Line items with auto totals, category subtotals, and discount support
- [x] Duplicate/Copy estimate with line items
- [x] Professional invoice PDF generation with shop branding
- [x] One-click PDF download with auto-named file
- [x] PDF preview page (inline viewer + download)
- [x] Shop settings management (name, address, contact, logo)
- [x] Unit combobox with free-text and predefined options
- [x] Job-level and line-item discount fields
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
