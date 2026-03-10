'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function Header({ onNuevaCategoria, totalCategorias }) {
    const { values } = useMultiLocalStorageListener([
        "sucursalSeleccionada",
        "currentUser",
    ]);

    const { sucursalSeleccionada, currentUser } = values;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !sucursalSeleccionada) return;
        setLoading(false);
    }, [currentUser, sucursalSeleccionada]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow mb-8">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col mx-5">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-2xl font-bold text-gray-900"
                        >
                            Gestión de Categorías
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-600 font-semibold"
                        >
                            Sucursal: {sucursalSeleccionada?.nombre}
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-600 font-semibold"
                        >
                            Usuario: {currentUser?.nombre}
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="font-semibold"
                        >
                            Rol: {currentUser?.roles?.nombre}
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-gray-600 mt-2"
                        >
                            Total: {totalCategorias || 0} categorías
                        </motion.p>
                    </div>

                    <AnimatePresence>
                        <motion.div
                            initial={{ scale: 0, opacity: 0, x: -20 }}
                            animate={{ scale: 1, opacity: 1, x: 0 }}
                            exit={{ scale: 0, opacity: 0, x: -20 }}
                            transition={{
                                duration: 0.3,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            className='flex items-center gap-2'
                        >
                            <button
                                onClick={onNuevaCategoria}
                                className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                + Nueva Categoría
                            </button>
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando información...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-2 rounded-xl shadow-md border-l-4 border-teal-500"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl font-bold text-gray-900 mb-2"
                    >
                        Gestión de Categorías
                    </motion.h1>

                    <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-1 bg-teal-100 px-3 py-1 rounded-full"
                        >
                            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-teal-600">Sucursal:</span>
                            <span className="font-semibold text-teal-800">{sucursalSeleccionada?.nombre}</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-1 bg-teal-100 px-3 py-1 rounded-full"
                        >
                            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-teal-600">Usuario:</span>
                            <span className="font-semibold text-teal-800">{currentUser?.nombre}</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="inline-flex items-center gap-1 bg-teal-100 px-3 py-1 rounded-full"
                        >
                            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-teal-600">Rol:</span>
                            <span className="font-semibold text-teal-700">{currentUser?.roles?.nombre}</span>
                        </motion.div>
                    </div>
                </div>

                <AnimatePresence>
                    <motion.div
                        initial={{ scale: 0, opacity: 0, x: -100 }}
                        animate={{ scale: 1, opacity: 1, x: 0 }}
                        exit={{ scale: 0, opacity: 0, x: -20 }}
                        transition={{
                            duration: 0.3,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                        }}
                        className="flex items-center gap-2"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onNuevaCategoria}
                            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 cursor-pointer text-white pl-3 pr-4 py-2.5 rounded-full font-semibold transition-colors"
                        >
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span>Nueva Categoría</span>
                        </motion.button>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}