// components/layout/sidebar/NavigationMenu.jsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react';
import {
    ShoppingCart,
    Package,
    BarChart3,
    Users,
    FileText,
    Settings,
    Shield
} from 'lucide-react'

const menuItems = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: ShoppingCart,
        roles: [1, 2, 3],
        path: '/dashboard/dashboard'
    },
    {
        id: 'ventas',
        name: 'Registro de Ventas',
        icon: ShoppingCart,
        roles: [1, 2, 3],
        path: '/dashboard/ventas'
    },
    {
        id: 'planeswifi',
        name: 'Planes WiFi',
        icon: ShoppingCart,
        roles: [1, 2, 3],
        path: '/dashboard/planes-wifi'
    },
    {
        id: 'productos',
        name: 'Gestión de Productos',
        icon: Package,
        roles: [1, 2, 3],
        path: '/dashboard/gestion-productos'
    },
    {
        id: 'categorias',
        name: 'Gestión de Categorías',
        icon: Package,
        roles: [1],
        path: '/dashboard/gestion-categorias'
    },
    {
        id: 'inventario',
        name: 'Traspaso de Productos',
        icon: Package,
        roles: [1, 2, 3],
        path: '/dashboard/control-traslados'
    },
    {
        id: 'reportes',
        name: 'Reportes',
        icon: BarChart3,
        roles: [1, 2, 3],
        path: '/dashboard/reportes'
    },
    {
        id: 'resumen',
        name: 'Ver resumen del mes',
        icon: FileText,
        roles: [1, 2, 3],
        path: '/dashboard/resumen'
    },
    {
        id: 'usuarios',
        name: 'Gestión de Usuarios',
        icon: Users,
        roles: [1],
        path: '/dashboard/gestion-usuarios'
    },
    {
        id: 'sucursales',
        name: 'Gestión de Sucursales',
        icon: Package,
        roles: [1],
        path: '/dashboard/gestion-sucursales'
    },
    {
        id: 'configuracion',
        name: 'Contraseña',
        icon: Settings,
        roles: [1, 2, 3],
        path: '/dashboard/ajustes-usuario'
    }
]

export default function NavigationMenu({ isCollapsed }) {
    const { user } = useAuth()
    const router = useRouter()
    const pathname = usePathname() // ← DECLARADO AQUÍ, disponible en todo el componente
    const [hoveredItem, setHoveredItem] = useState(null)


    const filteredItems = menuItems.filter(item =>
        item.roles.includes(user?.rol_id)
    )

    const isActive = (path) => {
        if (!pathname) return false // ← Seguridad si pathname no está disponible
        if (pathname === path) return true
        if (path !== '/dashboard' && pathname.startsWith(path)) return true
        return false
    }
    const handleNavigation = (path) => {
        router.push(path)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    }

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300
            }
        }
    }

    return (
        <motion.div
            className="space-y-1 px-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {filteredItems.map((item) => {
                const Icon = item.icon
                const isHovered = hoveredItem === item.id
                const active = isActive(item.path) // ← Usa la función que ya tiene acceso a pathname

                return (
                    <motion.button
                        key={item.id}
                        variants={itemVariants}
                        whileHover={{
                            x: isCollapsed ? 0 : 4,
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                            color: "#1e40af"
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation(item.path)}
                        className={`flex items-center cursor-pointer ${isCollapsed ? 'justify-center px-1 w-full' : 'px-3 w-full'
                            } py-3 text-gray-700 rounded-lg transition-all duration-200 hover:shadow-sm group relative`}
                    >

                        {/* Indicador de página activa (visible en estado expandido) */}
                        {active && !isCollapsed && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -left-1 w-1 h-6 bg-blue-600 rounded-full"
                            />
                        )}
                        <div className="relative">
                            <Icon className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                } transition-colors ${active ? 'text-blue-600' : 'text-gray-500'}`} />

                            {/* Punto indicador para estado colapsado */}
                            {active && isCollapsed && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border border-white"
                                />
                            )}
                        </div>
                        <AnimatePresence>
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="font-medium text-sm group-hover:font-semibold whitespace-nowrap"
                                >
                                    {item.name}
                                </motion.span>
                            )}
                        </AnimatePresence>

                        {/* Tooltip para estado colapsado */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none">
                                {item.name}
                                <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                        )}
                    </motion.button>
                )
            })}
        </motion.div>
    )
}