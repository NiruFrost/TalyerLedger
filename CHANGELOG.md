# Changelog

All notable changes to TalyerLedger are documented here.

## [Unreleased]

### Added
- Phase 0 tenant/security migration with workshop RLS, private attachment storage, atomic work-order transactions, status/version controls, and daily numbering.
- PGlite migration/RLS coverage, auth-route tests, error-mapping tests, component accessibility coverage, and desktop/mobile Playwright smoke tests.
- Phase 0 architecture, operations, security, accessibility, testing, and final-validation documentation.

### Fixed
- Type checking now generates Next.js route types and runs `tsc --noEmit`; CI no longer substitutes a production build for static type checking or suppresses browser failures.
- Canonical auth redirects no longer trust request host headers; logout replaces browser history and refreshes server state.
- Raw authentication/provider errors are mapped to safe user messages.
- Work-order creation, permanent numbers, derived payment status, line totals, optimistic versions, and soft-delete parent/child rules are enforced in PostgreSQL.
- Legacy cascading foreign keys on operational/audit rows now use restrictive deletion.
- Attachment metadata visibility, object-path binding, active-parent checks, duplicate-path prevention, upload request limits, rate limiting, and semantic progress/error feedback were hardened.
- TanStack Query keys and invalidation paths were centralized.
- Security headers, mobile auth control sizing, protected-route redirect coverage, and reduced-motion documentation were tightened.

### Known
- The current dependency graph resolves PostCSS 8.5.10 and `npm audit --omit=dev --audit-level=high` reports three high-severity advisories. Updating the override and lockfile requires approved npm registry access.
- Hosted Supabase migration/RLS/Storage, backup/restore, and production performance remain external validation gates.
