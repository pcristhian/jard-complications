"use client"

import { useAuth } from '@/contexts/AuthContext'
import { motion } from 'framer-motion'
import { ArrowRight, ShoppingBag, Store, Calendar, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
    const { user } = useAuth()
    return (
        <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
            {/* Header con Bienvenida */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                            ¡Hola de Nuevo, <span className="text-blue-600">{user?.nombre}</span>! 👋
                        </h1>
                        <p className="text-gray-600 mt-2 text-lg">
                            Sistema de Gestión - Torre Fuerte Distribuidora
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl p-6 shadow-lg"
                    >
                        <p className="text-sm opacity-90">Hoy es</p>
                        <p className="text-2xl font-bold mt-1">
                            {new Date().toLocaleDateString('es-PE', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Sección Principal - Llamado a la Acción */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-2"
            >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-2 md:p-8 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <ShoppingBag className="w-6 h-6 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    ¡Comienza a Vender!
                                </h2>
                            </div>
                            <p className="text-gray-700 text-lg mb-4">
                                Para iniciar tus actividades del día, dirígete a la sección de
                                <span className="font-semibold text-green-600"> Registrar Ventas </span>
                                y comienza a procesar transacciones.
                            </p>
                            <p className="text-gray-600 mb-6">
                                El sistema está listo para gestionar tus ventas, inventario y clientes
                                de manera eficiente.
                            </p>

                            <motion.a
                                href="/dashboard/ventas"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                Ir a Registrar Ventas
                                <ArrowRight className="w-4 h-4" />
                            </motion.a>
                        </div>

                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="w-64 h-64 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full opacity-10"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShoppingBag className="w-32 h-32 text-green-600 opacity-20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Mensaje de Estado del Sistema */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <div className="animate-pulse w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Sistema Activo y Operativo</h4>
                        <p className="text-gray-600 text-sm mt-1">
                            Todas las funcionalidades principales están disponibles.
                            Tu sesión está activa y sincronizada con la sucursal actual.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Footer Informativo */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-8 text-center text-gray-500 text-sm"
            >
                <p>
                    Torre Fuerte Distribuidora • {new Date().getFullYear()} •
                    <span className="text-green-600 ml-1">Sistema de Gestión v1.0</span>
                </p>
                <p className="mt-1">¡Que tengas un excelente día de trabajo!</p>
            </motion.div>
        </div>
    )
}