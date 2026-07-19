# TalyerLedger

A modern repair estimate, invoice, payment, and vehicle record management system for automotive and machine repair shops.

## Architecture

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | TailwindCSS v4 + shadcn/ui |
| Forms | React Hook Form 7 + Zod 3 |
| Data Fetching | TanStack Query v5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (SSR) |
| PDF | @react-pdf/renderer 4 |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Hosting | Vercel |

### Folder Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth pages (login, register)
│   ├── (dashboard)/          # Dashboard pages (customers, vehicles, jobs, settings)
│   └── auth/callback/        # OAuth callback route
├── components/
│   ├── ui/                   # 21 shadcn/ui components
│   ├── layout/               # Sidebar, header, dashboard shell
│   ├── forms/                # Shared form components
│   └── pdf/                  # Invoice PDF components (react-pdf)
├── db/
│   └── migrations/           # 8 SQL migration files
├── features/                 # Feature-based modules
│   ├── auth/                 # Authentication (login, register, logout)
│   ├── customers/            # Customer CRUD + restore
│   ├── vehicles/             # Vehicle CRUD + restore + timeline
│   ├── work-orders/          # Work Order CRUD + copy + restore
│   ├── line-items/           # Line items CRUD + sync
│   ├── payments/             # Payment CRUD (deposit/regular)
│   ├── labor-catalog/        # Labor items CRUD + picker
│   ├── service-packages/     # Service packages CRUD + picker
│   ├── attachments/          # Digital evidence: upload, gallery, viewer, before/after, drop-off, vehicle/job/line-item galleries
│   ├── search/               # Global search (Ctrl+K)
│   └── settings/             # Shop settings + catalog/packages UI
├── hooks/                    # Shared hooks
├── lib/
│   ├── supabase/             # Supabase client (browser, server, middleware)
│   ├── storage/service.ts    # Abstracted StorageService (Supabase, ready for Cloudflare R2)
│   ├── image/processor.ts    # Client-side image processing (resize, strip EXIF, thumbnail, validate)
│   ├── types.ts              # TypeScript interfaces
│   ├── utils.ts              # cn(), formatCurrency, formatDate, estimate_no
│   └── constants.ts          # Enums, statuses, units, events, attachment categories
├── middleware.ts             # Auth middleware (session refresh + redirect)
└── proxy.ts                  # Next.js 16 proxy
```

## Database Schema

### Entity Relationship

```
customers (1) ───< vehicles (N)
    │                    │
    └──< work_orders (N) ┘
            │
            ├──< line_items (N)
            ├──< payments (N)
            ├──< documents (N)
            ├──< activity_logs (N)
            ├──< attachments (N)
            └──< notifications (N)

work_orders — self-ref via linked_work_order_id
service_packages (1) ───< package_items (N)
shop_settings (single row)
```

### Tables

| Table | Description |
|---|---|
| `customers` | Client records with soft delete |
| `vehicles` | Vehicle records linked to customers |
| `work_orders` | Estimates, repair orders, invoices (renamed from `jobs`) |
| `line_items` | Individual line items by category with discount support |
| `payments` | Payment ledger (deposit/regular) |
| `documents` | Generated PDF document tracking |
| `activity_logs` | Event timeline with JSONB metadata |
| `attachments` | Polymorphic file attachments (replaces `photos`) |
| `notifications` | Event-based notification records |
| `labor_items` | Reusable labor catalog for quick insertion |
| `service_packages` | Bundled services with multiple package_items |
| `package_items` | Individual items within a service package |
| `shop_settings` | Single-row shop configuration |

### Key Design Decisions

- **Work orders separate from customers** — Repeat customers don't require retyping
- **Service history timeline** — Vehicles link to all their work orders
- **Inventory flag** — Line items can later link to stocked parts (`is_inventory` column)
- **Auto estimate numbering** — Format: `YY-MMDD-XXXXX` (e.g., `26-0716-00001`)
- **Discount support** — Per-order overall discount and per-line-item discount (amount/percent)
- **Labor Catalog** — Predefined reusable services for one-click insertion
- **Service Packages** — Multi-line bundles (e.g., oil change, tune-up) with bulk insertion
- **Audit logs** — `created_at`, `updated_at`, `created_by`, `updated_by` on every table
- **Soft deletes** — `deleted_at` column instead of permanent removal
- **Row Level Security** — All tables have RLS policies for authenticated users
- **Database migrations** — 8 SQL files managed from day one
- **Unit combobox** — Free-text unit input with predefined dropdown
- **Repair Documentation** — Client-side image processing (resize 1920px, strip EXIF/GPS, 400px thumbnail, MIME validation)
- **Storage abstraction** — `StorageService` interface for Supabase Storage with signed URLs; ready for Cloudflare R2 migration
- **Drop-off inspection** — Condition notes, representative info, category-based photo galleries per work order
- **PDF photo appendix** — Optional photo appendix page in generated PDFs with 6 images per A4 page

## Running Migrations

Apply via Supabase SQL editor in order:

1. `00001_initial_schema.sql` — Core schema
2. `00002_line_items_enhancements.sql` — Discount columns
3. `00003_photos_audit_storage.sql` — Photos, audit, storage RLS
4. `00004_v2_enhancements.sql` — Voided status, insurance, payments
5. `00005_work_order_document_attachment.sql` — Rename jobs→work_orders, attachments
6. `00006_status_workflow_internal_notes.sql` — Status workflow, internal notes
7. `00007_notifications_labor_packages.sql` — Notifications, labor catalog, packages
8. `00008_repair_documentation.sql` — Repair documentation & digital evidence (evolve attachments, drop-off inspection, photo appendix)

## Environment Variables

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

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

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Features

### Core CRUD
- [x] Authentication (login/register/logout) with Supabase SSR
- [x] Customer CRUD with soft delete, vehicle count display
- [x] Vehicle CRUD with customer association, cover photo
- [x] Work Order CRUD with auto numbering (YY-MMDD-XXXXX)
- [x] Line items with auto totals, category subtotals, discount support
- [x] Duplicate/Copy work order with line items
- [x] Payment ledger with deposit/regular types

### PDF & Documents
- [x] Professional PDF generation with shop branding
- [x] PDF labels: "Service Estimate", "Statement of Account", "Payment Acknowledgment"
- [x] Business registration fields (TIN, DTI/BN, Permit) on PDF
- [x] PDF preview page with inline viewer + download

### Settings
- [x] Shop information (name, address, contact, logo, email)
- [x] Business registration (TIN, DTI/BN, Business Permit)
- [x] Labor Catalog CRUD (reusable services, one-click insertion)
- [x] Service Packages CRUD (multi-line bundles, bulk insertion)
- [x] Notification event toggles

### Status Workflow
- [x] 8 statuses: draft → estimate → approved → in_progress → completed → released → closed + voided
- [x] STATUS_TRANSITIONS enforced in form select
- [x] Payment status auto-derived from payments
- [x] Internal notes (staff-only, excluded from PDF)

### Vehicle Timeline
- [x] Visual vertical timeline on vehicle detail page
- [x] Shows work orders grouped by date with status badges

### Repair Documentation & Digital Evidence
- [x] Client-side image processing: resize (1920px), strip EXIF/GPS, compress, generate 400px thumbnail
- [x] MIME validation (JPG, PNG, WebP) and 10MB size enforcement
- [x] Camera-first mobile upload with drag-and-drop desktop support
- [x] 12 attachment categories (before, during, after, damage, vehicle_overview, odometer, vin, plate_number, authorization_letter, tool_condition_out, tool_condition_in, other)
- [x] Full-screen lightbox viewer with zoom and keyboard navigation
- [x] Before/after slider comparison with side-by-side mode
- [x] Vehicle gallery with per-category tabs
- [x] Job gallery with sectioned cards per category
- [x] Line-item evidence inline gallery
- [x] Drop-off inspection form (condition notes, representative info, category photos, auth docs)
- [x] Timeline integration (attachment upload creates activity_log event)
- [x] Optional PDF photo appendix (6 images per A4 page)
- [x] Storage abstraction via `StorageService` interface (Supabase, ready for Cloudflare R2)
- [x] Signed URLs only — no public bucket exposure
- [x] RLS policies on attachments table (select/insert/update/delete)
- [x] Auto-created private storage bucket with 10MB file size limit

### UI/UX
- [x] Responsive dashboard with collapsible sidebar
- [x] Global search (Ctrl+K) — customers, plates, VIN, estimate numbers
- [x] Skeleton loaders and empty states on all pages
- [x] Dark mode support
- [x] Toast notifications
- [x] Soft deletes on all tables with RLS

## License

Private — All rights reserved.
