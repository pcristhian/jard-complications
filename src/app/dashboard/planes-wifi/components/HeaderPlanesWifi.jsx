// components/PlanesWifi/HeaderPlanesWifi.jsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function HeaderPlanesWifi({ onNuevoPlan, onRecargar, loading }) {
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        setIsLoading(false);
    }, [currentUser]);

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col mx-5">
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-2xl font-bold text-gray-900"
                        >
                            Gestión de Planes WiFi
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-600 font-semibold"
                        >
                            Usuario: {currentUser?.nombre || 'Cargando...'}
                        </motion.p>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="font-semibold"
                        >
                            Rol: {currentUser?.roles?.nombre || 'Cargando...'}
                        </motion.p>
                    </div>
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
            className="bg-white p-2 rounded-xl shadow-md border-l-4 border-blue-500"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl font-bold text-gray-900 mb-2"
                    >
                        Gestión de Planes WiFi
                    </motion.h1>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full"
                        >
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-blue-600">Usuario:</span>
                            <span className="font-semibold text-blue-800">{currentUser?.nombre}</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="inline-flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full"
                        >
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-blue-600">Rol:</span>
                            <span className="font-semibold text-blue-700">{currentUser?.roles?.nombre}</span>
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
                            onClick={onNuevoPlan}
                            disabled={currentUser?.roles?.nombre !== 'admin'}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white pl-3 pr-4 py-2.5 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <span>Nuevo Plan WiFi</span>
                        </motion.button>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}