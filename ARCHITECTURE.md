# TalyerLedger — Architecture & Implementation Guide

> **Version:** 1.0.0  
> **Stack:** Next.js 16 + React 19 + Supabase + TypeScript  
> **Status:** Phase 1 Complete — Ready for Phase 2

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

TalyerLedger is a repair estimate, invoice, and vehicle record management system for automotive/machine repair shops. It provides complete CRUD for customers, vehicles, and jobs with soft deletes, audit trails, and Row Level Security.

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
│   │   ├── jobs/                 # List, detail, new, edit, PDF
│   │   ├── settings/             # Shop settings
│   │   ├── layout.tsx            # DashboardShell wrapper
│   │   └── page.tsx              # Dashboard (stats, recent items, search)
│   ├── auth/callback/            # OAuth callback route
│   ├── layout.tsx                # Root layout (providers, toaster)
│   └── globals.css               # Tailwind + CSS variables
├── components/
│   ├── forms/                    # Reusable form wrappers (Form, FormField, etc.)
│   ├── layout/                   # DashboardShell, Header, Sidebar
│   ├── pdf/                      # Invoice PDF generation (react-pdf)
│   └── ui/                       # 19 shadcn/ui components
├── db/migrations/                # 3 SQL migration files
├── features/
│   ├── auth/                     # Login, register, logout
│   ├── customers/                # Customer CRUD + restore
│   ├── vehicles/                 # Vehicle CRUD + restore
│   ├── jobs/                     # Job CRUD + copy + restore
│   ├── line-items/               # Line items CRUD + sync
│   ├── payments/                 # Placeholder (Phase 3)
│   ├── photos/                   # Placeholder (Phase 2)
│   ├── search/                   # Global search command palette
│   └── settings/                 # Shop settings CRUD
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
    └──< jobs (N) ───────┘
            │
            ├──< line_items (N)
            ├──< payments (N)
            └──< photos (N)

vehicles (1) ──< photos (N)
line_items (1) ──< photos (N)

shop_settings (single row)
```

### Tables

| Table | Key Fields | Relationships |
|---|---|---|
| `customers` | `id (UUID PK)`, `name`, `email`, `phone`, `address`, `notes`, `deleted_at` | FK to `vehicles`, `jobs` |
| `vehicles` | `id (UUID PK)`, `customer_id`, `make`, `model`, `year`, `engine`, `transmission`, `vin`, `plate`, `color`, `cover_photo`, `deleted_at` | FK → `customers` |
| `jobs` | `id (UUID PK)`, `estimate_no (UNIQUE)`, `vehicle_id`, `customer_id`, `status`, `date`, `currency`, `deleted_at` | FK → `vehicles`, `customers` |
| `line_items` | `id (UUID PK)`, `job_id`, `category`, `item`, `quantity`, `unit_price`, `line_total`, `is_inventory`, `deleted_at` | FK → `jobs` (CASCADE) |
| `payments` | `id (UUID PK)`, `job_id`, `date`, `amount`, `payment_method`, `deleted_at` | FK → `jobs` (RESTRICT) |
| `photos` | `id (UUID PK)`, `url`, `vehicle_id`, `job_id`, `line_item_id`, `photo_type`, `deleted_at` | FK → `vehicles`, `jobs`, `line_items` (CASCADE) |
| `shop_settings` | `id (UUID PK)`, `shop_name`, `address`, `contact`, `email`, `tax_id` | Single-row config |

### Common Columns

All core tables include:
- `created_at TIMESTAMPTZ DEFAULT now()` — set on INSERT
- `updated_at TIMESTAMPTZ DEFAULT now()` — auto-updated via trigger
- `deleted_at TIMESTAMPTZ` — soft delete marker (NULL = active)
- `created_by UUID REFERENCES auth.users` — set via trigger on INSERT
- `updated_by UUID REFERENCES auth.users` — set via trigger on UPDATE

### RLS Policies

All 7 tables have `ENABLE ROW LEVEL SECURITY` with:
- **SELECT:** `deleted_at IS NULL` (active records only)
- **INSERT:** Authenticated users
- **UPDATE:** Authenticated users
- **Storage:** 4 policies on `photos` bucket (SELECT, INSERT, UPDATE, DELETE)

### Job Status Enum

```
draft → estimate → approved → invoiced → partially_paid → paid → closed
```

### Estimate Number Format

`YY-MMDD-000001` — auto-generated with yearly reset.

Example: `26-0717-000042` (42nd job in 2026)

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

### UI Components (19 total — shadcn/ui)

```
alert-dialog    avatar      badge       button
card            checkbox    command     dialog
dropdown-menu   input       label       popover
select          separator   skeleton    table
tabs            textarea    toast
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
|---|---|---|
| Login/Logout/Session/Protected | ✅ | Middleware renamed to `middleware.ts` |
| Customer CRUD + soft delete + restore | ✅ | All operations + `restoreCustomer()` |
| Vehicle CRUD + soft delete + restore | ✅ | All operations + `restoreVehicle()` |
| Job CRUD + soft delete + restore | ✅ | All operations + `restoreJob()` + copy |
| All job statuses in tabs | ✅ | draft, estimate, approved, invoiced, partially_paid, paid, closed |
| Cover photo in vehicle form | ✅ | URL input + detail page display |
| Dashboard — Recent Jobs | ✅ | Top 5 with links |
| Dashboard — Recent Vehicles | ✅ | Top 5 with links and details |
| Dashboard — Outstanding Jobs | ✅ | Non-paid/non-closed with links |
| Dashboard — Revenue Summary | ✅ | Total from invoiced + paid jobs |
| Dashboard — Quick Actions | ✅ | Create Estimate, Add Vehicle, Add Customer |
| Global Search | ✅ | Ctrl+K command palette (customer, plate, VIN, estimate) |
| Toast notifications | ✅ | `use-toast` hook + `Toaster` in root layout |
| Responsive layout | ✅ | Mobile sidebar + responsive grid |
| Dark mode | ✅ | `next-themes` with CSS variables |
| Skeleton loading | ✅ | All tables, detail pages, forms |
| Empty states | ✅ | All list and detail pages |
| Accessible forms | ✅ | Labels, error messages, aria attributes |
| Build — 0 lint errors | ✅ | 4 non-blocking warnings (React Compiler) |
| Build — 0 TypeScript errors | ✅ | `tsc --noEmit` passes |

---

## 9. Migration Summary

| File | Description | Status |
|---|---|---|
| `00001_initial_schema.sql` | Core schema: 4 enums, 7 tables, RLS, triggers, indexes | Applied |
| `00002_line_items_enhancements.sql` | Discount columns: discount_type, discount_value | Applied |
| `00003_photos_audit_storage.sql` | Photos updated_at/updated_by, shop_settings created_by, storage RLS | **Needs to be applied** |

To apply migration 00003:
```sql
-- Run in Supabase SQL Editor
\i src/db/migrations/00003_photos_audit_storage.sql
-- Or paste contents into Supabase Dashboard → SQL Editor
```

---

## 10. Build Verification

### Current Status

```
npm run lint       → 0 errors, 4 warnings (React Compiler compatibility)
npx tsc --noEmit   → 0 errors
```

### The 4 warnings are all pre-existing and non-blocking:
- 1x `react-hooks/exhaustive-deps` — `lineItems` in useMemo deps
- 3x `react-hooks/incompatible-library` — React Hook Form `watch()` is not memoizable by React Compiler

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
|---|---|
| Inventory | ✅ `is_inventory` on line_items |
| Photo uploads | ✅ Schema, storage bucket, RLS in migration 00003 |
| Payments ledger | ✅ Schema exists, UI placeholder in Phase 3 |
| Multiple users | ⚠️ Single-tenant RLS; needs tenant_id |
| Multiple workshops | ⚠️ Single shop_settings; needs workshop_id |
| VIN scanning | ⚠️ VIN field exists |
| Plate OCR | ⚠️ Plate field exists |
| Mobile app | ⚠️ Responsive; needs Capacitor (Phase 5) |
| Desktop app | ⚠️ Needs Tauri (Phase 5) |
| PWA | ⚠️ Needs manifest + service worker |
