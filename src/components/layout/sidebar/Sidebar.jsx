// components/layout/sidebar/Sidebar.jsx
"use client"

import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useCallback, useMemo, memo } from 'react'
import SidebarHeader from './SidebarHeader'
import NavigationMenu from './NavigationMenu'
import LogoutButton from './LogoutButton'
import { useSidebar } from '@/hooks/collapse/useSidebar'
import { Menu } from 'lucide-react'

// Componente memoizado para el botón flotante
const FloatingMenuButton = memo(({ onClick }) => (
    <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        onClick={onClick}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Mostrar menú"
    >
        <Menu size={24} />
    </motion.button>
));

FloatingMenuButton.displayName = 'FloatingMenuButton';

export default function Sidebar() {
    const { user } = useAuth()
    const {
        isCollapsed,
        handleMouseEnter,
        handleMouseLeave,
        isMobile
    } = useSidebar()

    const [isSidebarVisible, setIsSidebarVisible] = useState(true)

    // Animación suave y natural tipo "spring" para mejor sensación
    const sidebarTransition = {
        type: "spring",
        stiffness: 300, // Más bajo = más suave (300 es un buen equilibrio)
        damping: 30,    // Controla el rebote
        mass: 0.8       // Peso de la animación
    }

    // Transición para el contenido interno (opcional)
    const contentTransition = {
        duration: 0.2,
        ease: "easeInOut"
    }

    const toggleSidebarVisibility = useCallback(() => {
        setIsSidebarVisible(prev => !prev)
    }, [])

    const handleMouseEnterMemo = useCallback(() => {
        if (!isMobile) handleMouseEnter()
    }, [isMobile, handleMouseEnter])

    const handleMouseLeaveMemo = useCallback(() => {
        if (!isMobile) handleMouseLeave()
    }, [isMobile, handleMouseLeave])

    // Memoizar el ancho basado en el estado colapsado
    const sidebarWidth = useMemo(() => isCollapsed ? 80 : 320, [isCollapsed])

    if (!isSidebarVisible) {
        return <FloatingMenuButton onClick={toggleSidebarVisibility} />
    }

    return (
        <>
            <motion.div
                className="h-screen flex flex-col shadow-xl bg-white border-r border-gray-200 relative"
                animate={{
                    width: sidebarWidth
                }}
                transition={sidebarTransition}
                onMouseEnter={handleMouseEnterMemo}
                onMouseLeave={handleMouseLeaveMemo}
                style={{
                    willChange: 'width',
                    overflow: 'hidden'
                }}
            >
                {/* Contenido con opacidad suave al cambiar */}
                <motion.div
                    className="flex-1 flex flex-col min-w-0"
                    animate={{
                        opacity: 1
                    }}
                    transition={contentTransition}
                >
                    <SidebarHeader isCollapsed={isCollapsed} />

                    <div className={`flex-1 ${isCollapsed ? 'overflow-y-auto overflow-x-hidden' : 'overflow-y-auto'}`}>
                        <div className={isCollapsed ? 'py-1' : 'py-3'}>
                            <NavigationMenu isCollapsed={isCollapsed} />
                        </div>
                    </div>

                    <div className={`border-t border-gray-200 bg-gray-50 ${isCollapsed ? 'p-1' : 'p-2'}`}>
                        <LogoutButton isCollapsed={isCollapsed} />
                    </div>
                </motion.div>
            </motion.div>

            {/* Overlay para móvil cuando el sidebar está abierto */}
            {isMobile && !isCollapsed && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleMouseLeaveMemo()}
                    className="fixed inset-0 bg-black/50 z-40"
                    style={{ backdropFilter: 'blur(2px)' }}
                />
            )}
        </>
    )
}