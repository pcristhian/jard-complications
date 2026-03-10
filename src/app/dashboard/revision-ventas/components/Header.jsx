// src/app/dashboard/ventas/components/Header.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
export default function Header({
    onMostrarComisiones,
    currentSucursal,
    rolNombre,
    currentUser,
    sucursalSeleccionada
}) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !currentSucursal) return;
        setLoading(false);
    }, [currentUser, currentSucursal]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col mx-5 ">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Revision de Ventas
                        </h1>

                        <p className="text-gray-600 font-semibold">
                            Sucursal: {currentSucursal?.nombre}
                        </p>

                        <p className="text-gray-600 font-semibold">
                            Usuario: {currentUser?.nombre}
                        </p>

                        <p className="font-semibold">
                            Rol: {rolNombre}
                        </p>
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
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando mis Filtros...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-2 rounded-xl shadow-md border-l-4 border-blue-500">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Revisión de Ventas</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="inline-flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-blue-600">Sucursal:</span>
                            <span className="font-semibold text-blue-800">{currentSucursal.nombre}</span>
                        </div>

                        <div className="inline-flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-blue-600">Usuario:</span>
                            <span className="font-semibold text-blue-800">{currentUser.nombre}</span>
                        </div>

                        <div className="inline-flex items-center gap-1 bg-blue-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-blue-600">Rol:</span>
                            <span className="font-semibold text-blue-700">{rolNombre}</span>
                        </div>
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
                        <button
                            onClick={onMostrarComisiones}
                            disabled={!sucursalSeleccionada || currentUser?.roles?.nombre !== 'admin'}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white pl-3 pr-4 py-2.5 rounded-full font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                        >
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span>Ver Comisiones</span>
                        </button>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
}