// src/app/dashboard/gestion-inventario/components/TablaInventario.jsx

'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

export default function TablaInventario({
    productos: productosProp,
    conteos: conteosProp,
    loading,
    saving,
    sucursalId,
    onGuardarConteo,
    onCambiarFecha
}) {
    // Estado local para fecha
    const [fechaGlobal, setFechaGlobal] = useState(new Date().toISOString().split('T')[0]);
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [busquedaTexto, setBusquedaTexto] = useState('');
    const [categorias, setCategorias] = useState([]);

    // Estado local para conteos (sincronizado con props)
    const [conteosLocales, setConteosLocales] = useState({});
    const [titulosLocales, setTitulosLocales] = useState({});

    // Estado para indicador de guardado
    const [cambiosPendientes, setCambiosPendientes] = useState(0);

    // Timeouts para debounce
    const debounceTimeouts = useRef({});
    const tituloDebounceRef = useRef({});

    // Paginación virtual
    const [visibleCount, setVisibleCount] = useState(20);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const loadMoreRef = useRef(null);
    const tableContainerRef = useRef(null);

    // Ahora solo 4 columnas
    const [titulosColumnas, setTitulosColumnas] = useState({
        col1: '',
        col2: '',
        col3: '',
        col4: ''
    });

    const inputRefs = useRef({});
    const tituloInputRefs = useRef({});
    const columnas = ['col1', 'col2', 'col3', 'col4'];

    // Sincronizar conteos locales con props
    useEffect(() => {
        if (conteosProp && Object.keys(conteosProp).length > 0) {
            setConteosLocales(prev => ({
                ...prev,
                ...conteosProp
            }));
        } else {
            // Si no hay conteos, limpiar
            setConteosLocales({});
        }
    }, [conteosProp]);

    // Sincronizar títulos locales
    useEffect(() => {
        setTitulosLocales(titulosColumnas);
    }, [titulosColumnas]);

    // Verificar si hay filtros activos
    const hayFiltrosActivos = filtroCategoria !== '' || busquedaTexto.trim() !== '';

    // Función para limpiar todos los filtros
    const limpiarFiltros = () => {
        setFiltroCategoria('');
        setBusquedaTexto('');
        setVisibleCount(20);
    };

    // Filtrar productos por categoría y búsqueda
    const productosFiltrados = useMemo(() => {
        let filtrados = productosProp.filter(producto => {
            if (filtroCategoria && producto.categoria !== filtroCategoria) return false;
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
        return filtrados;
    }, [productosProp, filtroCategoria, busquedaTexto]);

    // Productos visibles (solo los primeros 'visibleCount')
    const productosVisibles = useMemo(() => {
        return productosFiltrados.slice(0, visibleCount);
    }, [productosFiltrados, visibleCount]);

    // Función para descargar datos a Excel
    const descargarExcel = () => {
        try {
            const datosExcel = [];
            const encabezados = [
                '#',
                'Código',
                'Producto',
                'Categoría',
                'Precio (Bs.)',
                'Stock Actual'
            ];

            columnas.forEach((col, idx) => {
                const titulo = titulosLocales[col] || titulosColumnas[col] || `Conteo ${idx + 1}`;
                encabezados.push(titulo);
            });

            datosExcel.push(encabezados);

            productosFiltrados.forEach((producto, idx) => {
                const fila = [
                    idx + 1,
                    producto.codigo || '',
                    producto.nombre || '',
                    producto.categoria || '',
                    producto.precio || 0,
                    producto.stock_actual || 0
                ];

                columnas.forEach((col) => {
                    const valor = conteosLocales[producto.id]?.[col] || '';
                    fila.push(valor);
                });

                datosExcel.push(fila);
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(datosExcel);

            const colWidths = [
                { wch: 6 }, { wch: 15 }, { wch: 30 },
                { wch: 20 }, { wch: 12 }, { wch: 12 }
            ];
            columnas.forEach(() => colWidths.push({ wch: 15 }));
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Inventario_Fisico');

            const ahora = new Date();
            const año = ahora.getFullYear();
            const mes = String(ahora.getMonth() + 1).padStart(2, '0');
            const dia = String(ahora.getDate()).padStart(2, '0');
            const fechaActual = `${año}-${mes}-${dia}`;

            const nombreSucursal = localStorage.getItem('sucursalSeleccionada')
                ? JSON.parse(localStorage.getItem('sucursalSeleccionada')).nombre
                : 'sucursal';
            const nombreArchivo = `inventario_fisico_${nombreSucursal}_${fechaActual}.xlsx`;

            XLSX.writeFile(wb, nombreArchivo);
        } catch (error) {
            console.error('Error al generar Excel:', error);
            mostrarNotificacionTemporal('Error al generar Excel', 'error');
        }
    };

    // Notificación temporal discreta
    const mostrarNotificacionTemporal = (mensaje, tipo = 'success') => {
        const notificacion = document.createElement('div');
        notificacion.className = `fixed bottom-4 right-4 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg transition-all duration-300 z-50 ${tipo === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateY(20px)';
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.style.opacity = '1';
            notificacion.style.transform = 'translateY(0)';
        }, 10);

        setTimeout(() => {
            notificacion.style.opacity = '0';
            notificacion.style.transform = 'translateY(20px)';
            setTimeout(() => notificacion.remove(), 300);
        }, 1500);
    };

    // Guardar valor con optimistic update y debounce
    const handleInputChange = (productoId, columnaKey, valor) => {
        // Actualizar inmediatamente el estado local
        setConteosLocales(prev => ({
            ...prev,
            [productoId]: {
                ...(prev[productoId] || {}),
                [columnaKey]: valor
            }
        }));

        // Incrementar contador de cambios pendientes
        setCambiosPendientes(prev => prev + 1);

        // Limpiar timeout anterior
        if (debounceTimeouts.current[`${productoId}_${columnaKey}`]) {
            clearTimeout(debounceTimeouts.current[`${productoId}_${columnaKey}`]);
        }

        // Nuevo timeout para guardar
        debounceTimeouts.current[`${productoId}_${columnaKey}`] = setTimeout(async () => {
            await onGuardarConteo(sucursalId, productoId, columnaKey, valor, fechaGlobal);
            setCambiosPendientes(prev => Math.max(0, prev - 1));
            delete debounceTimeouts.current[`${productoId}_${columnaKey}`];
        }, 500);
    };

    // Guardar título de columna
    const handleTituloChange = (columnaKey, nuevoTitulo) => {
        setTitulosColumnas(prev => ({
            ...prev,
            [columnaKey]: nuevoTitulo
        }));

        setTitulosLocales(prev => ({
            ...prev,
            [columnaKey]: nuevoTitulo
        }));

        setCambiosPendientes(prev => prev + 1);

        if (tituloDebounceRef.current[columnaKey]) {
            clearTimeout(tituloDebounceRef.current[columnaKey]);
        }

        tituloDebounceRef.current[columnaKey] = setTimeout(async () => {
            if (productosProp.length > 0) {
                const primerProductoId = productosProp[0].id;
                await onGuardarConteo(sucursalId, primerProductoId, `titulo_${columnaKey}`, nuevoTitulo, fechaGlobal);
                setCambiosPendientes(prev => Math.max(0, prev - 1));
                delete tituloDebounceRef.current[columnaKey];
            }
        }, 800);
    };

    // Cargar más productos al hacer scroll
    const loadMoreProducts = useCallback(() => {
        if (visibleCount >= productosFiltrados.length) return;
        if (isLoadingMore) return;

        setIsLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 20, productosFiltrados.length));
            setIsLoadingMore(false);
        }, 100);
    }, [visibleCount, productosFiltrados.length, isLoadingMore]);

    // Observer para scroll infinito
    useEffect(() => {
        if (!loadMoreRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < productosFiltrados.length) {
                    loadMoreProducts();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        observer.observe(loadMoreRef.current);
        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [loadMoreProducts, visibleCount, productosFiltrados.length]);

    // Resetear paginación cuando cambian los filtros
    useEffect(() => {
        setVisibleCount(20);
    }, [filtroCategoria, busquedaTexto]);

    // Cargar títulos desde el primer producto
    useEffect(() => {
        if (productosProp.length > 0 && Object.keys(conteosProp).length > 0) {
            for (const productoId in conteosProp) {
                const conteo = conteosProp[productoId];
                const tieneTitulos = columnas.some(col => conteo[`titulo_${col}`]);
                if (tieneTitulos) {
                    const nuevosTitulos = {};
                    columnas.forEach(col => {
                        nuevosTitulos[col] = conteo[`titulo_${col}`] || '';
                    });
                    setTitulosColumnas(nuevosTitulos);
                    setTitulosLocales(nuevosTitulos);
                    break;
                }
            }
        }
    }, [conteosProp, productosProp]);

    // Cargar categorías
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
    }, []);

    // Manejar cambio de fecha
    const handleFechaChange = (nuevaFecha) => {
        setFechaGlobal(nuevaFecha);
        // Limpiar conteos locales antes de cargar nuevos
        setConteosLocales({});
        // Notificar al padre para que recargue
        if (onCambiarFecha) {
            onCambiarFecha(nuevaFecha);
        }
    };

    // Navegación con teclado
    const handleKeyDown = (e, productoId, columnaIndex, rowIndex) => {
        const key = e.key;

        if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Tab') {
            e.preventDefault();
        }

        if (key === 'ArrowRight') {
            if (columnaIndex + 1 < columnas.length) {
                const nextKey = `${productoId}_${columnas[columnaIndex + 1]}`;
                if (inputRefs.current[nextKey]) {
                    inputRefs.current[nextKey].focus();
                    inputRefs.current[nextKey].select();
                }
            } else if (rowIndex + 1 < productosVisibles.length) {
                const nextRow = productosVisibles[rowIndex + 1];
                const firstColKey = `${nextRow.id}_${columnas[0]}`;
                if (inputRefs.current[firstColKey]) {
                    inputRefs.current[firstColKey].focus();
                    inputRefs.current[firstColKey].select();
                }
            }
        } else if (key === 'ArrowLeft') {
            if (columnaIndex - 1 >= 0) {
                const prevKey = `${productoId}_${columnas[columnaIndex - 1]}`;
                if (inputRefs.current[prevKey]) {
                    inputRefs.current[prevKey].focus();
                    inputRefs.current[prevKey].select();
                }
            } else if (rowIndex - 1 >= 0) {
                const prevRow = productosVisibles[rowIndex - 1];
                const lastColKey = `${prevRow.id}_${columnas[columnas.length - 1]}`;
                if (inputRefs.current[lastColKey]) {
                    inputRefs.current[lastColKey].focus();
                    inputRefs.current[lastColKey].select();
                }
            }
        } else if (key === 'ArrowDown') {
            if (rowIndex + 1 < productosVisibles.length) {
                const nextRow = productosVisibles[rowIndex + 1];
                const downKey = `${nextRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[downKey]) {
                    inputRefs.current[downKey].focus();
                    inputRefs.current[downKey].select();
                }
            }
        } else if (key === 'ArrowUp') {
            if (rowIndex - 1 >= 0) {
                const prevRow = productosVisibles[rowIndex - 1];
                const upKey = `${prevRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[upKey]) {
                    inputRefs.current[upKey].focus();
                    inputRefs.current[upKey].select();
                }
            } else {
                const tituloKey = `titulo_${columnas[columnaIndex]}`;
                if (tituloInputRefs.current[tituloKey]) {
                    tituloInputRefs.current[tituloKey].focus();
                    tituloInputRefs.current[tituloKey].select();
                }
            }
        } else if (key === 'Enter') {
            if (rowIndex + 1 < productosVisibles.length) {
                const nextRow = productosVisibles[rowIndex + 1];
                const downKey = `${nextRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[downKey]) {
                    inputRefs.current[downKey].focus();
                    inputRefs.current[downKey].select();
                }
            }
        } else if (key === 'Tab') {
            if (rowIndex + 1 < productosVisibles.length) {
                const nextRow = productosVisibles[rowIndex + 1];
                const tabkey = `${nextRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[tabkey]) {
                    inputRefs.current[tabkey].focus();
                    inputRefs.current[tabkey].select();
                }
            }
        }
    };

    const handleTituloKeyDown = (e, columnaIndex) => {
        const key = e.key;

        if (key === 'ArrowRight' && columnaIndex + 1 < columnas.length) {
            e.preventDefault();
            const nextKey = `titulo_${columnas[columnaIndex + 1]}`;
            if (tituloInputRefs.current[nextKey]) {
                tituloInputRefs.current[nextKey].focus();
                tituloInputRefs.current[nextKey].select();
            }
        } else if (key === 'ArrowLeft' && columnaIndex - 1 >= 0) {
            e.preventDefault();
            const prevKey = `titulo_${columnas[columnaIndex - 1]}`;
            if (tituloInputRefs.current[prevKey]) {
                tituloInputRefs.current[prevKey].focus();
                tituloInputRefs.current[prevKey].select();
            }
        } else if (key === 'ArrowDown' && productosVisibles.length > 0) {
            e.preventDefault();
            const firstRow = productosVisibles[0];
            const downKey = `${firstRow.id}_${columnas[columnaIndex]}`;
            if (inputRefs.current[downKey]) {
                inputRefs.current[downKey].focus();
                inputRefs.current[downKey].select();
            }
        } else if (key === 'Enter') {
            e.preventDefault();
            if (productosVisibles.length > 0) {
                const firstRow = productosVisibles[0];
                const downKey = `${firstRow.id}_${columnas[columnaIndex]}`;
                if (inputRefs.current[downKey]) {
                    inputRefs.current[downKey].focus();
                    inputRefs.current[downKey].select();
                }
            }
        }
    };

    if (loading && productosProp.length === 0) {
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
            {/* Filtros */}
            <div className="p-2 py-1 bg-linear-to-r from-gray-50 to-gray-100 border-b shrink-0">
                <div className="flex flex-wrap gap-2 items-end justify-between">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Selector de fecha */}
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                Fecha de conteo
                            </label>
                            <input
                                type="date"
                                value={fechaGlobal}
                                onChange={(e) => handleFechaChange(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
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

                        <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                Buscar producto
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={busquedaTexto}
                                    onChange={(e) => setBusquedaTexto(e.target.value)}
                                    placeholder="Buscar por código, nombre..."
                                    className="w-full min-w-80 px-3 py-2 pl-9 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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

                        {hayFiltrosActivos && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-end"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={limpiarFiltros}
                                    className="px-4 py-2 cursor-pointer bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Quitar filtros
                                </motion.button>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Botón de descarga a Excel */}
                        <button
                            onClick={descargarExcel}
                            disabled={productosFiltrados.length === 0}
                            className={`
                                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 
                                flex items-center gap-2 shadow-sm hover:shadow-md
                                ${productosFiltrados.length === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }
                            `}
                        >
                            <svg
                                className="w-4 h-4" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            Descargar Excel
                        </button>

                        <div className="text-sm text-gray-500">
                            Mostrando {productosVisibles.length} de {productosFiltrados.length} productos
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla con scroll infinito */}
            <div
                ref={tableContainerRef}
                className="overflow-auto relative"
                style={{ height: 'calc(100vh - 100px)' }}
            >
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                            <th className="px-1 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-amber-100 border-r border-gray-200" rowSpan="2">
                                #
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[60px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                Código
                            </th>
                            <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[370px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                Producto
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[60px] bg-amber-100 border-r border-gray-200" rowSpan="2">
                                Precio
                            </th>
                            <th className="px-1 py-2 text-center text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[8px] bg-blue-50 border-r border-gray-200" rowSpan="2">
                                Stock Actual
                            </th>
                            {columnas.map((col, idx) => (
                                <th key={col} className="px-2 py-2 text-center bg-purple-50">
                                    <input
                                        ref={el => tituloInputRefs.current[`titulo_${col}`] = el}
                                        type="text"
                                        value={titulosColumnas[col] || ''}
                                        onChange={(e) => handleTituloChange(col, e.target.value)}
                                        onKeyDown={(e) => handleTituloKeyDown(e, idx)}
                                        placeholder={`Conteo ${idx + 1}`}
                                        className="w-full min-w-[60px] px-2 py-1 text-center text-sm font-bold text-purple-700 bg-transparent border-b-2 border-gray-300 focus:border-purple-600 focus:outline-none transition-colors"
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {productosVisibles.length === 0 ? (
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
                            <>
                                {productosVisibles.map((producto, idx) => {
                                    // Obtener conteos para este producto
                                    const conteosProducto = conteosLocales[producto.id] || {};

                                    return (
                                        <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-1 py-2 whitespace-nowrap font-bold text-sm text-center text-zinc-500 border-r border-gray-200 min-w-10">
                                                {idx + 1}
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-medium text-gray-900 border-r border-gray-200">
                                                {producto.codigo}
                                            </td>
                                            <td className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200 min-w-100">
                                                <div className="font-medium">{producto.nombre}</div>
                                                <div className="text-xs text-amber-600">{producto.categoria}</div>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-sm text-center font-semibold text-gray-900 border-r border-gray-200">
                                                Bs. {producto.precio}
                                            </td>
                                            <td className="px-1 py-2 whitespace-nowrap text-sm text-center font-bold text-blue-600 border-r border-gray-200 min-w-10">
                                                {producto.stock_actual?.toLocaleString() || 0}
                                            </td>
                                            {columnas.map((col, colIdx) => {
                                                const inputKey = `${producto.id}_${col}`;
                                                const valor = conteosProducto[col] || '';
                                                const isSaving = saving[`${producto.id}_${col}`];
                                                const tieneCambioPendiente = !!debounceTimeouts.current[`${producto.id}_${col}`];

                                                return (
                                                    <td key={col} className="px-1 py-2 text-center relative">
                                                        <input
                                                            ref={el => inputRefs.current[inputKey] = el}
                                                            type="text"
                                                            value={valor}
                                                            onChange={(e) => handleInputChange(producto.id, col, e.target.value)}
                                                            onKeyDown={(e) => handleKeyDown(e, producto.id, colIdx, idx)}
                                                            placeholder={titulosColumnas[col] || `Conteo ${colIdx + 1}`}
                                                            className={`
                                                                w-full min-w-20 px-1 py-1 text-center text-sm 
                                                                border rounded transition-all duration-200
                                                                ${tieneCambioPendiente
                                                                    ? 'bg-amber-50 border-amber-300'
                                                                    : valor
                                                                        ? 'bg-green-50 border-green-200'
                                                                        : 'border-gray-200 hover:border-gray-300'
                                                                }
                                                                focus:ring-2 focus:ring-purple-200 focus:border-purple-500 focus:outline-none
                                                            `}
                                                        />
                                                        {tieneCambioPendiente && (
                                                            <div className="absolute bottom-0 right-0 mb-1 mr-1">
                                                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                                                            </div>
                                                        )}
                                                        {!tieneCambioPendiente && valor && !isSaving && (
                                                            <div className="absolute bottom-0 right-0 mb-1 mr-1">
                                                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}

                                {/* Elemento observador para scroll infinito */}
                                {visibleCount < productosFiltrados.length && (
                                    <tr ref={loadMoreRef}>
                                        <td colSpan={4 + columnas.length} className="py-4 text-center">
                                            <div className="flex justify-center items-center gap-2 text-gray-500">
                                                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm">Cargando más productos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}