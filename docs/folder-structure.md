# Folder Structure and Naming Conventions

## Repository map

```text
talyer-ledger/
|-- .github/
|   |-- workflows/ci.yml          # Lint, typecheck, tests, audit, build
|   `-- dependabot.yml             # Dependency update schedules
|-- docs/                          # Current project documentation
|-- e2e/
|   `-- auth-foundation.spec.ts    # Playwright browser smoke test
|-- public/                        # Static public assets
|-- src/
|   |-- app/                       # Next.js App Router
|   |   |-- (auth)/                # Login and conditionally public registration
|   |   |-- (dashboard)/           # Authenticated dashboard routes
|   |   |   |-- customers/         # List, create, detail, edit
|   |   |   |-- vehicles/          # List, create, detail, edit
|   |   |   |-- jobs/              # Work-order routes; DB table is work_orders
|   |   |   |-- settings/          # Shop, labor, and package settings
|   |   |   `-- page.tsx           # Dashboard
|   |   |-- api/attachments/upload/# Server-only secure image upload route
|   |   |-- auth/callback/          # Supabase code exchange
|   |   |-- error.tsx               # Route error boundary
|   |   |-- global-error.tsx        # Root error boundary
|   |   |-- layout.tsx              # Root providers and metadata
|   |   `-- not-found.tsx
|   |-- components/
|   |   |-- forms/                  # Shared React Hook Form wrappers
|   |   |-- layout/                 # Header, sidebar, dashboard shell
|   |   |-- pdf/                    # PDF renderer, preview, download
|   |   |-- shared/                 # Cross-feature states and banners
|   |   `-- ui/                     # Design-system primitives
|   |-- db/
|   |   |-- migrations/             # Ordered PostgreSQL migrations 00001-00009
|   |   `-- tests/                  # PGlite migration and RLS tests
|   |-- features/
|   |   |-- attachments/            # Evidence metadata, upload hooks, galleries
|   |   |-- auth/                   # Auth actions, hooks, schemas, forms
|   |   |-- customers/              # CRUD plus explicit repository boundary
|   |   |-- labor-catalog/          # Reusable labor entries
|   |   |-- line-items/             # Work-order line-item CRUD and sync
|   |   |-- payments/               # Payment CRUD and status recalculation
|   |   |-- search/                 # Global command palette
|   |   |-- service-packages/       # Package headers and items
|   |   |-- settings/               # Shop settings access and tabs
|   |   |-- vehicles/               # Vehicle CRUD and timeline
|   |   `-- work-orders/             # Work-order actions, hooks, schemas, UI
|   |-- hooks/                       # Hooks shared across features
|   |-- lib/
|   |   |-- auth/                    # Public-route and return-path rules
|   |   |-- database/                # Shared database RPC adapters
|   |   |-- errors/                  # Application-safe error model
|   |   |-- image/                   # Browser image validation/processing
|   |   |-- logging/                 # Structured redacting logger
|   |   |-- query/                   # QueryClient policy and key definitions
|   |   |-- security/                # Request-origin checks
|   |   |-- storage/                 # StorageService implementation
|   |   |-- supabase/                # Browser, server, admin, middleware clients
|   |   |-- constants.ts             # Statuses, categories, limits, labels
|   |   |-- env.server.ts            # Server-only environment validation
|   |   |-- env.ts                   # Browser-safe environment validation
|   |   |-- financial-calculations.ts# Deterministic money calculations
|   |   |-- types.ts                 # Manually maintained domain interfaces
|   |   `-- utils.ts                 # Formatting and class-name helpers
|   `-- proxy.ts                     # Next.js 16 request proxy entry
|-- .env.example                     # Environment template without secrets
|-- next.config.ts                   # Next.js and security-header configuration
|-- playwright.config.ts             # Desktop/mobile Chromium configuration
|-- vitest.config.ts                 # Unit and migration test configuration
|-- package.json                     # Scripts and dependency manifest
`-- tsconfig.json                    # Strict TypeScript and @/* alias
```

Generated and local-only directories such as `.next/`, `node_modules/`, coverage output, and `.env.local` are not part of the source structure.

## Feature module shape

Feature folders use only the pieces they need. The common shape is:

```text
src/features/example/
|-- actions.ts                # Use cases and persistence calls
|-- schemas.ts                # Zod input schemas and inferred form types
|-- repository.ts             # Optional persistence interface/implementation
|-- repository.test.ts        # Colocated unit test when applicable
|-- components/
|   `-- example-form.tsx
`-- hooks/
    `-- use-example.ts
```

Current boundary details:

- Components should call feature hooks rather than importing Supabase directly.
- Hooks own TanStack Query configuration and invalidation.
- Actions own use-case orchestration and persistence calls.
- A repository should isolate vendor-specific persistence when a feature benefits from injection or focused testing. Customers currently demonstrate this pattern.
- Global search is a known exception because it issues cross-feature Supabase queries directly.
- Files called `actions.ts` are currently ordinary browser-callable functions unless they explicitly contain a server directive. Do not assume they are Next.js Server Actions.

## Where new code belongs

| Change                               | Location                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| New route or route handler           | `src/app/...` using App Router conventions.                                  |
| Domain-specific UI or data operation | Existing or new `src/features/<feature>/`.                                   |
| Reusable unstyled/styled primitive   | `src/components/ui/`.                                                        |
| Cross-feature presentation           | `src/components/shared/` or `src/components/layout/`.                        |
| Cross-feature domain utility         | A focused directory under `src/lib/`; avoid a generic dumping ground.        |
| Database change                      | Next sequential file under `src/db/migrations/` plus migration tests.        |
| Unit/component test                  | Colocate as `*.test.ts` or `*.test.tsx`.                                     |
| Database integration test            | `src/db/tests/`.                                                             |
| Browser test                         | `e2e/*.spec.ts`.                                                             |
| Project documentation                | `docs/`, except documents whose location is already fixed by project policy. |

## Naming conventions

### Files and directories

- Use `kebab-case` for feature directories and TypeScript/TSX filenames: `work-orders`, `customer-form.tsx`, `financial-calculations.ts`.
- Use Next.js reserved lowercase route filenames: `page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Use bracketed dynamic segments such as `[id]` and parenthesized route groups such as `(dashboard)`.
- Name hooks `use-<domain>.ts`; exported hook functions use `usePascalCase`, for example `useWorkOrder`.
- Name tests after the unit under test with `.test.ts[x]`; use `.spec.ts` for Playwright scenarios.
- Keep one feature's UI under that feature instead of adding domain components to global `components/`.

### TypeScript symbols

- React components, interfaces, and type aliases use `PascalCase`.
- Functions and local variables use `camelCase`.
- Shared constants use `UPPER_SNAKE_CASE`.
- Mutation payload interfaces use `<Entity>Insert` and `<Entity>Update`; persisted records use the singular entity name.
- Boolean names should describe the true state, commonly with `is`, `has`, `allow`, or `include`.
- Import source files through `@/` for paths rooted at `src`; use relative imports for nearby files inside one feature.

### Database objects

- Tables use plural `snake_case`: `work_orders`, `package_items`, `workshop_members`.
- Columns use `snake_case`.
- Primary keys are normally `id UUID`; foreign keys end in `_id`.
- Tenant-owned tables use `workshop_id`.
- Timestamps end in `_at`; actor references end in `_by`.
- Soft deletion uses nullable `deleted_at`; active means `deleted_at IS NULL`.
- Boolean columns use descriptive prefixes such as `is_read`, `is_inventory`, or `include_photo_appendix`.
- PostgreSQL enum/type names are singular `snake_case`, such as `work_order_status`.
- New constraints and indexes should identify table and purpose, for example `payments_amount_positive` or `work_orders_workshop_number_unique`.
- Existing legacy index/policy names are mixed. Do not rename them only for style because migration and operational tooling may depend on names.
- SQL functions use `snake_case` verbs or predicates: `next_work_order_number`, `soft_delete_record`, `is_workshop_member`.

### Migrations

- Use the five-digit ordered form `NNNNN_short_description.sql`, matching `00009_phase0_tenant_security.sql`.
- Apply files strictly in lexical/numeric order.
- A migration must state purpose, data impact, and practical rollback guidance.
- Add or update PGlite coverage for schema, integrity, and RLS behavior.
- Do not assume a file's presence means it was applied remotely. Record target-specific deployment evidence separately.
- Migrations should normally be immutable after deployment. This repository is an exception for repaired legacy files `00005`, `00006`, and `00008`; remote targets that may have run earlier versions require the drift preflight in [migration-guide.md](migration-guide.md).

### Routes versus domain names

The public application route remains `/jobs`, while code and schema use `work-orders` and `work_orders`. Preserve that mapping unless a separately planned route migration is approved:

| Layer                                     | Name                       |
| ----------------------------------------- | -------------------------- |
| Browser URL and some labels               | `jobs`, estimates          |
| Feature directory and TypeScript entity   | `work-orders`, `WorkOrder` |
| PostgreSQL table                          | `work_orders`              |
| Historical table before migration `00005` | `jobs`                     |

Do not query `jobs` in new persistence code. The remaining global-search query is a known stale reference, not a convention.

## Query and cache conventions

- Query keys are arrays rooted in the domain, for example `['customers']` and `['work-orders', id]`.
- Invalidate collection and affected detail keys after successful writes.
- Prefer the definitions in `src/lib/query/keys.ts` when extending a covered domain. Existing feature hooks still contain literal keys, so check both before introducing a new spelling.
- Reads should explicitly filter active rows when relationships or service-role contexts could bypass the standard SELECT policy.
- Bound lists with `limit`, pagination, or virtualization. Do not add a new unbounded collection read.

## Validation and type conventions

- Validate user-authored form input with a feature Zod schema.
- Treat database checks, FKs, triggers, and RLS as the final authority.
- Keep money calculations in `src/lib/financial-calculations.ts`; do not reproduce formulae in components.
- The current `src/lib/types.ts` is manually maintained and does not include every database column on every interface. Verify migrations before treating a TypeScript interface as a complete data dictionary.
- The `db:types` script expects a local Supabase environment and would write `src/lib/database.types.ts`, but that generated file is not currently present.

## Documentation conventions

- Describe current behavior separately from roadmap intent.
- Link schema summaries to [data-dictionary.md](data-dictionary.md) instead of duplicating every column.
- State whether migration claims come from PGlite, staging, or a live Supabase target.
- Include data impact and rollback implications for every operational migration procedure.
- Use Mermaid diagrams that render in GitHub-flavored Markdown and keep entity names aligned with the database.
