'use client'

import { useAuth } from '@/lib/auth-context'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-gray-600 text-sm">Welcome back,</h2>
        <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </header>
  )
}
