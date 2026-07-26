# ADR-0003: Generic Asset Domain with Vehicle-First UI

- Status: Accepted
- Date: 2026-07-23

## Context

TalyerLedger initially serves automotive and machine-repair workflows but is intended to expand to fleet, heavy-equipment, industrial, and CMMS use cases. `Asset` is broad enough for vehicles, motorcycles, excavators, generators, pumps, conveyors, and machines. The implemented schema and product, however, are vehicle-specific: `vehicles`, `vehicle_id`, `/vehicles`, vehicle forms, VIN, plate, and odometer-oriented views are used throughout the application.

Renaming the active model before generic-asset workflows are approved would create migration risk without delivering user value. Keeping vehicle terminology forever would constrain the planned Phase 6 expansion.

## Decision

`Asset` is the long-term core domain concept, while the current product remains vehicle-first.

- The existing `vehicles` table, `vehicle_id` references, vehicle TypeScript types, `/vehicles` routes, and Vehicle UI remain in place through Phase 6.
- Initial screens use familiar Vehicle language and do not expose industrial fields that are not needed for automotive work.
- New code before Phase 6 must not introduce a parallel generic `assets` model or duplicate records solely to anticipate future types.
- Phase 6 will introduce the generic asset schema and UI through an explicit, tested migration that preserves work-order, attachment, customer, and maintenance history.
- Generic fields such as asset type, asset code, serial or registration, meter type, and meter reading use progressive disclosure when implemented.

## Consequences

- Positive: The current vehicle workflow remains stable and understandable.
- Positive: The accepted domain direction supports later CMMS and non-vehicle expansion.
- Tradeoff: Code and schema use narrower terminology than the long-term domain until Phase 6.
- Tradeoff: Features added before Phase 6 must avoid assumptions that make the eventual migration unnecessarily destructive.
- Follow-up: Phase 6 requires a data migration and a terminology review across schema, APIs, routes, search, attachments, PDFs, analytics, and tests.

## Alternatives Considered

- Rename all vehicle code and data to assets now: Rejected because Phase 6 requirements and generic fields are not yet implemented, and the change would be mostly churn.
- Keep a vehicle-only model permanently: Rejected because it conflicts with the approved industrial and CMMS product direction.
- Maintain both vehicles and assets before Phase 6: Rejected because dual models would create identity, synchronization, and foreign-key ambiguity.
- Put generic industrial fields directly into the current form: Rejected because it would overload the initial vehicle workflow.

## Migration and Deferred Conflicts

- The `vehicles` table and Vehicle UI remain intentionally until Phase 6. Their presence is not an accidental unresolved rename.
- Work orders currently require `vehicle_id`; attachments use the `vehicle` parent type; customer counts and dashboards also query `vehicles`.
- No `assets` table or generic asset UI exists in the current migration chain.
- Migration `00009_phase0_tenant_security.sql` scopes `vehicles` and vehicle relationships to a workshop; it does not perform the Phase 6 asset conversion. Migration `00009` was not live-applied or live-verified in this session.
- Phase 6 must define whether to rename `vehicles`, migrate to a new `assets` table, or evolve it in place before any production data change is approved.
