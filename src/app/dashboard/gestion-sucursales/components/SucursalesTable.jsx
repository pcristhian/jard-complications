'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingOfficeIcon,
    MapPinIcon,
    PhoneIcon,
    PencilIcon,
    FunnelIcon,
    XMarkIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';

export default function SucursalesTable({ sucursales, loading, onEditarSucursal, sucursalSeleccionada }) {
    // Animaciones
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const rowVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    const headerVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center"
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full"
                    />
                    <p className="text-gray-600 font-medium">Cargando sucursales...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
            {/* Filtro */}
            <AnimatePresence>
                {sucursalSeleccionada && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-6 py-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <motion.div
                                    whileHover={{ rotate: 15 }}
                                    className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg"
                                >
                                    <FunnelIcon className="h-5 w-5 text-white" />
                                </motion.div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-800">
                                        Filtro aplicado
                                    </p>
                                    <p className="text-sm text-blue-600">
                                        Mostrando sucursal: <span className="font-medium">{sucursalSeleccionada.nombre}</span>
                                    </p>
                                </div>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="px-3 py-1 bg-white border border-blue-200 rounded-lg shadow-sm"
                            >
                                <span className="text-sm font-semibold text-blue-700">
                                    {sucursales.length} {sucursales.length === 1 ? 'sucursal' : 'sucursales'}
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Encabezados de tabla */}
            <div className="overflow-x-none">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr className="border-b">
                            <th className="px-6 py-4 text-center text-gray-600 w-1/3">
                                <div className="flex items-center justify-center gap-2">
                                    <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />
                                    <span>Nombre Sucursal</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-gray-600 w-1/3">
                                <div className="flex items-center justify-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                                    <span>Ubicación</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-gray-600 w-1/3">
                                <div className="flex items-center justify-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                                    <span>Contactos</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-gray-600 w-1/3">
                                <div className="flex items-center justify-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                                    <span>Estado</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-center text-gray-600 w-1/3">
                                <div className="flex items-center justify-center gap-2">
                                    <MapPinIcon className="h-4 w-4 text-gray-500" />
                                    <span>Acciones</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    {/* Cuerpo de la tabla */}
                    <motion.tbody
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="bg-white divide-y divide-gray-200"
                    >
                        <AnimatePresence>
                            {sucursales.map((sucursal) => (
                                <motion.tr
                                    key={sucursal.id}
                                    variants={rowVariants}
                                    layout
                                    whileHover={{
                                        scale: 1.005,
                                        backgroundColor: "rgba(249, 250, 251, 0.8)",
                                        transition: { duration: 0.2 }
                                    }}
                                    className="group border-b border-gray-100 hover:bg-gray-50/80 transition-colors duration-200"
                                >
                                    {/* Nombre */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <motion.div
                                                whileHover={{ scale: 1.1 }}
                                                className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg"
                                            >
                                                <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                                            </motion.div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {sucursal.nombre}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Dirección */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-start space-x-2">
                                            <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-gray-700">
                                                {sucursal.direccion || (
                                                    <span className="text-gray-400 italic">Sin dirección</span>
                                                )}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Teléfono */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <p className="text-sm text-gray-700">
                                                {sucursal.telefono || (
                                                    <span className="text-gray-400 italic">Sin teléfono</span>
                                                )}
                                            </p>
                                        </div>
                                    </td>

                                    {/* Estado */}
                                    <td className="px-6 py-4">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sucursal.activo
                                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 border border-green-200'
                                                : 'bg-gradient-to-r from-red-50 to-rose-50 text-rose-700 border border-red-200'
                                                }`}>
                                                {sucursal.activo ? (
                                                    <>
                                                        <CheckCircleIcon className="h-3 w-3 mr-1.5 text-emerald-500" />
                                                        Activo
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircleIcon className="h-3 w-3 mr-1.5 text-rose-500" />
                                                        Inactivo
                                                    </>
                                                )}
                                            </span>
                                        </motion.div>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-6 py-4">
                                        <motion.button
                                            whileHover={{
                                                scale: 1.05,
                                                x: 5,
                                                backgroundColor: "rgba(59, 130, 246, 0.1)"
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onEditarSucursal(sucursal)}
                                            className="flex items-center cursor-pointer space-x-2 px-4 py-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 font-medium text-sm"
                                        >
                                            <PencilIcon className="h-4 w-4" />
                                            <span>Editar</span>
                                        </motion.button>
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </motion.tbody>
                </table>
            </div>

            {/* Estado vacío */}
            <AnimatePresence>
                {sucursales.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="text-center py-12 px-6"
                    >
                        <div className="max-w-sm mx-auto">
                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4"
                            >
                                <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                            </motion.div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No hay sucursales registradas
                            </h3>
                            <p className="text-gray-600 text-sm mb-6">
                                Comience agregando una nueva sucursal para organizar sus operaciones.
                            </p>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg cursor-pointer"
                            >
                                <BuildingOfficeIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">Agregar primera sucursal</span>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer de la tabla */}
            {sucursales.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 px-6 py-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{sucursales.length}</span> sucursales en total
                        </div>
                        <div className="text-sm text-gray-600">
                            {sucursales.filter(s => s.activo).length} activas • {sucursales.filter(s => !s.activo).length} inactivas
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}