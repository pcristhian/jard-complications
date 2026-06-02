// components/layout/sidebar/SidebarHeader.jsx
"use client"

import { MapPin } from 'lucide-react'
import { useSucursal } from '@/contexts/SucursalContext'
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener'
import { useCallback, useMemo, memo } from 'react'

// Componente memoizado para evitar re-renderizados
const SidebarHeader = memo(({ isCollapsed }) => {
    const {
        sucursalSeleccionada,
        sucursales,
        loading,
        selectSucursal
    } = useSucursal()

    const handleSucursalChange = useCallback((e) => {
        const selectedId = parseInt(e.target.value)
        const sucursal = sucursales.find(s => s.id === selectedId)
        if (sucursal) {
            selectSucursal(sucursal.id, sucursal.nombre)
        }
    }, [sucursales, selectSucursal])

    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser',
        'sucursalSeleccionada'
    ]);

    const currentUser = useMemo(() => {
        return localStorageValues.currentUser || null;
    }, [localStorageValues.currentUser]);

    const isSupervisorOrAdmin = useMemo(() => {
        const userRole = currentUser?.roles?.nombre?.toLowerCase();
        return userRole === 'admin' || userRole === 'supervisor';
    }, [currentUser]);

    return (
        <div className="border-b border-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-700">
            {/* Header con altura fija para evitar saltos */}
            <div className={`${isCollapsed ? 'py-3 px-4' : 'py-4 px-6'} transition-all duration-200`}>
                <div className="flex items-center gap-3">
                    {/* Logo - siempre visible, mismo tamaño */}
                    <div className="bg-white p-2 rounded-xl flex-shrink-0">
                        <img
                            src="/image/empresa/icono_logo.png"
                            alt="Logo empresa"
                            className="w-7 h-7"
                        />
                    </div>

                    {/* Texto - solo visible cuando expandido, con opacidad suave */}
                    <div className={`min-w-0 flex-1 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                        <h1 className="text-lg font-bold text-white truncate">
                            Jard Complications
                        </h1>
                        <p className="text-blue-100/80 text-xs">
                            Torre Fuerte
                        </p>
                    </div>
                </div>
            </div>

            {/* Selector de sucursal - con altura controlada para evitar empujones */}
            {isSupervisorOrAdmin && (
                <div className={`overflow-hidden transition-all duration-200 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-32 opacity-100'}`}>
                    <div className="px-4 pb-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-blue-200 flex-shrink-0" />
                                <label className="text-blue-100 text-sm font-medium truncate">
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
                                    className="w-full bg-white/90 border border-white/30 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 transition-colors"
                                >
                                    <option value="">Seleccionar sucursal</option>
                                    {sucursales
                                        .filter(sucursal => {
                                            if (!sucursal?.activo) return false;
                                            const userRole = currentUser?.roles?.nombre;
                                            if (!userRole) return false;
                                            if (userRole === 'admin') return true;
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
});

SidebarHeader.displayName = 'SidebarHeader';

export default SidebarHeader;