// components/ModalAgregarStock.jsx
'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ModalAgregarStock({
    abierto,
    onCerrar,
    onAgregarStock,
    sucursalActual,
    loading
}) {
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [carrito, setCarrito] = useState([]);
    const [formProducto, setFormProducto] = useState({
        cantidad: 1,
        observaciones: ""
    });
    const [creando, setCreando] = useState(false);

    // Estados para paginación/infinite scroll
    const [productosVisibles, setProductosVisibles] = useState([]);
    const [displayCount, setDisplayCount] = useState(10);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const loadMoreTriggerRef = useRef(null);

    // Estado para productos con stock actual
    const [productos, setProductos] = useState([]);
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [stocksProductos, setStocksProductos] = useState({});

    // Cargar productos activos y su stock actual
    useEffect(() => {
        if (abierto && sucursalActual) {
            cargarProductosConStock();
        }
    }, [abierto, sucursalActual]);

    const cargarProductosConStock = async () => {
        setCargandoProductos(true);
        try {
            // Cargar productos activos
            const { data: productosData, error: productosError } = await supabase
                .from('productos')
                .select('id, codigo, nombre, precio, costo, categoria_id, categorias(nombre)')
                .eq('activo', true)
                .order('nombre');

            if (productosError) throw productosError;

            // Cargar stock actual para cada producto en la sucursal actual
            const { data: stockData, error: stockError } = await supabase
                .from('productos_stock')
                .select('producto_id, stock_actual')
                .eq('sucursal_id', sucursalActual?.id);

            if (stockError) throw stockError;

            // Crear mapa de stock
            const stockMap = {};
            stockData?.forEach(item => {
                stockMap[item.producto_id] = item.stock_actual;
            });

            // Combinar productos con su stock
            const productosConStock = productosData.map(producto => ({
                ...producto,
                stock_actual: stockMap[producto.id] || 0
            }));

            setStocksProductos(stockMap);
            setProductos(productosConStock);
        } catch (error) {
            console.error('Error cargando productos:', error);
            toast.error('Error al cargar los productos');
        } finally {
            setCargandoProductos(false);
        }
    };

    // Filtrar productos en tiempo real
    const productosFiltrados = useMemo(() => {
        return productos.filter(producto =>
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.codigo.toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [productos, busqueda]);

    // Infinite scroll - cargar más productos
    const loadMoreProducts = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;
        setIsLoadingMore(true);
        await new Promise(resolve => setTimeout(resolve, 100));
        setDisplayCount(prev => Math.min(prev + 10, productosFiltrados.length));
        setIsLoadingMore(false);
    }, [isLoadingMore, hasMore, productosFiltrados.length]);

    // Actualizar productos visibles
    useEffect(() => {
        setDisplayCount(10);
        setHasMore(true);
        setProductosVisibles(productosFiltrados.slice(0, 10));
    }, [productosFiltrados]);

    useEffect(() => {
        const nuevosVisibles = productosFiltrados.slice(0, displayCount);
        setProductosVisibles(nuevosVisibles);
        setHasMore(displayCount < productosFiltrados.length);
    }, [productosFiltrados, displayCount]);

    // Observer para infinite scroll
    useEffect(() => {
        if (!loadMoreTriggerRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !productoSeleccionado) {
                    loadMoreProducts();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );
        observer.observe(loadMoreTriggerRef.current);
        return () => {
            if (loadMoreTriggerRef.current) {
                observer.unobserve(loadMoreTriggerRef.current);
            }
        };
    }, [hasMore, isLoadingMore, loadMoreProducts, productoSeleccionado]);

    // Resetear formulario al abrir/cerrar
    useEffect(() => {
        if (abierto) {
            setBusqueda("");
            setProductoSeleccionado(null);
            setCarrito([]);
            setFormProducto({
                cantidad: 1,
                observaciones: ""
            });
        }
    }, [abierto]);

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setFormProducto({
            cantidad: 1,
            observaciones: ""
        });
    };

    const handleAgregarAlCarrito = () => {
        if (!productoSeleccionado) return;

        const cantidad = parseInt(formProducto.cantidad) || 1;

        const itemCarrito = {
            id: Date.now(),
            producto_id: productoSeleccionado.id,
            producto: productoSeleccionado,
            cantidad: cantidad,
            stock_actual: productoSeleccionado.stock_actual,
            observaciones: formProducto.observaciones
        };

        setCarrito(prev => [...prev, itemCarrito]);
        setProductoSeleccionado(null);
        setFormProducto({
            cantidad: 1,
            observaciones: ""
        });
        setBusqueda("");
        toast.success(`${productoSeleccionado.nombre} agregado al carrito`);
    };

    const handleEliminarDelCarrito = (itemId) => {
        setCarrito(prev => prev.filter(item => item.id !== itemId));
        toast.success("Producto eliminado del carrito");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (carrito.length === 0) {
            toast.error("Debe agregar al menos un producto al carrito");
            return;
        }

        setCreando(true);
        let exitosos = 0;
        let errores = 0;

        try {
            for (const item of carrito) {
                const result = await onAgregarStock({
                    producto: item.producto,
                    cantidad: item.cantidad,
                    observaciones: item.observaciones || `Aumento de stock - Lote de ${carrito.length} productos`
                });

                if (result.success) {
                    exitosos++;
                } else {
                    errores++;
                    console.error(`Error al agregar stock para ${item.producto.nombre}:`, result.error);
                }
            }

            if (exitosos > 0) {
                toast.success(`${exitosos} producto(s) actualizado(s) correctamente`);
            }
            if (errores > 0) {
                toast.error(`${errores} producto(s) fallaron al actualizar`);
            }

            if (exitosos > 0) {
                onCerrar();
            }
        } catch (err) {
            toast.error("Error al procesar los aumentos de stock");
        } finally {
            setCreando(false);
        }
    };

    const handleChangeForm = (e) => {
        const { name, value } = e.target;
        setFormProducto(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalProductos = carrito.length;

    if (!abierto) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
            <div className="bg-white rounded-lg max-w-6xl w-full min-h-[90vh] max-h-[90vh] overflow-hidden flex">

                {/* Lado Izquierdo - Búsqueda y Selección de Productos */}
                <div className="w-1/2 bg-emerald-50 border-r border-gray-200 flex flex-col">
                    <div className="p-3 pb-1 border-b border-gray-50">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-xl font-bold text-gray-900">Aumento de Stock por Lotes</h2>
                        </div>

                        {/* Info de sucursal */}
                        <div className="bg-stone-100 p-3 rounded-md mb-2">
                            <div className="flex items-center gap-4">
                                <p className="inline-flex items-center gap-2 text-sm border-l-[3px] border-emerald-400 bg-emerald-50 px-3 py-1 rounded-r-lg">
                                    <span className="font-semibold text-emerald-700">Sucursal</span>
                                    <span className="text-emerald-300">/</span>
                                    <span className="font-medium text-emerald-900">{sucursalActual?.nombre}</span>
                                </p>
                            </div>
                        </div>

                        <div className="relative w-full mb-1 flex items-center gap-3">
                            <span>Buscar: </span>
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full ring-1 ring-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {busqueda && (
                                <button
                                    onClick={() => setBusqueda("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xl cursor-pointer hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista de Productos */}
                    {!productoSeleccionado && (
                        <div className="flex-1 overflow-y-auto p-2 pt-1">
                            {cargandoProductos ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                </div>
                            ) : productosFiltrados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3">
                                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                        <rect x="8" y="14" width="32" height="26" rx="4" stroke="#93c5fd" strokeWidth="2" fill="#eff6ff" />
                                        <path d="M16 14v-2a8 8 0 0116 0v2" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
                                        <path d="M18 26h12M18 32h7" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <p className="text-sm font-medium text-slate-500">Sin resultados</p>
                                    <p className="text-xs text-slate-400">Intenta con otro nombre o código</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {productosVisibles.map((producto) => (
                                        <div
                                            key={producto.id}
                                            onClick={() => handleSeleccionarProducto(producto)}
                                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${productoSeleccionado?.id === producto.id
                                                    ? 'bg-emerald-50 border-emerald-300'
                                                    : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-5 group">
                                                <div className="flex-1 text-left">
                                                    <div className="relative w-full h-6 overflow-hidden">
                                                        <h3 className="absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900 transition-none group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear group-hover:-translate-x-full">
                                                            {producto.nombre}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Código: {producto.codigo}</p>
                                                    <p className="text-sm text-gray-600">Categoría: {producto.categorias?.nombre}</p>
                                                    <p className="text-sm font-medium text-emerald-600">
                                                        Stock actual: {producto.stock_actual} unidades
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">Bs. {producto.precio?.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Trigger para infinite scroll */}
                                    {hasMore && !productoSeleccionado && (
                                        <div ref={loadMoreTriggerRef} className="py-4 flex justify-center items-center">
                                            {isLoadingMore ? (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin" />
                                                    <span className="text-sm">Cargando más productos...</span>
                                                </div>
                                            ) : (
                                                <div className="h-8" />
                                            )}
                                        </div>
                                    )}

                                    {!hasMore && productosFiltrados.length > 10 && (
                                        <div className="py-4 text-center">
                                            <p className="text-xs text-gray-500">
                                                Mostrando {productosFiltrados.length} de {productosFiltrados.length} productos
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Formulario para producto seleccionado */}
                    <AnimatePresence>
                        {productoSeleccionado && (
                            <motion.div
                                key={productoSeleccionado.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="border-t border-gray-200 mb-1 min-h-[100vh] max-h-[100vh] items-start p-3 bg-stone-50"
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-emerald-600 text-sm">
                                        PRODUCTO SELECCIONADO:
                                    </h3>
                                    <span
                                        className="w-10 cursor-pointer text-2xl text-center text-red-500 font-bold hover:text-red-700"
                                        onClick={() => setProductoSeleccionado(null)}
                                    >
                                        X
                                    </span>
                                </div>

                                <div className="flex bg-emerald-50 mb-1 ring-1 ring-emerald-300 rounded-lg p-2 items-start group gap-5">
                                    <div className="flex-1 text-left">
                                        <div className="relative w-full h-6 overflow-hidden">
                                            <h3 className="absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900 transition-none group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear group-hover:-translate-x-full">
                                                {productoSeleccionado.nombre}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600">Código: {productoSeleccionado.codigo}</p>
                                        <p className="text-sm text-gray-600">Categoría: {productoSeleccionado.categorias?.nombre}</p>
                                        <p className="text-sm font-medium text-emerald-600">
                                            Stock actual: {productoSeleccionado.stock_actual} unidades
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">Bs. {productoSeleccionado.precio?.toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="mb-1">
                                    <div className="flex gap-4">
                                        <div className="flex-2">
                                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                Cantidad a aumentar *
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    name="cantidad"
                                                    value={formProducto.cantidad}
                                                    onChange={handleChangeForm}
                                                    pattern="[0-9]*"
                                                    inputMode="numeric"
                                                    min="1"
                                                    required
                                                    className="w-full ring-1 ring-emerald-300 bg-emerald-50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                    onKeyPress={(e) => {
                                                        const charCode = e.which ? e.which : e.keyCode;
                                                        if (charCode < 48 || charCode > 57) {
                                                            e.preventDefault();
                                                            return false;
                                                        }
                                                        return true;
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleChangeForm({
                                                        target: { name: "cantidad", value: Math.max(1, parseInt(formProducto.cantidad) - 1) }
                                                    })}
                                                    className="px-6 py-2 cursor-pointer bg-gray-200 rounded-md text-lg font-bold hover:bg-gray-300"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleChangeForm({
                                                        target: { name: "cantidad", value: parseInt(formProducto.cantidad) + 1 }
                                                    })}
                                                    className="px-6 py-2 cursor-pointer bg-gray-200 rounded-md text-lg font-bold hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="py-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Observaciones (Opcional)
                                        </label>
                                        <textarea
                                            name="observaciones"
                                            value={formProducto.observaciones}
                                            onChange={handleChangeForm}
                                            rows={2}
                                            className="w-full ring-1 ring-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Motivo del aumento de stock..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleAgregarAlCarrito}
                                        className="w-full py-2 px-4 rounded-md font-semibold transition-colors bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white"
                                    >
                                        Agregar al Carrito
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Lado Derecho - Carrito de Aumentos */}
                <div className="w-1/2 flex flex-col">
                    <div className="p-2 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Carrito de Aumentos</h3>
                        <p className="text-sm text-emerald-600">
                            {totalProductos} producto(s) | {totalItems} unidad(es)
                        </p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 overflow-y-auto p-2 bg-white"
                    >
                        {carrito.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <p>No hay productos en el carrito</p>
                                <p className="text-sm">Selecciona productos del lado izquierdo</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {[...carrito].reverse().map((item) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -40 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="ring ring-gray-200 rounded-lg px-3 py-2 bg-emerald-50 group"
                                        >
                                            <div className="flex justify-between items-start mb-2 gap-5">
                                                <div className="flex-1">
                                                    <div className="relative w-full h-6 overflow-hidden">
                                                        <h3 className="absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900 transition-none group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear group-hover:-translate-x-full">
                                                            {item.producto.nombre}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Código: {item.producto.codigo}</p>
                                                    <p className="text-sm text-gray-600">Categoría: {item.producto.categorias?.nombre}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleEliminarDelCarrito(item.id)}
                                                    className="cursor-pointer bg-red-50 px-2 rounded-full text-red-600 hover:text-red-800 text-sm font-semibold"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p><strong>Cantidad a aumentar:</strong> {item.cantidad} unidades</p>
                                                </div>
                                                <div>
                                                    <p className="text-emerald-700">
                                                        <strong>Stock actual:</strong> {item.stock_actual} unidades
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Mostrar nuevo stock después del aumento */}
                                            <div className="mt-1 pt-1 border-t border-gray-200">
                                                <p className="text-sm font-medium text-emerald-600">
                                                    Nuevo stock: {item.stock_actual + item.cantidad} unidades
                                                    <span className="text-xs text-gray-500 ml-2">(+{item.cantidad})</span>
                                                </p>
                                            </div>

                                            {item.observaciones && (
                                                <div className="mt-1 pt-1 border-t border-gray-200">
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <strong>Observaciones:</strong> {item.observaciones}
                                                    </p>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </motion.div>

                    {/* Resumen y Botones */}
                    <div className="ring-1 ring-gray-300 p-4 bg-gray-100 rounded-md">
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span>Total productos a aumentar:</span>
                                <span className="font-semibold">{totalProductos}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Total unidades:</span>
                                <span className="font-semibold">{totalItems}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onCerrar}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 cursor-pointer text-gray-800 py-3 px-4 rounded-md transition-colors font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={creando || carrito.length === 0}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white py-3 px-4 rounded-md transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creando ? "Procesando..." : `Realizar Aumentos (${totalProductos})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}