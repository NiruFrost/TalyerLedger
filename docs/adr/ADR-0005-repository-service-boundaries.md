# ADR-0005: Repository and Service Boundaries

- Status: Accepted
- Date: 2026-07-23

## Context

TalyerLedger uses Supabase for PostgreSQL, authentication, and storage, but core feature behavior must remain testable and must not be spread through UI components. The target flow is UI component to feature hook or form controller to service or use case to repository interface to provider implementation. Trivial reads do not justify ceremonial layers, but vendor calls in components make authorization, filtering, errors, transactions, and future provider changes difficult to control.

Most current feature `actions.ts` modules instantiate a Supabase client and query tables directly. Some components, including global search and the vehicle timeline, also issue Supabase queries. The Customer feature now defines a repository interface and a Supabase implementation with a repository unit test.

## Decision

Domain persistence and external integrations use explicit repository or service boundaries.

- UI components do not contain Supabase table or storage queries.
- Feature hooks own client-side server-state orchestration and call a use case, service, or repository-facing action.
- Services or use cases coordinate domain rules, multi-record workflows, and transaction boundaries.
- Repository interfaces describe domain persistence without exposing Supabase query-builder details.
- Supabase repository implementations translate between those interfaces and the provider SDK and rely on database constraints and RLS for final authorization.
- Provider-oriented integrations such as media storage, PDF generation, OCR, notifications, and backups use service or adapter interfaces.
- Simple reads may call a repository directly from a hook-facing action; no empty pass-through service class is required.
- Interfaces are introduced at real seams and tested through injected implementations rather than created for every function by default.

## Consequences

- Positive: Domain behavior, query invariants, and error handling can be tested without a live Supabase project.
- Positive: UI code no longer determines persistence or vendor behavior.
- Positive: Storage and later integrations can be replaced behind stable contracts.
- Tradeoff: Features gain additional files and dependency wiring where a boundary provides value.
- Tradeoff: During incremental adoption, architectural consistency is temporarily incomplete.
- Follow-up: Repository tests should cover active-row filtering, bounded reads, ownership assumptions, and error translation relevant to each feature.

## Alternatives Considered

- Query Supabase directly from every component: Rejected because it duplicates data rules and couples UI behavior to a vendor SDK.
- Treat any `actions.ts` file as a repository automatically: Rejected because file placement alone does not provide an interface, dependency injection, or provider isolation.
- Build a fully generic repository framework: Rejected because it would obscure feature-specific queries and over-engineer simple operations.
- Put all features in one global data service: Rejected because it would become a large, coupled boundary with unclear ownership.

## Migration and Deferred Conflicts

- `CustomerRepository` and `createSupabaseCustomerRepository` are the only current representative domain data repository boundary. The repository test verifies an active-row filter and a bounded list query.
- Other feature actions generally call Supabase directly and are not considered equivalent repository implementations merely because components call them through hooks.
- `StorageService` is an existing integration-provider boundary, not evidence that other domain repositories are complete.
- Direct Supabase access remains in UI code such as `search-command.tsx` and `vehicle-timeline.tsx`; these are accepted migration targets, not the target architecture.
- Adoption is feature-by-feature when behavior is changed or a seam is needed. A risky big-bang rewrite is not required.
- This decision requires no database migration. Migration `00009` strengthens the authorization layer beneath repositories but was not live-applied or live-verified in this session.
