import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import DashboardShell from '@/components/layout/dashboard-shell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    template: '%s | TalyerLedger',
    default: 'TalyerLedger',
  },
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
