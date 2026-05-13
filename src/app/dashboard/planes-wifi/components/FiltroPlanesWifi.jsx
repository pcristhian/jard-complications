// components/PlanesWifi/FiltroPlanesWifi.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FiltroPlanesWifi = ({
    onMesChange,
    onAnioChange,
    onEstadoActivoChange,
    mesSeleccionado,
    anioSeleccionado,
    soloActivos,
    planes // ← Recibir planes para filtrar fechas
}) => {
    const [mes, setMes] = useState(mesSeleccionado || '');
    const [anio, setAnio] = useState(anioSeleccionado || '');
    const [activos, setActivos] = useState(soloActivos || false);

    // Generar años y meses disponibles basados en los planes
    const [añosDisponibles, setAñosDisponibles] = useState([]);
    const [mesesDisponibles, setMesesDisponibles] = useState([]);

    const meses = [
        { value: 1, nombre: 'Enero' },
        { value: 2, nombre: 'Febrero' },
        { value: 3, nombre: 'Marzo' },
        { value: 4, nombre: 'Abril' },
        { value: 5, nombre: 'Mayo' },
        { value: 6, nombre: 'Junio' },
        { value: 7, nombre: 'Julio' },
        { value: 8, nombre: 'Agosto' },
        { value: 9, nombre: 'Septiembre' },
        { value: 10, nombre: 'Octubre' },
        { value: 11, nombre: 'Noviembre' },
        { value: 12, nombre: 'Diciembre' }
    ];

    // Calcular años y meses disponibles cuando cambian los planes
    // Calcular años y meses disponibles cuando cambian los planes o el año
    useEffect(() => {
        if (!planes || planes.length === 0) {
            setAñosDisponibles([]);
            setMesesDisponibles([]);
            return;
        }

        // Obtener años únicos de los planes
        const años = [...new Set(planes.map(plan => {
            const fecha = new Date(plan.fecha);
            return fecha.getFullYear();
        }))].sort((a, b) => b - a);

        setAñosDisponibles(años);

        // Calcular meses disponibles basados en el año seleccionado o todos los años
        let meses = [];
        if (anio) {
            // Si hay año seleccionado, filtrar por ese año
            meses = [...new Set(planes
                .map(plan => {
                    const fecha = new Date(plan.fecha);
                    if (fecha.getFullYear() === parseInt(anio)) {
                        return fecha.getMonth() + 1;
                    }
                    return null;
                })
                .filter(m => m !== null)
            )].sort((a, b) => a - b);
        } else {
            // Si no hay año seleccionado, mostrar todos los meses que tienen datos
            meses = [...new Set(planes
                .map(plan => {
                    const fecha = new Date(plan.fecha);
                    return fecha.getMonth() + 1;
                })
                .filter(m => m !== null)
            )].sort((a, b) => a - b);
        }

        setMesesDisponibles(meses);
    }, [planes, anio]);

    // Forzar actualización de meses cuando cambia el año
    useEffect(() => {
        if (anio && mesesDisponibles.length === 0) {
            // Si hay año seleccionado pero no hay meses disponibles, recalcular
            const nuevosMeses = [...new Set(planes
                .map(plan => {
                    const fecha = new Date(plan.fecha);
                    if (fecha.getFullYear() === parseInt(anio)) {
                        return fecha.getMonth() + 1;
                    }
                    return null;
                })
                .filter(m => m !== null)
            )].sort((a, b) => a - b);

            if (nuevosMeses.length > 0) {
                setMesesDisponibles(nuevosMeses);
            }
        }
    }, [anio, planes]);


    const manejarCambioMes = (e) => {
        const value = e.target.value;
        setMes(value);
        onMesChange(value);
    };
    const manejarCambioAnio = (e) => {
        const value = e.target.value;
        setAnio(value);
        setMes(''); // Resetear mes cuando cambia el año
        onMesChange(''); // Resetear filtro de mes en el padre
        onAnioChange(value);
    };

    const manejarCambioActivos = (e) => {
        const value = e.target.checked;
        setActivos(value);
        if (onEstadoActivoChange) {
            onEstadoActivoChange(value);
        }
    };

    const limpiarFiltros = () => {
        setMes('');
        setAnio('');
        setActivos(false);
        onMesChange('');
        onAnioChange('');
        if (onEstadoActivoChange) {
            onEstadoActivoChange(false);
        }
    };

    const mostrarBotonLimpiar = mes !== '' || anio !== '' || activos;

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white px-1 p-1 rounded-lg shadow-sm border border-gray-200"
        >
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Filtro de Año */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">Año:</label>
                        <select
                            value={anio}
                            onChange={manejarCambioAnio}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos los años</option>
                            {añosDisponibles.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Mes - solo muestra meses con datos */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">Mes:</label>
                        <select
                            value={mes}
                            onChange={manejarCambioMes}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos los meses</option>
                            {mesesDisponibles.map((m) => {
                                const mesData = meses.find(mes => mes.value === m);
                                return (
                                    <option key={m} value={m}>
                                        {mesData?.nombre || m}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Filtro de Solo Activos */}
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={activos}
                                onChange={manejarCambioActivos}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 font-medium">
                                Solo activos (Pendientes y Completados)
                            </span>
                        </label>
                    </div>

                    <AnimatePresence>
                        {mostrarBotonLimpiar && (
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
            </div>
        </motion.div>
    );
};

export default FiltroPlanesWifi;