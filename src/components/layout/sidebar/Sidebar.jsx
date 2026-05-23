// components/layout/sidebar/Sidebar.jsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import SidebarHeader from './SidebarHeader'
import NavigationMenu from './NavigationMenu'
import LogoutButton from './LogoutButton'
import { useSidebar } from '@/hooks/collapse/useSidebar'
import { Menu } from 'lucide-react'

export default function Sidebar() {
    const { user } = useAuth()
    const {
        isCollapsed,
        handleMouseEnter,
        handleMouseLeave,
        toggleSidebar,
        isMobile
    } = useSidebar()

    const [isSidebarVisible, setIsSidebarVisible] = useState(true)

    // Configuración optimizada para performance
    const sidebarTransition = {
        duration: 0.3,
        ease: "easeInOut"
    }

    const toggleSidebarVisibility = () => {
        setIsSidebarVisible(!isSidebarVisible)
    }

    if (!isSidebarVisible) {
        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={sidebarTransition}
                onClick={toggleSidebarVisibility}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                aria-label="Mostrar menú"
            >
                <Menu size={24} />
            </motion.button>
        )
    }

    return (
        <motion.div
            className={`h-screen flex flex-col shadow-xl bg-white border-r border-gray-200 relative`}
            initial={{ x: isMobile ? 0 : (isCollapsed ? -70 : -300), opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                width: isCollapsed ? 80 : 320
            }}
            transition={sidebarTransition}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ willChange: 'transform, width' }}
        >
            <div className="flex-1 flex flex-col overflow-hidden group min-w-0">
                <div className="relative">
                    <SidebarHeader isCollapsed={isCollapsed} />
                </div>

                <div className={`flex-1 ${isCollapsed ? 'overflow-y-auto overflow-x-hidden' : 'overflow-y-auto'}`}>
                    <div className={isCollapsed ? 'py-1' : 'py-3'}>
                        <NavigationMenu isCollapsed={isCollapsed} />
                    </div>
                </div>

                <div className={`border-t border-gray-200 bg-gray-50 ${isCollapsed ? 'p-1' : 'p-2'}`}>
                    <LogoutButton isCollapsed={isCollapsed} />
                </div>
            </div>
        </motion.div>
    )
}