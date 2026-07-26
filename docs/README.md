# TalyerLedger Documentation

This directory is the controlled documentation set for the TalyerLedger
Phase 0 baseline. It is organized for product owners, project managers,
engineers, security reviewers, operators, and future maintainers.

## Publication status

| Item | Current state |
| --- | --- |
| Baseline | Master Build v3 — Phase 0 |
| Publication date | 2026-07-26 |
| Included database boundary | Migrations `00001` through `00009` |
| Excluded scope | Phase 1 planning and implementation, including migration `00010` |
| Implementation state | Complete for the locally verifiable Phase 0 scope |
| Progression decision | Not approved for Phase 1 progression |
| Blocking gate | Production dependency audit reports three High PostCSS findings |
| Publication branch | `codex/phase-0-finalization` |

The implementation, local database checks, unit tests, type checking,
production build, and browser tests pass. The dependency audit remains a
release gate. See the
[Phase 0 Completion Report](phase-0-completion-report.md) for the executive
decision and [Phase 0 Final Validation](phase-0-final-validation.md) for the
evidence.

## Scope boundary

This publication contains only Phase 0 work:

- architecture, security, tenancy, database, and operational foundations;
- authentication and route-protection hardening;
- workshop-scoped RLS and data-integrity controls;
- transactional and versioned work-order operations;
- private attachment upload and access controls;
- shared error, logging, query, validation, and environment conventions;
- accessibility, performance, test, deployment, backup, and migration guidance;
- the final acceptance, validation, and completion records.

Phase 1 plans, work logs, schema additions, form fields, PDFs, and other
in-progress implementation are intentionally absent from this branch.

## Document authority

When documents describe different checkpoints, use this precedence:

1. [Phase 0 Final Validation](phase-0-final-validation.md) — command results,
   independently verified behavior, limitations, and final gate.
2. [Phase 0 Completion Report](phase-0-completion-report.md) — executive
   outcome, completed work, blockers, and next actions.
3. [Phase 0 Acceptance Matrix](phase-0-acceptance-matrix.md) — requirement-level
   acceptance evidence.
4. Current architecture, security, schema, testing, and operations documents
   listed below.
5. Historical audit and model-handoff records. These preserve traceability but
   do not override the final validation decision.

The master requirements are defined by
[Master Build Specification](master-build-specification.md). Architecture
decisions in `docs/adr/` govern intentional design choices. If implementation
and documentation diverge, record the discrepancy, update the applicable ADR
when the decision changes, and correct the documentation in the same change.

## Reader paths

### Product owner or project manager

Read, in order:

1. [Phase 0 Project Handoff](../.lovelace/documentation/phase-0-handoff.md)
2. [Product Requirements](product-requirements.md)
3. [Phase 0 Completion Report](phase-0-completion-report.md)
4. [Phase 0 Acceptance Matrix](phase-0-acceptance-matrix.md)
5. [Phase 0 Final Validation](phase-0-final-validation.md)
6. The risk and action register in this document

### Engineer or maintainer

Read:

- [Architecture](architecture.md)
- [Folder Structure and Naming](folder-structure.md)
- [Data Dictionary](data-dictionary.md)
- [Database Schema](database-schema.md)
- [Query Conventions](query-conventions.md)
- [Form and Validation Conventions](form-validation-conventions.md)
- [Logging and Observability](logging-and-observability.md)
- [Architecture Decision Records](adr/)

### Security or database reviewer

Read:

- [Security Threat Model](security-threat-model.md)
- [RLS Policy Matrix](rls-policy-matrix.md)
- [Entity Relationship Diagram](erd.md)
- [Database Schema](database-schema.md)
- [Migration Guide](migration-guide.md)
- [Supabase Client Architecture](supabase-client-architecture.md)
- [Phase 0 Final Validation](phase-0-final-validation.md)

### Operator or release engineer

Read:

- [Environment Variables](environment-variables.md)
- [Deployment](deployment.md)
- [Backup and Recovery](backup-recovery.md)
- [Testing Strategy](testing-strategy.md)
- [Performance Budget](performance-budget.md)
- [Migration Guide](migration-guide.md)

### Designer or accessibility reviewer

Read:

- [Design System](design-system.md)
- [Motion Design](motion-design.md)
- [Accessibility Checklist](accessibility-checklist.md)
- [HCI Screen Review Checklist](hci-screen-review-checklist.md)

## Controlled document register

| Document | Purpose | Primary audience |
| --- | --- | --- |
| [Master Build Specification](master-build-specification.md) | Authoritative product and delivery specification | All stakeholders |
| [Product Requirements](product-requirements.md) | Product goals, personas, workflows, and acceptance expectations | Product, delivery, engineering |
| [Architecture](architecture.md) | Current system boundaries, data flow, security model, and deployment shape | Engineering, security |
| [Database Schema](database-schema.md) | Table, constraint, trigger, function, and migration behavior | Engineering, database |
| [Data Dictionary](data-dictionary.md) | Field-level definitions and ownership | Engineering, analytics, support |
| [RLS Policy Matrix](rls-policy-matrix.md) | Role- and tenant-specific access behavior | Security, database |
| [Security Threat Model](security-threat-model.md) | Assets, trust boundaries, threats, mitigations, and residual risks | Security, engineering |
| [Testing Strategy](testing-strategy.md) | Test layers, environments, commands, and release gates | QA, engineering, release |
| [Deployment](deployment.md) | Deployment sequence, configuration, validation, and rollback | Operations, release |
| [Backup and Recovery](backup-recovery.md) | Backup scope, restore procedure, RPO/RTO targets, and evidence | Operations, governance |
| [Phase 0 Repository Audit](phase-0-repository-audit.md) | Initial repository findings and disposition | Engineering, project management |
| [DeepSeek Phase 0 Handoff](deepseek-phase-0-handoff.md) | First-pass implementation handoff and review requests | Engineering, audit |
| [Codex Phase 0 Review](codex-phase-0-review.md) | Independent finalization review and corrections | Engineering, security |
| [Phase 0 Work Log](phase-0-work-log.md) | Chronological execution record | Project management, audit |
| [Phase 0 Acceptance Matrix](phase-0-acceptance-matrix.md) | Requirement-to-evidence traceability | Product, QA, audit |
| [Phase 0 Final Validation](phase-0-final-validation.md) | Final commands, results, limitations, and release gate | QA, release, security |
| [Phase 0 Completion Report](phase-0-completion-report.md) | Executive decision and handoff | Product owner, project management |
| [Lovelace Phase 0 Project Handoff](../.lovelace/documentation/phase-0-handoff.md) | Publication record, board map, residual-risk sequence, and Phase 1 boundary | Product owner, project management |

## Phase 0 deliverable summary

| Workstream | Delivered outcome | Evidence |
| --- | --- | --- |
| Architecture | Feature boundaries, shared infrastructure, ADRs, and runtime topology documented | `architecture.md`, `folder-structure.md`, `adr/` |
| Security | Tenant isolation, route protection, safe errors, upload controls, and threat analysis | `rls-policy-matrix.md`, `security-threat-model.md` |
| Database | Nine ordered migrations, composite tenant constraints, RLS, triggers, RPCs, and clean-chain tests | `database-schema.md`, `migration-guide.md`, `src/db/tests/` |
| Reliability | Transactional numbering and work-order updates, optimistic version checks, derived financial state | `phase-0-final-validation.md`, ADR-0008 |
| Quality | Lint, typecheck, 50 Vitest tests, 9 migration/RLS cases, build, and 2 Playwright projects pass | `phase-0-final-validation.md` |
| Operations | Environment, deployment, backup/restore, monitoring, and performance expectations documented | Operations documents listed above |
| Governance | Acceptance matrix, audit trail, completion decision, explicit residual risk register, and Lovelace board | Phase 0 control documents and `.lovelace/` |

## Validation gate

| Gate | Result | Release effect |
| --- | --- | --- |
| ESLint | Passed | Clear |
| Static type checking | Passed | Clear |
| Vitest | 50/50 passed | Clear |
| Migration/RLS subset | 9/9 passed | Clear for local evidence |
| Production build | Passed | Clear |
| Playwright desktop/mobile | 2/2 passed | Clear for tested entry surface |
| Production dependency audit | Failed: three High findings | Blocks progression approval |
| Hosted Supabase rehearsal | Not performed | Required before production |
| Backup/restore rehearsal | Not performed | Required before production |

## Risk and action register

| ID | Priority | Risk or action | Owner | Exit criteria | Status |
| --- | --- | --- | --- | --- | --- |
| SEC-01 | Blocker | Resolve High PostCSS dependency advisories | Engineering lead | `npm audit --omit=dev --audit-level=high` exits successfully and the full CI sequence remains green | Open |
| DB-01 | Pre-production | Rehearse migrations `00001`–`00009` against an isolated hosted Supabase project | Database/platform owner | Migration history, grants, JWT/RLS behavior, Storage policies, and signed URLs are verified | Open |
| OPS-01 | Pre-production | Prove database, Auth linkage, and Storage backup/restore | Operations owner | Timed restore succeeds in an isolated environment and evidence is retained | Open |
| OPS-02 | High | Define cleanup for objects uploaded before a metadata insert fails | Engineering/operations | Orphan detection and safe cleanup are automated and monitored | Open |
| PERF-01 | Pre-production | Measure production performance budgets | Engineering lead | Documented p75/p95 results meet the agreed budgets or have approved exceptions | Open |
| A11Y-01 | Pre-production | Complete full screen and reduced-motion review | Product/design owner | Accessibility and HCI checklists are completed with defects resolved or accepted | Open |

Owners are role-based until named individuals are assigned. The project manager
should assign names and target dates before production scheduling.
The mirrored Lovelace tickets use Niru as the default accountable repository
owner until those role-specific execution owners are delegated.

## Release and change control

- Apply database migrations in filename order. Do not edit an already-deployed
  migration; add a new migration with forward and rollback guidance.
- Treat work-order numbers, tenant ownership, financial derivations, and audit
  history as database-owned invariants.
- Keep service-role credentials server-only and use the admin client only from
  reviewed server paths.
- Update the acceptance matrix, validation record, completion report, and this
  register when a release gate changes.
- Record significant design changes in a new or superseding ADR.
- Keep Phase 1 changes in a separate branch and migration sequence from this
  published Phase 0 baseline.

## Handoff checklist

- [ ] Review the completion decision and open risks.
- [ ] Confirm local Node and npm versions match the repository configuration.
- [ ] Create `.env.local` from `.env.example` without committing secrets.
- [ ] Run `npm ci`.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run test:run`,
      `npm run db:test`, and `npm run build`.
- [ ] Run `npx playwright test` in an environment where browser execution is
      available.
- [ ] Run `npm audit --omit=dev --audit-level=high`.
- [ ] Rehearse migrations, RLS, Storage, backup, and restore before production.
- [ ] Close or formally accept every open release risk.

## Historical records

`PHASE0_ARCHITECTURE_REPORT.md`, `ARCHITECTURE.md`, and
`deepseek-phase-0-handoff.md` include earlier checkpoint language and legacy
roadmap labels. They are retained for auditability. The current Phase 0 outcome
is defined by the final validation, completion report, and acceptance matrix.
