'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import Tabla from './components/Tabla';
import { useInventarioFisico } from './hooks/useInventarioFisico';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionProductos() {

    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { sucursalSeleccionada } = values;

    const {
        productos,
        categorias,
        loading,
        error,
        recargarProductos
    } = useInventarioFisico(sucursalSeleccionada?.id);

    const [categoriaFiltro, setCategoriaFiltro] = useState('');

    // Filtrar productos SOLO de la sucursal seleccionada para la validación
    const productosDeSucursal = sucursalSeleccionada
        ? productos.filter(producto => producto.sucursal_id === sucursalSeleccionada.id)
        : [];

    return (
        <>
            <div className="p-3 space-y-3 text-gray-800">
                <Header
                    loading={loading}
                    sucursalSeleccionada={sucursalSeleccionada}
                    categorias={categorias}
                    categoriaFiltro={categoriaFiltro}
                    setCategoriaFiltro={setCategoriaFiltro}
                />
            </div>
            <div className="p-y-0">
                {
                    error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )
                }
                <Tabla
                    productos={productos}
                    loading={loading}
                    sucursalSeleccionada={sucursalSeleccionada}
                    categoriaFiltro={categoriaFiltro}
                />
            </div >
        </>
    );
}