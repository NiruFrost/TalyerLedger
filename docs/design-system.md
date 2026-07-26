# Design System

## Purpose and source of truth

TalyerLedger is an operational workshop interface: dense enough for estimates and records, but usable on a phone around vehicles. The current visual system is Tailwind CSS v4 plus local shadcn-style primitives. It is neutral, typography-led, and uses color primarily for status and destructive emphasis.

The implementation sources are:

- Global tokens and base behavior: `src/app/globals.css`
- Root fonts and theme provider: `src/app/layout.tsx`, `src/components/providers.tsx`
- Primitive configuration: `components.json`
- Reusable primitives: `src/components/ui/`
- Form composition: `src/components/forms/index.tsx`
- Layout shell: `src/components/layout/`
- Domain labels and status colors: `src/lib/constants.ts`
- Class merging: `src/lib/utils.ts`

This document records the current system and contribution rules. It is not a visual-regression or contrast certification.

## Foundations

### Typography

| Role               | Current implementation                                                | Usage                                                        |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| Interface sans     | Inter through `next/font/google`, exposed as `--font-sans`            | Body, navigation, forms, tables, headings                    |
| Monospace          | Geist Mono through `next/font/google`, exposed as `--font-geist-mono` | Currency columns, VINs, reference-like values                |
| Page title         | Usually `text-2xl font-bold tracking-tight`                           | One visible title per route                                  |
| Shell title        | `text-xl font-semibold` when the shell receives a title               | Header context; do not duplicate the page `h1`               |
| Section/card title | Default semibold, or `text-sm font-medium` for metric cards           | Group related data, not decoration                           |
| Body/control       | `text-sm` is the dominant operational size                            | Labels, controls, tables, descriptions                       |
| Supporting text    | `text-xs` or `text-sm text-muted-foreground`                          | Dates, IDs, hints; never the only carrier of essential state |

Use sentence case. Keep work-order references, amounts, VINs, and plates visually stable; do not use decorative display type. Current URLs use `/jobs`, while the domain model and most copy use "work order" or "estimate". Do not introduce another term without a coordinated content decision.

### Color

The light and dark palettes in `src/app/globals.css` use OKLCH semantic variables. Use semantic utilities or variables rather than hard-coded neutral colors.

| Semantic group     | Tokens                                                     |
| ------------------ | ---------------------------------------------------------- |
| Canvas and text    | `background`, `foreground`                                 |
| Surfaces           | `card`, `card-foreground`, `popover`, `popover-foreground` |
| Primary action     | `primary`, `primary-foreground`                            |
| Secondary action   | `secondary`, `secondary-foreground`                        |
| Quiet content      | `muted`, `muted-foreground`                                |
| Selection/hover    | `accent`, `accent-foreground`                              |
| Destructive action | `destructive`, `destructive-foreground`                    |
| Boundaries/focus   | `border`, `input`, `ring`                                  |
| Navigation         | `sidebar-*`                                                |
| Charts             | `chart-1` through `chart-5`; currently neutral             |

Status colors are defined in `src/lib/constants.ts` and always appear with text labels:

| Domain       | Current mapping                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Work order   | Gray draft/closed, blue estimate, green approved, yellow in progress, emerald completed, purple released, red voided |
| Payment      | Red unpaid, amber partial, green paid, blue overpaid                                                                 |
| Installation | Amber to confirm, violet ordered, blue in stock, green installed, red out of stock, gray N/A                         |
| Attachments  | Category-specific light background plus dark text for before/during/after/damage and evidence categories             |

Do not rely on hue alone. Keep the status/category text, and add an icon or explanatory text when the consequence is important. Direct palette classes in status constants, attachment badges, and a few legacy error/search controls need dark-mode and contrast review before being treated as reusable tokens.

### Theme

`ThemeProvider` uses the system theme, applies a `class` to the root, and disables transitions while the theme changes. There is currently no visible theme switcher. Every changed screen must be reviewed in both system light and dark modes; do not claim user-selectable theme support from the provider alone.

### Shape, border, and elevation

| Element              | Current convention                                                |
| -------------------- | ----------------------------------------------------------------- |
| Base radius          | `--radius: 0.625rem`                                              |
| Inputs/buttons       | `rounded-md`                                                      |
| Navigation/list rows | `rounded-lg`                                                      |
| Cards                | `rounded-xl`, one semantic border, default shadow                 |
| Dialog/popover       | Bordered surface with `shadow-md` or `shadow-lg`                  |
| Focus                | 2 px global `focus-visible` outline, with component ring variants |

Avoid stacking multiple shadows and bordered cards. Group by spacing and headings before adding another container.

### Spacing and density

The dominant page rhythm is `space-y-6`; section grids use `gap-4` or `gap-6`. Dashboard main padding is `p-4 lg:p-6`. Cards use `p-6`, and form fields use `space-y-2` inside `space-y-4` or `space-y-6` groups.

The base button is 36 px high (`h-9`), while shell navigation and header controls use at least 44 px (`min-h-11` or `size-11`). For touch-first actions, use a 44 by 44 CSS-pixel target or provide equivalent spacing; do not shrink icon controls to the attachment card's current 28 px pattern without an accessibility review.

## Layout

### Application shell

`DashboardShell` uses a fixed-height `h-dvh` frame, a scrollable main region, and responsive padding. The sidebar is a 16 rem off-canvas navigation with a backdrop, Escape handling, `inert` while closed, and active-page state. The header contains the navigation trigger, optional title, command search, and account menu.

The shell's main landmark is `#main-content`, which is the target of the root skip link. Full-page auth, global error, and not-found layouts must also provide a valid skip target or intentionally suppress/rehome the link; this is a current review item.

### Responsive composition

- Start with one column and allow content to wrap without horizontal page scrolling.
- Use `sm` for small control regrouping, `md` for two-column forms/cards, and `lg` for wider dashboard grids.
- Tables may scroll inside the `Table` wrapper. Preserve headers and expose an equivalent mobile reading order when a table becomes difficult to scan.
- Keep primary and destructive actions visible and labeled on narrow screens. Do not make them hover-only.
- Review at 320, 375/412, 768, 1024, and 1280 CSS pixels, plus 200% and 400% zoom.
- Signed attachment images use native `img` elements because expiring URLs are intentionally not routed through the Next image optimizer. Continue to provide dimensions/aspect boxes, lazy loading where appropriate, and useful alternative text.

## Component inventory

Current reusable UI primitives in `src/components/ui/` are:

| Category           | Components                                                      |
| ------------------ | --------------------------------------------------------------- |
| Actions            | `button`, `checkbox`, `switch`                                  |
| Inputs             | `input`, `textarea`, `select`, `unit-combobox`                  |
| Overlays           | `dialog`, `alert-dialog`, `popover`, `dropdown-menu`, `command` |
| Navigation/content | `tabs`, `scroll-area`, `table`, `card`, `separator`             |
| Feedback           | `toast`, `toaster`, `skeleton`, `badge`                         |
| Identity           | `avatar`, `label`                                               |

Use these primitives before creating route-local controls. Domain compositions such as `WorkOrderStatusBadge`, `ErrorState`, `OfflineBanner`, attachment gallery/viewer, and the form wrappers should remain outside the generic primitive layer.

### Buttons

| Variant       | Use                                                                    |
| ------------- | ---------------------------------------------------------------------- |
| `default`     | One primary action in a local task area                                |
| `secondary`   | Supporting action with moderate emphasis                               |
| `outline`     | Common secondary action, cancel/navigation, non-primary toolbar action |
| `ghost`       | Compact menus and low-emphasis controls                                |
| `destructive` | Irreversible or retention-sensitive action after clear confirmation    |
| `link`        | Inline navigation that still needs button composition                  |

Use `asChild` for a link styled as a button. Icon-only buttons require an accessible name. Pending buttons stay disabled, retain a stable label such as "Saving...", and must not shift surrounding layout.

### Forms

- Use React Hook Form and a feature Zod schema for user-entered records.
- Associate every label and control explicitly. Prefer the wrappers in `src/components/forms/index.tsx` when they correctly place ARIA on the actual focusable control.
- Show required state in the visible label, not only through validation after submit.
- Place errors next to their field, connect them with `aria-describedby`, set `aria-invalid`, and move focus or provide an error summary after a failed submit.
- Keep server errors generic enough to avoid leaking database detail while preserving the user's input.
- Disable only the action that is pending; do not disable review/copy access unnecessarily.
- Group insurance, payment, drop-off, and internal notes under visible headings. Internal notes must never appear in customer PDFs.

Some existing forms manually render red error text without ARIA relationships. Treat those as migration targets, not the pattern to copy.

### Tables and records

- Put row identity first and row actions last.
- Right-align money and use monospace numerals where scanning benefits.
- Keep dates and status text visible; avoid icon-only status.
- Provide loading skeletons, empty state, recoverable error state, and result-count/pagination behavior.
- Current customer/work-order/package lists cap at 100, while several other lists are unbounded. A UI that can exceed the cap needs explicit pagination rather than silent truncation.
- A row should have one predictable navigation target. Menus must remain keyboard reachable and labelled (for example, the existing visually hidden "Actions").

### Cards and metrics

Cards represent one coherent record summary or task. Metric cards use a short title, one prominent value, and optional concise context. Avoid placing long editable forms inside deeply nested cards. Empty cards should explain the next action rather than showing a blank frame.

### Dialogs, menus, and command search

Use Radix-backed primitives for focus management and Escape behavior. Dialog titles are required, including visually hidden titles for command overlays. Destructive confirmation copy must describe the real retention behavior; current attachment deletion is a metadata soft delete even though one dialog says it cannot be undone.

Custom overlays such as `attachment-viewer.tsx` must meet the same focus trap, initial focus, Escape, focus return, labelling, and background-inert behavior before they are considered equivalent to `Dialog`.

### Feedback and states

Every data screen needs these explicit states:

| State   | Pattern                                                                             |
| ------- | ----------------------------------------------------------------------------------- |
| Loading | Shape-matched `Skeleton`; container uses an accessible busy label when route-level  |
| Empty   | Explain what is empty and offer the permitted next action                           |
| Error   | `ErrorState` for recoverable load errors; preserve entered data for mutation errors |
| Offline | `OfflineBanner`; writes are already configured `networkMode: 'online'`              |
| Success | Toast or in-context confirmation; do not rely on motion or color alone              |
| Pending | Stable button label/spinner and duplicate-submit prevention                         |

## Domain-specific presentation

### Work orders and financials

Use `formatCurrency`, `formatDate`, and the shared calculation functions rather than formatting ad hoc. Payment states use the same `unpaid`, `partial`, `paid`, and `overpaid` tokens in storage and UI. Work-order status choices must follow the database-approved sequence and display the current state in text.

### Attachments

Attachment category and file kind are different. Display category text over a contrast-safe surface and use the caption for meaningful image alternative text where possible. Private signed URLs must not be copied into logs, analytics, CSS, or durable state. A gallery action cannot be hover-only; it must also be visible on focus and discoverable on touch.

### PDF

The browser PDF preview is a separate, dynamically imported workload. Screen layout and generated-document layout have different constraints. Do not assume the rendered PDF is tagged or accessible; review document reading order, text extraction, contrast, and a non-PDF alternative separately.

## Contribution rules

1. Reuse semantic tokens and local primitives before adding a new color, radius, overlay, or control.
2. Compose class names with `cn()`; do not fork near-identical component styles in feature files.
3. Preserve text labels for statuses, icon controls, destructive actions, and progress.
4. Add normal, loading, empty, error, disabled, focus, dark, narrow, and reduced-motion states with the feature.
5. Review [accessibility-checklist.md](accessibility-checklist.md) and [motion-design.md](motion-design.md) for every interaction change.
6. Record intentional raw palette use in the domain constant rather than scattering it across screens.
7. Check bundle impact before adding a component library or icon set; Lucide is the current icon source.

## Current review debt

- There is no visual regression suite, Storybook/component catalog, or automated token/contrast test.
- Dark mode is system-driven but several direct gray/red/category classes have not been screen-reviewed.
- Base and attachment icon targets are smaller than the 44 px touch target used in the shell.
- The custom attachment upload drop zone and viewer need keyboard/focus review.
- The sidebar remains an off-canvas pattern at desktop widths; usability across wide screens has not been browser-verified.
- Terminology mixes jobs, estimates, and work orders across routes and navigation.
- Remote cover-photo URL behavior and the newer attachment-ID cover path are inconsistent and need product/implementation reconciliation.

These are documented constraints, not claims that the affected screens fail or pass a full review.
