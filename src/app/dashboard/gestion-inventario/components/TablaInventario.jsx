// src/app/dashboard/gestion-inventario/components/TablaInventario.jsx

'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export default function TablaInventario({
    productos,
    conteos,
    loading,
    saving,
    sucursalId,
    onGuardarConteo
}) {
    const [fechaGlobal, setFechaGlobal] = useState(new Date().toISOString().split('T')[0]);
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [busquedaTexto, setBusquedaTexto] = useState('');
    const [categorias, setCategorias] = useState([]);

    const [titulosColumnas, setTitulosColumnas] = useState({
        col1: '',
        col2: '',
        col3: '',
        col4: '',
        col5: '',
        col6: '',
        col7: ''
    });

    const inputRefs = useRef({});
    const tituloInputRefs = useRef({});
    const tableContainerRef = useRef(null);
    const [tableHeight, setTableHeight] = useState('calc(100vh - 380px)');
    const columnas = ['col1', 'col2', 'col3', 'col4', 'col5', 'col6', 'col7'];
    const tituloDebounceRef = useRef({});

    // Verificar si hay filtros activos
    const hayFiltrosActivos = filtroCategoria !== '' || busquedaTexto.trim() !== '';

    // Función para limpiar todos los filtros
    const limpiarFiltros = () => {
        setFiltroCategoria('');
        setBusquedaTexto('');
    };

    // Cargar títulos desde el primer producto que tenga datos
    useEffect(() => {
        if (productos.length > 0 && Object.keys(conteos).length > 0) {
            for (const productoId in conteos) {
                const conteo = conteos[productoId];
                const tieneTitulos = columnas.some(col => conteo[`titulo_${col}`]);
                if (tieneTitulos) {
                    const nuevosTitulos = {};
                    columnas.forEach(col => {
                        nuevosTitulos[col] = conteo[`titulo_${col}`] || '';
                    });
                    setTitulosColumnas(nuevosTitulos);
                    break;
                }
            }
        }
    }, [conteos, productos]);

    useEffect(() => {
        const cargarCategorias = async () => {
            try {
                const { data, error } = await supabase
                    .from('categorias')
                    .select('id, nombre')
                    .eq('activo', true)
                    .order('nombre');

                if (error) throw error;
                if (data) setCategorias(data);
            } catch (error) {
                console.error('Error cargando categorías:', error);
            }
        };

        cargarCategorias();

        const updateHeight = () => {
            const viewportHeight = window.innerHeight;
            const headerOffset = 120;
            setTableHeight(`${viewportHeight - headerOffset}px`);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    // Filtrar productos por categoría y búsqueda en tiempo real
    const productosFiltrados = productos.filter(producto => {
        // Filtro por categoría
        if (filtroCategoria && producto.categoria !== filtroCategoria) {
            return false;
        }

        // Filtro por búsqueda en tiempo real (código, nombre o categoría)
        if (busquedaTexto.trim() !== '') {
            const textoBusqueda = busquedaTexto.toLowerCase().trim();
            return (
                producto.codigo?.toLowerCase().includes(textoBusqueda) ||
                producto.nombre?.toLowerCase().includes(textoBusqueda) ||
                producto.categoria?.toLowerCase().includes(textoBusqueda)
            );
        }

        return true;
    });

    // Guardar valor del input (celda)
    const handleInputChange = (productoId, columnaKey, valor) => {
        onGuardarConteo(sucursalId, productoId, columnaKey, valor, fechaGlobal);
    };

    // Guardar título de columna
    const handleTituloChange = (columnaKey, nuevoTitulo) => {
        setTitulosColumnas(prev => ({
            ...prev,
            [columnaKey]: nuevoTitulo
        }));

        if (productos.length > 0) {
            const primerProductoId = productos[0].id;

            if (tituloDebounceRef.current[columnaKey]) {
                clearTimeout(tituloDebounceRef.current[columnaKey]);
            }

            tituloDebounceRef.current[columnaKey] = setTimeout(() => {
                onGuardarConteo(sucursalId, primerProductoId, `titulo_${columnaKey}`, nuevoTitulo, fechaGlobal);
                delete tituloDebounceRef.current[columnaKey];
            }, 800);
        }
    };

    // Navegación mejorada con teclado
    const handleKeyDown = (e, productoId, columnaIndex, rowIndex) => {
        const key = e.key;

        // Prevenir scroll por defecto con las flechas
        if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
            e.preventDefault();
        }

        // Flecha derecha: mover a la siguiente columna
        if (key === 'ArrowRight') {
            if (columnaIndex + 1 < columnas.length) {
                const nextKey = `${productoId}_${columnas[columnaIndex + 1]}`;
                if (inputRefs.current[nextKey]) {
                    inputRefs.current[nextKey].focus();
                    inputRefs.current[nextKey].select();
                }
            } else if (rowIndex + 1 < productosFiltrados.length) {
                // Ir a la primera columna de la siguiente fila
                const nextRow = productosFiltrados[rowIndex + 1];
                const firstColKey = `${nextRow.id}_${columnas[0]}`;
                if (inputRefs.current[firstColKey]) {
                    inputRefs.current[firstColKey].focus();
                    inputRefs.current[firstColKey].select();
                }
            }
        }

        // Flecha izquierda: mover a la columna anterior
        else if (key === 'ArrowLeft') {
            if (columnaIndex - 1 >= 0) {
                const prevKey = `${productoId}_${columnas[columnaIndex - 1]}`;
                if (inputRefs.current[prevKey]) {
                    inputRefs.current[prevKey].focus();
                    inputRefs.current[prevKey].select();
                }
            } else if (rowIndex - 1 >= 0) {
                // Ir a la última columna de la fila anterior
                const prevRow = productosFiltrados[rowIndex - 1];
                const lastColKey = `${prevRow.id}_${columnas[columnas.length - 1]}`;
                if (inputRefs.current[lastColKey]) {
                    inputRefs.current[lastColKey].focus();
                    inputRefs.current[lastColKey].select();
                }
            }
        }

        // Flecha abajo: mover a la misma columna en la siguiente fila
        else if (key === 'ArrowDown') {
            if (rowIndex + 1 < productosFiltrados.length) {
                const nextRow = productosFiltrados[rowIndex + 1];
                const downKey = `${nextRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[downKey]) {
                    inputRefs.current[downKey].focus();
                    inputRefs.current[downKey].select();
                }
            }
        }

        // Flecha arriba: mover a la misma columna en la fila anterior
        else if (key === 'ArrowUp') {
            if (rowIndex - 1 >= 0) {
                const prevRow = productosFiltrados[rowIndex - 1];
                const upKey = `${prevRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[upKey]) {
                    inputRefs.current[upKey].focus();
                    inputRefs.current[upKey].select();
                }
            } else {
                // Si estamos en la primera fila, mover al título de la columna
                const tituloKey = `titulo_${columnas[columnaIndex]}`;
                if (tituloInputRefs.current[tituloKey]) {
                    tituloInputRefs.current[tituloKey].focus();
                    tituloInputRefs.current[tituloKey].select();
                }
            }
        }

        // Enter: mover a la misma columna en la siguiente fila
        else if (key === 'Enter') {
            if (rowIndex + 1 < productosFiltrados.length) {
                const nextRow = productosFiltrados[rowIndex + 1];
                const downKey = `${nextRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[downKey]) {
                    inputRefs.current[downKey].focus();
                    inputRefs.current[downKey].select();
                }
            }
        }

        // Tab: comportamiento normal
        else if (key === 'Tab') {
            // Dejar que el navegador maneje el tab
            return;
        }
    };

    // Navegación para los títulos
    const handleTituloKeyDown = (e, columnaIndex) => {
        const key = e.key;

        if (key === 'ArrowRight' && columnaIndex + 1 < columnas.length) {
            e.preventDefault();
            const nextKey = `titulo_${columnas[columnaIndex + 1]}`;
            if (tituloInputRefs.current[nextKey]) {
                tituloInputRefs.current[nextKey].focus();
                tituloInputRefs.current[nextKey].select();
            }
        }
        else if (key === 'ArrowLeft' && columnaIndex - 1 >= 0) {
            e.preventDefault();
            const prevKey = `titulo_${columnas[columnaIndex - 1]}`;
            if (tituloInputRefs.current[prevKey]) {
                tituloInputRefs.current[prevKey].focus();
                tituloInputRefs.current[prevKey].select();
            }
        }
        else if (key === 'ArrowDown' && productosFiltrados.length > 0) {
            e.preventDefault();
            const firstRow = productosFiltrados[0];
            const downKey = `${firstRow.id}_${columnas[columnaIndex]}`;
            if (inputRefs.current[downKey]) {
                inputRefs.current[downKey].focus();
                inputRefs.current[downKey].select();
            }
        }
        else if (key === 'Enter') {
            e.preventDefault();
            if (productosFiltrados.length > 0) {
                const firstRow = productosFiltrados[0];
                const downKey = `${firstRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[downKey]) {
                    inputRefs.current[downKey].focus();
                    inputRefs.current[downKey].select();
                }
            }
        }
    };

    if (loading && productos.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando productos...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
            {/* Filtros */}
            <div className="p-2 bg-linear-to-r from-gray-50 to-gray-100 border-b shrink-0">
                <div className="flex flex-wrap gap-2 items-end justify-between">
                    <div className="flex flex-wrap gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Fecha actual del sistema
                            </label>
                            <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 text-sm">
                                {new Date().toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Filtrar por Categoría
                            </label>
                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[180px] focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            >
                                <option value="">Todas las categorías</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Buscar producto
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busquedaTexto}
                                    onChange={(e) => setBusquedaTexto(e.target.value)}
                                    placeholder="Buscar por código, nombre o categoría..."
                                    className="w-full min-w-[250px] px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                    autoComplete="off"
                                />
                                <svg
                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {busquedaTexto && (
                                    <button
                                        onClick={() => setBusquedaTexto('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Botón Quitar Filtros - Solo aparece cuando hay filtros activos */}
                        {hayFiltrosActivos && (
                            <div className="flex items-end">
                                <button
                                    onClick={limpiarFiltros}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Quitar filtros
                                </button>
                            </div>
                        )}

                        {/* Indicador de guardado */}
                        {Object.keys(saving).length > 0 && (
                            <div className="flex items-end">
                                <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                                    Guardando cambios...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-gray-500">
                        Mostrando {productosFiltrados.length} de {productos.length} productos
                    </div>
                </div>

            </div>

            {/* Tabla */}
            <div
                ref={tableContainerRef}
                className="overflow-auto relative"
                style={{ height: tableHeight }}
            >
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[5px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                #
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[60px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                Código
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                Producto
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[60px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                Precio
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[10px] bg-blue-50 border-r border-gray-200" rowSpan="2">
                                Stock Actual
                            </th>
                            {columnas.map((col, idx) => (
                                <th key={col} className="px-2 py-2 text-center bg-purple-50">
                                    <input
                                        ref={el => tituloInputRefs.current[`titulo_${col}`] = el}
                                        type="text"
                                        value={titulosColumnas[col]}
                                        onChange={(e) => handleTituloChange(col, e.target.value)}
                                        onKeyDown={(e) => handleTituloKeyDown(e, idx)}
                                        placeholder={`Fecha ${idx + 1}`}
                                        className="w-full min-w-[100px] px-2 py-1 text-center text-sm font-bold text-purple-700 bg-transparent border-b-2 border-gray-300 focus:border-purple-600 focus:outline-none transition-colors"
                                    />
                                </th>
                            ))}
                        </tr>
                        <tr className="bg-purple-50">
                            {columnas.map((col) => (
                                <th key={`sub-${col}`} className="px-2 py-1 text-center text-xs text-purple-500">
                                    Conteo
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {productosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan={4 + columnas.length} className="px-4 py-8 text-center text-gray-500">
                                    {hayFiltrosActivos ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <p className="font-medium text-gray-700">No se encontraron productos</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Intenta con otros criterios de búsqueda
                                                </p>
                                            </div>
                                            <button
                                                onClick={limpiarFiltros}
                                                className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Quitar filtros
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <p>No hay productos para mostrar</p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            productosFiltrados.map((producto, idx) => (
                                <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-3 py-2 whitespace-nowrap font-bold text-sm text-center text-zinc-500 border-r border-gray-200">
                                        {idx + 1}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-medium text-gray-900 border-r border-gray-200">
                                        {producto.codigo}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200">
                                        <div className="font-medium">{producto.nombre}</div>
                                        <div className="text-xs text-amber-600">{producto.categoria}</div>
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-semibold text-gray-900 border-r border-gray-200">
                                        Bs. {producto.precio}
                                    </td>
                                    <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-bold text-blue-600 border-r border-gray-200">
                                        {producto.stock_actual?.toLocaleString() || 0}
                                    </td>
                                    {columnas.map((col, colIdx) => {
                                        const inputKey = `${producto.id}_${col}`;
                                        const valor = conteos[producto.id]?.[col] || '';
                                        const isSaving = saving[`${producto.id}_${col}`];

                                        return (
                                            <td key={col} className="px-2 py-2 text-center">
                                                <div className="relative">
                                                    <input
                                                        ref={el => inputRefs.current[inputKey] = el}
                                                        type="text"
                                                        value={valor}
                                                        onChange={(e) => handleInputChange(producto.id, col, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, producto.id, colIdx, idx)}
                                                        placeholder={titulosColumnas[col] || `Conteo ${colIdx + 1}`}
                                                        className={`
                                                            w-full min-w-[100px] px-2 py-1 text-center text-sm 
                                                            border rounded transition-all
                                                            ${isSaving
                                                                ? 'bg-yellow-50 border-yellow-400'
                                                                : valor
                                                                    ? 'bg-green-50 border-green-400'
                                                                    : 'border-gray-300'
                                                            }
                                                            focus:ring-2 focus:ring-sky-200 focus:border-purple-500 focus:outline-none
                                                        `}
                                                    />
                                                    {isSaving && (
                                                        <div className="absolute -top-1 -right-1">
                                                            <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}