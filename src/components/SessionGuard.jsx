// components/SessionGuard.jsx
'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SessionGuard({ children }) {
    const { user, forceVerification, logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user) return

        // Verificar antes de acciones importantes
        const handleBeforeUnload = () => {
            // No hacer nada, solo prevenir
        }

        // Verificar periódicamente (cada 30 segundos)
        const interval = setInterval(async () => {
            const isValid = await forceVerification()
            if (!isValid) {
                router.push('/login')
            }
        }, 30000)

        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            clearInterval(interval)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [user, forceVerification, router])

    return <>{children}</>
}