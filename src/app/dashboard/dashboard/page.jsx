// src/app/dashboard/page.jsx
'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDashboardData } from './hooks/useDashboardData';
import { useMetas } from './hooks/useMetas';
import CategoryCards from './components/CategoryCards';
import SalesChart from './components/SalesChart';
import TopProductsList from './components/TopProductsList';
import ModalMeta from './components/ModalMeta';
import { motion } from 'framer-motion';

export default function DashboardPage() {
    const { dashboardData, loading, error, currentUser, currentSucursal, getTopProductsByMonth, getCategoriesByMonth } = useDashboardData();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [filteredProducts, setFilteredProducts] = useState(null);
    const [filteredCategories, setFilteredCategories] = useState(null);
    const [showModalMeta, setShowModalMeta] = useState(false);

    // Ref para evitar actualizaciones innecesarias
    const isUpdatingRef = useRef(false);

    // Función para resetear filtros
    const resetFilters = useCallback(() => {
        setSelectedMonth(null);
        setSelectedCategory(null);
    }, []);

    // Actualizar productos y categorías cuando cambia el mes seleccionado
    useEffect(() => {
        if (isUpdatingRef.current) return;
        if (!dashboardData) return;

        if (selectedMonth && getTopProductsByMonth && getCategoriesByMonth) {
            isUpdatingRef.current = true;
            console.log(`🔄 Buscando datos para el mes: ${selectedMonth}`);

            const productsByMonth = getTopProductsByMonth(selectedMonth);
            const categoriesByMonth = getCategoriesByMonth(selectedMonth);

            setFilteredProducts(productsByMonth);
            setFilteredCategories(categoriesByMonth);

            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        } else if (!selectedMonth && dashboardData) {
            isUpdatingRef.current = true;
            setFilteredProducts(dashboardData.topProducts);
            setFilteredCategories(dashboardData.categories);

            setTimeout(() => {
                isUpdatingRef.current = false;
            }, 100);
        }
    }, [selectedMonth, dashboardData, getTopProductsByMonth, getCategoriesByMonth]);

    // Determinar qué datos mostrar
    const displayCategories = useMemo(() => {
        if (selectedMonth && filteredCategories) {
            return filteredCategories;
        }
        return dashboardData?.categories || [];
    }, [selectedMonth, filteredCategories, dashboardData?.categories]);

    const displayProducts = useMemo(() => {
        if (selectedMonth && filteredProducts) {
            return filteredProducts;
        }
        return dashboardData?.topProducts || {};
    }, [selectedMonth, filteredProducts, dashboardData?.topProducts]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto space-y-5">
                    <div className="space-y-2">
                        <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse" />
                        <div className="h-4 w-48 bg-gray-200 rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2">
                            <div className="h-[400px] bg-gray-200 rounded-xl animate-pulse" />
                        </div>
                        <div className="lg:col-span-1">
                            <div className="h-[400px] bg-gray-200 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar datos</h3>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData || !dashboardData.categories?.length) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">No hay datos disponibles</h3>
                    <p className="text-yellow-600 text-sm">
                        {!currentSucursal
                            ? "Selecciona una sucursal para comenzar a ver estadísticas"
                            : "No se encontraron ventas registradas en esta sucursal"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Dashboard de Ventas
                        </h1>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-sm text-gray-500">
                                {currentSucursal?.nombre || 'Sin sucursal'}
                            </p>
                            {/* <span className="text-gray-300">•</span> */}
                            {/* <p className="text-sm text-gray-500">
                                {currentUser?.nombre || 'Usuario'}
                            </p> */}
                            {dashboardData.stats?.totalVentas > 0 && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-green-600 font-medium">
                                        {dashboardData.stats.totalVentas} ventas totales
                                    </p>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-blue-600 font-medium">
                                        Bs. {(() => { const v = dashboardData.stats.totalIngresos; return v % 1 !== 0 ? v.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.toLocaleString('es-BO'); })()} ingresos
                                    </p>
                                </>
                            )}
                            {selectedMonth && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-orange-600 font-medium">
                                        📍 Mostrando datos de {selectedMonth}
                                    </p>
                                    <motion.button
                                        onClick={resetFilters}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: 1,
                                            opacity: 1,
                                            // Efecto de parpadeo suave que se repite 3 veces
                                            boxShadow: [
                                                "0 0 0 0 rgba(249, 115, 22, 0)",
                                                "0 0 0 4px rgba(249, 115, 22, 0.3)",
                                                "0 0 0 0 rgba(249, 115, 22, 0)"
                                            ]
                                        }}
                                        transition={{
                                            scale: { type: "spring", stiffness: 400, damping: 25 },
                                            opacity: { duration: 0.3 },
                                            boxShadow: { duration: 0.8, repeat: 3, repeatType: "loop" }
                                        }}
                                        whileHover={{ scale: 1.05, backgroundColor: "#fed7aa" }}
                                        whileTap={{ scale: 0.95 }}
                                        className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-all ml-1 flex items-center gap-1 font-medium"
                                    >
                                        <motion.span
                                            animate={{ rotate: [0, 90, 0] }}
                                            transition={{ duration: 0.5, delay: 0.2, repeat: 2 }}
                                            className="text-sm"
                                        >
                                            ✕
                                        </motion.span>
                                        <span>Limpiar filtro</span>
                                    </motion.button>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowModalMeta(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <span className="text-base">🎯</span>
                        <span className="font-medium">Editar Metas</span>
                    </button>
                </div>

                {/* Category Cards */}
                <CategoryCards
                    categories={displayCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    currentMonth={dashboardData.currentMonth}
                    selectedMonth={selectedMonth}
                />

                {/* Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <SalesChart
                            data={dashboardData.monthlySales}
                            categories={dashboardData.categories}
                            selectedCategory={selectedCategory}
                            onMonthSelect={setSelectedMonth}
                        />
                    </div>

                    <div className="lg:col-span-1">
                        <TopProductsList
                            key={`${selectedCategory || 'all'}-${selectedMonth || 'current'}`}
                            products={displayProducts}
                            categories={dashboardData.categories}
                            selectedCategory={selectedCategory}
                            currentMonth={dashboardData.currentMonth}
                            selectedMonth={selectedMonth}
                        />
                    </div>
                </div>

                {/* Footer */}
                {dashboardData.stats && (
                    <div className="text-center pt-2">
                        <p className="text-xs text-gray-400">
                            Datos actualizados al {new Date().toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de Metas con BD */}
            <ModalMeta
                isOpen={showModalMeta}
                onClose={() => setShowModalMeta(false)}
                categories={dashboardData.categories}
                currentMonth={dashboardData.currentMonth}
            />
        </div>
    );
}