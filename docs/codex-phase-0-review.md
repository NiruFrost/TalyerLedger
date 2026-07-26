# Codex Phase 0 Review

Date: 2026-07-26

## DeepSeek findings accepted

- Feature-oriented route/module structure is a sound baseline.
- Public, server, middleware, and service-role Supabase clients are separated.
- Environment validation, error boundaries, shared calculations, private bucket direction, workshop tenancy, soft deletion, Query, form, accessibility, motion, and operational documentation were useful foundations.
- PGlite, Vitest, Playwright, CI, and Dependabot are appropriate Phase 0 tools.

## DeepSeek findings corrected

- `typecheck` was a build alias, not independent type checking.
- CI silently tolerated Playwright installation/test failures.
- Passing old tests did not prove the database/RLS/storage claims made in the handoff.
- Migration `00009` was not complete: direct work-order creation, permanent number immutability, derived financial fields, soft-delete updates, parent lifecycle, private evidence, and legacy cascade paths were weak.
- Current docs incorrectly described `refund`, mutable numbers, unversioned updates, broader status transitions, incomplete work-order search, and attachment visibility/parent limits.

## Architecture changes made

- Standardized Query keys/invalidation.
- Kept feature actions as the data boundary while preserving existing repository abstractions that add testing value.
- Made work-order create/update/copy use the transactional RPC boundary and aligned the create form with draft-only database creation.
- Kept the existing `/jobs` route as a documented presentation/compatibility name; no Phase 1 rename was attempted.

## Security defects fixed

- Canonicalized auth redirects and disabled caching of redirect responses.
- Replaced history-pushing logout and raw provider error disclosure.
- Added owner/private attachment policy, exact metadata/object path binding, unique paths, active-parent visibility, request headroom, rate limiting, and safe upload feedback/logging.
- Added ownership immutability and removed normal direct work-order insertion.
- Added COOP and DNS-prefetch headers and tightened CSP resource directives.

## Migration defects fixed

- Replaced operational/audit cascade FKs with restrictive deletion.
- Enforced calculated line totals and database-derived payment status.
- Enforced draft-only creation, forward transitions, permanent immutable numbers, seeded counters, overflow protection, and optimistic versions.
- Enforced active parent relationships across child insert/update/restore.
- Prevented ordinary direct soft-delete/restore writes and blocked parent deletion while active dependents exist.

## Tests added or corrected

- Added safe authentication error mapping tests.
- Expanded migrations from representative basics to 9 tenant/RLS/lifecycle/attachment/financial/transaction/numbering/FK cases.
- Corrected finance fixtures to create work orders through the production RPC.
- Re-ran 50 Vitest assertions, production build, two Playwright projects, and manual mobile auth checks.

## Documentation corrected

- Added the stable master-spec path and all required finalization documents.
- Reconciled schema, data dictionary, RLS matrix, threat model, product requirements, architecture, testing, deployment, migration, performance, motion, accessibility, ADR, README, and changelog claims with current code.

## Unresolved limitations

- Three High PostCSS audit findings remain.
- Live Supabase migration/RLS/Storage and Auth-provider settings are not verified.
- Backup/restore and production performance are not operationally measured.
- Attachment object upload and metadata insertion remain separate systems.
- Advanced member roles and public customer access remain future work and were not introduced.

## Final decision

**Rejected for Phase 1 progression until the production dependency audit is
clean and the complete CI sequence passes.** No unresolved Critical issue was
found. The remaining High dependency gate cannot be waived under the Phase 0
acceptance rules.
