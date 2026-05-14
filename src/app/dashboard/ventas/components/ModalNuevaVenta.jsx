// src/app/dashboard/ventas/components/ModalNuevaVenta.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import toast from "react-hot-toast";
export default function ModalNuevaVenta({
    abierto,
    onCerrar,
    productos,
    onCreateVenta,
    currentUser,
    currentSucursal,
    onCreateMultiplesVentas,
    obtenerVendedores
}) {
    const [busqueda, setBusqueda] = useState("");
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [carrito, setCarrito] = useState([]);
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null); // <-- NUEVO ESTADO
    const [formProducto, setFormProducto] = useState({
        cantidad: 1,
        descuento_unitario: "0",
        observaciones: ""
    });
    const [vendedores, setVendedores] = useState([]);
    const [loadingVendedores, setLoadingVendedores] = useState(false);

    const [creando, setCreando] = useState(false);


    //para mostrar solo 10 productos en el modal y evitar saturar la interfaz, el resto se puede buscar con el filtro de búsqueda
    const [productosVisibles, setProductosVisibles] = useState([]);
    const [displayCount, setDisplayCount] = useState(10); // Mostrar inicialmente 10 productos
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const productosListRef = useRef(null);
    const loadMoreTriggerRef = useRef(null);


    // Filtrar productos en tiempo real - esto ya lo tienes
    const productosFiltrados = useMemo(() => {
        return productos.filter(producto =>
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.precio.toString().includes(busqueda)
        );
    }, [productos, busqueda]);


    const loadMoreProducts = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        // Simular un pequeño delay para mejor UX (opcional)
        await new Promise(resolve => setTimeout(resolve, 100));

        // Incrementar en 10 productos
        setDisplayCount(prev => Math.min(prev + 10, productosFiltrados.length));
        setIsLoadingMore(false);
    }, [isLoadingMore, hasMore, productosFiltrados.length]);


    // Actualizar productos visibles cuando cambia el filtro o el contador
    useEffect(() => {
        // Resetear cuando cambia la búsqueda
        setDisplayCount(10);
        setHasMore(true);
        setProductosVisibles(productosFiltrados.slice(0, 10));
    }, [productosFiltrados]);

    // Actualizar cuando cambia displayCount
    useEffect(() => {
        const nuevosVisibles = productosFiltrados.slice(0, displayCount);
        setProductosVisibles(nuevosVisibles);
        setHasMore(displayCount < productosFiltrados.length);
    }, [productosFiltrados, displayCount]);

    // Reset form cuando se abre/cierra el modal
    useEffect(() => {
        if (abierto) {
            setBusqueda("");
            setProductoSeleccionado(null);
            setCarrito([]);
            setVendedorSeleccionado(null); // <-- AGREGAR ESTA LÍNEA
            setFormProducto({
                cantidad: 1,
                descuento_unitario: "0",
                observaciones: ""
            });
        }
    }, [abierto]);
    // Observador de intersección para infinite scroll
    useEffect(() => {
        if (!loadMoreTriggerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !productoSeleccionado) {
                    loadMoreProducts();
                }
            },
            { threshold: 0.1, rootMargin: "100px" } // Activar cuando esté a 100px del final
        );

        observer.observe(loadMoreTriggerRef.current);

        return () => {
            if (loadMoreTriggerRef.current) {
                observer.unobserve(loadMoreTriggerRef.current);
            }
        };
    }, [hasMore, isLoadingMore, loadMoreProducts, productoSeleccionado, productosFiltrados]);

    useEffect(() => {
        const cargarVendedores = async () => {
            // Solo cargar si hay una sucursal seleccionada
            if (!currentSucursal?.id) {
                setVendedores([]);
                setVendedorSeleccionado(null);
                return;
            }

            setLoadingVendedores(true);
            try {
                console.log('Cargando vendedores para sucursal:', currentSucursal.id); // Debug
                const resultado = await obtenerVendedores();
                setVendedores(resultado);

                // Resetear selección cuando cambia la sucursal
                setVendedorSeleccionado(null);

            } catch (error) {
                console.error('Error cargando vendedores:', error);
                setVendedores([]);
                toast.error('Error al cargar vendedores');
            } finally {
                setLoadingVendedores(false);
            }
        };

        cargarVendedores();
    }, [currentSucursal?.id, obtenerVendedores]); // <-- Dependencia en currentSucursal.id

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setFormProducto({
            cantidad: 1,
            descuento_unitario: "",
            observaciones: ""
        });
    };

    const handleAgregarAlCarrito = () => {
        if (!productoSeleccionado) return;

        const precioUnitario = parseFloat(productoSeleccionado.precio);
        const descuento = parseFloat(formProducto.descuento_unitario) || 0;
        const cantidad = parseInt(formProducto.cantidad) || 1;

        const precioConDescuento = Math.max(0, precioUnitario - descuento);
        const totalLinea = precioConDescuento * cantidad;

        const itemCarrito = {
            id: Date.now(), // ID temporal para el carrito
            producto_id: productoSeleccionado.id,
            producto: productoSeleccionado,
            cantidad: cantidad,
            precio_unitario: precioUnitario,
            descuento_unitario: descuento,
            precio_con_descuento: precioConDescuento,
            total_linea: totalLinea,
            observaciones: formProducto.observaciones
        };

        setCarrito(prev => [...prev, itemCarrito]);
        setProductoSeleccionado(null);
        setFormProducto({
            cantidad: 1,
            descuento_unitario: "0",
            observaciones: ""
        });
        setBusqueda("");
    };

    const handleEliminarDelCarrito = (itemId) => {
        setCarrito(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (carrito.length === 0) {
            toast.error("Debe agregar al menos un producto al carrito");
            return;
        }

        if (!vendedorSeleccionado) {
            toast.error("Debe seleccionar un promotor");
            return;
        }

        setCreando(true);
        try {
            // Preparar todas las ventas del carrito
            const ventasParaCrear = carrito.map(item => ({
                producto_id: item.producto_id,
                total_precio_venta: item.total_linea,
                descuento_venta: item.descuento_unitario * item.cantidad,
                observaciones: item.observaciones,
                cantidad: item.cantidad,
                promotor_id: vendedorSeleccionado
            }));

            // 🔹 USAR crearMultiplesVentas si existe
            if (onCreateMultiplesVentas) {
                await onCreateMultiplesVentas(ventasParaCrear);
                toast.success(`${carrito.length} venta(s) creada(s) correctamente`);
            } else {
                // Fallback: crear una por una
                for (const venta of ventasParaCrear) {
                    await onCreateVenta(venta);
                }
                toast.success(`${carrito.length} venta(s) creada(s) correctamente`);
            }

            onCerrar();
        } catch (err) {
            toast.error("Error al crear venta(s): " + err.message);
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

    const totalVenta = carrito.reduce((sum, item) => sum + item.total_linea, 0);
    const totalDescuentos = carrito.reduce((sum, item) => sum + (item.descuento_unitario * item.cantidad), 0);


    //mostrar descuentos en tiempo real antes de agregar al carrito
    const cantidadItemSeleccionado = Number(formProducto.cantidad) || 0;
    const precioItemSeleccionado = Number(productoSeleccionado?.precio) || 0;
    const descuentoUnitItemSeleccionado = Number(formProducto.descuento_unitario) || 0;

    const subtotalItemSeleccionado = cantidadItemSeleccionado * precioItemSeleccionado;
    const descuentoTotalItemSeleccionado = cantidadItemSeleccionado * descuentoUnitItemSeleccionado;
    const totalFinalItemSeleccionado = subtotalItemSeleccionado - descuentoTotalItemSeleccionado;

    if (!abierto) return null;
    return (
        <motion.div
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full min-h-[90vh] max-h-[90vh] overflow-hidden flex">

                {/* Lado Izquierdo - Búsqueda y Selección de Productos */}
                <div className="w-1/2 bg-lima-50 border-r border-gray-200 flex flex-col">
                    <div className="p-3 pb-1 border-b border-gray-50">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-xl font-bold text-gray-900">Nueva Venta</h2>
                        </div>

                        {/* Info de sucursal y select de vendedores */}
                        <div className="bg-stone-100 p-3 rounded-md mb-2">
                            <div className="flex items-center gap-4">
                                <p className="inline-flex items-center gap-2 text-sm border-l-[3px] border-blue-400 bg-blue-50 px-3 py-1 rounded-r-lg">
                                    <span className="font-semibold text-blue-700">Sucursal</span>
                                    <span className="text-blue-300">/</span>
                                    <span className="font-medium text-blue-900">{currentSucursal?.nombre}</span>
                                </p>
                                <div className="inline-flex items-center border-l-[3px] border-blue-400 bg-blue-50 px-3 py-1.5 rounded-r-lg gap-3">
                                    <span className="font-semibold text-blue-700 text-sm whitespace-nowrap">Promotor</span>
                                    <span className="text-blue-300 text-sm">/</span>

                                    <select
                                        id="vendedorSelect"
                                        value={vendedorSeleccionado || ''}
                                        onChange={(e) => setVendedorSeleccionado(e.target.value ? Number(e.target.value) : null)}
                                        disabled={loadingVendedores}
                                        className="text-sm text-blue-900 bg-transparent border-none outline-none focus:ring-0 cursor-pointer py-0 px-0 font-medium"
                                    >
                                        <option value="">Seleccionar promotor...</option>
                                        {vendedores.map(vendedor => (
                                            <option key={vendedor.id} value={vendedor.id}>
                                                {vendedor.nombre}
                                            </option>
                                        ))}
                                    </select>

                                    {loadingVendedores && (
                                        <>
                                            <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .spinner {
        width: 14px; height: 14px; border-radius: 50%;
        border: 2px solid #bfdbfe;
        border-top-color: #3b82f6;
        animation: spin .7s linear infinite;
        flex-shrink: 0;
      }
    `}</style>
                                            <span className="spinner" />
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Mensaje de error si no hay vendedores */}
                            {!loadingVendedores && vendedores.length === 0 && (
                                <p className="text-sm text-red-500 mt-2">
                                    No hay vendedores disponibles en esta sucursal
                                </p>
                            )}

                            {/* Mensaje de advertencia si no se selecciona vendedor
                            {vendedorSeleccionado === null && vendedores.length > 0 && (
                                <p className="text-sm text-yellow-600 mt-2">
                                    ⚠️ Debe seleccionar un vendedor para continuar
                                </p>
                            )} */}
                            {vendedorSeleccionado === null && vendedores.length > 0 && (
                                <>
                                    <style>{`
      @keyframes pulse-border {
        0%, 100% { border-color: #fca5a5; opacity: 1; }
        50% { border-color: #ef4444; opacity: .75; }
      }
      @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .warn-alert {
        display: inline-flex; align-items: center; gap: 8px;
        margin-top: 8px; padding: 6px 12px;
        border-radius: 8px; background: #fff1f2;
        border: 1.5px solid #fca5a5;
        animation: pulse-border 1.4s ease-in-out infinite;
      }
      .warn-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #ef4444; flex-shrink: 0;
        animation: blink 1.4s ease-in-out infinite;
      }
    `}</style>

                                    <div className="warn-alert">
                                        <span className="warn-dot" />
                                        <p className="text-sm font-medium text-red-700 leading-snug">
                                            Debe seleccionar un promotor para continuar
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative w-full mb-1 flex items-center gap-3">
                            <span>Buscar: </span>
                            <input
                                type="text"
                                placeholder="Buscar producto por nombre o código..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full ring-1 ring-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="flex-1 overflow-y-auto p-2 pt-1 ">
                            {productosFiltrados.length === 0 ? (
                                <>
                                    <style>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .empty-wrap { animation: fade-in .3s ease-out both; }
      .empty-icon { animation: float 2.8s ease-in-out infinite; }
    `}</style>

                                    <div className="empty-wrap flex flex-col items-center justify-center py-10 gap-3">
                                        <div className="empty-icon">
                                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                                <rect x="8" y="14" width="32" height="26" rx="4" stroke="#93c5fd" strokeWidth="2" fill="#eff6ff" />
                                                <path d="M16 14v-2a8 8 0 0116 0v2" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M18 26h12M18 32h7" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
                                                <circle cx="36" cy="36" r="8" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.5" />
                                                <path d="M33 36h6M36 33v6" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
                                            </svg>
                                        </div>

                                        <p className="text-sm font-medium text-slate-500">Sin resultados</p>
                                        <p className="text-xs text-slate-400">Intenta con otro nombre o código</p>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    {productosVisibles.map((producto) => (
                                        <div
                                            key={producto.id}
                                            onClick={() => handleSeleccionarProducto(producto)}
                                            className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${productoSeleccionado?.id === producto.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start gap-5 group">
                                                <div className="flex-1 text-left">
                                                    <div className="relative w-full h-6 overflow-hidden">
                                                        <h3
                                                            className="
                absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900
                transition-none
                group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear
                group-hover:-translate-x-full
            "
                                                        >
                                                            {producto.nombre}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-gray-600">Código: {producto.codigo}</p>
                                                    <p className="text-sm text-gray-600">Categoría: {producto.categorias?.nombre}</p>
                                                    <p className="text-sm text-gray-600">Stock: {producto.stock_actual}</p>
                                                </div>
                                                <div className="text-right flex flex-col gap-1">
                                                    <p className="font-bold text-green-600">Bs. {producto.precio.toFixed(2)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Trigger para infinite scroll */}
                                    {hasMore && !productoSeleccionado && (
                                        <div ref={loadMoreTriggerRef} className="py-4 flex justify-center items-center">
                                            {isLoadingMore ? (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                                                    <span className="text-sm">Cargando más productos...</span>
                                                </div>
                                            ) : (
                                                <div className="h-8" /> // Espacio invisible para el observer
                                            )}
                                        </div>
                                    )}

                                    {/* Indicador de fin de lista */}
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
                                key={productoSeleccionado.id} // importante para que AnimatePresence detecte cambios
                                initial={{ opacity: 0, y: 50 }} // empieza invisible y abajo
                                animate={{ opacity: 1, y: 0 }} // termina visible y en su lugar
                                exit={{ opacity: 0, y: 50 }} // al desmontar vuelve invisible y se desplaza abajo
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="border-t border-gray-200 mb-1 min-h-[100vh] max-h-[100vh] items-start p-3 bg-stone-50">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-semibold text-green-600 text-sm">
                                        PRODUCTO SELECCIONADO:
                                    </h3>
                                    <span
                                        className="w-10 cursor-pointer text-2xl text-center text-red-500 font-bold hover:text-red-700"
                                        onClick={() => setProductoSeleccionado(null)}

                                    >
                                        X
                                    </span>
                                </div>

                                <div className="flex bg-blue-50 mb-1 ring-1 ring-blue-300 rounded-lg p-2 items-start group gap-5">
                                    <div className=" flex-1 text-left">
                                        <div className="relative w-full h-6 overflow-hidden">
                                            <h3
                                                className="
                absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900
                transition-none
                group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear
                group-hover:-translate-x-full
            "
                                            >
                                                {productoSeleccionado.nombre}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600">Código: {productoSeleccionado.codigo}</p>
                                        <p className="text-sm text-gray-600">Categoría: {productoSeleccionado.categorias?.nombre}</p>
                                        <p className="text-sm text-gray-600">Stock: {productoSeleccionado.stock_actual}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900">Bs. {productoSeleccionado.precio.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="p-1 bg-blue-50 ring-1 ring-blue-300 rounded-lg shadow-sm mb-1">
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-lg font-bold text-gray-900">
                                            Subtotal: Bs. {subtotalItemSeleccionado.toFixed(2)}
                                        </p>

                                        <p className="text-lg font-bold text-green-600">
                                            Total Bs. {totalFinalItemSeleccionado.toFixed(2)}
                                        </p>
                                    </div>

                                </div>


                                <div className="mb-1">
                                    <div className="flex gap-4">
                                        <div className="flex-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Descuento por unidad Bs *
                                            </label>
                                            <input
                                                type="text"
                                                pattern="[0-9]*"
                                                inputMode="numeric"
                                                name="descuento_unitario"
                                                value={formProducto.descuento_unitario}
                                                onChange={handleChangeForm}
                                                step="0.01"
                                                min="0"
                                                max={productoSeleccionado.precio}
                                                className="w-full ring-1 ring-green-300 bg-green-50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Bs. 0.00"
                                            />
                                        </div>
                                        <div className="flex-2">
                                            <label className="text-sm font-medium text-gray-700 mb-1 block">
                                                Cantidad *
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
                                                    max={productoSeleccionado.stock_actual}
                                                    required
                                                    className="w-full ring-1 ring-green-300 bg-green-50 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                    onClick={() =>
                                                        handleChangeForm({
                                                            target: {
                                                                name: "cantidad",
                                                                value: Math.max(1, formProducto.cantidad - 1)
                                                            }
                                                        })
                                                    }
                                                    className="px-6 py-2 cursor-pointer bg-gray-200 rounded-md text-lg font-bold hover:bg-gray-300"
                                                >
                                                    -
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleChangeForm({
                                                            target: {
                                                                name: "cantidad",
                                                                value: Math.min(
                                                                    productoSeleccionado.stock_actual,
                                                                    formProducto.cantidad + 1
                                                                )
                                                            }
                                                        })
                                                    }
                                                    className="px-6 py-2 cursor-pointer bg-gray-200 rounded-md text-lg font-bold hover:bg-gray-300"
                                                >
                                                    +
                                                </button>

                                            </div>
                                        </div>

                                    </div>
                                    <div className="py-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Observaciones *
                                        </label>
                                        <textarea
                                            name="observaciones"
                                            value={formProducto.observaciones}
                                            onChange={handleChangeForm}
                                            rows={2}
                                            required={Number(formProducto.descuento_unitario) > 0}
                                            className={`w-full ring-1 ring-gray-300 rounded-md  px-1 focus:outline-none focus:ring-2
        ${Number(formProducto.descuento_unitario) > 0
                                                    ? "ring-red-400 ring-red-300 bg-red-50"
                                                    : "ring-gray-300 bg-white"
                                                }`} placeholder="Descuento por compra de volumen, producto con detalle, etc."
                                        />
                                        {Number(formProducto.descuento_unitario) > 0 &&
                                            formProducto.observaciones.trim() === "" && (
                                                <span className="text-xs text-red-500 mb-1 mt-1 block">
                                                    Debe rellenar las observaciones para aplicar un descuento.
                                                </span>
                                            )}
                                    </div>

                                    <button
                                        disabled={
                                            Number(formProducto.descuento_unitario) > 0 &&
                                            formProducto.observaciones.trim() === ""
                                        }
                                        onClick={handleAgregarAlCarrito}
                                        className={`w-full py-2 px-4 rounded-md font-semibold transition-colors
        ${Number(formProducto.descuento_unitario) > 0 &&
                                                formProducto.observaciones.trim() === ""
                                                ? "bg-gray-400 cursor-not-allowed"
                                                : "bg-green-600 hover:bg-green-700 cursor-pointer text-white"
                                            }
    `} >
                                        Agregar al Carrito
                                    </button>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                {/* Lado Derecho - Carrito de Compras */}
                <div className="w-1/2 flex flex-col">
                    <div className="p-2 border-b border-gray-200">
                        <h3 className="text-xl font-bold text-gray-900">Carrito de Venta</h3>
                        <p className="text-sm text-blue-600">{carrito.length} producto(s) seleccionado(s)</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-1 overflow-y-auto p-2 bg-white">
                        {carrito.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <p>No hay productos en el carrito</p>
                                <p className="text-sm">Selecciona productos del lado izquierdo</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {[...carrito]
                                        .sort((a, b) => b.id - a.id)
                                        .map((item) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -40 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="ring ring-gray-200 rounded-lg px-3 py-2 bg-blue-50 group">
                                                <div className="flex justify-between items-start mb-2 gap-5">
                                                    <div className="flex-1">
                                                        <div className="relative w-full h-6 overflow-hidden">
                                                            <h3
                                                                className="
                absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900
                transition-none
                group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear
                group-hover:-translate-x-full
            "
                                                            >
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
                                                        <p><strong>Cantidad:</strong> {item.cantidad}</p>
                                                        <p><strong>Precio unitario:</strong> Bs. {item.precio_unitario.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p><strong>Descuento/u:</strong> Bs. {item.descuento_unitario.toFixed(2)}</p>
                                                        <p><strong>Precio con descuento:</strong> Bs. {item.precio_con_descuento.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center mt-1 pt-1 border-t border-gray-200 gap-2">
                                                    {item.observaciones ? (
                                                        <p className="text-sm text-gray-600 mt-1 text-left flex-1">
                                                            <strong>Motivo descuento:</strong> {item.observaciones}
                                                        </p>
                                                    ) : (
                                                        <div className="flex-1" />
                                                    )}
                                                    <p className="font-semibold text-right">
                                                        Total: <span className="text-blue-600">Bs. {item.total_linea.toFixed(2)}</span>
                                                    </p>

                                                </div>
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
                                <span>Total descuentos:</span>
                                <span className="text-red-600">- Bs. {totalDescuentos.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total venta:</span>
                                <span className="text-green-600">Bs. {totalVenta.toFixed(2)}</span>
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
                                disabled={creando || carrito.length === 0 || !vendedorSeleccionado} // <-- MODIFICADO
                                className="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-3 px-4 rounded-md transition-colors font-semibold disabled:opacity-50"
                            >
                                {creando ? "Procesando..." : `Realizar Venta (${carrito.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}