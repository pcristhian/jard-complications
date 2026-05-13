// components/layout/sidebar/LogoutButton.jsx
"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function LogoutButton({ isCollapsed }) {
    const { logout, user } = useAuth()
    const router = useRouter()
    const [avatarUrl, setAvatarUrl] = useState('/image/promotores/default.png')
    const [userData, setUserData] = useState(null)
    const mountedRef = useRef(true)

    // Escuchar cambios en localStorage para obtener los datos del usuario actual
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // Actualizar datos del usuario cuando cambie currentUser en localStorage
    useEffect(() => {
        if (!currentUser) return

        if (mountedRef.current) {
            setUserData(currentUser)
            // Determinar la URL del avatar basado en el nombre del usuario
            const avatarPath = getAvatarPath(currentUser)
            setAvatarUrl(avatarPath)
        }
    }, [currentUser])

    // Función para obtener la ruta del avatar según el nombre del usuario
    const getAvatarPath = (user) => {
        if (!user || !user.nombre) return '/image/promotores/default.png'

        const nombre = user.nombre.toLowerCase()

        // Mapeo de nombres a sus imágenes
        const avatarMap = {
            'angela': '/image/promotores/promotor1.png',
            'bolivia': '/image/promotores/promotor4.png',
            'tatiana': '/image/promotores/promotor3.png',
            'grisel': '/image/promotores/promotor2.png',
        }

        // Buscar coincidencia exacta o por parte del nombre
        for (const [key, path] of Object.entries(avatarMap)) {
            if (nombre.includes(key) || key.includes(nombre)) {
                return path
            }
        }

        return '/image/promotores/default.png'
    }

    const handleLogout = async () => {
        toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex flex-col p-6 border border-gray-200`}>
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <LogOut className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Cerrar Sesión
                    </h3>
                    <p className="text-gray-600 mb-1">
                        ¿Estás seguro de que quieres salir?
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        Usuario: <span className="font-semibold">{userData?.nombre || user?.nombre || 'Usuario'}</span>
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id)
                                toast('¡Qué bueno que te quedas! 🎉', { duration: 2000 })
                            }}
                            className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={async () => {
                                toast.dismiss(t.id)
                                try {
                                    await logout()
                                    toast.success(`¡Hasta pronto ${userData?.nombre || user?.nombre}! 👋`)
                                    router.push('/')
                                } catch (error) {
                                    toast.error('Error al cerrar sesión')
                                }
                            }}
                            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                        >
                            Sí, Salir
                        </button>
                    </div>
                </div>
            </div>
        ), {
            duration: Infinity,
            position: 'top-center'
        })
    }

    // Si no hay datos aún, mostrar un placeholder
    if (!userData && !user) {
        return (
            <motion.div
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                )}
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
            </motion.div>
        )
    }

    return (
        <motion.div
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
            whileHover={{ scale: 1.02 }}
        >
            {/* Avatar del usuario */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600">
                <img
                    src={avatarUrl}
                    alt={userData?.nombre || user?.nombre || 'Usuario'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>';
                    }}
                />
            </div>

            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.div
                        key="user-info"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="min-w-0 w-full flex-1"
                    >
                        <p className="font-medium text-gray-800 text-sm truncate">
                            {userData?.nombre || user?.nombre || 'Usuario'}
                        </p>
                        {userData?.caja && (
                            <p className="text-xs text-gray-500 truncate">
                                {userData.caja}
                            </p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón de logout */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className={`${isCollapsed
                    ? 'p-2 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'p-2 text-gray-500 hover:text-red-600 hover:bg-red-50'
                    } rounded-lg transition-colors`}
            >
                <LogOut className="w-5 h-5" />
            </motion.button>
        </motion.div>
    )
}