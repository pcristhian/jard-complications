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
        name: 'Registro Planes WiFi',
        icon: ShoppingCart,
        roles: [1, 2, 3],
        path: '/dashboard/planes-wifi'
    },
    {
        id: 'productos',
        name: 'Gestión de Productos',
        icon: Package,
        roles: [1],
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
        id: 'traspasos',
        name: 'Traspaso de Productos',
        icon: Package,
        roles: [1, 2, 3],
        path: '/dashboard/control-traspasos'
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
        id: 'inventario-fisico',
        name: 'Inventario Físico',
        icon: Package,
        roles: [1, 2, 3],
        path: '/dashboard/gestion-inventario'
    },
    {
        id: 'configuracion',
        name: 'Contraseña',
        icon: Settings,
        roles: [1, 2, 3],
        path: '/dashboard/ajustes-usuario'
    }
]

// Transición unificada y suave
const smoothTransition = {
    duration: 0.25,
    ease: "easeInOut"
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03,
            delayChildren: 0.05
        }
    }
}

const itemVariants = {
    hidden: { x: -8, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: smoothTransition
    }
}

export default function NavigationMenu({ isCollapsed }) {
    const { user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [hoveredItem, setHoveredItem] = useState(null)

    const filteredItems = menuItems.filter(item =>
        item.roles.includes(user?.rol_id)
    )

    const isActive = (path) => {
        if (!pathname) return false
        if (pathname === path) return true
        if (path !== '/dashboard' && pathname.startsWith(path)) return true
        return false
    }

    const handleNavigation = (path) => {
        router.push(path)
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
                const active = isActive(item.path)

                return (
                    <motion.button
                        key={item.id}
                        variants={itemVariants}
                        whileHover={{
                            x: isCollapsed ? 0 : 3,
                            backgroundColor: "rgba(59, 130, 246, 0.08)",
                            transition: smoothTransition
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleNavigation(item.path)}
                        className={`flex items-center cursor-pointer ${isCollapsed ? 'justify-center px-1 w-full' : 'px-3 w-full'
                            } py-3 text-gray-700 rounded-lg transition-colors duration-200 hover:shadow-sm group relative`}
                        onMouseEnter={() => setHoveredItem(item.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                    >
                        {/* Indicador de página activa (expandido) */}
                        {active && !isCollapsed && (
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={smoothTransition}
                                className="absolute -left-1 w-1 h-6 bg-blue-600 rounded-full"
                            />
                        )}

                        {/* Icono */}
                        <div className="relative">
                            <Icon
                                className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'
                                    } transition-colors duration-200 ${active ? 'text-blue-600' : 'text-gray-500'}`}
                            />

                            {/* Punto indicador para estado colapsado */}
                            {active && isCollapsed && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={smoothTransition}
                                    className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border border-white"
                                />
                            )}
                        </div>

                        {/* Texto (solo expandido) */}
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -5 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -5 }}
                                    transition={smoothTransition}
                                    className="font-medium text-sm whitespace-nowrap"
                                >
                                    {item.name}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )
            })}
        </motion.div>
    )
}