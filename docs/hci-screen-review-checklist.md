# TalyerLedger — HCI Screen Review Checklist

## Evaluation Framework

Each major screen is evaluated against:

- Nielsen's 10 usability heuristics
- Shneiderman's Eight Golden Rules
- Norman's principles (visibility, feedback, affordance, mapping, constraints, conceptual model)
- WCAG 2.2 AA

## Dashboard (`/`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Operational overview, KPI cards, recent items, quick actions |
| Primary action | Create Estimate | Visible in Quick Actions card |
| Feedback | Partial | Skeleton loading, no optimistic updates |
| Loading state | ✅ | Skeleton cards and table rows |
| Empty state | ✅ | "No work orders yet" text |
| Error state | ✅ | `error.tsx` boundary exists |
| Keyboard navigation | Partial | Quick actions are links, cards are not focusable |
| Focus visibility | ✅ | Focus-visible ring via globals.css |
| Labels | ✅ | Card titles, button text, link text |
| Touch targets | ✅ | Buttons >44px, links in tables are smaller |
| Contrast | ✅ | OKLCH variables, dark mode |
| Responsive | ✅ | 4-col grid → 1-col on mobile |
| Destructive-action recovery | N/A | No destructive actions on dashboard |

## Login (`/login`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Email/password sign-in |
| Primary action | Sign in | Visible submit button |
| Feedback | Partial | Error display, no loading state for email field |
| Loading state | ✅ | Button shows loading during submission |
| Empty state | N/A | |
| Error state | ✅ | `error` searchParam renders error message |
| Keyboard navigation | ✅ | Tab order: email → password → submit |
| Focus visibility | ✅ | Outline ring |
| Labels | ✅ | `<FormLabel>` with `htmlFor` |
| Contrast | ✅ | |
| Responsive | ✅ | Centered card layout |
| Accessibility | ✅ | Skip-link available from root layout |

## Customer List (`/customers`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Browse, search, create customers |
| Primary action | Add Customer | Button in header |
| Loading state | ✅ | Skeleton rows |
| Empty state | ✅ | "No customers" with create prompt |
| Error state | ✅ | Via ErrorState component |
| Keyboard nav | Partial | Table rows not focusable; action buttons are |
| Pagination | ⚠️ | 100-row limit, no load-more or pagination UI |

## Customer Detail (`/customers/[id]`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | View/edit customer info, see vehicles, take actions |
| Primary action | Edit or Add Vehicle | Action buttons in card |
| Loading state | ✅ | Skeleton |
| Empty state | ✅ | "No vehicles" text |
| Error state | ✅ | |
| Keyboard nav | Partial | |
| Breadcrumb | ✅ | Heading with link back to list |

## Vehicle Detail (`/vehicles/[id]`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Vehicle info, work history, timeline, gallery |
| Primary action | Create Estimate | Visible button |
| Loading state | ✅ | Skeleton |
| Empty state | ✅ | "No work orders yet" |
| Error state | ✅ | |
| Keyboard nav | Partial | Timeline items not individually focusable |

## Work Order Detail (`/jobs/[id]`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Line items, payments, status, gallery, drop-off |
| Primary action | Edit, Status change, or Payment | Multiple action areas |
| Loading state | ✅ | Skeleton |
| Empty state | ✅ | "No line items" |
| Error state | ✅ | |
| Keyboard nav | Partial | Complex form with many interactive elements |
| Form complexity | ⚠️ | Largest component (~800 lines), needs progressive disclosure |

## Work Order Form (`/jobs/new`, `/jobs/[id]/edit`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Vehicle, customer, line items, discounts |
| Primary action | Save | Submit button at bottom |
| Loading state | ✅ | |
| Validation | ✅ | Zod + inline messages |
| Error state | ✅ | Form-level and field-level errors |
| Unsaved changes | ❌ | No beforeunload or draft persistence |
| Responsive | Partial | Table editing on mobile is constrained |
| Keyboard nav | Partial | DnD reordering not keyboard accessible |

## Settings (`/settings`)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Shop info, labor catalog, service packages |
| Primary action | Save or Add item | Tab-dependent |
| Loading state | ✅ | |
| Empty state | ✅ | No items text |
| Error state | ✅ | |
| Keyboard nav | ✅ | |

## Global Search (Ctrl+K)

| Criterion | Status | Notes |
|---|---|---|
| Page purpose | Clear | Quick navigation to customers, vehicles, work orders |
| Primary action | Select result | Keyboard enter or click |
| Feedback | ✅ | Deferred query loading |
| Keyboard nav | ✅ | Arrow keys, enter, escape |
| Accessibility | ✅ | Command dialog from cmdk library |

## Common Patterns

### Skeleton Loading

All list and detail pages use `Skeleton` components for loading state.

### Empty State

Lists show descriptive text and a create-action link when empty.

### Destructive Actions

- Delete (soft) has confirmation dialog via `AlertDialog`.
- Payment and line item deletion within forms show confirmation.
- Restore is available in the data layer but has no UI.

### Error Communication

- Root error boundary: "The page encountered an unexpected problem. Your saved records were not changed."
- Dashboard error boundary: Similar message with retry.
- Form errors: Inline field messages + toast for server errors.
- Not found: "The page may have moved or you may not have access."

## Accessibility Defects Found (Critical)

1. **No screen-reader announcements** for dynamic content changes (status updates, payment added).
2. **Drag-and-drop line-item reordering** has no keyboard alternative.
3. **Work order form is extremely long** (~800 lines) with no progressive disclosure or section navigation.
4. **No `aria-live` regions** for async operation feedback.
5. **Color-only status indicators** exist in some places (status badges use text + color, but no icon differentiation).

## Items Requiring GPT-5.6 Sol Review

- Systematic keyboard navigation audit of all interactive elements
- Screen reader testing with NVDA or VoiceOver
- Color contrast verification using automated tools
- Touch-target sizing audit on mobile views
- Focus-order verification on complex forms
