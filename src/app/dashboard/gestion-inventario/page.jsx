// src/app/dashboard/gestion-inventario/page.js

'use client';

import { useState, useEffect } from 'react';
import { useInventarioFisico } from './hooks/useInventarioFisico';
import TablaInventario from './components/TablaInventario';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionInventario() {
    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { sucursalSeleccionada } = values;

    const [filtroCategoria, setFiltroCategoria] = useState(null);
    const [fechaConteo, setFechaConteo] = useState(new Date().toISOString().split('T')[0]);

    const {
        productos,
        conteos,
        loading,
        error,
        saving,
        cargarProductos,
        cargarConteos,
        guardarConteo
    } = useInventarioFisico();

    // Cargar productos cuando cambia la sucursal o categoría
    useEffect(() => {
        if (sucursalSeleccionada?.id) {
            cargarProductos(sucursalSeleccionada.id, filtroCategoria);
        }
    }, [sucursalSeleccionada?.id, filtroCategoria]);

    // Cargar conteos cuando cambia la fecha o sucursal
    useEffect(() => {
        if (sucursalSeleccionada?.id) {
            cargarConteos(sucursalSeleccionada.id, fechaConteo);
        }
    }, [sucursalSeleccionada?.id, fechaConteo]);

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
        <div className="p-1 space-y-3 text-gray-800">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                    <strong>Error:</strong> {error}
                </div>
            )}

            <TablaInventario
                productos={productos}
                conteos={conteos}
                loading={loading}
                saving={saving}
                sucursalId={sucursalSeleccionada.id}
                onGuardarConteo={guardarConteo}
            />
        </div>
    );
}