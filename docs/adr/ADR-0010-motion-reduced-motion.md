# ADR-0010: Purposeful Motion and Reduced Motion

- Status: Accepted
- Date: 2026-07-23

## Context

Motion can explain navigation, hierarchy, state changes, progress, expansion, comparison, and successful actions. Excessive or unavoidable animation can distract users, delay work, trigger vestibular discomfort, obscure focus, and make workshop use less reliable. TalyerLedger must satisfy WCAG 2.2 AA and respect the operating-system `prefers-reduced-motion` setting.

The current interface uses CSS transitions, `tw-animate-css`, loading spinners, and a 180 ms route-content entrance. `globals.css` has a global reduced-motion media query that reduces animation and transition duration to `0.01ms` and disables smooth scrolling. No dedicated motion library is installed.

## Decision

Motion is purposeful, brief, optional, and accessible.

- Motion is added only when it communicates navigation, state, hierarchy, progress, reordering, expansion, success, undo, or comparison.
- Common microinteractions target approximately 120 to 250 ms and never delay input or required feedback.
- CSS and native platform capabilities are preferred. A motion library is added only for a demonstrated interaction that cannot be implemented clearly and accessibly with the current stack, and heavy libraries are lazy-loaded.
- Nonessential animation and smooth scrolling are removed or reduced to effectively immediate behavior when `prefers-reduced-motion: reduce` is active.
- JavaScript, canvas, chart, and future motion-library animations must check reduced-motion preference when the global CSS rule cannot control them.
- No information, success state, status, or error depends on motion alone.
- Animations avoid layout shifts, excessive parallax, long entrances, and continuous decorative movement.
- Keyboard behavior, focus order, and screen-reader output are rechecked whenever motion changes component structure or timing.

## Consequences

- Positive: Motion can improve orientation and feedback without excluding motion-sensitive users.
- Positive: CSS-first implementation limits bundle cost and keeps behavior easy to override.
- Tradeoff: Complex animated components require both normal-motion and reduced-motion behavior and tests.
- Tradeoff: Some reduced-motion transitions become nearly instantaneous and need non-motion visual feedback.
- Follow-up: Motion review is part of accessibility and performance review for affected screens.

## Alternatives Considered

- Ban all motion: Rejected because restrained motion can clarify state and spatial relationships.
- Animate all component entrances: Rejected because it adds distraction, delay, and accessibility risk without consistent value.
- Ignore system preference and provide only an in-app toggle: Rejected because the platform preference must work without prior application setup.
- Add a general-purpose motion library immediately: Rejected because current interactions do not demonstrate a need that outweighs bundle and complexity cost.

## Migration and Deferred Conflicts

- The 180 ms route-content animation and global `prefers-reduced-motion` override in `globals.css` comply with the baseline decision.
- Existing CSS transitions and utility animations rely on the global media query; any future JavaScript-driven animation requires its own preference handling.
- No dedicated reduced-motion automated test or maintained motion design guide exists yet. Those remain documentation and accessibility-test gaps for the relevant phase.
- This decision has no data or database migration.
