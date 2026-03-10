'use client';

import { useState, useEffect } from 'react';
import Header from './components/Header';
import FiltroProductos from './components/FiltroProductos';
import Tabla from './components/Tabla';
import ModalNuevoProducto from './components/ModalNuevoProducto';
import ModalEditarProducto from './components/ModalEditarProducto';
import { useProductos } from './hooks/useProductos';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionProductos() {
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);

    // Estados para filtros
    const [filtro, setFiltro] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [soloActivos, setSoloActivos] = useState(true);

    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { sucursalSeleccionada } = values;

    const {
        productos,
        categorias,
        loading,
        error,
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        recargarProductos
    } = useProductos(sucursalSeleccionada?.id);

    // Filtrar productos SOLO de la sucursal seleccionada para la validación
    const productosDeSucursal = sucursalSeleccionada
        ? productos.filter(producto => producto.sucursal_id === sucursalSeleccionada.id)
        : [];

    const handleCrearProducto = async (datosProducto) => {
        const productoConSucursal = {
            ...datosProducto,
            sucursal_id: sucursalSeleccionada?.id
        };

        const resultado = await crearProducto(productoConSucursal);
        if (resultado.success) {
            setModalNuevoAbierto(false);
        }
        return resultado;
    };

    const handleEditarProducto = async (id, datosProducto) => {
        const productoConSucursal = {
            ...datosProducto,
            sucursal_id: sucursalSeleccionada?.id
        };

        const resultado = await actualizarProducto(id, productoConSucursal);
        if (resultado.success) {
            setProductoEditando(null);
        }
        return resultado;
    };

    const handleEliminarProducto = async (id) => {
        if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            await eliminarProducto(id);
        }
    };

    return (
        <div className="p-3 space-y-3 text-gray-800">
            <Header
                onNuevoProducto={() => setModalNuevoAbierto(true)}
                onRecargar={recargarProductos}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Componente de filtros separado */}
            <FiltroProductos
                productos={productos}
                sucursalSeleccionada={sucursalSeleccionada}
                onFiltroChange={setFiltro}
                onCategoriaChange={setCategoriaFiltro}
                onSoloActivosChange={setSoloActivos}
            />

            {/* Tabla simplificada */}
            <Tabla
                productos={productos}
                onEditar={setProductoEditando}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
                filtro={filtro}
                categoriaFiltro={categoriaFiltro}
                soloActivos={soloActivos}
            />

            <ModalNuevoProducto
                abierto={modalNuevoAbierto}
                onCerrar={() => setModalNuevoAbierto(false)}
                onCrearProducto={handleCrearProducto}
                categorias={categorias}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
                productosExistentes={productosDeSucursal} // ← Solo productos de esta sucursal
            />

            {productoEditando && (
                <ModalEditarProducto
                    producto={productoEditando}
                    onCerrar={() => setProductoEditando(null)}
                    onActualizarProducto={handleEditarProducto}
                    categorias={categorias}
                    loading={loading}
                    sucursalSeleccionada={sucursalSeleccionada}
                    productosExistentes={productosDeSucursal} // ← Solo productos de esta sucursal

                />
            )}
        </div>
    );
}