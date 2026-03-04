// components/layout/sidebar/LogoutButton.jsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LogoutButton({ isCollapsed }) {
    const { logout, user } = useAuth()
    const router = useRouter()

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
                        Usuario: <span className="font-semibold">{user?.nombre}</span>
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
                                    toast.success(`¡Hasta pronto ${user?.nombre}! 👋`)
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

    return (
        <motion.div
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
            whileHover={{ scale: 1.02 }}
        >
            {/* Avatar del usuario */}
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
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
                            {user?.nombre || 'Usuario'}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botón de logout */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLogout}
                className={`x-4 ${isCollapsed
                    ? 'p-2 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'p-2 text-gray-500 hover:text-red-600 hover:bg-red-50'
                    } rounded-lg transition-colors`}
            >
                <LogOut className="w-5 h-5" />
            </motion.button>
        </motion.div>
    )
}