// src/app/dashboard/ventas/page.jsx
"use client";
/////////////////////////////////////////////////
import { useState, useMemo, useCallback } from "react";
import { useVentas } from "./hooks/useVentas";
import Header from "./components/Header";
import Tabla from "./components/Tabla";
import ModalNuevaVenta from "./components/ModalNuevaVenta";
import ModalComisionesPorUsuario from "./components/ModalComisionesPorUsuario";
import FiltroVentas from "./components/FiltrosVentas";

export default function VentasPage() {
    // 1. TODOS los Hooks primero
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modalVenta, setModalVenta] = useState(false);
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroUsuarios, setFiltroUsuarios] = useState('');
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [filtroFecha, setFiltroFecha] = useState(null);
    const [mostrarSoloActivas, setMostrarSoloActivas] = useState(true);

    const {
        productos,
        currentUser,
        currentSucursal,
        sucursalCargada,
        rolNombre,
        ventas,  // ⬅️ Estas son las ventas originales (sin filtrar)
        crearVenta,
        crearMultiplesVentas,
        obtenerVendedores,
        anularVenta,
        actualizarDepositado,
        actualizarConfirmacionDepositado,
        filtrarVentasPorCategoria,
        filtrarVentasPorUsuarios,
        filtrarVentasPorBusqueda,
        filtrarVentasFecha,
        obtenerMisVentas
    } = useVentas();

    // 2. Funciones de manejo
    const handleVentaCreada = useCallback(async () => {
        await obtenerMisVentas();
    }, [obtenerMisVentas]);

    const manejarFiltroCategoria = (categoria) => {
        setFiltroCategoria(categoria);
    };

    const manejarFiltroUsuarios = (usuario) => {
        setFiltroUsuarios(usuario);
    };

    const manejarBusqueda = (termino) => {
        setTerminoBusqueda(termino);
    };

    // 3. Obtener categorías únicas de ventas
    const obtenerCategoriasUnicas = () => {
        const categorias = [...new Set(ventas
            .filter(venta => venta.categoria_nombre && venta.categoria_nombre.trim() !== '')
            .map(venta => venta.categoria_nombre)
        )].sort();
        return categorias;
    };

    // 4. Ventas filtradas (para la tabla)
    const ventasFiltradas = useMemo(() => {
        let ventasFiltradas = ventas;  // ⬅️ Partimos de las ventas originales

        if (filtroCategoria) {
            ventasFiltradas = filtrarVentasPorCategoria(ventasFiltradas, filtroCategoria);
        }
        if (filtroUsuarios) {
            ventasFiltradas = filtrarVentasPorUsuarios(ventasFiltradas, filtroUsuarios);
        }
        if (terminoBusqueda) {
            ventasFiltradas = filtrarVentasPorBusqueda(ventasFiltradas, terminoBusqueda);
        }
        if (filtroFecha) {
            ventasFiltradas = filtrarVentasFecha(ventasFiltradas, filtroFecha);
        }
        if (mostrarSoloActivas) {
            ventasFiltradas = ventasFiltradas.filter(v => v.estado === "activa");
        }
        return ventasFiltradas;
    }, [ventas, filtroCategoria, filtroUsuarios, terminoBusqueda, filtroFecha, mostrarSoloActivas]);

    // ✅ Usuarios de las ventas filtradas (incluye inactivos si tienen ventas en el período)
    const usuariosDeVentasFiltradas = useMemo(() => {
        const usuarios = [...new Set(ventasFiltradas
            .filter(venta =>
                venta.usuarios?.nombre &&
                venta.usuarios?.nombre.trim() !== ''
            )
            .map(venta => venta.usuarios.nombre)
        )].sort();

        return usuarios;
    }, [ventasFiltradas]);

    // 5. Returns condicionales (DESPUÉS de todos los Hooks)
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

    // 6. Return principal
    return (
        <div className="min-h-screen p-1 space-y-1 text-gray-800 text-gray-500">
            <Header
                onMostrarComisiones={() => setModalAbierto(true)}
                onNuevaVenta={() => setModalVenta(true)}
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
                usuariosActivos={usuariosDeVentasFiltradas}
                totalVentas={ventas.length}
                ventasFiltradas={ventasFiltradas}
                filtroFecha={filtroFecha}
                onFiltroFechaChange={setFiltroFecha}
                mostrarSoloActivas={mostrarSoloActivas}
                setMostrarSoloActivas={setMostrarSoloActivas}
                // ⬇️ PASAR LAS VENTAS ORIGINALES PARA LA DESCARGA ⬇️
                ventasOriginales={ventas}  // 🔥 NUEVA PROP
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

            <ModalNuevaVenta
                abierto={modalVenta}
                onCerrar={() => setModalVenta(false)}
                productos={productos}
                onCreateVenta={crearVenta}
                onCreateMultiplesVentas={crearMultiplesVentas}
                currentUser={currentUser}
                currentSucursal={currentSucursal}
                obtenerVendedores={obtenerVendedores}
            />
        </div>
    );
}