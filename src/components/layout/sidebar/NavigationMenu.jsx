// components/layout/sidebar/NavigationMenu.jsx
"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, memo } from 'react'
import {
    ShoppingCart,
    Package,
    Users,
    Settings,
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

// Componente memoizado para cada item del menú
const MenuItem = memo(({ item, isActive, isCollapsed, onClick }) => {
    const Icon = item.icon

    return (
        <button
            onClick={() => onClick(item.path)}
            className={`
                flex items-center cursor-pointer 
                ${isCollapsed ? 'justify-center px-1 w-full' : 'px-3 w-full'} 
                py-2.5 text-gray-700 rounded-lg 
                transition-all duration-200
                hover:bg-blue-50 hover:text-blue-600
                group relative
                ${isActive ? 'bg-blue-50 text-blue-600' : ''}
            `}
        >
            {/* Indicador de página activa - con transición suave */}
            {isActive && !isCollapsed && (
                <div className="absolute -left-1 w-1 h-6 bg-blue-600 rounded-full transition-all duration-200" />
            )}

            {/* Icono */}
            <Icon
                className={`
                    ${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'}
                    transition-colors duration-200
                    ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}
                `}
            />

            {/* Punto indicador para estado colapsado */}
            {isActive && isCollapsed && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full border border-white transition-all duration-200" />
            )}

            {/* Texto - con transición de opacidad */}
            <span className={`
                font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}
            `}>
                {item.name}
            </span>
        </button>
    )
})

MenuItem.displayName = 'MenuItem'

export default function NavigationMenu({ isCollapsed }) {
    const { user } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    const filteredItems = menuItems.filter(item =>
        item.roles.includes(user?.rol_id)
    )

    const isActive = useCallback((path) => {
        if (!pathname) return false
        if (pathname === path) return true
        if (path !== '/dashboard' && pathname.startsWith(path)) return true
        return false
    }, [pathname])

    const handleNavigation = useCallback((path) => {
        router.push(path)
    }, [router])

    return (
        <nav className="space-y-1 px-2">
            {filteredItems.map((item) => (
                <MenuItem
                    key={item.id}
                    item={item}
                    isActive={isActive(item.path)}
                    isCollapsed={isCollapsed}
                    onClick={handleNavigation}
                />
            ))}
        </nav>
    )
}