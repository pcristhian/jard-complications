// src/app/dashboard/ventas/components/FiltrosVentas.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import * as XLSX from 'xlsx'; // Importar XLSX

//////////////////////////////////////////////////////
// Constantes de zona horaria
const TIMEZONE_BOLIVIA = -4; // Bolivia está en UTC-4

// Funciones auxiliares de conversión de fechas
const boliviaToUTC = (fechaBolivia) => {
    if (!fechaBolivia) return null;
    const date = new Date(fechaBolivia);
    return new Date(date.getTime() + (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));
};

const utcToBolivia = (fechaUTC) => {
    if (!fechaUTC) return null;
    const date = new Date(fechaUTC);
    return new Date(date.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));
};

const formatearFechaParaMostrar = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Función para formatear fecha para el nombre del archivo
const formatearFechaParaArchivo = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
};

// Variantes fuera del componente — no se recrean en cada render
const containerVariants = {
    hidden: { opacity: 0, x: 40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.22, ease: "easeOut" },
    },
};

const filterGroupVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.05, delayChildren: 0.05 },
    },
};

const filterItemVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.16, ease: "easeOut" } },
};

const limpiarVariants = {
    hidden: { scale: 0.8, opacity: 0, x: -10 },
    visible: { scale: 1, opacity: 1, x: 0, transition: { type: "spring", stiffness: 320, damping: 22 } },
    exit: { scale: 0.8, opacity: 0, x: -10, transition: { duration: 0.12 } },
};

// Estilos compartidos para inputs y selects
const inputClass =
    "px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 transition-colors";

const labelClass = "text-xs text-slate-400 font-medium";

const FiltrosVentas = ({
    filtroCategoria,
    onFiltroCategoriaChange,
    filtroUsuarios,
    onFiltroUsuariosChange,
    terminoBusqueda,
    onBusquedaChange,
    categorias,
    usuariosActivos = [],
    ventasFiltradas,
    filtroFecha,
    onFiltroFechaChange,
    mostrarSoloActivas,
    setMostrarSoloActivas,
    ventasOriginales, // Recibir las ventas originales sin filtrar
}) => {
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [descargando, setDescargando] = useState(false);
    const calendarioRef = useRef(null);

    const manejarCambioCategoria = (e) => onFiltroCategoriaChange(e.target.value);
    const manejarCambioUsuarios = (e) => onFiltroUsuariosChange(e.target.value);
    const manejarCambioBusqueda = (e) => onBusquedaChange(e.target.value);

    const [mesSeleccionado, setMesSeleccionado] = useState(() => {
        const ahora = new Date();
        return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    });

    // ✅ Funciones de navegación
    const mesAnterior = () => {
        const nuevoMes = new Date(mesSeleccionado);
        nuevoMes.setMonth(nuevoMes.getMonth() - 1);
        setMesSeleccionado(nuevoMes);
        aplicarFiltroMes(nuevoMes);
    };

    const mesSiguiente = () => {
        const nuevoMes = new Date(mesSeleccionado);
        nuevoMes.setMonth(nuevoMes.getMonth() + 1);
        setMesSeleccionado(nuevoMes);
        aplicarFiltroMes(nuevoMes);
    };

    const aplicarFiltroMes = (fecha) => {
        const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

        const primerDiaBolivia = new Date(primerDia);
        primerDiaBolivia.setHours(0, 0, 0, 0);

        const ultimoDiaBolivia = new Date(ultimoDia);
        ultimoDiaBolivia.setHours(23, 59, 59, 999);

        const inicioUTC = boliviaToUTC(primerDiaBolivia);
        const finUTC = boliviaToUTC(ultimoDiaBolivia);

        onFiltroFechaChange({
            inicio: inicioUTC,
            fin: finUTC,
            aplicadoManualmente: true
        });
    };

    const esMesActual = () => {
        const ahora = new Date();
        return mesSeleccionado.getMonth() === ahora.getMonth() &&
            mesSeleccionado.getFullYear() === ahora.getFullYear();
    };

    // ✅ Formatear mes para mostrar
    const formatearMes = (fecha) => {
        return fecha.toLocaleString('es', {
            month: 'long',
            year: 'numeric'
        });
    };

    useEffect(() => {
        const ahora = new Date();
        const mesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        setMesSeleccionado(mesActual);
    }, []);

    // Obtener el texto a mostrar para el rango de fechas
    const getFechaMostrar = () => {
        if (!filtroFecha?.inicio || !filtroFecha?.fin) return 'Seleccionar fechas';

        const inicioBolivia = utcToBolivia(filtroFecha.inicio);
        const finBolivia = utcToBolivia(filtroFecha.fin);

        if (!inicioBolivia || !finBolivia) return 'Seleccionar fechas';

        return `${formatearFechaParaMostrar(inicioBolivia)} — ${formatearFechaParaMostrar(finBolivia)}`;
    };

    const limpiarFiltros = () => {
        const ahoraBolivia = new Date();
        const fechaBolivia = new Date(ahoraBolivia.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));

        const primerDiaBolivia = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth(), 1);
        primerDiaBolivia.setHours(0, 0, 0, 0);

        const ultimoDiaBolivia = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth() + 1, 0);
        ultimoDiaBolivia.setHours(23, 59, 59, 999);

        const inicioUTC = boliviaToUTC(primerDiaBolivia);
        const finUTC = boliviaToUTC(ultimoDiaBolivia);

        onBusquedaChange('');
        onFiltroCategoriaChange('');
        onFiltroUsuariosChange('');
        onFiltroFechaChange({
            inicio: inicioUTC,
            fin: finUTC,
            aplicadoManualmente: true
        });
    };

    const manejarSeleccionFecha = (fechaInicioStr, fechaFinStr) => {
        const [yearInicio, monthInicio, dayInicio] = fechaInicioStr.split('-');
        const [yearFin, monthFin, dayFin] = fechaFinStr.split('-');

        const inicioBolivia = new Date(parseInt(yearInicio), parseInt(monthInicio) - 1, parseInt(dayInicio), 0, 0, 0);
        const finBolivia = new Date(parseInt(yearFin), parseInt(monthFin) - 1, parseInt(dayFin), 23, 59, 59, 999);

        const inicioUTC = boliviaToUTC(inicioBolivia);
        const finUTC = boliviaToUTC(finBolivia);

        onFiltroFechaChange({
            inicio: inicioUTC,
            fin: finUTC,
            aplicadoManualmente: true
        });
        setMostrarCalendario(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (calendarioRef.current && !calendarioRef.current.contains(e.target)) {
                setMostrarCalendario(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Inicializar fechas al cargar el componente
    useEffect(() => {
        const ahoraBolivia = new Date();
        const fechaBolivia = new Date(ahoraBolivia.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));

        const primerDiaBolivia = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth(), 1);
        primerDiaBolivia.setHours(0, 0, 0, 0);

        const ultimoDiaBolivia = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth() + 1, 0);
        ultimoDiaBolivia.setHours(23, 59, 59, 999);

        const inicioUTC = boliviaToUTC(primerDiaBolivia);
        const finUTC = boliviaToUTC(ultimoDiaBolivia);

        onFiltroFechaChange({
            inicio: inicioUTC,
            fin: finUTC,
            aplicadoManualmente: true
        });
    }, []);

    const hayFiltrosActivos =
        filtroCategoria ||
        filtroUsuarios ||
        terminoBusqueda ||
        (filtroFecha && filtroFecha.aplicadoManualmente);

    // 🟢 FUNCIÓN PARA DESCARGAR EXCEL
    const descargarExcel = () => {
        if (!ventasOriginales || ventasOriginales.length === 0) {
            toast.error('No hay ventas para descargar');
            return;
        }

        setDescargando(true);

        try {
            // Filtrar solo ventas activas
            const ventasActivas = ventasOriginales.filter(v => v.estado === 'activa');

            if (ventasActivas.length === 0) {
                toast.error('No hay ventas activas para descargar');
                setDescargando(false);
                return;
            }

            // Aplicar filtros adicionales si existen
            let ventasParaExportar = ventasActivas;

            // Filtro por categoría
            if (filtroCategoria) {
                ventasParaExportar = ventasParaExportar.filter(v =>
                    v.categoria_nombre === filtroCategoria
                );
            }

            // Filtro por usuario
            if (filtroUsuarios) {
                ventasParaExportar = ventasParaExportar.filter(v =>
                    v.usuarios?.nombre === filtroUsuarios
                );
            }

            // Filtro por término de búsqueda
            if (terminoBusqueda) {
                const termino = terminoBusqueda.toLowerCase();
                ventasParaExportar = ventasParaExportar.filter(v =>
                    v.producto_codigo?.toLowerCase().includes(termino) ||
                    v.producto_nombre?.toLowerCase().includes(termino) ||
                    v.usuarios?.nombre?.toLowerCase().includes(termino)
                );
            }

            // Filtro por rango de fechas (mes seleccionado)
            if (filtroFecha?.inicio && filtroFecha?.fin) {
                const inicioUTC = new Date(filtroFecha.inicio);
                const finUTC = new Date(filtroFecha.fin);

                ventasParaExportar = ventasParaExportar.filter(v => {
                    const fechaVenta = new Date(v.fecha_venta);
                    return fechaVenta >= inicioUTC && fechaVenta <= finUTC;
                });
            }

            if (ventasParaExportar.length === 0) {
                alert('No hay ventas que coincidan con los filtros aplicados');
                setDescargando(false);
                return;
            }

            // Preparar datos para Excel
            const datosExcel = ventasParaExportar.map((venta, index) => {
                const fechaUTC = new Date(venta.fecha_venta);
                const fechaBolivia = new Date(fechaUTC.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));

                return {
                    'N°': index + 1,
                    'Fecha': fechaBolivia.toLocaleDateString('es-BO'),
                    'Código': venta.producto_codigo || '',
                    'Producto': venta.producto_nombre || '',
                    'Promotor': venta.usuarios?.nombre || '',
                    'Caja': venta.usuarios?.caja || '',
                    // 'Rol': venta.rol_nombre || '',
                    'Cantidad': venta.cantidad || 0,
                    'Precio Unitario': parseFloat(venta.producto_precio || 0).toFixed(2),
                    'Total': parseFloat(venta.total_precio_venta || 0).toFixed(2),
                    'Descuento': parseFloat(venta.descuento_venta || 0).toFixed(2),
                    'Comisión': venta.productos?.comision_variable
                        ? parseFloat(venta.productos.comision_variable).toFixed(2)
                        : (venta.productos?.categorias?.reglas_comision?.comision_base
                            ? parseFloat(venta.productos.categorias.reglas_comision.comision_base).toFixed(2)
                            : '0.00'),
                    'Categoría': venta.categoria_nombre || '',
                    'Observaciones': venta.observaciones || '',
                    'Estado': venta.estado || '',
                    // 'Depositado': venta.depositado ? 'Sí' : 'No',
                };
            });

            // Crear libro de trabajo
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(datosExcel);

            // Ajustar anchos de columnas
            const colWidths = [
                { wch: 6 },  // N°
                { wch: 12 }, // Fecha
                { wch: 12 }, // Código
                { wch: 40 }, // Producto
                { wch: 15 }, // Promotor
                { wch: 12 }, // Caja
                // { wch: 10 }, // Rol
                { wch: 10 }, // Cantidad
                { wch: 14 }, // Precio Unitario
                { wch: 14 }, // Total
                { wch: 14 }, // Descuento
                { wch: 14 }, // Comisión
                { wch: 15 }, // Categoría
                { wch: 25 }, // Observaciones
                { wch: 10 }, // Estado
                // { wch: 10 }, // Depositado
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

            // Generar nombre del archivo con mes y año
            const mesNombre = mesSeleccionado.toLocaleString('es', { month: 'long', year: 'numeric' });
            const nombreArchivo = `Ventas_${mesNombre.replace(/ /g, '_')}.xlsx`;

            // Descargar archivo
            XLSX.writeFile(wb, nombreArchivo);

        } catch (error) {
            console.error('Error al descargar Excel:', error);
            alert('Error al generar el archivo Excel: ' + error.message);
        } finally {
            setDescargando(false);
        }
    };

    // Componente Calendario interno
    const Calendario = ({ onSeleccionar, onCerrar }) => {
        const hoy = new Date();
        const hoyBolivia = new Date(hoy.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));
        const [fechaInicio, setFechaInicio] = useState('');
        const [fechaFin, setFechaFin] = useState('');

        const todayStr = `${hoyBolivia.getFullYear()}-${String(hoyBolivia.getMonth() + 1).padStart(2, '0')}-${String(hoyBolivia.getDate()).padStart(2, '0')}`;

        const manejarAplicar = () => {
            if (fechaInicio && fechaFin) {
                onSeleccionar(fechaInicio, fechaFin);
            }
        };

        const setUltimos7Dias = () => {
            const hoy = new Date();
            const hoyBolivia = new Date(hoy.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));
            const hace7 = new Date(hoyBolivia);
            hace7.setDate(hace7.getDate() - 7);

            const fechaFinStr = `${hoyBolivia.getFullYear()}-${String(hoyBolivia.getMonth() + 1).padStart(2, '0')}-${String(hoyBolivia.getDate()).padStart(2, '0')}`;
            const fechaInicioStr = `${hace7.getFullYear()}-${String(hace7.getMonth() + 1).padStart(2, '0')}-${String(hace7.getDate()).padStart(2, '0')}`;

            setFechaInicio(fechaInicioStr);
            setFechaFin(fechaFinStr);
            onSeleccionar(fechaInicioStr, fechaFinStr);
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full left-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-[100] p-4 min-w-72"
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                        Rango de fechas (Bolivia)
                    </h3>
                    <button
                        onClick={onCerrar}
                        className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className={`block ${labelClass} mb-1`}>Fecha inicio</label>
                        <input
                            type="date"
                            value={fechaInicio}
                            max={fechaFin || todayStr}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className={`w-full ${inputClass}`}
                        />
                    </div>
                    <div>
                        <label className={`block ${labelClass} mb-1`}>Fecha fin</label>
                        <input
                            type="date"
                            value={fechaFin}
                            min={fechaInicio}
                            max={todayStr}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className={`w-full ${inputClass}`}
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-4 gap-2">
                    <button
                        onClick={setUltimos7Dias}
                        className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Últimos 7 días
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onCerrar}
                            className="px-3 py-1.5 text-xs border border-slate-700 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={manejarAplicar}
                            disabled={!fechaInicio || !fechaFin}
                            className="px-3 py-1.5 text-xs bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 divide-gray-700 px-3 py-2.5 rounded-xl shadow border border-slate-800 border-l-[3px] border-l-cyan-400"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">

                {/* Grupo de filtros — animación escalonada una sola vez */}
                <motion.div
                    variants={filterGroupVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-wrap items-center gap-3"
                >
                    {/* Fecha */}
                    <motion.div variants={filterItemVariants} className="flex items-center gap-2">
                        <label className={labelClass}>Fecha:</label>

                        <button
                            onClick={mesAnterior}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setMostrarCalendario((v) => !v)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors min-w-[140px] justify-center"
                        >
                            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-medium capitalize">
                                {formatearMes(mesSeleccionado)}
                            </span>
                        </button>

                        <button
                            onClick={mesSiguiente}
                            disabled={esMesActual()}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="relative" ref={calendarioRef}>
                            <AnimatePresence>
                                {mostrarCalendario && (
                                    <Calendario
                                        onSeleccionar={(inicio, fin) => {
                                            manejarSeleccionFecha(inicio, fin);
                                            const [year, month] = inicio.split('-');
                                            setMesSeleccionado(new Date(parseInt(year), parseInt(month) - 1, 1));
                                        }}
                                        onCerrar={() => setMostrarCalendario(false)}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Buscar */}
                    <motion.div variants={filterItemVariants} className="flex items-center gap-2">
                        <label className={labelClass}>Buscar:</label>
                        <input
                            type="text"
                            value={terminoBusqueda}
                            onChange={manejarCambioBusqueda}
                            placeholder="Código, nombre..."
                            className={`${inputClass} w-52`}
                        />
                    </motion.div>

                    {/* Categoría */}
                    <motion.div variants={filterItemVariants} className="flex items-center gap-2">
                        <label className={labelClass}>Filtrar por:</label>
                        <select
                            value={filtroCategoria}
                            onChange={manejarCambioCategoria}
                            className={inputClass}
                        >
                            <option value="">Categorías</option>
                            {categorias.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </motion.div>

                    <motion.div variants={filterItemVariants} className="flex items-center gap-2">
                        <label className={labelClass}>ó</label>
                        <select
                            value={filtroUsuarios}
                            onChange={manejarCambioUsuarios}
                            className={inputClass}
                        >
                            <option value="">Promotores</option>
                            {usuariosActivos.map((nombre) => (
                                <option key={nombre} value={nombre}>{nombre}</option>
                            ))}
                        </select>
                    </motion.div>

                    {/* Botones de acción */}
                    <motion.div variants={filterItemVariants} className="flex items-center gap-4">
                        {/* Botón Limpiar Filtros */}
                        <AnimatePresence mode="popLayout">
                            {hayFiltrosActivos && (
                                <motion.button
                                    key="limpiar"
                                    variants={limpiarVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    onClick={limpiarFiltros}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-950 border border-red-800 rounded-lg hover:bg-red-900 hover:border-red-700 transition-colors whitespace-nowrap"
                                >
                                    Limpiar filtros
                                </motion.button>
                            )}
                        </AnimatePresence>

                        {/* Botón Descargar Excel */}
                        <button
                            onClick={descargarExcel}
                            disabled={descargando}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-700 border border-green-600 rounded-lg hover:bg-green-600 hover:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {descargando ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Descargando...
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5" />
                                    Descargar Excel
                                </>
                            )}
                        </button>
                    </motion.div>
                </motion.div>

                {/* Contador + toggle */}
                <motion.div
                    variants={filterItemVariants}
                    className="flex flex-col gap-1.5 items-end"
                >
                    <span className="text-xs font-semibold text-slate-300">
                        Mostrando:{" "}
                        <span className="text-cyan-400">{ventasFiltradas?.length || 0}</span>{" "}
                        ventas
                    </span>

                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={mostrarSoloActivas}
                            onChange={() => setMostrarSoloActivas(!mostrarSoloActivas)}
                            className="sr-only"
                        />
                        <div
                            className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${mostrarSoloActivas ? 'bg-cyan-400' : 'bg-slate-700'
                                }`}
                        >
                            <div
                                className={`absolute top-[2px] left-[2px] w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 ${mostrarSoloActivas ? 'translate-x-4' : ''
                                    }`}
                            />
                        </div>
                        <span className="text-xs text-slate-400">Solo activas</span>
                    </label>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default FiltrosVentas;