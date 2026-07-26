# ADR-0006: Workshop-Scoped Row Level Security

- Status: Accepted
- Date: 2026-07-23

## Context

Migrations `00001` through `00008` generally allow any authenticated user to read or update application data. That single-owner shortcut does not satisfy the product requirement for multiple users and workshops and would expose one workshop's customers, work orders, payments, and evidence to another authenticated account. UI filters and hidden routes cannot provide tenant security.

Migration `00009_phase0_tenant_security.sql` defines workshops, workshop membership, tenant columns, parent integrity, forced RLS, and workshop-prefixed private storage. The migration test executes the complete migration chain in PGlite and exercises owner, different-user, anonymous, foreign-key, attachment metadata, and storage-object boundaries.

## Decision

The workshop is the authorization and data-isolation boundary.

- Every exposed business row carries a non-null, immutable `workshop_id` and is accessible only to an active member of that workshop.
- RLS is enabled and forced on exposed tenant tables. Client queries and application filters are defense in depth, not authorization.
- Inserts default to the authenticated user's current workshop and reject a supplied workshop outside that membership.
- Updates cannot move a row between workshops.
- Composite foreign keys or equivalent validation prevent cross-workshop parent references.
- Soft-deleted rows are excluded from ordinary member reads where deletion applies.
- Attachment metadata and storage objects share the same workshop boundary. Object paths begin with the workshop UUID.
- The attachment bucket is private. Browser writes do not receive broad storage privileges; the server may use `service_role` only after authenticating the user and authorizing the active parent.
- `service_role` credentials remain server-only and are never a substitute for request-level authorization.

## Consequences

- Positive: Authenticated accounts cannot see or mutate another workshop's operational data merely by knowing an ID.
- Positive: Database constraints protect ownership even if application code omits a filter.
- Positive: Storage and metadata use one tenant model.
- Tradeoff: Every new business table, relationship, function, storage path, and test must account for workshop scope.
- Tradeoff: Administrative and migration operations require explicit trusted handling rather than bypassing tenant rules casually.
- Follow-up: Hosted Supabase policy and storage behavior must be verified after every relevant migration deployment.

## Alternatives Considered

- Keep global access for all authenticated users: Rejected because authentication is not tenant authorization.
- Filter by `created_by`: Rejected because workshop records must be shareable by members and creator identity is an audit field, not ownership.
- Enforce workshop filters only in repositories: Rejected because a missed or malicious query could cross the tenant boundary.
- Use one database or schema per workshop: Rejected for the current scale because it adds provisioning and migration complexity without a demonstrated need.

## Migration and Deferred Conflicts

- Migration `00009` replaces permissive legacy policies, adds ownership columns and integrity controls, and provisions the private `attachments` bucket.
- Existing operational data is auto-assigned only when exactly one auth user exists. A legacy database with multiple users requires an explicit reviewed mapping before migration; the transaction aborts rather than guessing.
- The clean migration chain and representative RLS cases pass through `src/db/tests/migrations.test.ts`, but PGlite is not the hosted Supabase environment.
- Migration `00009` was not live-applied in this session. No claim is made that the current hosted database, RLS policies, functions, or storage bucket already match it.
- Expired public tokens, customer-safe public sharing, and finer visibility distinctions are not covered by the present migration test because those flows are not yet implemented. They require tests in their approved phases.
