// src/app/dashboard/ventas/page.jsx
"use client";

import { useState, useMemo } from "react";
import { useVentas } from "./hooks/useVentas";
import Header from "./components/Header";
import Tabla from "./components/Tabla";
import ModalNuevaVenta from "./components/ModalNuevaVenta";
import FiltroVentas from "./components/FiltrosVentas";
export default function VentasPage() {
    const {
        productos,
        currentUser,
        currentSucursal,
        sucursalCargada,
        rolNombre,
        ventas,
        crearVenta,
        anularVenta,
        actualizarDepositado,
        actualizarConfirmacionDepositado,
        filtrarVentasPorCategoria,
        filtrarVentasPorBusqueda,
        filtrarVentasFecha,

        obtenerMisVentas
    } = useVentas();

    const [modalAbierto, setModalAbierto] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState(''); // ← Estado para el filtro
    const [terminoBusqueda, setTerminoBusqueda] = useState(''); // ← Nuevo estado
    const [filtroFecha, setFiltroFecha] = useState(null);

    const manejarFiltroCategoria = (categoria) => {
        setFiltroCategoria(categoria);
    };

    const manejarBusqueda = (termino) => {
        setTerminoBusqueda(termino);
    };

    const obtenerCategoriasUnicas = () => {
        const categorias = [...new Set(ventas
            .filter(venta => venta.categoria_nombre && venta.categoria_nombre.trim() !== '')
            .map(venta => venta.categoria_nombre)
        )].sort();
        return categorias;
    };

    const [mostrarSoloActivas, setMostrarSoloActivas] = useState(true);


    const ventasFiltradas = useMemo(() => {
        let ventasFiltradas = ventas;

        // Primero aplicar filtro de categoría
        if (filtroCategoria) {
            ventasFiltradas = filtrarVentasPorCategoria(ventasFiltradas, filtroCategoria);
        }

        // Luego aplicar búsqueda
        if (terminoBusqueda) {
            ventasFiltradas = filtrarVentasPorBusqueda(ventasFiltradas, terminoBusqueda);
        }

        // Finalmente aplicar filtro de fecha
        if (filtroFecha) {
            ventasFiltradas = filtrarVentasFecha(ventasFiltradas, filtroFecha);
        }
        if (mostrarSoloActivas) {
            ventasFiltradas = ventasFiltradas.filter(v => v.estado === "activa");
        }

        return ventasFiltradas;
    }, [ventas, filtroCategoria, terminoBusqueda, filtroFecha, mostrarSoloActivas]);

    if (!currentUser) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">⚠️ Debe iniciar sesión para ver las ventas</p>
                </div>
            </div>
        );
    }

    if (!sucursalCargada) {
        return (
            <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">⚠️ Debe seleccionar una sucursal para ver las ventas</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 space-y-1 text-gray-800 text-gray-500">
            <Header
                onNuevaVenta={() => setModalAbierto(true)}
                currentSucursal={currentSucursal}
                rolNombre={rolNombre}
                currentUser={currentUser}
            />
            <FiltroVentas
                filtroCategoria={filtroCategoria}
                onFiltroCategoriaChange={manejarFiltroCategoria}
                terminoBusqueda={terminoBusqueda}
                onBusquedaChange={manejarBusqueda}
                categorias={obtenerCategoriasUnicas()}
                totalVentas={ventas.length}
                ventasFiltradas={ventasFiltradas}
                filtroFecha={filtroFecha}
                onFiltroFechaChange={setFiltroFecha}
                mostrarSoloActivas={mostrarSoloActivas}
                setMostrarSoloActivas={setMostrarSoloActivas}
            />


            <Tabla
                onAnularVenta={anularVenta}
                onActualizarDepositado={actualizarDepositado}
                onActualizarConfirmacionDepositado={actualizarConfirmacionDepositado}
                obtenerMisVentas={obtenerMisVentas}
                currentUser={currentUser}
                currentSucursal={currentSucursal}
                ventas={ventasFiltradas}
                filtrarVentasPorCategoria={filtrarVentasPorCategoria}
                mostrarSoloActivas={mostrarSoloActivas}
            />

            <ModalNuevaVenta
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
                productos={productos}
                onCreateVenta={crearVenta}
                currentUser={currentUser}
                currentSucursal={currentSucursal}
            />
        </div>
    );
}