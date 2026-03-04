'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";
import { Building2, User, Shield, X } from 'lucide-react';

export default function Header({ loading,
    sucursalSeleccionada,
    categorias = [],
    categoriaFiltro = '',
    setCategoriaFiltro }) {

    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detectar si es móvil
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        setIsLoading(false);
    }, [currentUser]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-700 font-medium text-lg">Cargando información...</p>
                </div>
            </div>
        );
    }

    // Vista móvil compacta
    const MobileView = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-1 mb-0 rounded-xl shadow-md border-l-4 border-amber-500 sticky top-0 z-40"
        >
            <div className="flex items-center justify-between">
                {/* Título principal */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-lg font-bold text-gray-900 text-center flex-1 mx-2"
                >
                    Inventario Físico
                </motion.h1>

                {/* Dropdown de usuario móvil */}
                <div className="relative">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors"
                        aria-label="Información de usuario"
                    >
                        <User size={20} className="text-amber-600" />
                    </button>
                </div>
            </div>
            {/* Panel desplegable móvil */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                    >
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                                <Building2 size={12} className="text-amber-600" />
                                <p className="text-xs text-gray-500">Sucursal actual</p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {sucursalSeleccionada?.nombre || 'No seleccionada'}
                                </p>

                            </div>
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                                <User size={12} className="text-amber-600" />
                                <p className="text-xs text-gray-500">Usuario</p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {currentUser.roles.nombre === 'promotor' ?
                                        <span>{currentUser.nombre} - {currentUser.caja}</span>
                                        : <span>{currentUser.nombre}</span>}
                                </p>
                            </div>
                            <div className="flex items-center justify-between gap-3 p-3 bg-amber-50 rounded-lg">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Shield size={12} className="text-amber-600 flex-shrink-0" />
                                    <p className="text-xs text-gray-500 truncate">Rol</p>
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                        {currentUser?.roles?.nombre}
                                    </p>
                                </div>
                            </div>
                            <div className="px-3 py-0">
                                <select
                                    value={categoriaFiltro}
                                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categorias.map((categoria) => (
                                        <option key={categoria.id} value={categoria.id}>
                                            {categoria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )
                }
            </AnimatePresence >
        </motion.div >
    );

    // Vista escritorio expandida
    const DesktopView = () => (
        <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-2 rounded-xl shadow-md border-l-4 border-purple-500"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Gestión de Usuarios</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="inline-flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-purple-600">Sucursal:</span>
                            <span className="font-semibold text-purple-800">{sucursalSeleccionada?.nombre}</span>
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
                            <span className="font-semibold text-purple-700">{currentUser?.roles.nombre}</span>
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
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );

    // Renderizado condicional según dispositivo
    return isMobile ? <MobileView /> : <DesktopView />;
}