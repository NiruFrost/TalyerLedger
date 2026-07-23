# TalyerLedger — TanStack Query Conventions

## Provider

Global provider in `src/components/providers.tsx` wraps the root layout with `<QueryClientProvider>` and `<ThemeProvider>`.

## Query Client

Configured in `src/lib/query/query-client.ts`:

| Setting | Value | Rationale |
|---------|-------|-----------|
| `staleTime` | 30,000 ms | Data is fresh for 30s; reduces redundant refetches |
| `retry` | 1 attempt | One retry for transient failures; no infinite retries |
| `refetchOnWindowFocus` | `false` | Workshop data changes slowly; avoids distracting refetches |
| `networkMode` | `'online'` | Eagerly fail when offline; no stale cache usage |
| Mutation retries | `false` | Mutations should fail fast to surface errors immediately |
| Mutation `onError` | Logged via `logger` | All mutation errors are logged with the structured logger |

## Query Key Factory

Defined in `src/lib/query/keys.ts`:

```typescript
export const queryKeys = {
  auth: { currentUser: ['auth', 'current-user'] as const },
  customers: { all: ['customers'] as const, detail: (id: string) => ['customers', id] as const },
  vehicles: { all: ['vehicles'] as const, detail: (id: string) => ['vehicles', id] as const },
  workOrders: { all: ['work-orders'] as const, detail: (id: string) => ['work-orders', id] as const },
}
```

**Convention:** All query keys use the factory pattern. Add new factories for each feature. Keys are `as const` for type safety.

## List Query Example

```typescript
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: getCustomers,
  })
}
```

## Detail Query Example

```typescript
export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => getCustomer(id),
    enabled: !!id,
  })
}
```

## Create Mutation Example

```typescript
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    },
  })
}
```

## Update Mutation Example

```typescript
export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) => updateCustomer(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(variables.id) })
    },
  })
}
```

## Soft-Delete Mutation Example

```typescript
export function useDeleteCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => softDeleteRecord('customers', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.all })
    },
  })
}
```

## Invalidation Strategy

- Invalidate list keys after create/update/delete
- Invalidate both list and detail keys after update
- Use optimistic updates only where rollback is safe and visually clear
- Never invalidate unnecessarily (avoids waterfall refetches)

## SSR and Hydration

- No `prefetchQuery` on server yet (Phase 1 scope)
- Client hydrates from initial server-rendered data
- Avoid `disableSSR` or hydration-specific workarounds
