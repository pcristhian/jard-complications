// src/app/dashboard/ventas/components/FiltrosVentas.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
const FiltrosVentas = ({
    filtroCategoria,
    onFiltroCategoriaChange,
    terminoBusqueda,
    onBusquedaChange,
    categorias,
    totalVentas,
    ventasFiltradas,
    filtroFecha,
    onFiltroFechaChange,
    mostrarSoloActivas,
    setMostrarSoloActivas
}) => {
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const calendarioRef = useRef(null);

    const manejarCambioCategoria = (e) => {
        onFiltroCategoriaChange(e.target.value);
    };

    const manejarCambioBusqueda = (e) => {
        onBusquedaChange(e.target.value);
    };
    const limpiarFiltros = () => {
        const primerDia = new Date();
        primerDia.setDate(1);
        primerDia.setHours(0, 0, 0, 0); // ← ¡IMPORTANTE!

        const ultimoDia = new Date(primerDia.getFullYear(), primerDia.getMonth() + 1, 0);
        ultimoDia.setHours(23, 59, 59, 999); // ← ¡IMPORTANTE!

        onFiltroCategoriaChange('');
        onBusquedaChange('');

        // IMPORTANTE — Usa el mismo formato que tu filtroFecha espera
        onFiltroFechaChange({
            inicio: primerDia,
            fin: ultimoDia
        });
    };


    const toggleCalendario = () => {
        setMostrarCalendario(!mostrarCalendario);
    };
    const manejarSeleccionFecha = (inicio, fin) => {
        onFiltroFechaChange({ inicio, fin, aplicadoManualmente: true });
        setMostrarCalendario(false);
    };


    const limpiarFiltroFecha = () => {
        onFiltroFechaChange(null);
    };

    // Cerrar calendario al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (calendarioRef.current && !calendarioRef.current.contains(event.target)) {
                setMostrarCalendario(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const hoy = new Date();

        const primerDia = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
        const ultimoDia = formatearFecha(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0));

        onFiltroFechaChange({
            inicio: primerDia,
            fin: ultimoDia,
        });
    }, []);



    // Componente de calendario simple
    const Calendario = ({ onSeleccionar, onCerrar }) => {
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
            .toISOString()
            .split("T")[0];

        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
            .toISOString()
            .split("T")[0];


        const [fechaInicio, setFechaInicio] = useState('');
        const [fechaFin, setFechaFin] = useState('');

        const manejarAplicar = () => {
            if (fechaInicio && fechaFin) {
                onSeleccionar(fechaInicio, fechaFin);
            }
        };

        return (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-[100] p-4 min-w-80">  <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Seleccionar rango de fechas</h3>
                <button
                    onClick={onCerrar}
                    className="text-gray-400 hover:text-gray-600 text-lg"
                >
                    ×
                </button>
            </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Fecha inicio
                        </label>
                        <input
                            type="date"
                            value={fechaInicio}
                            max={fechaFin || hoy}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Fecha fin
                        </label>
                        <input
                            type="date"
                            value={fechaFin}
                            min={fechaInicio}
                            max={hoy}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="flex justify-between mt-4 gap-2">
                    <button
                        onClick={() => {
                            const hoy = new Date().toISOString().split('T')[0];
                            const hace7Dias = new Date();
                            hace7Dias.setDate(hace7Dias.getDate() - 7);
                            const fecha7Dias = hace7Dias.toISOString().split('T')[0];

                            onSeleccionar(fecha7Dias, hoy);
                        }}
                        className="px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Últimos 7 días
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onCerrar}
                            className="px-3 py-2 text-xs border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={manejarAplicar}
                            disabled={!fechaInicio || !fechaFin}
                            className="px-3 py-2 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "";

        // Si ya viene en formato YYYY-MM-DD → lo respetamos
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return fecha;
        }

        // Si viene como DD/MM/YYYY → convertirlo
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
            const [day, month, year] = fecha.split("/");
            return `${year}-${month}-${day}`;
        }

        // Si recibimos objeto Date
        if (fecha instanceof Date) {
            const y = fecha.getFullYear();
            const m = String(fecha.getMonth() + 1).padStart(2, "0");
            const d = String(fecha.getDate()).padStart(2, "0");
            return `${y}-${m}-${d}`;
        }

        // Si recibimos algo tipo string raro → intentar convertir
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





    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white px-1 p-1 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 relative" ref={calendarioRef}>
                        <label className="text-sm text-gray-500 font-medium">
                            Fecha:
                        </label>
                        <button
                            onClick={toggleCalendario}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                                {filtroFecha
                                    ? `${formatearFecha(filtroFecha.inicio)} - ${formatearFecha(filtroFecha.fin)}`
                                    : 'Seleccionar fechas'
                                }
                            </span>
                        </button>

                        {mostrarCalendario && (
                            <Calendario
                                onSeleccionar={manejarSeleccionFecha}
                                onCerrar={() => setMostrarCalendario(false)}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">
                            Buscar:
                        </label>
                        <input
                            type="text"
                            value={terminoBusqueda}
                            onChange={manejarCambioBusqueda}
                            placeholder="Código, nombre o descripción..."
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                    </div>

                    {/* Filtro por Categoría */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">
                            Filtrar por:
                        </label>
                        <select
                            value={filtroCategoria}
                            onChange={manejarCambioCategoria}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((categoria) => (
                                <option key={categoria} value={categoria}>
                                    {categoria}
                                </option>
                            ))}
                        </select>
                    </div>
                    <AnimatePresence>
                        {((filtroCategoria || terminoBusqueda || (filtroFecha && filtroFecha.aplicadoManualmente))
                        ) && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0, x: -20 }}
                                    animate={{ scale: 1, opacity: 1, x: 0 }}
                                    exit={{ scale: 0, opacity: 0, x: -20 }}
                                    transition={{
                                        duration: 0.3,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20
                                    }}
                                    className='flex items-center gap-2'
                                >
                                    <button
                                        onClick={limpiarFiltros}
                                        className="px-3 py-2 text-sm text-white bg-red-500 ring ring-red-300 rounded-md hover:bg-red-700 cursor-pointer transition-colors"
                                    >
                                        Limpiar filtros
                                    </button>
                                </motion.div>
                            )}
                    </AnimatePresence>
                </div>

                {/* Contador de resultados */}
                <div className="text-xs text-gray-600 flex flex-col gap-1">

                    {/* Texto principal arriba */}
                    <span className="font-semibold">Mostrando: {ventasFiltradas?.length} ventas</span>

                    {/* Switch abajo */}
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                        <input
                            type="checkbox"
                            checked={mostrarSoloActivas}
                            onChange={() => setMostrarSoloActivas(!mostrarSoloActivas)}
                            className="sr-only"
                        />

                        <div
                            className={`w-8 h-4 rounded-full relative transition-colors duration-200
                ${mostrarSoloActivas ? 'bg-green-500' : 'bg-gray-400'}`}
                        >
                            <div
                                className={`absolute top-[2px] left-[2px] w-3 h-3 bg-white rounded-full transition-all duration-200
                    ${mostrarSoloActivas ? 'translate-x-4' : ''}`}
                            ></div>
                        </div>

                        <span>Solo activas</span>
                    </label>

                </div>
            </div>
        </motion.div>
    );
};

export default FiltrosVentas;