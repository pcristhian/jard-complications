// app/dashboard/layout.jsx
"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/layout/sidebar/Sidebar'
import { useSidebar } from '@/hooks/collapse/useSidebar'

export default function DashboardLayout({ children }) {
    const { isAuthenticated, loading, user } = useAuth()
    const { isCollapsed } = useSidebar()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated()) {
            router.push('/login')
            return
        }
    }, [loading, isAuthenticated, router, user])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!isAuthenticated()) {
        return null
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className={`flex-1 overflow-auto transition-all duration-300 ${isCollapsed ? 'ml-0' : 'ml-2'
                }`}>
                {children}
            </main>
        </div>
    )
}