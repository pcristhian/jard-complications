// src/app/dashboard/reportes/components/Header.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

export default function Header({
    onDownloadExcel,
    currentSucursal,
    rolNombre,
    currentUser,
    loading = false,
    hasActiveFilters = false,
    onClearFilters
}) {
    const [isReady, setIsReady] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        if (!currentUser || !currentSucursal) return;
        setIsReady(true);
    }, [currentUser, currentSucursal]);

    // Detectar scroll para cambiar estilo
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsScrolled(scrollPosition > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!isReady) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col mx-5">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Reportes y Estadísticas
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
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando módulo de reportes...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`
                sticky top-0 z-50 transition-all duration-300
                ${isScrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg border-l-4 border-purple-500'
                    : 'bg-white shadow-md border-l-4 border-purple-500'
                }
                p-2 rounded-xl
            `}
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Reportes y Estadísticas</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="inline-flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-purple-600">Sucursal:</span>
                            <span className="font-semibold text-purple-800">{currentSucursal?.nombre}</span>
                        </div>

                        <div className="inline-flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-purple-600">Usuario:</span>
                            <span className="font-semibold text-purple-800">{currentUser?.nombre}</span>
                        </div>

                        <div className="inline-flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span className="text-purple-600">Rol:</span>
                            <span className="font-semibold text-purple-700">{rolNombre}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón para limpiar filtros - aparece solo si hay filtros activos */}
                    <AnimatePresence>
                        {hasActiveFilters && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0, x: 20 }}
                                animate={{ scale: 1, opacity: 1, x: 0 }}
                                exit={{ scale: 0, opacity: 0, x: 20 }}
                                transition={{
                                    duration: 0.2,
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 20
                                }}
                                onClick={onClearFilters}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 cursor-pointer text-gray-700 px-4 py-2.5 rounded-full font-semibold transition-colors border border-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>Limpiar Filtros</span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Botón de descarga Excel */}
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
                        >
                            <button
                                onClick={onDownloadExcel}
                                disabled={loading}
                                className={`flex items-center gap-2 ${loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                    } text-white pl-3 pr-4 py-2.5 rounded-full font-semibold transition-colors`}
                            >
                                <div className={`${loading ? 'bg-gray-500' : 'bg-white/20'
                                    } p-1.5 rounded-full`}>
                                    {loading ? (
                                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    )}
                                </div>
                                <span>{loading ? 'Descargando...' : 'Descargar Excel'}</span>
                            </button>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Indicador de filtros activos (opcional) */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200"
                    >
                        <p className="text-sm text-yellow-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Filtros activos - La descarga incluirá solo los datos filtrados
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}