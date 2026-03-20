// src/app/dashboard/reportes/page.jsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useReportes } from "./hooks/useReportes";
import Header from "./components/Header";
import Tabla from "./components/Tabla";
import { useVentas } from "../ventas/hooks/useVentas";

export default function ReportesPage() {
    // Comentamos temporalmente el código de reportes mientras trabajamos en el módulo
    /*
    const {
        currentUser,
        currentSucursal,
        sucursalCargada,
        rolNombre
    } = useVentas();

    const {
        loading,
        error,
        data,
        filters,
        hasActiveFilters,
        monthOptions,
        fetchReportData,
        downloadExcel,
        fetchFilterOptions,
        clearFilters,
        updateFilter
    } = useReportes();

    const [filterOptions, setFilterOptions] = useState({
        categorias: [],
        usuarios: []
    });

    // Cargar datos iniciales y opciones de filtros
    useEffect(() => {
        if (currentSucursal?.id) {
            fetchReportData();
            loadFilterOptions();
        }
    }, [currentSucursal]);

    const loadFilterOptions = async () => {
        const options = await fetchFilterOptions();
        setFilterOptions(options);
    };

    // Manejar cambios en filtros
    const handleFilterChange = (key, value) => {
        updateFilter(key, value);
    };

    // Aplicar filtros (refrescar datos)
    const handleApplyFilters = () => {
        fetchReportData();
    };

    // Verificar si hay datos para mostrar
    if (!currentUser) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">⚠️ Debe iniciar sesión para ver los reportes</p>
                </div>
            </div>
        );
    }

    if (!sucursalCargada) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">⚠️ Debe seleccionar una sucursal para ver los reportes</p>
                </div>
            </div>
        );
    }
    */

    // Pantalla de "En construcción" mientras trabajamos en el módulo de reportes
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden"
            >
                {/* Barra decorativa superior */}
                <div className="h-2 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"></div>

                <div className="p-8 text-center">
                    {/* Icono animado */}
                    <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center"
                    >
                        <svg
                            className="w-12 h-12 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </motion.div>

                    {/* Título principal */}
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold text-gray-800 mb-3"
                    >
                        Módulo de Reportes
                    </motion.h1>

                    {/* Badge de estado */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="inline-block mb-6"
                    >
                        <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold">
                            🚧 En construcción
                        </span>
                    </motion.div>

                    {/* Mensaje principal */}
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-gray-600 mb-4 text-lg"
                    >
                        Estamos trabajando para ofrecerte la mejor experiencia
                    </motion.p>

                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-gray-500 mb-8"
                    >
                        Próximamente podrás generar reportes detallados de tus ventas,
                        productos y rendimiento. ¡Gracias por tu paciencia!
                    </motion.p>

                    {/* Animación de puntos de carga */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center space-x-2 mb-8"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                            className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                    </motion.div>

                    {/* Información adicional */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="bg-gray-50 rounded-lg p-4 text-left"
                    >
                        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            ¿Qué vendrá en los reportes?
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                Reportes de ventas por período
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                Análisis de productos más vendidos
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                Estadísticas por promotor y sucursal
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                Exportación a Excel con múltiples formatos
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                                Gráficos interactivos y dashboard
                            </li>
                        </ul>
                    </motion.div>

                    {/* Footer con fecha estimada */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-6 pt-4 border-t border-gray-200"
                    >
                        <p className="text-xs text-gray-400">
                            Estamos trabajando para lanzar esta funcionalidad pronto.
                            <br />
                            Si tienes alguna necesidad específica, contáctanos.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}