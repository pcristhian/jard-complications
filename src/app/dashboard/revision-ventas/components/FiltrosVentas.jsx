// src/app/dashboard/ventas/components/FiltrosVentas.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    usuarios,
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

    const limpiarFiltros = () => {
        const primerDia = new Date();
        primerDia.setDate(1);
        primerDia.setHours(0, 0, 0, 0);
        const ultimoDia = new Date(primerDia.getFullYear(), primerDia.getMonth() + 1, 0);
        ultimoDia.setHours(23, 59, 59, 999);

        onBusquedaChange('');
        onFiltroCategoriaChange('');
        onFiltroUsuariosChange('');
        onFiltroFechaChange({ inicio: primerDia, fin: ultimoDia });
    };

    const manejarSeleccionFecha = (inicio, fin) => {
        onFiltroFechaChange({ inicio, fin, aplicadoManualmente: true });
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

    useEffect(() => {
        const hoy = new Date();
        const primerDia = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
        const ultimoDia = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));
        onFiltroFechaChange({ inicio: primerDia, fin: ultimoDia });
    }, []);

    const formatearFecha = (fecha) => {
        if (!fecha) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
            const [day, month, year] = fecha.split("/");
            return `${year}-${month}-${day}`;
        }
        if (fecha instanceof Date) {
            const y = fecha.getFullYear();
            const m = String(fecha.getMonth() + 1).padStart(2, "0");
            const d = String(fecha.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }
        const d = new Date(fecha);
        if (!isNaN(d)) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${y}-${m}-${dd}`;
        }
        console.warn("Fecha inválida recibida:", fecha);
        return "";
    };

    // Calendario — definido fuera del return para no recrear el componente en cada render
    const Calendario = ({ onSeleccionar, onCerrar }) => {
        const hoy = new Date();
        const [fechaInicio, setFechaInicio] = useState('');
        const [fechaFin, setFechaFin] = useState('');
        const todayStr = hoy.toISOString().split("T")[0];

        const manejarAplicar = () => {
            if (fechaInicio && fechaFin) onSeleccionar(fechaInicio, fechaFin);
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
                        Rango de fechas
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
                        onClick={() => {
                            const hoy = new Date().toISOString().split('T')[0];
                            const hace7 = new Date();
                            hace7.setDate(hace7.getDate() - 7);
                            onSeleccionar(hace7.toISOString().split('T')[0], hoy);
                        }}
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

    const hayFiltrosActivos =
        filtroCategoria ||
        filtroUsuarios ||
        terminoBusqueda ||
        (filtroFecha && filtroFecha.aplicadoManualmente);

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-slate-900 divide-slate-700 px-3 py-2.5 rounded-xl shadow border border-slate-800 border-l-[3px] border-l-cyan-400"
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
                    <motion.div variants={filterItemVariants} className="flex items-center gap-2 relative" ref={calendarioRef}>
                        <label className={labelClass}>Fecha:</label>
                        <button
                            onClick={() => setMostrarCalendario((v) => !v)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">
                                {filtroFecha
                                    ? `${formatearFecha(filtroFecha.inicio)} — ${formatearFecha(filtroFecha.fin)}`
                                    : 'Seleccionar fechas'}
                            </span>
                        </button>

                        <AnimatePresence>
                            {mostrarCalendario && (
                                <Calendario
                                    onSeleccionar={manejarSeleccionFecha}
                                    onCerrar={() => setMostrarCalendario(false)}
                                />
                            )}
                        </AnimatePresence>
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

                    {/* Usuarios */}
                    <motion.div variants={filterItemVariants} className="flex items-center gap-2">
                        <label className={labelClass}>ó</label>
                        <select
                            value={filtroUsuarios}
                            onChange={manejarCambioUsuarios}
                            className={inputClass}
                        >
                            <option value="">Vendedores</option>
                            {usuarios.map((u) => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </motion.div>

                    {/* Botón limpiar — aparece/desaparece sin doble render */}
                    <AnimatePresence mode="popLayout">
                        {hayFiltrosActivos && (
                            <motion.button
                                key="limpiar"
                                variants={limpiarVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onClick={limpiarFiltros}
                                className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-950 border border-red-800 rounded-lg hover:bg-red-900 hover:border-red-700 transition-colors"
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
                        <span className="text-cyan-400">{ventasFiltradas?.length}</span>{" "}
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