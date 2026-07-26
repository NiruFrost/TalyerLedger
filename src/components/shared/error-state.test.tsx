// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './error-state'

describe('ErrorState', () => {
  it('provides an accessible retry interaction', async () => {
    const retry = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<ErrorState message="Network unavailable" onRetry={retry} />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(retry).toHaveBeenCalledOnce()
    expect((await axe(container, { rules: { 'color-contrast': { enabled: false } } })).violations)
      .toHaveLength(0)
  })
})
