# Phase 0 Acceptance Matrix

Date: 2026-07-26

Independent reviewer: GPT-5.6 Sol
Starting Phase 0 baseline identified by the first-pass handoff: `ebd17e1`

## DeepSeek work-unit review

| Work unit | Classification | Independent evidence | Correction or remaining limit |
| --- | --- | --- | --- |
| Repository audit and baseline | Partially Passed | The repository shape and dirty state were broadly identified, but the handoff treated a build as type checking and reused stale counts. | Restored a real `next typegen && tsc --noEmit` gate and reran every local command. |
| Architecture and folder boundaries | Partially Passed | Route groups and feature modules are coherent, but query keys/invalidation and several implementation/documentation boundaries were inconsistent. | Centralized remaining query keys, reconciled current architecture docs, and preserved later-phase code already present at the baseline. |
| Environment, Supabase clients, auth, and sessions | Partially Passed | Public/private environment modules and client separation were sound. Redirects trusted request origin/host, logout used history-pushing navigation, and provider errors reached users. | Canonical-site redirects, no-store auth redirects, replace/refresh logout, and safe error mapping were added and tested. Live Supabase Auth settings remain external. |
| Migrations and database conventions | Failed | Clean-chain SQL ran, but direct work-order inserts, mutable permanent numbers, mutable derived payment state, stale line totals, cascade FKs, and parent/child soft-delete gaps remained. | Migration `00009` now enforces transactional creation, number format/immutability, counter seeding, derived totals/status, restrictive FKs, active-parent rules, and ownership invariants. Nine migration cases pass. |
| RLS and Storage security | Failed | Tenant isolation existed, but update policies bypassed soft-delete conventions and attachment private/path policies were incomplete. | Active-row write policies, RPC lifecycle boundaries, owner-only private evidence, exact path binding, active-parent checks, unique paths, and representative owner/member/anon tests were added. Hosted Supabase remains unverified. |
| Queries, forms, validation, errors, and logging | Partially Passed | The basic libraries were present, but hard-coded cache keys, broad invalidation, raw auth errors, and weak upload feedback remained. | Query factories, targeted invalidation, safe errors, semantic upload UI/progress, bounded logs, and draft-only creation UI were added. |
| Design system, HCI, accessibility, and motion | Partially Passed | Source documentation was strong, but the completion claim lacked browser evidence and mobile auth controls were below the preferred target. | Login/register controls are 44 px; browser checks verified semantic validation, no horizontal overflow, skip navigation, and protected redirects. Reduced-motion source policy is verified; OS emulation remains unverified. |
| Performance, testing, CI, and documentation | Failed | CI suppressed Playwright failures, type checking duplicated build, current docs contradicted migration behavior, and no current dependency audit result was recorded. | CI now runs independent typecheck, tests, build, Playwright, and audit without suppression; docs were reconciled. The audit still fails on three high PostCSS findings, so this work unit remains failed. |

## Acceptance gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Clean migration chain | Passed | `npm run db:test`: 9/9 |
| Representative tenant, anonymous, RLS, lifecycle, and Storage policies | Passed locally | PGlite cases; hosted Supabase not verified |
| Permanent work-order numbering and atomic transactions | Passed locally | Direct-insert denial, format, immutability, concurrency, tenant counters, version conflict, create/update/copy cases |
| Derived financial integrity | Passed | Trigger-controlled line totals/payment state and direct mutation denial |
| Auth route and redirect safety | Passed locally | Seven unit cases, canonical redirects, manual protected-route check, two Playwright projects |
| Public/private environment boundary | Passed in source/tests | Environment tests and server-only admin import; deployment values not inspected |
| Safe errors and bounded logging | Passed for reviewed paths | Error mapper tests and upload logging inspection |
| Critical accessibility defects on anonymous entry flow | Passed | Semantic form/browser checks and 44 px mobile controls |
| Reduced-motion support | Partially Passed | Global CSS rule inspected; OS-level browser emulation not completed |
| Production build | Passed | Next.js 16.2.11 build completed |
| CI accurately represents gates | Passed in workflow definition | No silent skip; a remote run was not available |
| No unresolved Critical security issue | Passed | None found |
| No unresolved High security issue | Failed | Three high PostCSS advisories remain in the production audit |
| Hosted migration, JWT/RLS, Storage, backup/restore | Not Verifiable | Requires connected staging infrastructure and operational evidence |
| Phase 1 feature boundary | Passed for this pass | No new Phase 1 feature was started; pre-existing later-phase code was preserved |

## Decision

**Rejected for Phase 1 progression.**

The repository implementation is materially stronger and all non-dependency
local gates pass, but the Phase 0 specification explicitly rejects progression
while a High security finding or CI gate remains unresolved.
