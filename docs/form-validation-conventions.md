# TalyerLedger — Form and Validation Conventions

## Stack

- **React Hook Form** v7 for form state and submission
- **Zod** v3 for schema validation
- **`@hookform/resolvers`** `zodResolver` bridges the two

## Schema Location

Each feature has a `schemas.ts` file exporting Zod schemas and inferred TypeScript types:

```text
src/features/auth/schemas.ts
src/features/customers/schemas.ts
src/features/vehicles/schemas.ts
src/features/work-orders/schemas.ts
src/features/line-items/schemas.ts
src/features/payments/schemas.ts
src/features/settings/schemas.ts
```

## Shared Client and Server Schemas

Schemas are used on both client and server. They are never duplicated.

```typescript
// schemas.ts
export const customerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(160),
  email: z.string().email().max(254).or(z.literal('')).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
```

## Pattern

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { customerSchema, type CustomerFormValues } from '../schemas'

export function CustomerForm() {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form

  async function onSubmit(data: CustomerFormValues) {
    // mutation call
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        aria-invalid={!!errors.name}
        aria-describedby={errors.name ? 'name-error' : undefined}
        {...register('name')}
      />
      {errors.name && (
        <p id="name-error" role="alert">{errors.name.message}</p>
      )}
    </form>
  )
}
```

## Accessible Labels

- Every input has an associated `<Label htmlFor="...">`
- Error messages use `role="alert"` and are connected via `aria-describedby`
- Invalid inputs use `aria-invalid={true}`
- Submit buttons show loading state and disable during submission

## Safe Numeric Parsing

```typescript
export const paymentSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be at least 0.01'),
  // ...
})
```

Use `z.coerce.number()` to safely parse string input from form fields.

## Currency Parsing

Currency values are stored as integer cents in calculation logic (see `src/lib/financial-calculations.ts`) but displayed/formatted as decimal strings. Form inputs use `z.coerce.number()` with appropriate min/max.

## Date Handling

- Dates use ISO 8601 strings (`YYYY-MM-DD`)
- Form inputs use `<input type="date">`
- Zod validates with `z.string()` and server normalizes to `TIMESTAMPTZ`

## Error Focus

- On validation error, first invalid field should receive focus (React Hook Form's `handleSubmit` does not auto-focus; use `setFocus` from `useForm` if needed)
- Error messages are visually adjacent to the field

## Unsaved-Change Behavior

Not yet implemented (Phase 1 scope). Plan: use `formState.isDirty` to warn before navigation.

## Field-Level Messages

- Per-field errors appear below the field
- Form-level errors (e.g., mutation failure) appear above the submit button
- Error text uses `text-destructive` (red) via Tailwind
