# Motion Design

## Intent

Motion in TalyerLedger explains state, hierarchy, progress, or direct manipulation. It is not decorative. Workshop tasks should remain fast and legible when motion is reduced or absent.

The current implementation is CSS-first. `tw-animate-css` supplies primitive transitions, `src/app/globals.css` defines one route entrance, and no general-purpose motion library is installed.

## Principles

1. Motion must communicate navigation, state change, progress, expansion, comparison, or direct manipulation.
2. Input feedback is immediate; animation never delays a save, error, confirmation, or focus move.
3. Prefer opacity and transform. Avoid animating dimensions or position in ways that cause layout shift.
4. Use one motion event per state change. Do not cascade every card or table row into view.
5. Status, success, error, and loading meaning must remain available in text or semantics without animation.
6. Respect `prefers-reduced-motion: reduce` without requiring an account or in-app setting.
7. New JavaScript, canvas, chart, or motion-library animation must handle reduced motion explicitly when CSS cannot control it.

## Current inventory

| Surface                   | Source                                                      | Current behavior                                     | Duration in source                               | Purpose                                                   |
| ------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------- |
| Route content             | `src/app/globals.css` `.route-content`                      | Fade from 0 and translate from 4 px                  | 180 ms, `cubic-bezier(0.2, 0, 0, 1)`             | Orient after route content mounts                         |
| Dialog and alert dialog   | `src/components/ui/dialog.tsx`, `alert-dialog.tsx`          | Overlay fade; content fade, zoom, and short slide    | 200 ms on content                                | Establish modal layer                                     |
| Dropdown, popover, select | Corresponding files in `src/components/ui/`                 | Fade, zoom, and side-aware slide                     | No project-specific duration in component source | Connect trigger to floating content                       |
| Toast                     | `src/components/ui/toast.tsx`                               | Slide/fade on open/close and track swipe             | Utility default; swipe follows pointer           | Confirm transient events and support dismissal            |
| Mobile sidebar            | `src/components/layout/sidebar.tsx`                         | Backdrop opacity and panel translation               | No explicit duration in source                   | Preserve spatial relationship to navigation edge          |
| Attachment viewer zoom    | `src/features/attachments/components/attachment-viewer.tsx` | Scale image after zoom controls                      | 200 ms                                           | Show user-requested magnification                         |
| Upload progress bar       | `attachment-upload.tsx`                                     | Width follows completed-file percentage              | No explicit duration in source                   | Show sequential upload progress                           |
| Hover/focus color         | Buttons, rows, links, tabs, pickers                         | Color/background/opacity transition                  | Utility default                                  | Acknowledge interaction                                   |
| Attachment card controls  | `attachment-card.tsx`                                       | Actions become opaque on hover or focus-within       | Utility default                                  | Reveal secondary actions without excluding keyboard focus |
| Skeletons                 | `src/components/ui/skeleton.tsx` and table skeletons        | Repeating pulse                                      | Tailwind utility default                         | Indicate unresolved shape                                 |
| Spinners                  | PDF and upload actions                                      | Repeating rotation                                   | Tailwind utility default                         | Indicate active operation                                 |
| Before/after slider       | `before-after-comparison.tsx`                               | Divider follows pointer, touch, or keyboard directly | No easing; direct manipulation                   | Compare evidence without lag                              |

Where the source relies on a Tailwind utility default, do not treat the exact generated duration as a stable project token. If timing matters to the interaction, set and document it explicitly.

## Timing guidance

| Motion                                 | Target                         | Notes                                                  |
| -------------------------------------- | ------------------------------ | ------------------------------------------------------ |
| Hover/focus acknowledgement            | 120 to 160 ms                  | Subtle color/opacity only                              |
| Small overlay or state change          | 160 to 220 ms                  | Current route entrance is 180 ms; dialogs are 200 ms   |
| Drawer or larger spatial transition    | 180 to 250 ms                  | Keep travel short and focus available immediately      |
| User-controlled slider, drag, or swipe | Direct, frame-synchronous      | Do not add easing behind the pointer                   |
| Progress with unknown duration         | Continuous indicator plus text | Announce the operation; do not fake percent completion |
| Success/error                          | Immediate semantic update      | Optional brief emphasis, never delayed                 |

Avoid motion longer than 300 ms in routine data entry. A longer operation should show real progress or a stable pending state rather than a longer entrance animation.

## Easing

- Use the route curve `cubic-bezier(0.2, 0, 0, 1)` for a quick decelerating entrance when spatial orientation is useful.
- Use simple ease-out for appearing elements and ease-in for disappearing elements.
- Keep paired overlay/content transitions synchronized.
- Do not use bounce, spring overshoot, parallax, shaking, or looping decorative effects in operational screens.

## Reduced motion

`src/app/globals.css` currently applies this global policy under `prefers-reduced-motion: reduce`:

- Smooth scrolling becomes `auto`.
- Animation duration becomes `0.01ms`.
- Animation iteration count becomes `1`.
- Transition duration becomes `0.01ms`.

This effectively removes the route entrance, overlay travel, spinner rotation, skeleton pulse, and transition interpolation while preserving final states. Text such as "Uploading...", "Generating...", and route loading labels must therefore remain sufficient on their own.

The global rule cannot guarantee behavior inside canvas, an embedded PDF renderer, third-party JavaScript animation, or future chart animation. Such features must use a media query hook or equivalent and render a static state when reduction is requested.

## Interaction rules

### Navigation and overlays

- Move keyboard focus according to the interaction before or independently of animation.
- A closing dialog/drawer returns focus to its trigger.
- Escape behavior and background inertness cannot depend on transition completion.
- Route animation applies once to the content container; do not add a second page-level entrance.

### Loading and progress

- Skeleton geometry should approximate final content to avoid layout shift.
- Use a spinner only while work is active and pair it with an accessible label.
- Use determinate progress only when the value is real. The current attachment percentage is file-count progress, not byte progress; label it accordingly if exposed to assistive technology.
- Avoid indefinite animation after an error or offline state.

### Direct manipulation

- The before/after slider supports Arrow keys in 5% steps plus Home and End. Pointer, touch, and keyboard positions must remain equivalent.
- Zoom controls need visible percentage and bounded values; current bounds are 50% to 300%.
- Drag or swipe affordances require a non-drag alternative.

### Data changes

- Do not animate currency totals through intermediate values; show the calculated result.
- Do not animate status color without updating status text and live feedback.
- Reordering may animate position only if focus, order semantics, and reduced-motion behavior remain correct.

## Review checklist

- [ ] The motion has a named user purpose.
- [ ] Input, focus, and semantic feedback happen without waiting for animation.
- [ ] Normal timing is within the guidance or has a documented reason.
- [ ] No essential information depends on movement, opacity, or color alone.
- [ ] `prefers-reduced-motion: reduce` reaches an immediate and understandable final state.
- [ ] Continuous indicators stop when work stops or fails.
- [ ] Layout does not shift unexpectedly during loading or entrance.
- [ ] Keyboard, touch, pointer, and screen-reader behavior were rechecked.
- [ ] Browser CPU and bundle impact are acceptable under [performance-budget.md](performance-budget.md).

## Verification status and gaps

- The global reduced-motion rule and current CSS motion were inspected in source.
- A browser session on 2026-07-26 verified the mobile login layout and semantic validation, while source inspection verified the global reduced-motion override. Operating-system reduced-motion emulation was not completed.
- No automated reduced-motion test exists.
- Utility-default timings are not centralized.
- The custom attachment viewer does not use the Radix dialog focus-management implementation, so its motion and focus lifecycle require joint review.
- Skeleton and spinner suppression under reduced motion needs a screen check to ensure static pending text remains obvious.

Use the screen matrix in [accessibility-checklist.md](accessibility-checklist.md) for that review.
