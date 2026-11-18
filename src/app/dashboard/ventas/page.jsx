// src/app/dashboard/ventas/page.jsx
"use client";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useVentas } from "./hooks/useVentas";
import Header from "./components/Header";
import Tabla from "./components/Tabla";
import ModalNuevaVenta from "./components/ModalNuevaVenta";
import ModalComisionesPorUsuario from "./components/ModalComisionesPorUsuario";
import FiltroVentas from "./components/FiltrosVentas";

export default function VentasPage() {
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
        ventas,
        crearVenta,
        crearMultiplesVentas,
        obtenerVendedores,
        anularVenta,
        actualizarDepositado,
        actualizarConfirmacionDepositado,
        filtrarVentasPorCategoria,
        filtrarVentasPorUsuarios,
        filtrarVentasPorBusqueda,
        obtenerMisVentas,
        obtenerVentasParaExportar
    } = useVentas();

    // Ref para evitar doble fetch cuando FiltrosVentas setea el mes actual al montar
    const ultimoFiltroRef = useRef(undefined);

    // Refetch cuando cambia el rango de fecha (Opción 1: page orquesta)
    useEffect(() => {
        if (!sucursalCargada) return;

        const prev = ultimoFiltroRef.current;
        ultimoFiltroRef.current = filtroFecha;

        // null → useVentas ya cargó el mes actual por defecto
        if (filtroFecha === null) return;

        // Si es el mismo rango que ya se aplicó, no refetch
        if (prev !== undefined &&
            prev?.inicio === filtroFecha?.inicio &&
            prev?.fin === filtroFecha?.fin) return;

        obtenerMisVentas(filtroFecha);
    }, [filtroFecha, sucursalCargada, obtenerMisVentas]);

    const handleVentaCreada = useCallback(async () => {
        await obtenerMisVentas();
    }, [obtenerMisVentas]);

    const manejarFiltroCategoria = (categoria) => setFiltroCategoria(categoria);
    const manejarFiltroUsuarios = (usuario) => setFiltroUsuarios(usuario);
    const manejarBusqueda = (termino) => setTerminoBusqueda(termino);

    // Categorías del rango actualmente cargado
    const obtenerCategoriasUnicas = () => {
        const categorias = [...new Set(ventas
            .filter(venta => venta.categoria_nombre && venta.categoria_nombre.trim() !== '')
            .map(venta => venta.categoria_nombre)
        )].sort();
        return categorias;
    };

    const ventasFiltradas = useMemo(() => {
        let result = ventas;

        if (filtroCategoria) {
            result = filtrarVentasPorCategoria(result, filtroCategoria);
        }
        if (filtroUsuarios) {
            result = filtrarVentasPorUsuarios(result, filtroUsuarios);
        }
        if (terminoBusqueda) {
            result = filtrarVentasPorBusqueda(result, terminoBusqueda);
        }
        if (mostrarSoloActivas) {
            result = result.filter(v => v.estado === "activa");
        }
        return result;
    }, [ventas, filtroCategoria, filtroUsuarios, terminoBusqueda, mostrarSoloActivas]);

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
                ventasOriginales={ventas}
                obtenerVentasParaExportar={obtenerVentasParaExportar}
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