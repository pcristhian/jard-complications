// src/app/dashboard/ventas/page.jsx
"use client";

import { useState, useMemo } from "react";
import { useVentas } from "./hooks/useVentas";
import Header from "./components/Header";
import Tabla from "./components/Tabla";
import ModalComisionesPorUsuario from "./components/ModalComisionesPorUsuario";
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
        filtrarVentasPorUsuarios,
        filtrarVentasPorBusqueda,
        filtrarVentasFecha,
        obtenerMisVentas
    } = useVentas();

    const [modalAbierto, setModalAbierto] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState(''); // ← Estado para el filtro
    const [filtroUsuarios, setFiltroUsuarios] = useState(''); // ← Nuevo estado
    const [terminoBusqueda, setTerminoBusqueda] = useState(''); // ← Nuevo estado
    const [filtroFecha, setFiltroFecha] = useState(null);

    const manejarFiltroCategoria = (categoria) => {
        setFiltroCategoria(categoria);
    };
    const manejarFiltroUsuarios = (usuario) => {
        setFiltroUsuarios(usuario);
    }

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
    const obtenerUsuariosUnicos = () => {
        const usuarios = [...new Set(ventas
            .filter(venta => venta.usuarios?.nombre && venta.usuarios?.nombre.trim() !== '')
            .map(venta => venta.usuarios?.nombre)
        )].sort();
        return usuarios;
    };

    const [mostrarSoloActivas, setMostrarSoloActivas] = useState(true);


    const ventasFiltradas = useMemo(() => {
        let ventasFiltradas = ventas;

        // Primero aplicar filtro de categoría
        if (filtroCategoria) {
            ventasFiltradas = filtrarVentasPorCategoria(ventasFiltradas, filtroCategoria);
        }
        if (filtroUsuarios) {
            ventasFiltradas = filtrarVentasPorUsuarios(ventasFiltradas, filtroUsuarios);
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
    }, [ventas, filtroCategoria, filtroUsuarios, terminoBusqueda, filtroFecha, mostrarSoloActivas]);

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
                onMostrarComisiones={() => setModalAbierto(true)}
                currentSucursal={currentSucursal}
                rolNombre={rolNombre}
                currentUser={currentUser}
            />
            <FiltroVentas
                filtroCategoria={filtroCategoria}
                filtroUsuarios={filtroUsuarios}
                onFiltroUsuariosChange={manejarFiltroUsuarios}
                onFiltroCategoriaChange={manejarFiltroCategoria}
                terminoBusqueda={terminoBusqueda}
                onBusquedaChange={manejarBusqueda}
                categorias={obtenerCategoriasUnicas()}
                usuarios={obtenerUsuariosUnicos()}
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
                rolNombre={rolNombre}
                currentSucursal={currentSucursal}
                ventas={ventasFiltradas}
                filtrarVentasPorCategoria={filtrarVentasPorCategoria}
                mostrarSoloActivas={mostrarSoloActivas}
            />

            <ModalComisionesPorUsuario
                abierto={modalAbierto}
                onCerrar={() => setModalAbierto(false)}
            />
        </div>
    );
}