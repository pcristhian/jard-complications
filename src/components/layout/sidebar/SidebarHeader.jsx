// components/layout/sidebar/SidebarHeader.jsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { Building2, MapPin, ChevronDown } from 'lucide-react'
import { useSucursal } from '@/contexts/SucursalContext'
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener'

export default function SidebarHeader({ isCollapsed }) {
    const {
        sucursalSeleccionada,
        sucursales,
        loading,
        selectSucursal
    } = useSucursal()

    const handleSucursalChange = (e) => {
        const selectedId = parseInt(e.target.value)
        const sucursal = sucursales.find(s => s.id === selectedId)
        if (sucursal) {
            selectSucursal(sucursal.id, sucursal.nombre)
        }
    }

    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser',
        'sucursalSeleccionada'
    ]);
    // Obtener usuario actual desde localStorage
    const getCurrentUser = () => {
        return localStorageValues.currentUser || null;
    };
    // Obtener sucursal seleccionada desde localStorage
    const getCurrentSucursal = () => {
        return localStorageValues.sucursalSeleccionada || null;
    };

    const currentUser = getCurrentUser();
    const currentSucursal = getCurrentSucursal();

    return (
        <motion.div
            className={`border-b border-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-700 ${isCollapsed ? 'px-4' : 'px-6'
                }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Logo y Título */}
            <div className={`${isCollapsed ? 'py-3' : 'py-4'}`}>
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        className="bg-white/20 p-2 rounded-xl"
                    >
                        <Building2 className="w-7 h-7 text-white" />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                key="header-text"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="min-w-0 flex-1"
                            >
                                <h1 className="text-lg font-bold text-white truncate">Torre Fuerte</h1>
                                <p className="text-blue-100/80 text-xs">Distribuidora</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Selector de Sucursal */}
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.div
                        key="sucursal-selector"
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-blue-200" />
                                    <label className="text-blue-100 text-sm font-medium">
                                        Sucursal Activa
                                    </label>
                                </div>

                                {loading ? (
                                    <div className="text-center py-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                    </div>
                                ) : (
                                    <select
                                        value={sucursalSeleccionada?.id || ''}
                                        onChange={handleSucursalChange}
                                        className="w-full bg-white/90 border border-white/30 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                                    >
                                        <option value="">Seleccionar sucursal</option>
                                        {/* {sucursales.filter(s => s.activo)
                                            .map((sucursal) => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))} */}
                                        {sucursales
                                            .filter(sucursal => {
                                                if (!sucursal?.activo) return false;

                                                const userRole = currentUser?.roles?.nombre;

                                                // Si no hay usuario o rol, no mostrar nada
                                                if (!userRole) return false;

                                                // Admin ve todas las sucursales activas
                                                if (userRole === 'admin') {
                                                    return true;
                                                }
                                                // Para otros roles, solo su sucursal asignada
                                                const userSucursalId = currentUser?.sucursal_id;
                                                return sucursal.id === userSucursalId;
                                            })
                                            .map((sucursal) => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                    </select>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}