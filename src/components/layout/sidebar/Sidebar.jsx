// components/layout/sidebar/Sidebar.jsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'
import SidebarHeader from './SidebarHeader'
import NavigationMenu from './NavigationMenu'
import LogoutButton from './LogoutButton'
import { useSidebar } from '@/hooks/collapse/useSidebar'
import { ChevronLeft, Menu } from 'lucide-react'

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


    const newSaleButtonVariants = {
        collapsed: {
            width: 40,
            borderRadius: 12,
            padding: "8px"
        },
        expanded: {
            width: "calc(100% - 32px)", // ← 100% menos padding
            borderRadius: 16,
            padding: "12px 16px"
        }
    }

    // Ajustar animación inicial basado en el estado colapsado
    const initialX = isMobile ? 0 : (isCollapsed ? -70 : -300)

    // Función para alternar visibilidad completa del sidebar
    const toggleSidebarVisibility = () => {
        setIsSidebarVisible(!isSidebarVisible)
    }
    if (!isSidebarVisible) {
        return (
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
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
            className={`h-screen flex flex-col shadow-xl bg-white border-r border-gray-200 ${isCollapsed ? 'w-16' : 'w-80'
                }relative`}
            initial={{ x: initialX, opacity: 0 }}
            animate={{
                x: 0,
                opacity: 1,
                width: isCollapsed ? 80 : 320
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 40
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex-1 flex flex-col overflow-hidden group min-w-0">
                {/* Header con selector de sucursal */}
                <div className="relative">
                    <SidebarHeader isCollapsed={isCollapsed} />
                </div>
                {/* Botón para ocultar sidebar (arriba) */}
                {/* <div className="px-2 py-1 border-b border-gray-100">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleSidebarVisibility}
                        className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors ${isCollapsed ? 'justify-center' : 'justify-between'
                            }`}
                        aria-label={isCollapsed ? "Ocultar menú" : "Ocultar menú"}
                    >
                        {!isCollapsed && (
                            <span className="text-sm font-medium">Ocultar menú</span>
                        )}
                        <ChevronLeft size={isCollapsed ? 20 : 18} />
                    </motion.button>
                </div> */}
                {/**arreglar boton para un estado global, actualmente solo funciona si pagina venta es focus */}
                {/* <AnimatePresence>
                    {!isCollapsed && (
                        <motion.div
                            key="boton-nueva-venta"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="px-1 py-3 border-b border-gray-100 overflow-hidden"
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold shadow-lg flex items-start justify-center gap-2 px-3 w-full`}
                            >
                                <span className="text-lg">+</span>
                                Nueva Venta
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence> */}


                {/* Menú de Navegación */}
                <div className={`flex-1 ${isCollapsed
                    ? 'overflow-y-auto overflow-x-hidden'
                    : 'overflow-y-auto'
                    }`}>
                    <div className={isCollapsed ? 'py-1' : 'py-3'}>
                        <NavigationMenu isCollapsed={isCollapsed} />
                    </div>
                </div>

                {/* Información del Usuario y Logout */}
                <div className={`border-t border-gray-200 bg-gray-50 ${isCollapsed ? 'p-1' : 'p-2'
                    }`}>
                    <LogoutButton isCollapsed={isCollapsed} />
                </div>
            </div>
        </motion.div >
    )
}