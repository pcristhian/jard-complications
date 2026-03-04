import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";
import {
    BuildingStorefrontIcon,
    UserIcon,
    IdentificationIcon,
    PlusIcon,
    ArrowPathIcon,
    CubeIcon,
    TruckIcon
} from '@heroicons/react/24/outline';

export default function Header({
    onNuevoProducto,
    onAgregarStock,
    onRealizarTraslado,
    loading,
    sucursalSeleccionada
}) {
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Obtener el rol del usuario desde el objeto completo
    const rolNombre = currentUser?.roles?.nombre || currentUser?.rol_id || 'Usuario';

    if (!mounted) {
        return (
            <div className="sticky top-0 z-50 bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                    <div>
                        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mt-2"></div>
                    </div>
                    <div className="flex space-x-3">
                        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                        <div className="h-10 w-32 bg-gray-200 animate-pulse rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="sticky top-0 z-50 bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500 mb-2"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Información izquierda */}
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                        <CubeIcon className="w-6 h-6 text-blue-500" />
                        Traslados / Inventario
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 text-sm">
                        {/* Sucursal */}
                        <div className="inline-flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                            <BuildingStorefrontIcon className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600 font-medium">Sucursal:</span>
                            <span className="font-semibold text-blue-800">
                                {sucursalSeleccionada?.nombre || 'No seleccionada'}
                            </span>
                        </div>

                        {/* Usuario */}
                        {currentUser && (
                            <div className="inline-flex items-center gap-1 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                <UserIcon className="w-4 h-4 text-green-500" />
                                <span className="text-green-600 font-medium">Usuario:</span>
                                <span className="font-semibold text-green-800">
                                    {currentUser.nombre}
                                </span>
                            </div>
                        )}

                        {/* Rol */}
                        {currentUser && (
                            <div className="inline-flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-100">
                                <IdentificationIcon className="w-4 h-4 text-purple-500" />
                                <span className="text-purple-600 font-medium">Rol:</span>
                                <span className="font-semibold text-purple-800">
                                    {rolNombre}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botones de acción */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key="action-buttons"
                        initial={{ scale: 0.8, opacity: 0, x: 20 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0.8, opacity: 0, x: 20 }}
                        transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className="flex flex-wrap items-center gap-2"
                    >
                        {/* Botón Agregar Stock */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onAgregarStock}
                            disabled={!sucursalSeleccionada || currentUser?.roles?.nombre !== 'admin'}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 cursor-pointer text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
                        >
                            <div className="bg-white/20 p-1 rounded-full">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span>Agregar Stock</span>
                            {loading && <ArrowPathIcon className="w-4 h-4 animate-spin ml-1" />}
                        </motion.button>

                        {/* Botón Realizar Traslado */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onRealizarTraslado}
                            disabled={!sucursalSeleccionada || currentUser?.roles?.nombre !== 'admin'}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 cursor-pointer text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
                        >
                            <div className="bg-white/20 p-1 rounded-full">
                                <TruckIcon className="w-4 h-4" />
                            </div>
                            <span>Realizar Traslado</span>
                            {loading && <ArrowPathIcon className="w-4 h-4 animate-spin ml-1" />}
                        </motion.button>

                        {/* Botón Nuevo Producto */}
                        {/* <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onNuevoProducto}
                            disabled={!sucursalSeleccionada || !currentUser}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                            title="Crear un nuevo producto"
                        >
                            <div className="bg-white/20 p-1 rounded-full">
                                <PlusIcon className="w-4 h-4" />
                            </div>
                            <span>Nuevo Producto</span>
                        </motion.button> */}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Mensaje de advertencia si no hay sucursal seleccionada */}
            {!sucursalSeleccionada && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Selecciona una sucursal para gestionar el inventario
                    </p>
                </motion.div>
            )}

            {/* Mensaje de advertencia si no hay usuario */}
            {!currentUser && sucursalSeleccionada && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg"
                >
                    <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        No hay usuario autenticado
                    </p>
                </motion.div>
            )}
        </motion.div>
    );
}