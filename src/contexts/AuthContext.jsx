"use client"

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Cargar usuario al inicializar - SÍNCRONO para evitar race conditions
    useEffect(() => {
        console.log('🎯 AuthProvider iniciando...')

        try {
            const storedUser = localStorage.getItem('currentUser') // Usar localStorage en lugar de sessionStorage
            console.log('📦 Storage check:', storedUser ? 'CON DATOS' : 'VACÍO')

            if (storedUser) {
                const userData = JSON.parse(storedUser)
                console.log('✅ Usuario cargado desde storage:', userData.nombre)
                setUser(userData)
            }
        } catch (error) {
            console.error('❌ Error cargando usuario:', error)
            localStorage.removeItem('currentUser')
        } finally {
            console.log('🏁 AuthProvider listo')
            setLoading(false)
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

        console.log('💾 Guardando en localStorage...')
        localStorage.setItem('currentUser', JSON.stringify(safeUserData))

        // Verificación inmediata
        const verify = localStorage.getItem('currentUser')
        console.log('🔍 Verificación storage:', verify ? '✅ EXITOSA' : '❌ FALLIDA')

        if (verify) {
            console.log('🎉 Usuario guardado correctamente')
        }
    }

    const logout = async () => {
        setUser(null)
        localStorage.removeItem('currentUser')
    }

    const isAuthenticated = () => {
        const authenticated = !!user
        console.log('🔐 isAuthenticated() ->', authenticated)
        return authenticated
    }

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole: (roleId) => user?.rol_id === roleId
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