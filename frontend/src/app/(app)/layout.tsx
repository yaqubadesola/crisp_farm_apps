'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !token) router.push('/login')
  }, [token, router, mounted])

  if (!mounted) return null
  if (!token) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* pt-14 offsets the fixed mobile top bar; removed on md+ where sidebar is in normal flow */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">{children}</main>
    </div>
  )
}
