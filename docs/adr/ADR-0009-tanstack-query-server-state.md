# ADR-0009: TanStack Query for Client-Side Server State

- Status: Accepted
- Date: 2026-07-23

## Context

Client features repeatedly read and mutate remote workshop data that has loading, stale, retry, error, and invalidation behavior. Treating that data as ordinary component state would duplicate request logic and make related screens disagree after writes. The approved stack distinguishes server state from form state and local interaction state.

TanStack Query v5 is installed and a single browser `QueryClient` is provided at the application root. Current feature hooks use queries and mutations, while React Hook Form handles forms and component state handles interactions such as dialogs. Query-key definitions exist but adoption is incomplete.

## Decision

TanStack Query is the standard client-side owner of server state.

- Feature hooks expose `useQuery` and `useMutation` behavior to UI components and call repository- or service-facing operations.
- Query keys are stable, hierarchical, and centralized by feature so invalidation and cache updates use the same identity.
- Successful mutations invalidate or safely update every affected aggregate and list key.
- Optimistic updates are used only when rollback is safe and the user benefit justifies the added behavior.
- React Hook Form owns editable form state. Local React state owns ephemeral interaction state. Neither duplicates the canonical server cache.
- Another global client-state library is introduced only for a demonstrated cross-feature client-state problem and requires a separate decision.
- Cache contents are not an authorization boundary. RLS and server authorization remain authoritative.
- Sign-out or workshop switching must clear or partition cached tenant data before another identity can observe it.
- Server Components may fetch request-time data where useful; TanStack Query remains the standard for interactive client caching rather than forcing every read through client rendering.

## Consequences

- Positive: Loading, error, retry, deduplication, and invalidation behavior is consistent across interactive features.
- Positive: Mutations can refresh all views of an affected work order or entity without manual state synchronization.
- Tradeoff: Query-key discipline is required, and broad invalidation can cause unnecessary refetches.
- Tradeoff: Offline mutation queues and optimistic behavior require explicit conflict and rollback design and are not automatic.
- Follow-up: Tests should cover critical invalidation and tenant-cache clearing behavior as those flows are implemented.

## Alternatives Considered

- Store remote rows in local component state and effects: Rejected because request lifecycle and synchronization logic would be duplicated.
- Put all server data in Zustand or another global store: Rejected because it would recreate cache, retry, and invalidation behavior already provided by TanStack Query.
- Use only request-time Server Component fetching: Rejected as the sole approach because current CRUD, galleries, forms, and mutations need interactive client caching.
- Refetch the whole application after every write: Rejected because it is wasteful and degrades interaction continuity.

## Migration and Deferred Conflicts

- `Providers` creates one client with a 30-second stale time, one query retry, no mutation retry, online network mode, and mutation error logging.
- Feature hooks generally use TanStack Query and invalidate related keys after writes.
- `src/lib/query/keys.ts` is not used consistently; most hooks and components still use literal key arrays.
- Some components define data access inside query functions, including global search and the vehicle timeline. TanStack Query usage there does not satisfy ADR-0005's repository boundary.
- There are no focused automated tests for query defaults, invalidation, sign-out cache clearing, or workshop switching.
- Offline drafts and queued mutations are deferred to Phase 8. No database migration is required by this decision.
