---
id: index
type: document
summary: Project orientation, authoritative reading order, release status, and project-management conventions for TalyerLedger.
updated: 2026-07-26T13:38:00Z
---

# TalyerLedger project orientation

TalyerLedger is a workshop management application for repair estimates,
work orders, payments, customer and vehicle records, and private repair
evidence. It uses Next.js, React, TypeScript, Supabase PostgreSQL/Auth/Storage,
TanStack Query, Zod, Vitest, PGlite, and Playwright.

## Current delivery state

The published baseline is Master Build v3 Phase 0. The locally verifiable
architecture, tenancy, security, database, reliability, testing, operations,
and governance scope is complete.

Progression approval remains open because the production dependency audit
reports three High PostCSS findings. This is tracked by [[T-0004]].

Primary publication:

- Branch: `codex/phase-0-finalization`
- Phase 0 baseline commit: `c3820d4`
- Lovelace project-management commit: `f414da8`
- Pull request: https://github.com/NiruFrost/Talyer-Ledger/pull/1

Backup publication:

- Branch: `codex/phase-0-finalization`
- Pull request: https://github.com/NiruFrost/TalyerLedger/pull/1

## Phase boundary

This project-management baseline covers Phase 0 only. Phase 1 planning,
migration `00010`, Phase 1-only fields, PDFs, and in-progress implementation
are excluded from the publication branch.

## Reading order

1. Read [[phase-0-handoff]] for the executive outcome, evidence, and open work.
2. Review [[E-0001]] for the completed Phase 0 baseline.
3. Review `docs/README.md` for the controlled repository documentation map.
4. Review `docs/phase-0-completion-report.md` for the release decision.
5. Review `docs/phase-0-acceptance-matrix.md` for requirement-level evidence.
6. Review `docs/phase-0-final-validation.md` for commands, results, and limits.
7. Review `docs/security-threat-model.md` and `docs/rls-policy-matrix.md` before
   security or database changes.
8. Review the applicable ADRs under `docs/adr/` before changing architecture.

## Project-management conventions

- `todo` contains ready, decision-bearing work.
- `in_progress` contains active implementation.
- `in_review` means agent work is complete and awaits review.
- `done` records verified completion.
- `backlog` contains accepted work that is not yet scheduled.
- Urgent and High items must have explicit exit criteria.
- Phase 1 changes must remain separate from the published Phase 0 branch.
- Significant implementation work should reference its Lovelace ticket in the
  commit message.

## Tooling portability

The checked-in `.mcp.json` and `.claude/settings.json` retain the
installer-generated Lovelace executable paths for the current Windows
workstation. A collaborator using a different account, installation directory,
or operating system must install Lovelace and refresh those commands locally
before relying on MCP access or agent hooks.

## Immediate decisions

1. Review both draft publication pull requests in [[T-0003]].
2. Decide whether [[T-0004]] must close before merge.
3. Assign named platform and operations owners to [[T-0005]] and [[T-0006]].
