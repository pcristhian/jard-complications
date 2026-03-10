// app/dashboard/page.jsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import TablaResumen from './components/TablaResumen';
import { useDashboardData } from './hooks/useDashboardData';

export default function DashboardResumen() {
    const {
        loading,
        error,
        productosMasVendidos,
        productosBajoStock,
        mesesDisponibles,
        mesSeleccionado,
        cambiarMes,
        sucursalSeleccionada,
        recargar
    } = useDashboardData();

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3"
            >
                <Header
                    onRecargar={recargar}
                    loading={loading}
                    sucursalSeleccionada={sucursalSeleccionada}
                />
                <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-3 space-y-3 text-gray-800"
        >
            <Header
                onRecargar={recargar}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center items-center h-64"
                    >
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Cargando datos del dashboard...</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <TablaResumen
                            productosMasVendidos={productosMasVendidos}
                            productosBajoStock={productosBajoStock}
                            mesesDisponibles={mesesDisponibles}
                            mesSeleccionado={mesSeleccionado}
                            onCambiarMes={cambiarMes}
                            loading={loading}
                            sucursalSeleccionada={sucursalSeleccionada}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}