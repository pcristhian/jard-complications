// components/PlanesWifi/FiltroPlanesWifi.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FiltroPlanesWifi = ({ onMesChange, onAnioChange, mesSeleccionado, anioSeleccionado }) => {
    const [mes, setMes] = useState(mesSeleccionado || '');
    const [anio, setAnio] = useState(anioSeleccionado || new Date().getFullYear());

    // Generar años (2024 al actual + 1)
    const anioActual = new Date().getFullYear();
    const años = Array.from({ length: anioActual - 2023 + 1 }, (_, i) => 2024 + i);

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

    const manejarCambioMes = (e) => {
        const value = e.target.value;
        setMes(value);
        onMesChange(value);
    };

    const manejarCambioAnio = (e) => {
        const value = e.target.value;
        setAnio(value);
        onAnioChange(value);
    };

    const limpiarFiltros = () => {
        setMes('');
        setAnio(anioActual);
        onMesChange('');
        onAnioChange(anioActual);
    };

    const mostrarBotonLimpiar = mes !== '';

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white px-1 p-1 rounded-lg shadow-sm border border-gray-200"
        >
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">
                        </label>
                        <select
                            value={mes}
                            onChange={manejarCambioMes}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos los meses</option>
                            {meses.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={anio}
                            onChange={manejarCambioAnio}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {años.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
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