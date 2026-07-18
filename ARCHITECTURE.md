# TalyerLedger — Architecture & Implementation Guide

> **Version:** 2.2.0  
> **Stack:** Next.js 16 + React 19 + Supabase + TypeScript  
> **Status:** v2 Features Complete — Labor Catalog / Service Packages / Vehicle Timeline / Notifications / Settings Management

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Component Library](#6-component-library)
7. [Data Flow](#7-data-flow)
8. [Phase 0 & Phase 1 Completion](#8-phase-0--phase-1-completion)
9. [Migration Summary](#9-migration-summary)
10. [Build Verification](#10-build-verification)

---

## 1. Project Overview

TalyerLedger is a repair estimate, invoice, and vehicle record management system for automotive/machine repair shops. It provides complete CRUD for customers, vehicles, and work orders (formerly "jobs") with soft deletes, audit trails, and Row Level Security.

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
| Theme | next-themes |

---

## 2. Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 16                        │
│  ┌──────────────────────────────────────────────┐   │
│  │            App Router (src/app/)              │   │
│  │  ┌──────────┐  ┌──────────────────────┐      │   │
│  │  │ (auth)   │  │    (dashboard)        │      │   │
│  │  │  /login  │  │  /customers/*         │      │   │
│  │  │ /register│  │  /vehicles/*          │      │   │
│  │  └──────────┘  │  /jobs/*              │      │   │
│  │                │  /settings             │      │   │
│  │                └──────────────────────┘      │   │
│  └──────────────────────────────────────────────┘   │
│                          │                          │
│  ┌──────────────────────────────────────────────┐   │
│  │           Feature Modules (src/features/)     │   │
│  │  ┌─────────┐ ┌──────────┐ ┌───────┐         │   │
│  │  │ actions │ │ schemas  │ │ hooks │         │   │
│  │  │  (data  │ │  (Zod    │ │(Query │         │   │
│  │  │ access) │ │validation│ │+Mutation)        │   │
│  │  └─────────┘ └──────────┘ └───────┘         │   │
│  └──────────────────────────────────────────────┘   │
│                          │                          │
│  ┌──────────────────────────────────────────────┐   │
│  │           Supabase Backend                    │   │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐   │   │
│  │  │PostgreSQL│ │   Auth   │ │  Storage   │   │   │
│  │  │  (RLS)   │ │  (SSR)   │ │ (bucket)   │   │   │
│  │  └──────────┘ └──────────┘ └────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
User Action
    │
    ▼
React Component (page.tsx)
    │
    ▼
Feature Hook (useCustomers, useVehicles, etc.)
    ├── useQuery (reads)
    └── useMutation (writes)
            │
            ▼
Feature Action (actions.ts)
    ├── createClient() → Supabase browser client
    ├── Supabase query (.select, .insert, .update)
    └── Zod validation via schemas.ts
            │
            ▼
Supabase (RLS enforced)
    ├── PostgreSQL tables
    ├── Triggers: created_by/updated_by, updated_at
    └── Soft deletes via deleted_at
```

### Auth Flow (Middleware)

```
Request → Next.js Edge
    │
    ▼
src/middleware.ts
    │
    ▼
src/lib/supabase/middleware.ts (updateSession)
    ├── Reads cookies → creates Supabase server client
    ├── Calls supabase.auth.getUser()
    ├── No user & not on /login or /register → redirect to /login
    └── Has user & on /login or /register → redirect to /
```

---

## 3. Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Login page (public route group)
│   ├── (auth)/register/          # Register page
│   ├── (dashboard)/              # Protected route group
│   │   ├── customers/            # List, detail, new, edit
│   │   ├── vehicles/             # List, detail, new, edit
│   │   ├── jobs/                 # List, detail, new, edit, PDF (route path, feature is work-orders)
│   │   ├── settings/             # Shop settings
│   │   ├── layout.tsx            # DashboardShell wrapper
│   │   └── page.tsx              # Dashboard (stats, recent items, search)
│   ├── auth/callback/            # OAuth callback route
│   ├── layout.tsx                # Root layout (providers, toaster)
│   └── globals.css               # Tailwind + CSS variables
├── components/
│   ├── forms/                    # Reusable form wrappers (Form, FormField, etc.)
│   ├── layout/                   # DashboardShell, Header, Sidebar
│   ├── pdf/                      # Work Order PDF generation (react-pdf) — Service Estimate / Statement of Account / Payment Acknowledgment
│   └── ui/                       # 19 shadcn/ui components
├── db/migrations/                # 7 SQL migration files
├── features/
│   ├── auth/                     # Login, register, logout
│   ├── customers/                # Customer CRUD + restore
│   ├── vehicles/                 # Vehicle CRUD + restore + timeline component
│   ├── work-orders/              # Work Order CRUD + copy + restore (renamed from jobs)
│   ├── line-items/               # Line items CRUD + sync (FK: work_order_id)
│   ├── payments/                 # Payment CRUD (actions, hooks, form, list) (FK: work_order_id)
│   ├── labor-catalog/            # Labor items CRUD + picker for work order form
│   ├── service-packages/         # Service packages CRUD + picker for work order form
│   ├── search/                   # Global search command palette
│   └── settings/                 # Shop settings CRUD + settings-tabs (catalog, packages, notifications)
├── hooks/
│   ├── use-media-query.ts        # Responsive breakpoint hook
│   └── use-toast.ts              # Toast notification hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (SSR)
│   │   └── middleware.ts         # Session refresh + auth redirect
│   ├── env.ts                    # Zod environment validation
│   ├── types.ts                  # TypeScript interfaces
│   ├── utils.ts                  # cn(), formatCurrency, estimate numbers
│   └── constants.ts              # Enums, statuses, units
└── middleware.ts                 # Next.js middleware entry point
```

---

## 4. Database Schema

### Entity Relationship Diagram (Text)

```
customers (1) ───< vehicles (N)
    │                    │
    └──< work_orders (N) ┘
            │
            ├──< line_items (N)
            ├──< payments (N)
            ├──< documents (N)
            ├──< activity_logs (N)
            └──< attachments (N)

work_orders — self-ref via linked_work_order_id

shop_settings (single row)
```

### Tables

| Table | Key Fields | Relationships |
|---|---|---|
| `customers` | `id (UUID PK)`, `name`, `email`, `phone`, `address`, `notes`, `deleted_at` | FK to `vehicles`, `work_orders` |
| `vehicles` | `id (UUID PK)`, `customer_id`, `make`, `model`, `year`, `engine`, `transmission`, `vin`, `plate`, `color`, `cover_photo`, `deleted_at` | FK → `customers` |
| `work_orders` | `id (UUID PK)`, `estimate_no (UNIQUE)`, `vehicle_id`, `customer_id`, `status`, `payer_type`, `insurance_company`, `insurance_policy_no`, `insurance_claim_no`, `linked_work_order_id`, `date`, `currency`, `deleted_at` | FK → `vehicles`, `customers`, `work_orders` (self-ref) |
| `line_items` | `id (UUID PK)`, `work_order_id`, `category`, `item`, `quantity`, `unit_price`, `line_total`, `is_inventory`, `deleted_at` | FK → `work_orders` (CASCADE) |
| `payments` | `id (UUID PK)`, `work_order_id`, `date`, `amount`, `payment_method`, `payment_type`, `reference_number`, `deleted_at` | FK → `work_orders` (RESTRICT) |
| `documents` | `id (UUID PK)`, `work_order_id`, `document_type`, `label`, `generated_at`, `file_url`, `created_by` | FK → `work_orders` |
| `activity_logs` | `id (UUID PK)`, `work_order_id`, `event`, `description`, `metadata (jsonb)`, `created_by` | FK → `work_orders` |
| `attachments` | `id (UUID PK)`, `parent_type`, `parent_id`, `file_url`, `file_type`, `file_name`, `file_size`, `notes` | Polymorphic via parent_type+parent_id |
| `shop_settings` | `id (UUID PK)`, `shop_name`, `address`, `contact`, `email`, `tin`, `dti_bn`, `business_permit`, `tax_id` | Single-row config |

### Common Columns

All core tables include:
- `created_at TIMESTAMPTZ DEFAULT now()` — set on INSERT
- `updated_at TIMESTAMPTZ DEFAULT now()` — auto-updated via trigger
- `deleted_at TIMESTAMPTZ` — soft delete marker (NULL = active)
- `created_by UUID REFERENCES auth.users` — set via trigger on INSERT
- `updated_by UUID REFERENCES auth.users` — set via trigger on UPDATE

### RLS Policies

All tables have `ENABLE ROW LEVEL SECURITY` with:
- **SELECT:** Authenticated users (active records only where applicable)
- **INSERT:** Authenticated users
- **UPDATE:** Authenticated users
- **Storage:** 4 policies on `photos` bucket (SELECT, INSERT, UPDATE, DELETE)

### Work Order Status Enum

```
draft → estimate → approved → invoiced → partially_paid → paid → closed
voided (can be set from any status to mark work order as cancelled/void)
```

### Estimate Number Format

`YY-MMDD-000001` — auto-generated with yearly reset.

Example: `26-0717-000042` (42nd work order in 2026)

---

## 5. Authentication & Authorization

### Implementation

| Feature | Location |
|---|---|
| Login form | `src/features/auth/components/login-form.tsx` |
| Register form | `src/features/auth/components/register-form.tsx` |
| Auth actions | `src/features/auth/actions.ts` (signIn, signUp, signOut) |
| Auth hooks | `src/features/auth/hooks/use-auth.ts` (useUser, useSignIn, useSignOut) |
| Session refresh | `src/lib/supabase/middleware.ts` (cookie-based SSR) |
| Middleware entry | `src/middleware.ts` (Next.js auto-detected) |
| Auth callback | `src/app/auth/callback/route.ts` (OAuth code exchange) |

### Session Flow

1. User logs in via email/password → Supabase sets HTTP-only cookies
2. Every request hits `src/middleware.ts` → refreshes session via `updateSession()`
3. Unauthenticated users redirected to `/login`
4. Authenticated users on `/login` or `/register` redirected to `/`
5. Server components use `createServerSupabaseClient()` for SSR-safe queries
6. Client components use `createClient()` from `@/lib/supabase/client`

---

## 6. Component Library

### UI Components (21 total — shadcn/ui)

```
alert-dialog    avatar      badge       button
card            checkbox    command     dialog
dropdown-menu   input       label       popover
scroll-area     select      separator   skeleton
switch          table       tabs        textarea
toast
```

### Form Components (custom)

Located in `src/components/forms/index.tsx`:
- `Form` — FormProvider wrapper
- `FormField` — react-hook-form Controller wrapper with context
- `FormItem` — field container
- `FormLabel` — accessible label with error styling
- `FormControl` — aria attributes provider
- `FormDescription` — help text
- `FormMessage` — error message display

### Layout Components

- `DashboardShell` — sidebar + header + main content
- `Sidebar` — navigation with mobile overlay
- `Header` — search command + user menu + sign out

---

## 7. Data Flow

### Read Pattern

```
Component
  → Hook (useQuery)
    → Action (getCustomers)
      → Supabase client (createClient)
        → .from('table').select().is('deleted_at', null)
```

### Write Pattern

```
Component → Form (react-hook-form + zodResolver)
  → onSubmit
    → Hook (useMutation)
      → Action (createCustomer)
        → Supabase client
          → .from('table').insert(data)
```

### Cache Strategy

- **TanStack Query** configured in `src/components/providers.tsx`
- `staleTime: 30_000` (30 seconds)
- `retry: 1`
- `refetchOnWindowFocus: false`
- Mutations invalidate related query keys on success

---

## 8. Phase 0 & Phase 1 Completion

### Phase 0 — Architecture Verification

| Requirement | Status | Notes |
|---|---|---|
| Feature-based folder structure | ✅ | `src/features/` per module |
| Next.js App Router + route groups | ✅ | `(auth)` + `(dashboard)` |
| TanStack Query globally | ✅ | `src/components/providers.tsx` |
| React Hook Form + Zod | ✅ | Every form uses both |
| TypeScript strict mode | ✅ | `"strict": true` |
| ESLint configured | ✅ | `eslint.config.mjs` |
| Prettier configured | ✅ | `.prettierrc` |
| Environment validation | ✅ | `src/lib/env.ts` |
| Shared UI components | ✅ | 19 shadcn/ui |
| Reusable form components | ✅ | `src/components/forms/` |
| UUID PKs, FKs, indexes | ✅ | Migration 00001 |
| Created_at, updated_at, deleted_at | ✅ | All tables |
| Created_by, updated_by | ✅ | triggers + migration 00003 |
| Soft deletes | ✅ | `deleted_at IS NULL` pattern |
| RLS on all tables | ✅ | 7 tables + storage |
| Customer/Vehicle/Job/Payment/LineItem/Photo | ✅ | All tables |
| Migrations in repo | ✅ | 3 files |
| Estimate number YY-MMDD-000001 | ✅ | Yearly reset via `.gte('created_at')` |
| Auth (login, logout, session, protected) | ✅ | Supabase SSR + middleware |
| Auth proxy/middleware | ✅ | `src/middleware.ts` |

### Phase 1 — Foundation

| Requirement | Status | Notes |
|---|---|---|---|
| Login/Logout/Session/Protected | ✅ | Middleware renamed to `middleware.ts` |
| Customer CRUD + soft delete + restore | ✅ | All operations + `restoreCustomer()` |
| Vehicle CRUD + soft delete + restore | ✅ | All operations + `restoreVehicle()` |
| Work Order CRUD + soft delete + restore | ✅ | All operations + `restoreWorkOrder()` + copy (renamed from Job) |
| All work order statuses in tabs | ✅ | draft, estimate, approved, invoiced, partially_paid, paid, closed |
| Cover photo in vehicle form | ✅ | URL input + detail page display |
| Dashboard — Recent Work Orders | ✅ | Top 5 with links |
| Dashboard — Recent Vehicles | ✅ | Top 5 with links and details |
| Dashboard — Outstanding Work Orders | ✅ | Non-paid/non-closed with links |
| Dashboard — Revenue Summary | ✅ | Total from invoiced + paid work orders |
| Dashboard — Quick Actions | ✅ | Create Estimate, Add Vehicle, Add Customer |
| Global Search | ✅ | Ctrl+K command palette (customer, plate, VIN, estimate) |
| Toast notifications | ✅ | `use-toast` hook + `Toaster` in root layout |
| Responsive layout | ✅ | Mobile sidebar + responsive grid |
| Dark mode | ✅ | `next-themes` with CSS variables |
| Skeleton loading | ✅ | All tables, detail pages, forms |
| Empty states | ✅ | All list and detail pages |
| Accessible forms | ✅ | Labels, error messages, aria attributes |
| Build — 0 lint errors | ✅ | 5 non-blocking warnings (React Compiler) |
| Build — 0 TypeScript errors | ✅ | `tsc --noEmit` passes |

### v2 Enhancements

| Requirement | Status | Notes |
|---|---|---|
| Voided status | ✅ | Added to enum, JOB_STATUSES, job list tabs, filtered from dashboard |
| Payer type (customer/insurance/both) | ✅ | `payer_type` on work_orders table + form + detail display |
| Insurance fields | ✅ | `insurance_company`, `insurance_policy_no`, `insurance_claim_no` on work_orders |
| Linked work order (self-referencing FK) | ✅ | `linked_work_order_id` on work_orders, shown in detail with link |
| Payment type (deposit/regular) | ✅ | `payment_type` on payments table + form |
| Payments module (full CRUD) | ✅ | actions, schemas, hooks, form, list — replaces placeholder |
| PDF labeling | ✅ | "Service Estimate" for draft/estimate, "Payment Acknowledgment" for paid, "Statement of Account" for others |
| Business Registration fields | ✅ | TIN, DTI/BN, Business Permit in shop_settings + settings UI + PDF |
| Migration 00004 | ✅ | All schema changes reversible |

### v2 Structural Redesign

| Requirement | Status | Notes |
|---|---|---|
| Rename `jobs` → `work_orders` | ✅ | Table, feature folder, all TypeScript types renamed; backward-compat `type Job = WorkOrder` alias |
| Rename FK columns | ✅ | `job_id` → `work_order_id` on `line_items`, `payments`; `linked_job_id` → `linked_work_order_id` on `work_orders` |
| `documents` table | ✅ | Printable document records with `work_order_id`, `document_type`, `label`, `generated_at`, `file_url` — UI not yet built |
| `activity_logs` table | ✅ | Event timeline with `work_order_id`, `event`, `description`, `metadata (jsonb)` — UI not yet built |
| `attachments` table | ✅ | Polymorphic attachments replacing `photos` table: `parent_type` + `parent_id`, `file_url`, `file_type`, `file_name`, `file_size` |
| Migration 00005 | ✅ | Full reversible migration: rename jobs→work_orders, indexes/triggers renamed, new tables with RLS |

### v2 Features (Phase 2)

| Feature | Priority | Notes |
|---|---|---|
| Internal Notes | ✅ | `internal_notes` column on work_orders, form field, detail view, excluded from PDF |
| Status Workflow | ✅ | New statuses (draft→estimate→approved→in_progress→completed→released→closed+voided), transition map (`STATUS_TRANSITIONS`), status select respects transitions in form + detail |
| Payment Status | ✅ | `payment_status` column (unpaid/partial/paid/refund) auto-derived from payments via `recalculatePaymentStatus()`, also settable in form |
| Vehicle Timeline | ✅ | Visual vertical timeline grouped by year on vehicle detail page, shows estimate_no + line item summary + status badge, replaces old table |
| Notifications DB Schema | ✅ | `notifications` table with event_type, title, message, metadata (jsonb), is_read, RLS — delivery is future |
| Labor Catalog | ✅ | `labor_items` table; reusable catalog with CRUD UI in Settings → Labor Catalog tab; "From Catalog" picker in work order form inserts one click |
| Service Packages | ✅ | `service_packages` + `package_items` tables; CRUD UI in Settings → Service Packages tab; "From Package" picker inserts multiple line items |

### Migration 00006 — Status Workflow + Internal Notes

| Change | Details |
|---|---|
| `work_orders.internal_notes` | New TEXT column for staff-only notes (never in PDF) |
| `work_orders.payment_status` | New TEXT column with CHECK constraint: unpaid/partial/paid/refund, default 'unpaid' |
| Status enum replacement | Old `job_status` (draft/estimate/approved/invoiced/partially_paid/paid/closed/voided) → new `work_order_status` (draft/estimate/approved/in_progress/completed/released/closed/voided) |
| Status mapping | `invoiced`/`partially_paid` → `completed`, `paid` → `released`, others preserved |
| `STATUS_TRANSITIONS` | Defines allowed transitions: draft→estimate→approved→in_progress→completed→released→closed; voided is terminal |
| `PAYMENT_STATUSES` | Updated to: unpaid, partial, paid, refund (replaces overpaid) |
| Auto-derivation | `recalculatePaymentStatus()` in payment actions updates `work_orders.payment_status` after create/update/delete |

---

## 9. Migration Summary

| File | Description | Status |
|---|---|---|
| `00001_initial_schema.sql` | Core schema: 4 enums, 7 tables, RLS, triggers, indexes | Applied |
| `00002_line_items_enhancements.sql` | Discount columns: discount_type, discount_value | Applied |
| `00003_photos_audit_storage.sql` | Photos updated_at/updated_by, shop_settings created_by, storage RLS | Applied |
| `00004_v2_enhancements.sql` | Voided status (enum), payer_type, insurance_*, linked_job_id on jobs; payment_type on payments; TIN/DTI/permit on shop_settings | Applied |
| `00005_work_order_document_attachment.sql` | Rename jobs→work_orders, FK column renames (job_id→work_order_id, linked_job_id→linked_work_order_id), indexes/triggers renamed; new tables: documents, activity_logs, attachments (polymorphic, replaces photos) | Applied |
| `00006_status_workflow_internal_notes.sql` | Add internal_notes + payment_status to work_orders; replace status enum with new workflow (in_progress, completed, released); STATUS_TRANSITIONS; auto-derive payment_status | Applied |
| `00007_notifications_labor_packages.sql` | Create notifications, labor_items, service_packages, package_items tables with RLS | Applied |

### Migration Order

```sql
-- Run sequentially in Supabase SQL Editor
-- 1. 00001 (initial schema)
-- 2. 00002 (line_items enhancements)
-- 3. 00003 (photos, audit, storage)
-- 4. 00004 (v2 enhancements — MUST be applied before 00005)
-- 5. 00005 (work_order, document, attachment)
-- 6. 00006 (status workflow + internal notes)
-- 7. 00007 (notifications, labor catalog, service packages)
```

---

## 10. Build Verification

### Current Status

```
npm run lint       → 0 errors, 5 warnings (React Compiler compatibility)
npx tsc --noEmit   → 0 errors
```

### The 5 warnings are all pre-existing and non-blocking:
- 1x `react-hooks/exhaustive-deps` — `lineItems` in useMemo deps
- 4x `react-hooks/incompatible-library` — React Hook Form `watch()` is not memoizable by React Compiler

### Package Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server (webpack) |
| `npm run build` | Production build (webpack) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Future Feature Readiness

| Feature | Current Support |
|---|---|---|
| Inventory | ✅ `is_inventory` on line_items |
| Attachments (replaces photos) | ✅ `attachments` table (polymorphic), `photos` table deprecated; storage bucket + UI not yet built |
| Document printing / PDF | ✅ `documents` table schema for tracking generated PDFs; PDF generation via react-pdf; UI for document list not yet built |
| Activity Timeline | ✅ `activity_logs` table with metadata (jsonb); UI not yet built |
| Payments ledger | ✅ Full CRUD with payment_type (deposit/regular) |
| Business Registration | ✅ TIN, DTI/BN, Business Permit on settings + PDF |
| Voided Work Orders | ✅ Voided status, excluded from dashboard, filtered in list |
| Insurance/Warranty | ✅ payer_type, insurance_company, policy_no, claim_no |
| Linked Work Orders | ✅ Self-referencing FK on work_orders, displayed in detail |
| Document Labels | ✅ `getDocumentLabel()` resolves to "Service Estimate", "Statement of Account", "Payment Acknowledgment" by status |
| Vehicle Timeline | ✅ Visual timeline on vehicle detail page, grouped by date |
| Labor Catalog | ✅ CRUD in Settings, picker in work order form |
| Service Packages | ✅ CRUD in Settings, multi-line picker in work order form |
| Notifications Schema | ✅ `notifications` table with RLS, events in Settings UI |
| Status Workflow | ✅ D→E→A→IP→C→R→Cl + voided, STATUS_TRANSITIONS enforced |
| Internal Notes | ✅ `internal_notes` field, excluded from PDF |
| Multiple users | ⚠️ Single-tenant RLS; needs tenant_id |
| Multiple workshops | ⚠️ Single shop_settings; needs workshop_id |
| VIN scanning | ⚠️ VIN field exists |
| Plate OCR | ⚠️ Plate field exists |
| Mobile app | ⚠️ Responsive; needs Capacitor (Phase 5) |
| Desktop app | ⚠️ Needs Tauri (Phase 5) |
| PWA | ⚠️ Needs manifest + service worker |
