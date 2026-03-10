// src/app/dashboard/reportes/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useReportes } from "./hooks/useReportes";
import Header from "./components/Header";
import Tabla from "./components/Tabla";
import { useVentas } from "../ventas/hooks/useVentas";

export default function ReportesPage() {
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
    }, [currentSucursal]); // Removemos fetchReportData de dependencias para evitar loops

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

    // src/app/dashboard/reportes/page.jsx (fragmento actualizado)
    return (
        <div className="min-h-screen p-3 space-y-3 text-gray-800">
            <Header
                onDownloadExcel={downloadExcel}
                currentSucursal={currentSucursal}
                rolNombre={rolNombre}
                currentUser={currentUser}
                loading={loading}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
            />

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-red-600">Error: {error}</p>
                </div>
            )}

            <Tabla
                data={data}
                loading={loading}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilter={handleFilterChange} // Reutilizamos la misma función
                categorias={filterOptions.categorias}
                usuarios={filterOptions.usuarios}
                monthOptions={monthOptions}
            />
        </div>
    );
}