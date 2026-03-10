'use client';

import { useState } from 'react';
import Header from './components/Header';
import Tabla from './components/Tabla';
import ModalNuevoProducto from './components/ModalNuevoProducto';
import ModalEditarProducto from './components/ModalEditarProducto';
import ModalAgregarStock from './components/ModalAgregarStock'; // 🔹 Nombre actualizado
import ModalTraslado from './components/ModalTraslado';
import { useProductos } from './hooks/useProductos';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionProductos() {
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [modalAgregarStockAbierto, setModalAgregarStockAbierto] = useState(false); // 🔹 Cambiado
    const [modalTrasladoAbierto, setModalTrasladoAbierto] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);

    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada", "currentUser"]);
    const { sucursalSeleccionada, currentUser } = values;

    const {
        productos,
        categorias,
        loading,
        error,
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        añadirStock, // 🔹 Mantenemos el nombre en español en el hook
        trasladarProducto,
        recargarProductos
    } = useProductos(sucursalSeleccionada?.id);

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

    const handleAgregarStock = async (productoId, cantidad, observaciones) => { // 🔹 Cambiado
        if (!currentUser?.id) {
            return { success: false, error: 'Usuario no identificado' };
        }

        const resultado = await añadirStock(productoId, cantidad, observaciones, currentUser.id);
        if (resultado.success) {
            setModalAgregarStockAbierto(false);
        }
        return resultado;
    };

    const handleRealizarTraslado = async (productoId, cantidad, sucursalDestinoId, observaciones) => {
        if (!currentUser?.id) {
            return { success: false, error: 'Usuario no identificado' };
        }

        const resultado = await trasladarProducto(
            productoId,
            cantidad,
            sucursalDestinoId,
            observaciones,
            currentUser.id
        );

        if (resultado.success) {
            setModalTrasladoAbierto(false);
        }
        return resultado;
    };

    return (
        <div className="p-2 space-y-2 text-gray-800">
            <Header
                onNuevoProducto={() => setModalNuevoAbierto(true)}
                onAgregarStock={() => setModalAgregarStockAbierto(true)} // 🔹 Cambiado
                onRealizarTraslado={() => setModalTrasladoAbierto(true)}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <Tabla
                productos={productos}
                onEditar={setProductoEditando}
                onEliminar={eliminarProducto}
                onRecargar={recargarProductos}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            <ModalNuevoProducto
                abierto={modalNuevoAbierto}
                onCerrar={() => setModalNuevoAbierto(false)}
                onCrearProducto={handleCrearProducto}
                categorias={categorias}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            {/* 🔹 Modal con nombre actualizado */}
            <ModalAgregarStock
                abierto={modalAgregarStockAbierto}
                onCerrar={() => setModalAgregarStockAbierto(false)}
                onAgregarStock={handleAgregarStock}
                productos={productos}
                sucursalSeleccionada={sucursalSeleccionada}
                loading={loading}
            />

            <ModalTraslado
                abierto={modalTrasladoAbierto}
                onCerrar={() => setModalTrasladoAbierto(false)}
                onRealizarTraslado={handleRealizarTraslado}
                productos={productos}
                sucursalActual={sucursalSeleccionada}
                loading={loading}
            />

            {productoEditando && (
                <ModalEditarProducto
                    producto={productoEditando}
                    onCerrar={() => setProductoEditando(null)}
                    onActualizarProducto={actualizarProducto}
                    categorias={categorias}
                    loading={loading}
                    sucursalSeleccionada={sucursalSeleccionada}
                />
            )}
        </div>
    );
}