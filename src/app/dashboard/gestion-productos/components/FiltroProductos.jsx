import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FiltroProductos = ({
    productos,
    sucursalSeleccionada,
    onFiltroChange,
    onCategoriaChange,
    onSoloActivosChange
}) => {
    const [filtro, setFiltro] = useState('');
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [soloActivos, setSoloActivos] = useState(true);
    useEffect(() => {
        onSoloActivosChange(true);
    }, []);


    // Obtener categorías únicas
    const categoriasUnicas = Array.from(
        new Set(
            productos
                .filter(p => p.categorias?.nombre)
                .map(p => JSON.stringify({ id: p.categorias.id, nombre: p.categorias.nombre }))
        )
    ).map(c => JSON.parse(c));

    const manejarCambioBusqueda = (e) => {
        const value = e.target.value;
        setFiltro(value);
        onFiltroChange(value);
    };

    const limpiarBusqueda = () => {
        setFiltro('');
        onFiltroChange('');
    };

    const manejarCambioCategoria = (e) => {
        const value = e.target.value;
        setCategoriaFiltro(value);
        onCategoriaChange(value);
    };

    const limpiarFiltros = () => {
        setFiltro('');
        setCategoriaFiltro('');
        onFiltroChange('');
        onCategoriaChange('');
        // NOTA: NO modificamos soloActivos aquí
    };

    const manejarSoloActivosToggle = () => {
        const newValue = !soloActivos;
        setSoloActivos(newValue);
        onSoloActivosChange(newValue);
    };

    // Determinar si mostrar el botón de limpiar filtros
    const mostrarBotonLimpiar = filtro || categoriaFiltro;

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white px-1 p-1 rounded-lg shadow-sm border border-gray-200"
        >
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Filtro de búsqueda con botón X */}
                    <div className="flex items-center gap-2 relative">
                        <label className="text-sm text-gray-500 font-medium">
                            Buscar:
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={filtro}
                                onChange={manejarCambioBusqueda}
                                placeholder="Código, nombre o precio..."
                                className="px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                            />

                            {/* Botón X para limpiar búsqueda */}
                            {filtro && (
                                <button
                                    type="button"
                                    onClick={limpiarBusqueda}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filtro por Categoría */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500 font-medium">
                            Filtrar por:
                        </label>
                        <select
                            value={categoriaFiltro}
                            onChange={manejarCambioCategoria}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Categorías</option>
                            {categoriasUnicas.map((categoria) => (
                                <option key={categoria.id} value={categoria.id}>
                                    {categoria.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón limpiar filtros (solo aparece para filtro y categoría) */}
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

                {/* Contador de resultados y switch */}
                <div className="text-xs text-gray-600 flex flex-col gap-1">
                    {/* Texto principal arriba */}
                    <span className="font-semibold">
                        Mostrando: {productos.length} productos
                    </span>

                    {/* Switch Solo activos - INDEPENDIENTE de otros filtros */}
                    <label className="flex items-center gap-1 cursor-pointer text-xs">
                        <input
                            type="checkbox"
                            checked={soloActivos}
                            onChange={manejarSoloActivosToggle}
                            className="sr-only"
                        />

                        <div
                            className={`w-8 h-4 rounded-full relative transition-colors duration-200
                                ${soloActivos ? 'bg-green-500' : 'bg-gray-400'}`}
                        >
                            <div
                                className={`absolute top-[2px] left-[2px] w-3 h-3 bg-white rounded-full transition-all duration-200
                                    ${soloActivos ? 'translate-x-4' : ''}`}
                            ></div>
                        </div>

                        <span>Solo activos</span>
                    </label>
                </div>
            </div>
        </motion.div>
    );
};

export default FiltroProductos;