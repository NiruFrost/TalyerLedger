# TalyerLedger Product Requirements

## Document status

This is an as-built product baseline derived from the repository on 2026-07-23. It describes behavior that exists in the current application and database migrations. It does not treat future goals in `MASTER_BUILD_PROMPT_V3.md` as implemented features.

Migration `00009_phase0_tenant_security.sql` is covered by the repository's PGlite migration tests. It was not applied to, or verified against, a live Supabase project in this documentation session.

## Product purpose

TalyerLedger is a responsive workshop ledger for small automotive or machine-repair operations. It connects customers, vehicles, work orders, line items, payments, repair evidence, and printable documents in one authenticated system.

The current product uses the term **Job** or **Estimate** in URLs and parts of the UI. The durable database entity is `work_orders`; `/jobs` is only the route vocabulary.

## Primary users

| User            | Current capabilities                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workshop owner  | Signs in, manages workshop records and settings, and owns the automatically provisioned workshop.                                                    |
| Workshop member | Supported by the database membership model and workshop-scoped RLS. There is no current member invitation, administration, or workshop-switching UI. |
| Customer        | Not an authenticated product role. Customer-visible information is rendered into PDFs; there is no customer portal or public share flow.             |

## Product goals

1. Replace disconnected customer, vehicle, estimate, payment, and repair-photo records with linked workshop records.
2. Keep repair progress independent from payment progress.
3. Preserve operational history through soft deletion, audit fields, status events, and immutable work-order numbers.
4. Isolate every workshop's data in PostgreSQL RLS, not only in the UI.
5. Produce consistent estimates and payment documents from deterministic financial calculations.
6. Keep attachment objects private and expose them through signed URLs only.

## Functional requirements

### PR-01 Authentication and workshop isolation

- Email/password authentication uses Supabase Auth.
- `/login` and `/auth/callback` are public. `/register` is public only when `NEXT_PUBLIC_ALLOW_SIGN_UP=true`; sign-up is disabled by default.
- The Next.js proxy refreshes sessions and redirects unauthenticated requests. The dashboard layout performs a second server-side user check.
- Migration `00009` provisions one owned workshop, one owner membership, and one settings row for each newly created auth user.
- Reads and writes must be limited to an active workshop membership. Anonymous and cross-workshop access must be denied by RLS.
- Operational inserts default `workshop_id` from `current_workshop_id()` and reject attempts to move a row to another workshop.
- The application has no workshop selector. `current_workshop_id()` chooses one active membership, preferring an owned workshop and then the earliest membership.

### PR-02 Customer records

- Users can list, view, create, edit, and soft-delete customers.
- A customer requires a non-blank name. Email, phone, address, and notes are optional.
- The customer list is alphabetical, limited to 100 rows, and includes an active vehicle count.
- Customer detail links to associated vehicles and supports starting a vehicle or estimate workflow.
- Restore exists in the data layer but has no current customer restore screen.

### PR-03 Vehicle records and history

- Users can list, view, create, edit, and soft-delete vehicles.
- Make, model, and year are required; customer, engine, transmission, VIN, plate, color, cover reference, and notes are optional.
- A vehicle may be associated with one customer in the same workshop.
- Vehicle detail presents linked work orders as service history and embeds the attachment gallery.
- The current data model is vehicle-specific. Generic industrial assets are roadmap scope, not current schema behavior.

### PR-04 Work-order lifecycle

- Users can list and filter work orders, create and edit them, make a copy with line items, and soft-delete them.
- A work order requires a vehicle and receives an atomic database-generated number in the form `YY-MMDD-000001`.
- Number counters are per workshop and local calendar day, using `workshops.timezone`. Allocated numbers are not reused, including after transaction gaps, voiding, or soft deletion.
- The database enforces number uniqueness and format per workshop, makes the number immutable, and denies normal authenticated direct inserts. Create and copy RPCs allocate numbers transactionally.
- Work orders support customer/payer details, insurance references, a linked work order, odometer, currency, customer notes, internal notes, terms, overall discounts, and drop-off metadata.
- Current repair states are `draft`, `estimate`, `approved`, `in_progress`, `completed`, `released`, `closed`, and `voided`.
- The UI and database expose a forward-only progression plus voiding, and the database records status changes in `activity_logs`. See [database-schema.md](database-schema.md#work-order-status).
- `version` increments on every work-order update, and the atomic update RPC rejects stale expected versions.

### PR-05 Line items, catalogs, and packages

- Work orders support ordered line items in `fluids`, `parts`, `accessories`, `labor`, and `other` categories.
- Each line item supports quantity, unit, unit price, amount or percentage discount, installation status, notes, and optional inventory/source metadata.
- Quantity must be positive; prices and persisted totals cannot be negative; percentage discounts must be between 0 and 100.
- The form calculates gross, discount, net, category totals, overall discount, total, paid amount, and balance with cent-based utilities.
- Users can maintain reusable labor items and service packages in Settings and insert them into a work order.
- Package header creation and child-item insertion are separate client requests, not a database transaction.

### PR-06 Payments

- Users can list, create, edit, and soft-delete payments for a work order.
- Payment amount must be greater than zero. Supported payment types are `deposit` and `regular`; payment method remains free text.
- Payment status is recalculated in database triggers after payment, line-item, or overall-discount changes.
- User-facing calculation states are `unpaid`, `partial`, `paid`, and `overpaid`.
- The database and application both use `overpaid`; direct authenticated edits to the derived status are rejected.
- Paid and balance values are derived and are not directly editable fields.

### PR-07 Repair evidence and attachments

- The upload pipeline supports customer, vehicle, work-order, and line-item image evidence. Routed screens expose vehicle/work-order galleries; some parent-specific components are not currently mounted by a route.
- Users can organize evidence by category, view signed images, and soft-delete attachment metadata where the gallery is exposed.
- Accepted source MIME types are JPEG, PNG, and WebP, with a 10 MiB raw client limit, a 4 MiB processed server-request limit, and a 40-million-pixel decode limit.
- Client processing produces a maximum 1920-pixel image and 400-pixel thumbnail. The server decodes, rotates, resizes, and normalizes every stored object to JPEG.
- Storage paths are prefixed by the authenticated workshop ID. The `attachments` bucket is private and permits only `image/jpeg` objects.
- Upload authorization is checked with the user's server-side Supabase session. The actual storage write uses a server-only service-role client.
- `SUPABASE_SERVICE_ROLE_KEY` is mandatory for the secure upload route and must never be exposed through a `NEXT_PUBLIC_` variable or browser code.
- Signed reads are authorized by the workshop ID at the start of the object path.
- Attachment metadata supports `private`, `workshop`, and `customer` visibility. Private metadata/objects are owner-only; workshop and customer rows are member-readable. `customer` also controls PDF appendix selection; no public customer portal policy exists.
- The current upload and metadata insert are two separate operations. A metadata failure can leave an unreferenced storage object, and metadata soft deletion does not remove the object.

### PR-08 PDFs and document records

- Users can preview and download client-rendered PDFs using current work-order, customer, vehicle, line-item, payment, and shop-setting data.
- PDFs support shop branding and business-registration fields.
- Internal notes are excluded from customer documents.
- When `shop_settings.include_photo_appendix` is true, only active work-order attachments with `visibility='customer'` are requested for the appendix.
- The `documents` table can track generated-document metadata, but the current PDF components do not create document rows or immutable snapshots.
- The Settings UI does not currently expose `include_photo_appendix` even though the field is read by PDF generation.

### PR-09 Dashboard, search, and settings

- The dashboard shows customer and vehicle counts, active and outstanding work orders, recent records, calculated revenue, and quick actions.
- Lists and dashboard aggregates are computed from bounded client queries; this is suitable for the current small-workshop baseline, not unbounded growth.
- The global command palette uses the bounded `search_workshop` RPC for customers, vehicles, and work orders.
- Owners can edit shop identity and business-registration data.
- Users can manage labor catalog and service packages.
- Notification records exist in the database. The current notification switches are uncontrolled UI toggles and are not persisted; no delivery worker or notification center exists.

## Non-functional requirements

### Security

- PostgreSQL RLS and composite workshop foreign keys are the authorization and tenant-integrity boundary.
- No client receives the service-role key.
- Sensitive upload requests require a same-origin `Origin` header and an authenticated user.
- Security headers include CSP, frame denial, MIME sniffing prevention, referrer policy, and production HSTS.
- Logs use structured JSON and redact keys matching common credentials and personal-data names.

### Reliability and data integrity

- Migrations must pass on a clean database before deployment.
- Remote deployment requires a schema-drift and data preflight; repository files do not prove the state of a Supabase project.
- Financial checks reject invalid legacy rows rather than rewriting them silently.
- Soft deletion is preferred; browser roles receive no hard-delete policies.
- Multi-record client workflows must report partial failure because they are not currently transactional.

### Performance

- TanStack Query uses a 30-second default stale time, one read retry, no mutation retry, and no window-focus refetch.
- Customer, work-order, package, customer-safe attachment, and search reads have explicit limits where implemented.
- Vehicle, payment, line-item, attachment, and catalog reads are not paginated and need review before larger deployments.
- PDF and gallery work should remain dynamically or conditionally loaded where currently implemented.

### Accessibility and responsive behavior

- Desktop and mobile Chromium are configured in Playwright.
- The root layout provides a skip link, forms use labels, and icon-only actions include accessible names where implemented.
- The repository contains one auth-foundation E2E accessibility smoke test; it is not a complete WCAG audit.

## Current acceptance evidence

| Area                    | Repository evidence                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration chain and RLS | `src/db/tests/migrations.test.ts` runs migrations `00001` through `00009` in PGlite and tests workshop isolation, anonymous denial, cross-tenant FK rejection, soft deletion, private bucket settings, and storage reads. |
| Financial behavior      | `src/lib/financial-calculations.test.ts` covers rounding, discounts, totals, and payment states; migration tests cover database-derived status and stored totals.                                                         |
| Customer boundary       | Customer schema and repository tests cover validation, active-row filtering, and bounded reads.                                                                                                                           |
| Auth/configuration      | Unit tests cover environment validation and safe auth return paths; Playwright checks keyboard reachability and default-closed registration.                                                                              |

On 2026-07-26, `npm run test:run` passed 50 tests across 9 files, including 9 clean-chain migration/RLS cases. These results are local repository evidence only; no live Supabase migration or Storage integration test was performed in this session.

## Explicit non-goals in the current build

- Tool inventory, borrowers, and tool loans.
- Generic assets, preventive maintenance, and CMMS analytics.
- Customer portal, public sharing, notifications delivery, and scheduled jobs.
- Workshop invitation, role administration, and workshop switching.
- Offline mutation queues, PWA installation, Capacitor, and Tauri packaging.
- Cloudflare R2 storage; its environment fields are placeholders for an inactive adapter.
- Immutable PDF snapshots and document revision history.
- A verified production deployment of migration `00009`.

## Known product gaps

- Customer deletion is implemented as recoverable soft deletion, but its confirmation text says the deletion is permanent.
- Work-order UI transitions are narrower than database transitions and do not offer voiding or rollback transitions.
- Work-order number format and immutability are application conventions rather than database checks.
- Customer-parent attachments are supported by the database, TypeScript types, and secure upload route.
- Legacy `photos` remains in the schema; new UI behavior uses `attachments`.
- Work-order creation/update and line-item synchronization can partially succeed.
- Search, notification preferences, drop-off metadata editing, document tracking, and attachment-object cleanup are incomplete as described above.
