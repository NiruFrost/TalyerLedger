'use client'

import { Menu, Search, ChevronDown, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface HeaderProps {
  title?: string
  onMenuClick: () => void
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
        </button>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
          <Search className="h-5 w-5" />
        </button>
        <div className="group relative">
          <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-700">
              U
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-500 sm:block" />
          </button>
          <div className="absolute right-0 top-full z-50 mt-1 hidden min-w-[160px] rounded-lg border bg-white py-1 shadow-lg group-focus-within:block group-hover:block">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
