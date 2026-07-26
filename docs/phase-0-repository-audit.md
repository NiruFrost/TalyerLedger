# TalyerLedger — Phase 0 Repository Audit

**Model:** DeepSeek V4 Flash  
**Date:** 2026-07-23  
**Branch:** `main`  
**Starting Commit:** `ebd17e1` feat: Phase 2 — repair documentation & digital evidence module  
**Master Specification:** `MASTER_BUILD_PROMPT_V3.md`

---

## Current Repository State

The repository is in an **advanced state** — Phase 0, 1, and significant Phase 2 work already completed:

- 16 commits from initial to Phase 2
- 45 passing tests across 8 test files
- 9 SQL migration files (src/db/migrations/)
- 18 documentation files + 11 ADRs in docs/
- Next.js 16.2.11 + React 19.2.4 + Supabase + TypeScript
- Feature-based architecture in src/features/
- Workshop-scoped RLS (migration 00009)
- TanStack Query, React Hook Form, Zod consistently used
- CSP headers, rate limiting, structured logging, error boundaries

## Working Functionality

| Area | Status | Notes |
|------|--------|-------|
| Authentication (login/logout/session) | ✅ | Supabase SSR + middleware proxy |
| Route protection | ✅ | Proxy + server layout check |
| Environment validation | ✅ | Zod for public + server env |
| Customer CRUD | ✅ | With soft delete + restore |
| Vehicle CRUD | ✅ | With timeline, customer association |
| Work Order CRUD | ✅ | With auto numbering, copy, status workflow |
| Line Items | ✅ | Categories, discounts, calculations |
| Payments | ✅ | Deposit/regular, payment status |
| Labor Catalog | ✅ | CRUD + work order picker |
| Service Packages | ✅ | CRUD + bulk insertion |
| Digital Evidence | ✅ | Upload, gallery, viewer, before/after |
| Drop-off Inspection | ✅ | Condition notes, representative, photos |
| PDF Generation | ✅ | Estimate, statement, acknowledgment |
| Global Search | ✅ | Ctrl+K command palette |
| Dashboard | ✅ | Metrics, recent WOs, quick actions |
| Settings | ✅ | Shop info, registration, catalog |
| Dark Mode | ✅ | System-driven via next-themes |
| RLS | ✅ | Workshop-scoped, composite FKs |
| Storage | ✅ | Private bucket, signed URLs |
| Production Build | ✅ | Zero errors |
| TypeScript | ✅ | Strict mode, zero errors |
| ESLint | ✅ | Zero warnings |
| Tests (45) | ✅ | All passing |

## Incomplete Functionality

| Area | Status | Notes |
|------|--------|-------|
| `src/middleware.ts` | ❌ Does not exist | README references it; proxy.ts serves role |
| `src/lib/database.types.ts` | ❌ Not generated | Script exists but never ran |
| TypeScript `workshop_id` | ⚠️ Partially fixed | Added during this pass |
| `photos/` feature directories | ❌ Empty | Legacy table; app code is empty |
| `src/hooks/` | ❌ Empty directory | Shared hooks planned but unimplemented |
| Register form ARIA | ✅ Fixed in this pass | Was missing aria-invalid/describedby |
| Logger redaction | ⚠️ Improved in this pass | Still key-name based |
| Upload component logging | ✅ Fixed in this pass | Was using raw console.error |

## Broken Functionality

| Area | Status | Notes |
|------|--------|-------|
| README references `src/middleware.ts` | ✅ Fixed | Now points to `src/proxy.ts` |
| README says 8 migrations | ✅ Fixed | Now references all 9 |
| Root `ARCHITECTURE.md` | Superseded | Use `docs/architecture.md` |
| Root `PHASE0_ARCHITECTURE_REPORT.md` | Superseded | Use `docs/phase-0-repository-audit.md` |

## Security Risks

| Risk | Severity | Status |
|------|----------|--------|
| `.env.local` with real Supabase creds | Med | NOT tracked by git (verified) |
| `NEXT_PUBLIC_ALLOW_SIGN_UP` UI gate only | Med | Documented; Supabase dashboard must also disable |
| Attachment `visibility` not enforced by RLS | Med | Fixed by Codex: private metadata/objects are owner-only |
| Logging redaction key-name based (not values) | Low | Improved in this pass |
| No hosted Supabase RLS verification | Med | PGlite tests cover but live verification needed |

## Architecture Inconsistencies

| Issue | Notes |
|-------|-------|
| Route paths use `/jobs` but domain model uses `work_orders` | Legacy naming preserved for routing |
| Only `customers` has a separate `repository.ts` | Others mix queries in `actions.ts` |
| `database.types.ts` not generated | Manually maintained `types.ts` instead |
| Terminology: jobs/estimates/work_orders mixed | Routes, nav, docs inconsistent |

## Documentation Gaps

| Gap | Action |
|-----|--------|
| `docs/query-conventions.md` | ✅ Created in this pass |
| `docs/form-validation-conventions.md` | ✅ Created in this pass |
| `docs/logging-and-observability.md` | ✅ Created in this pass |

## Performance Concerns

- No Lighthouse CI or bundle analysis in CI
- No pagination on list views (capped at 100)
- No lazy loading for charts/PDF/media libraries
- No web vitals monitoring

## Accessibility Concerns

- Register form ARIA ✅ Fixed in this pass
- Attachment upload uses non-semantic clickable `div`
- Several icon-only buttons lack accessible names
- No screen reader or axe DevTools audit performed

## Elements That Must Be Preserved

- All 9 migration files (especially 00009 tenant security)
- Workshop-scoped RLS with composite FKs
- Transactional RPCs (create_work_order_with_items, etc.)
- PGlite integration tests for migrations
- Financial calculation engine (cent-based, canonical)
- Storage service abstraction
- Image processing pipeline (resize, EXIF strip, thumbnail)
- Error boundary hierarchy
- CSP headers and security middleware

## Proposed Phase 0 Corrections (Completed)

1. ✅ Register form ARIA attributes (aria-invalid, aria-describedby, role="alert")
2. ✅ Upload component uses structured logger instead of console.error
3. ✅ Logger redaction expanded to cover more sensitive fields
4. ✅ TypeScript interfaces updated with workshop_id for all business tables
5. ✅ README updated: 9 migrations, proxy.ts, accurate folder structure
6. ✅ CI includes Playwright e2e step
7. ✅ docs/query-conventions.md created
8. ✅ docs/form-validation-conventions.md created
9. ✅ docs/logging-and-observability.md created
10. ✅ docs/phase-0-work-log.md created
11. ✅ docs/phase-0-repository-audit.md created

## Items Deferred to GPT-5.6 Sol

| Item | Rationale |
|------|-----------|
| Generate `database.types.ts` from live Supabase | Requires running Supabase project |
| Refactor `attachment-upload.tsx` to semantic `<button>` | More complex refactor; Phase 2 scope |
| Add pagination to list views | Phase 1 feature |
| Add Lighthouse/bundle CI checks | Performance budget enforcement |
| Add screen reader audit | Requires manual testing |
| Complete query key factory for all features | Incremental improvement |
| Retrofit repository.ts pattern to other features | Architectural preference, not correctness |
| Add tests for remaining features | Phase 1+ scope |
