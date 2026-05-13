"use client"

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sessionValid, setSessionValid] = useState(true)

    // Cargar usuario al inicializar - SÍNCRONO para evitar race conditions
    useEffect(() => {
        console.log('🎯 AuthProvider iniciando...')

        try {
            const storedUser = localStorage.getItem('currentUser')
            const loginTimestamp = localStorage.getItem('auth_login_timestamp')
            const userId = localStorage.getItem('auth_user_id')

            console.log('📦 Storage check:', storedUser ? 'CON DATOS' : 'VACÍO')

            if (storedUser) {
                const userData = JSON.parse(storedUser)
                console.log('✅ Usuario cargado desde storage:', userData.nombre)
                setUser(userData)

                // Verificar integridad de la sesión después de cargar
                if (userId && loginTimestamp) {
                    verificarIntegridadSesion(userId, loginTimestamp, userData)
                }
            }
        } catch (error) {
            console.error('❌ Error cargando usuario:', error)
            localStorage.removeItem('currentUser')
            localStorage.removeItem('auth_login_timestamp')
            localStorage.removeItem('auth_user_id')
        } finally {
            console.log('🏁 AuthProvider listo')
            setLoading(false)
        }
    }, [])

    // Verificar periódicamente la validez de la sesión
    useEffect(() => {
        if (!user) return

        const interval = setInterval(async () => {
            const userId = localStorage.getItem('auth_user_id')
            const loginTimestamp = localStorage.getItem('auth_login_timestamp')

            if (userId && loginTimestamp) {
                const isValid = await verificarIntegridadSesion(userId, loginTimestamp, user)
                if (!isValid) {
                    // Si la sesión ya no es válida, forzar logout
                    await logout(true) // true = silencioso (sin toast duplicado)
                }
            }
        }, 60000) // Verificar cada minuto

        return () => clearInterval(interval)
    }, [user])

    // Función para verificar si la sesión sigue siendo válida
    const verificarIntegridadSesion = useCallback(async (userId, loginTimestamp, userData) => {
        try {
            // Verificar si el usuario sigue activo en Supabase
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('updated_at, activo')
                .eq('id', parseInt(userId))
                .single()

            if (error) {
                console.error('Error verificando usuario:', error)
                return true // Si hay error, asumir que es válido para no bloquear
            }

            // Si el usuario fue desactivado
            if (usuario.activo === false) {
                console.log('⚠️ Usuario desactivado, cerrando sesión')
                toast.error('Tu cuenta ha sido desactivada. Contacta al administrador.')
                await logout(true)
                return false
            }

            // Si la contraseña cambió después del login
            const updatedAt = new Date(usuario.updated_at).getTime()
            const loginTime = parseInt(loginTimestamp)

            if (updatedAt > loginTime) {
                console.log('⚠️ Contraseña modificada después del login, cerrando sesión')
                toast.error('Tu contraseña fue modificada. Por favor, inicia sesión nuevamente.')
                await logout(true)
                return false
            }

            return true
        } catch (error) {
            console.error('Error en verificación de sesión:', error)
            return true
        }
    }, [])

    const login = (userData) => {
        console.log('🚀 LOGIN - Datos recibidos:', userData)

        if (!userData) {
            console.error('❌ ERROR: userData es null/undefined')
            return
        }

        // Remover contraseña
        const { clave, ...safeUserData } = userData

        console.log('🔄 Estableciendo estado de React...')
        setUser(safeUserData)

        // Guardar timestamp del login y ID del usuario
        const loginTimestamp = Date.now()

        console.log('💾 Guardando en localStorage...')
        localStorage.setItem('currentUser', JSON.stringify(safeUserData))
        localStorage.setItem('auth_login_timestamp', loginTimestamp.toString())
        localStorage.setItem('auth_user_id', safeUserData.id.toString())

        // Verificación inmediata
        const verify = localStorage.getItem('currentUser')
        console.log('🔍 Verificación storage:', verify ? '✅ EXITOSA' : '❌ FALLIDA')

        if (verify) {
            console.log('🎉 Usuario guardado correctamente')
        }
    }

    const logout = async (silent = false) => {
        console.log('👋 Cerrando sesión...')

        // Limpiar localStorage
        localStorage.removeItem('currentUser')
        localStorage.removeItem('auth_login_timestamp')
        localStorage.removeItem('auth_user_id')

        // Limpiar estado
        setUser(null)
        setSessionValid(true)

        // Cerrar sesión en Supabase si es necesario
        try {
            await supabase.auth.signOut()
        } catch (error) {
            console.error('Error cerrando sesión en Supabase:', error)
        }

        if (!silent) {
            toast.success('Sesión cerrada correctamente')
        }
    }

    const isAuthenticated = () => {
        const authenticated = !!user && sessionValid
        console.log('🔐 isAuthenticated() ->', authenticated)
        return authenticated
    }

    // Función para forzar verificación manual (útil antes de acciones importantes)
    const forceVerification = async () => {
        if (!user) return false

        const userId = localStorage.getItem('auth_user_id')
        const loginTimestamp = localStorage.getItem('auth_login_timestamp')

        if (userId && loginTimestamp) {
            return await verificarIntegridadSesion(userId, loginTimestamp, user)
        }
        return true
    }

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole: (roleId) => user?.rol_id === roleId,
        forceVerification, // Exportar función de verificación forzada
        sessionValid
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}