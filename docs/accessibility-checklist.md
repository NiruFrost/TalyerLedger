# Accessibility Screen-Review Checklist

## Standard and status

Target WCAG 2.2 AA for the web application and meaningful alternatives for generated documents. This checklist is a review procedure, not a conformance statement.

Repository evidence as of 2026-07-23 is limited:

- `src/components/shared/error-state.test.tsx` uses Testing Library, user-event, and `vitest-axe`; one component test passes. The axe color-contrast rule is disabled because jsdom cannot measure rendered contrast.
- `e2e/auth-foundation.spec.ts` defines one keyboard/login smoke test. It is configured for desktop Chromium and Pixel 7 emulation, but it was not run during this documentation work.
- The root has `lang="en"`, a visible-on-focus skip link, global focus styling, reduced-motion CSS, an offline live region, and route error semantics.
- No screen-reader session, browser axe scan, color-contrast measurement, zoom/reflow audit, accessible PDF audit, or full keyboard route pass was performed.

Record each review with commit, browser/version, viewport, theme, input method, assistive technology, result, and issue link. A single desktop Chromium pass is not sufficient.

## Required review environments

| Environment                              | Minimum use                                                  |
| ---------------------------------------- | ------------------------------------------------------------ |
| Chromium on Windows                      | Keyboard-only, 200%/400% zoom, light/dark, browser axe       |
| NVDA plus Chromium or Firefox on Windows | Landmarks, names, forms, tables, dialogs, live updates       |
| Safari plus VoiceOver on macOS           | Focus order, overlays, native controls, PDF fallback         |
| Mobile Safari plus VoiceOver             | Touch exploration, drawer, forms, attachment capture/gallery |
| Android Chromium plus TalkBack           | Responsive controls, dialogs, upload and slider alternatives |

If the team cannot run every combination for every change, run the relevant interaction set and complete the full matrix before a release claim.

## Global checklist

### Structure and navigation

- [ ] The page has one descriptive `h1`; lower headings do not skip levels without a structural reason.
- [ ] Landmarks are identifiable and not duplicated without labels.
- [ ] The root "Skip to main content" link becomes visible on focus and lands on an existing `#main-content` target.
- [ ] Browser title identifies the screen and TalyerLedger.
- [ ] Current navigation uses `aria-current="page"` and remains understandable without icons.
- [ ] Focus order follows the visual/task order at desktop and mobile widths.
- [ ] Route changes place or preserve focus predictably; they do not strand focus in removed content.
- [ ] Deep links, back navigation, not-found, and unauthenticated redirects remain understandable.

### Keyboard and focus

- [ ] Every action works with keyboard alone; there are no click-only `div` controls.
- [ ] Focus is always visible against light, dark, image, and destructive surfaces.
- [ ] Icon-only controls have unique accessible names.
- [ ] Menus, selects, tabs, command results, sliders, and dialogs follow their expected keyboard pattern.
- [ ] Escape closes the top overlay; focus returns to the trigger.
- [ ] Modal backgrounds are inert and focus cannot escape the modal.
- [ ] Hover-revealed actions are also focus-visible and permanently discoverable on touch.
- [ ] Target size is at least 24 by 24 CSS pixels under WCAG 2.2 AA, with 44 by 44 preferred for workshop/mobile controls.

### Reflow and visual presentation

- [ ] No information or control is lost at 320 CSS pixels wide.
- [ ] At 200% zoom, content reflows without horizontal page scrolling; local table/image scrolling is labelled and usable.
- [ ] At 400% zoom, essential reading and operation remain possible in a one-dimensional flow.
- [ ] Text spacing overrides do not clip or overlap content.
- [ ] Text contrast is at least 4.5:1, large text 3:1, and meaningful non-text boundaries/focus 3:1.
- [ ] Light and dark themes are checked independently; direct Tailwind palette classes are measured, not assumed.
- [ ] Status, required state, validation, and charts do not depend on color alone.
- [ ] Loading skeletons reserve space and do not produce disruptive layout shifts.

### Forms and errors

- [ ] Every control has a programmatic label; placeholder text is not the label.
- [ ] Required fields expose required state visually and programmatically.
- [ ] Instructions appear before the control they govern.
- [ ] Invalid controls use `aria-invalid` and reference their specific error text.
- [ ] Submit failure moves focus to an error summary or first invalid control without erasing valid input.
- [ ] Server/network errors use user-safe text and provide a retry path where safe.
- [ ] Pending submit prevents duplicates and exposes a stable status without only a spinner.
- [ ] Autocomplete purpose is set for email, password, phone, address, and identity fields where appropriate.
- [ ] Dates, currency, units, discounts, and status choices are announced unambiguously.

### Dynamic content

- [ ] Loading, offline, save success, failure, upload progress, and result counts are announced at the right politeness.
- [ ] Live regions do not repeat on every render or steal focus.
- [ ] Toasts remain long enough to perceive and do not contain the only route to recovery.
- [ ] Query refresh does not unexpectedly reset focus, scroll, form values, or selection.
- [ ] Reduced motion makes transitions effectively immediate while preserving visible pending state.

### Images, evidence, and documents

- [ ] Informative images have context-specific alternative text; decorative icons/images are hidden from assistive technology.
- [ ] Repeated attachment thumbnails do not all use the generic name "Attachment" when a caption/category can identify them.
- [ ] Zoom, previous/next, download, and delete controls are named and reachable.
- [ ] Before/after comparison has a non-slider side-by-side option and its slider value/instructions are announced.
- [ ] Upload works without drag-and-drop and without camera access.
- [ ] File type, size, progress, success, and failure are announced.
- [ ] Generated PDFs are checked for reading order, selectable text, headings/tables, language, contrast, and meaningful images, or an equivalent HTML view is supplied.

## Screen matrix

### Authentication and route handling

| Screen            | Path/source                                     | Screen-specific checks                                                                                                                                                                      |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login             | `/login`, `src/app/(auth)/login/page.tsx`       | Initial Tab order reaches email/password/sign-in; labels, autocomplete, invalid state, callback message, pending state, password-manager behavior; authenticated redirect; skip-link target |
| Registration      | `/register`, `src/app/(auth)/register/page.tsx` | When disabled, redirect and message are announced; when enabled, all three fields expose errors; success focus reaches "Check your email"; direct Supabase setting agrees with app flag     |
| Auth callback     | `/auth/callback`                                | Success/failure redirects do not loop; error message is understandable; unsafe `next` values remain same-origin                                                                             |
| Not found         | `src/app/not-found.tsx`                         | Heading and return link are announced; unauthenticated users do not enter a confusing redirect loop                                                                                         |
| Root/global error | `src/app/error.tsx`, `global-error.tsx`         | Alert is announced once; retry is named and focused; global fallback has usable unstyled focus and language                                                                                 |

### Dashboard and global shell

| Screen                    | Path/source                                   | Screen-specific checks                                                                                                                       |
| ------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard                 | `/`, `src/app/(dashboard)/page.tsx`           | Metric labels/values, recent tables, empty/loading states, quick actions, money reading, mobile grid/reflow                                  |
| Navigation drawer         | `src/components/layout/sidebar.tsx`           | Open/close names, initial focus, trap, Escape, focus return, backdrop, `inert`, active item, desktop behavior                                |
| Header/account            | `src/components/layout/header.tsx`            | Menu/search/account names, 44 px targets, dropdown keyboard behavior, pending sign-out announcement                                          |
| Command search            | `src/features/search/search-command.tsx`      | Ctrl/Cmd+K, visible trigger, dialog title, input label, loading/no-result announcement, arrow/Enter/Escape, result group names, focus return |
| Offline and route loading | Shared components and dashboard `loading.tsx` | Offline announcement once; page remains readable; static reduced-motion loading state; reconnect behavior                                    |

### Customer screens

| Screen          | Path                   | Screen-specific checks                                                                                             |
| --------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Customer list   | `/customers`           | Table headers/actions, horizontal scroll, count/cap behavior, empty/error/loading states, create action            |
| New customer    | `/customers/new`       | Label/error relationships, trimming feedback, email/phone autocomplete, cancel and submit order                    |
| Customer detail | `/customers/[id]`      | Heading, contact links/text, vehicle relations, edit/delete confirmation, no-data placeholders                     |
| Edit customer   | `/customers/[id]/edit` | Existing values, dirty-state/navigation behavior, save error and focus, soft-delete/restore terminology if exposed |

### Vehicle screens

| Screen           | Path                                                    | Screen-specific checks                                                                                                 |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Vehicle list     | `/vehicles`                                             | Table scanning, plate/VIN distinction, action menu, empty/loading/error, unbounded-result behavior                     |
| New vehicle      | `/vehicles/new`                                         | Customer selection, year/identifier input purpose, optional cover URL, validation and mobile keyboard types            |
| Vehicle detail   | `/vehicles/[id]`                                        | Unlabelled back icon review, cover-image alt/loading/error, gallery, service history, timeline, narrow action wrapping |
| Edit vehicle     | `/vehicles/[id]/edit`                                   | Existing relation and cover values, validation, save/delete focus, remote image failure behavior                       |
| Vehicle timeline | `src/features/vehicles/components/vehicle-timeline.tsx` | Chronology and status are understandable linearly; empty/error state; no visual-line dependency                        |

### Work-order and financial screens

| Screen               | Path                              | Screen-specific checks                                                                                                                                  |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work-order list      | `/jobs`                           | Status tabs and counts, table headers/actions, current tab semantics, status text, empty/loading/error                                                  |
| New work order       | `/jobs/new`                       | Long-form heading/group order, customer/vehicle dependency, status choices, line-item editing, insurance conditional fields, keyboard save              |
| Work-order detail    | `/jobs/[id]`                      | Status transition controls, financial totals, internal/customer notes separation, payments, attachments, destructive/copy actions, responsive hierarchy |
| Edit work order      | `/jobs/[id]/edit`                 | Dynamic arrays, add/remove/reorder line items, catalog/package dialogs, validation summary, focus after row changes, no data loss                       |
| PDF preview          | `/jobs/[id]/pdf`                  | Back icon accessible name, embedded viewer title/fallback, keyboard access, download name disclosure, zoom/reflow, accessible HTML alternative          |
| Payment form/list    | Work-order detail components      | Amount/date/method labels, status recalculation feedback, edit/delete confirmation, table reading, and overpaid terminology                             |
| Line-item table/form | Work-order form/detail components | Column headers, units combobox, discount semantics, add/edit/delete focus, totals announcement, horizontal scroll                                       |

### Settings and catalogs

| Screen                          | Path                      | Screen-specific checks                                                                                       |
| ------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Settings                        | `/settings`               | Tab names/keyboard pattern, shop fields, photo-appendix switch label/state, save status, owner-only failure  |
| Labor catalog                   | Settings tab/components   | List/form labels, price/unit semantics, picker keyboard operation, empty/error state                         |
| Service packages                | Settings tab/components   | Package/item grouping, add/remove item focus, total price, picker list keyboard behavior, destructive action |
| Notification settings/schema UI | Settings area if rendered | Event names and switch state; clarify that schema/configuration is not proof of delivery                     |

### Attachment workflows

| Interaction         | Source                                          | Screen-specific checks                                                                                                                                                                     |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Upload dialog       | `attachment-upload.tsx`                         | Category and caption labels attach to controls; drop zone is keyboard operable; hidden input alternative; real file-count progress semantics; errors are visible/announced; focus retained |
| Gallery/card        | `attachment-gallery.tsx`, `attachment-card.tsx` | Thumbnail alt text, touch-visible actions, 28 px icon target review, load failure, category contrast, soft-delete wording                                                                  |
| Viewer              | `attachment-viewer.tsx`                         | Initial focus, focus trap/return, Escape, labelled controls, background inertness, current-position live text, zoom bounds, swipe/touch alternative                                        |
| Before/after        | `before-after-comparison.tsx`                   | Slider Arrow/Home/End behavior, value text, touch behavior, side-by-side alternative, duplicate image announcements                                                                        |
| Drop-off inspection | `dropoff-inspection.tsx`                        | Representative identity labels, condition notes, category grouping, sensitive data exposure, empty evidence states                                                                         |

## Known high-priority review targets

These are source-inspection findings, not browser-confirmed failures:

- The global skip link targets `#main-content`, but auth and several full-page fallbacks do not expose that ID.
- `attachment-upload.tsx` uses a clickable drop-zone `div` without keyboard button semantics and uses labels without explicit control association.
- `attachment-viewer.tsx` declares a modal dialog but does not use the existing Radix focus trap/return implementation.
- Several back-arrow icon buttons, including vehicle detail and PDF preview, lack explicit accessible names.
- Register-form error paragraphs are not connected to controls in the same way as login-form errors.
- Several icon buttons are 28 or 36 px, below the preferred 44 px touch target.
- `vitest-axe` currently covers only `ErrorState`, and automated contrast is disabled in that test.
- The PDF renderer includes images that cannot receive HTML `alt`; no tagged-PDF or text-extraction test exists.
- No browser has verified sidebar focus, reduced motion, dark-mode contrast, attachment capture, or 400% reflow.

## Automated and manual commands

Run unit/component accessibility checks with the full Vitest suite:

```sh
npm run test:run
```

Run the existing browser smoke after installing Chromium and configuring a non-production environment:

```sh
npx playwright install chromium
npx playwright test e2e/auth-foundation.spec.ts
```

The Playwright command is not currently a package script or CI step. A passing result would cover only the assertions in that one spec; it would not complete this checklist.

See [testing-strategy.md](testing-strategy.md) for coverage boundaries and [motion-design.md](motion-design.md) for reduced-motion review.
