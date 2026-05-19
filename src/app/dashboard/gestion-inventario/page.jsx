// src/app/dashboard/gestion-inventario/page.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import TablaInventario from './components/TablaInventario';
import { useInventarioPeriodo } from './hooks/useInventarioPeriodo';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionInventario() {
    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { sucursalSeleccionada } = values;

    const [filtros, setFiltros] = useState({
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear(),
        categoriaId: null
    });

    const {
        inventario,
        categorias,
        loading,
        error,
        cargarInventario,
        cargarCategorias,
        registrarConteoFisico
    } = useInventarioPeriodo();

    useEffect(() => {
        cargarCategorias();
    }, [cargarCategorias]);

    // Cargar inventario cuando cambia la sucursal o los filtros
    useEffect(() => {
        if (sucursalSeleccionada?.id) {
            const fechaInicio = new Date(filtros.año, filtros.mes - 1, 1);
            const fechaFin = new Date(filtros.año, filtros.mes, 0);

            cargarInventario(
                sucursalSeleccionada.id,
                fechaInicio,
                fechaFin,
                filtros.categoriaId
            );
        }
    }, [sucursalSeleccionada?.id, filtros, cargarInventario]);

    const handleRecargar = useCallback(() => {
        if (sucursalSeleccionada?.id) {
            const fechaInicio = new Date(filtros.año, filtros.mes - 1, 1);
            const fechaFin = new Date(filtros.año, filtros.mes, 0);

            cargarInventario(
                sucursalSeleccionada.id,
                fechaInicio,
                fechaFin,
                filtros.categoriaId
            );
        }
    }, [sucursalSeleccionada?.id, filtros, cargarInventario]);

    const handleFiltroChange = (tipo, valor) => {
        setFiltros(prev => ({ ...prev, [tipo]: valor }));
    };

    const handleRegistrarConteo = async (productoId, stockReal, observacion) => {
        console.log('Registrando conteo:', { productoId, stockReal, observacion });

        const resultado = await registrarConteoFisico(
            productoId,
            sucursalSeleccionada.id,
            stockReal,
            observacion
        );

        // NO recargamos todo el inventario, solo mostramos feedback visual
        return resultado;
    };

    if (!sucursalSeleccionada) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-yellow-800 font-medium">Por favor, selecciona una sucursal</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3 space-y-3 text-gray-800">
            <Header
                onRecargar={handleRecargar}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <TablaInventario
                inventario={inventario}
                categorias={categorias}
                loading={loading}
                filtros={filtros}
                onFiltroChange={handleFiltroChange}
                onRegistrarConteo={handleRegistrarConteo}
                sucursalNombre={sucursalSeleccionada?.nombre}
            />
        </div>
    );
}