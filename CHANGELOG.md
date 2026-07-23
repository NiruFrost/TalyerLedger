# Changelog

All notable changes to TalyerLedger are documented here.

## [Unreleased]

### Added
- CI workflow: pre-generate `.next/types` before TypeScript type checking
- Documentation: `docs/phase-0-repository-audit.md`
- Documentation: `docs/phase-0-work-log.md`
- Documentation: `docs/supabase-client-architecture.md`
- Documentation: `docs/query-conventions.md`
- Documentation: `docs/form-validation-conventions.md`
- Documentation: `docs/logging-and-observability.md`
- Documentation: `docs/hci-screen-review-checklist.md`
- Documentation: `docs/deepseek-phase-0-handoff.md`
- Changelog: `CHANGELOG.md`

### Fixed
- CI pipeline: replaced separate `typecheck` step with `build` (which includes TypeScript checking) to avoid `.next/types` generation ordering issue
