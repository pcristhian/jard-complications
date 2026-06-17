// src/app/dashboard/ventas/components/FiltrosVentas.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // ✅ Importar iconos

//////////////////////////////////////////////////////
// Constantes de zona horaria
const TIMEZONE_BOLIVIA = -4; // Bolivia está en UTC-4

// Funciones auxiliares de conversión de fechas
const boliviaToUTC = (fechaBolivia) => {
    if (!fechaBolivia) return null;
    const date = new Date(fechaBolivia);
    // Sumar 4 horas para convertir de Bolivia a UTC
    return new Date(date.getTime() + (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));
};

const utcToBolivia = (fechaUTC) => {
    if (!fechaUTC) return null;
    const date = new Date(fechaUTC);
    // Restar 4 horas para convertir de UTC a Bolivia
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
}) => {
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
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
        // Ajustar a zona horaria Bolivia
        const fechaBolivia = new Date(ahoraBolivia.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));

        const primerDiaBolivia = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth(), 1);
        primerDiaBolivia.setHours(0, 0, 0, 0);

        const ultimoDiaBolivia = new Date(fechaBolivia.getFullYear(), fechaBolivia.getMonth() + 1, 0);
        ultimoDiaBolivia.setHours(23, 59, 59, 999);

        // Guardar como UTC para la consulta
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
        // fechaInicioStr y fechaFinStr vienen del input date (formato YYYY-MM-DD)
        // Estas fechas representan fechas en Bolivia

        const [yearInicio, monthInicio, dayInicio] = fechaInicioStr.split('-');
        const [yearFin, monthFin, dayFin] = fechaFinStr.split('-');

        // Crear fechas en Bolivia (sin ajuste horario, el navegador las interpreta como local)
        const inicioBolivia = new Date(parseInt(yearInicio), parseInt(monthInicio) - 1, parseInt(dayInicio), 0, 0, 0);
        const finBolivia = new Date(parseInt(yearFin), parseInt(monthFin) - 1, parseInt(dayFin), 23, 59, 59, 999);

        // Convertir a UTC para la consulta
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

    // Componente Calendario interno
    const Calendario = ({ onSeleccionar, onCerrar }) => {
        const hoy = new Date();
        const hoyBolivia = new Date(hoy.getTime() - (Math.abs(TIMEZONE_BOLIVIA) * 60 * 60 * 1000));
        const [fechaInicio, setFechaInicio] = useState('');
        const [fechaFin, setFechaFin] = useState('');

        // Obtener fecha actual en formato YYYY-MM-DD para Bolivia
        const todayStr = `${hoyBolivia.getFullYear()}-${String(hoyBolivia.getMonth() + 1).padStart(2, '0')}-${String(hoyBolivia.getDate()).padStart(2, '0')}`;

        const manejarAplicar = () => {
            if (fechaInicio && fechaFin) {
                onSeleccionar(fechaInicio, fechaFin);
            }
        };

        // Preestablecer últimos 7 días
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

                        {/* Botón mes anterior */}
                        <button
                            onClick={mesAnterior}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                            title="Mes anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Botón del mes (abre calendario) */}
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

                        {/* Botón mes siguiente */}
                        <button
                            onClick={mesSiguiente}
                            disabled={esMesActual()}
                            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Mes siguiente"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Calendario desplegable */}
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
                            {usuariosActivos.map((nombre) => (  // ✅ Usar usuariosActivos
                                <option key={nombre} value={nombre}>{nombre}</option>
                            ))}
                        </select>
                    </motion.div>

                    <AnimatePresence mode="popLayout">
                        {hayFiltrosActivos && (
                            <motion.button
                                key="limpiar"
                                variants={limpiarVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onClick={limpiarFiltros}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-950 border border-red-800 rounded-lg hover:bg-red-900 hover:border-red-700 transition-colors"
                            >
                                Limpiar filtros
                            </motion.button>
                        )}
                    </AnimatePresence>
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