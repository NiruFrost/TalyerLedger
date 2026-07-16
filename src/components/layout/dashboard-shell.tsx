'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Sidebar from './sidebar'
import Header from './header'

interface DashboardShellProps {
  title?: string
  children: ReactNode
}

export default function DashboardShell({ title, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
