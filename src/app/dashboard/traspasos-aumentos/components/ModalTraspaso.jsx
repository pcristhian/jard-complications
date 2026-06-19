// components/ModalTraspaso.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    CubeIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    TruckIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    MapPinIcon,
    PlusCircleIcon,
    TrashIcon,
    ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function ModalTraspaso({
    abierto,
    onCerrar,
    onTraspaso,
    onTraspasosMultiples,
    sucursalActual,
    sucursales,
    loading,
    currentUser
}) {
    // Estado para el carrito
    const [carrito, setCarrito] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [cargandoProductos, setCargandoProductos] = useState(false);
    const [formTraspaso, setFormTraspaso] = useState({
        cantidad: 1,
        sucursal_destino_id: '',
        observaciones: ''
    });
    const [creando, setCreando] = useState(false);

    const searchRef = useRef(null);
    const inputRef = useRef(null);
    const selectRef = useRef(null);

    // Cargar productos con stock de la sucursal actual
    useEffect(() => {
        if (abierto && sucursalActual) {
            cargarProductosConStock();
            setCarrito([]);
            setProductoSeleccionado(null);
            setBusqueda('');
            setFormTraspaso({
                cantidad: 1,
                sucursal_destino_id: '',
                observaciones: ''
            });
            setError('');
            setSuccessMessage('');
            setMostrarResultados(false);
        }
    }, [abierto, sucursalActual]);

    // Cerrar resultados al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target) &&
                inputRef.current && !inputRef.current.contains(event.target)) {
                setMostrarResultados(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtrar productos en tiempo real
    useEffect(() => {
        if (busqueda.trim() === '') {
            setProductosFiltrados([]);
            return;
        }

        const filtrados = productos.filter(producto =>
            producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
        setProductosFiltrados(filtrados);
    }, [busqueda, productos]);

    const cargarProductosConStock = async () => {
        setCargandoProductos(true);
        try {
            const { data, error } = await supabase
                .from('productos_stock')
                .select(`
                    producto_id,
                    stock_actual,
                    productos:producto_id (
                        id,
                        codigo,
                        nombre,
                        precio,
                        costo,
                        categoria_id,
                        categorias (nombre)
                    )
                `)
                .eq('sucursal_id', sucursalActual?.id)
                .gt('stock_actual', 0);

            if (error) throw error;

            const productosConStock = data
                .filter(item => item.productos)
                .map(item => ({
                    id: item.productos.id,
                    codigo: item.productos.codigo,
                    nombre: item.productos.nombre,
                    precio: item.productos.precio,
                    costo: item.productos.costo,
                    categoria: item.productos.categorias?.nombre || 'Sin categoría',
                    stock_actual: item.stock_actual
                }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre));

            setProductos(productosConStock);
        } catch (error) {
            console.error('Error cargando productos:', error);
            setError('Error al cargar los productos disponibles');
        } finally {
            setCargandoProductos(false);
        }
    };

    const handleSeleccionarProducto = (producto) => {
        setProductoSeleccionado(producto);
        setBusqueda(`${producto.codigo} - ${producto.nombre}`);
        setMostrarResultados(false);
        setError('');
        setFormTraspaso(prev => ({
            ...prev,
            cantidad: 1
        }));
    };

    const handleAgregarAlCarrito = () => {
        if (!productoSeleccionado) return;

        const cantidad = parseInt(formTraspaso.cantidad) || 1;

        if (productoSeleccionado.stock_actual < cantidad) {
            setError(`Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual} unidades`);
            return;
        }

        if (!formTraspaso.sucursal_destino_id) {
            setError('Debe seleccionar una sucursal destino');
            return;
        }

        const itemCarrito = {
            id: Date.now(),
            producto_id: productoSeleccionado.id,
            producto: productoSeleccionado,
            cantidad: cantidad,
            costo_unitario: productoSeleccionado.costo || 0,
            total_linea: (productoSeleccionado.costo || 0) * cantidad,
            sucursal_destino_id: parseInt(formTraspaso.sucursal_destino_id),
            observaciones: formTraspaso.observaciones
        };

        setCarrito(prev => [...prev, itemCarrito]);
        setProductoSeleccionado(null);
        setBusqueda('');
        setFormTraspaso(prev => ({
            ...prev,
            cantidad: 1,
            observaciones: ''
        }));
        setError('');
    };

    const handleEliminarDelCarrito = (itemId) => {
        setCarrito(prev => prev.filter(item => item.id !== itemId));
    };

    const handleActualizarCantidadCarrito = (itemId, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;

        const item = carrito.find(i => i.id === itemId);
        if (item && nuevaCantidad > item.producto.stock_actual) {
            setError(`Stock insuficiente para ${item.producto.nombre}. Máximo: ${item.producto.stock_actual}`);
            return;
        }

        setCarrito(prev => prev.map(item =>
            item.id === itemId
                ? {
                    ...item,
                    cantidad: nuevaCantidad,
                    total_linea: (item.costo_unitario || 0) * nuevaCantidad
                }
                : item
        ));
        setError('');
    };

    const handleChangeForm = (e) => {
        const { name, value } = e.target;
        setFormTraspaso(prev => ({
            ...prev,
            [name]: name === 'cantidad' ? parseInt(value) || 1 : value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (carrito.length === 0) {
            setError('Debe agregar al menos un producto al carrito');
            return;
        }

        const sucursalesDestino = [...new Set(carrito.map(item => item.sucursal_destino_id))];
        if (sucursalesDestino.length > 1) {
            setError('Todos los productos deben ir a la misma sucursal destino');
            return;
        }

        setCreando(true);
        setError('');

        try {
            if (onTraspasosMultiples) {
                const items = carrito.map(item => ({
                    producto: item.producto,
                    cantidad: item.cantidad,
                    sucursalDestinoId: item.sucursal_destino_id,
                    observaciones: item.observaciones || `Traspaso múltiple - ${item.producto.nombre}`
                }));

                const resultado = await onTraspasosMultiples(items);
                if (!resultado.success) {
                    throw new Error(resultado.error);
                }
            } else {
                for (const item of carrito) {
                    const resultado = await onTraspaso({
                        producto: item.producto,
                        cantidad: item.cantidad,
                        sucursalDestinoId: item.sucursal_destino_id,
                        observaciones: item.observaciones || `Traspaso múltiple - ${item.producto.nombre}`
                    });

                    if (!resultado.success) {
                        throw new Error(`Error en ${item.producto.nombre}: ${resultado.error}`);
                    }
                }
            }

            setSuccessMessage(`${carrito.length} traspaso(s) realizado(s) exitosamente!`);

            setTimeout(() => {
                setCarrito([]);
                onCerrar();
            }, 1500);

        } catch (err) {
            setError(err.message);
        } finally {
            setCreando(false);
        }
    };

    const productoSeleccionadoData = productoSeleccionado;
    const stockDisponible = productoSeleccionadoData?.stock_actual || 0;
    const cantidadItemSeleccionado = parseInt(formTraspaso.cantidad) || 1;
    const valorTotalItemSeleccionado = (productoSeleccionadoData?.precio || 0) * cantidadItemSeleccionado;

    const sucursalDestinoSeleccionada = sucursales?.find(s => s.id === parseInt(formTraspaso.sucursal_destino_id));

    const totalTraspasos = carrito.length;
    const totalCantidad = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    const totalValor = carrito.reduce((sum, item) => sum + item.total_linea, 0);

    const sucursalDestinoUnica = carrito.length > 0 ? carrito[0].sucursal_destino_id : null;
    const sucursalDestinoNombre = sucursalDestinoUnica
        ? sucursales?.find(s => s.id === sucursalDestinoUnica)?.nombre
        : null;

    const sucursalesDisponibles = useMemo(() => {
        return sucursales?.filter(s => s.id !== sucursalActual?.id) || [];
    }, [sucursales, sucursalActual]);

    if (!abierto) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={onCerrar}
            >
                <motion.div
                    key="modal-content"
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: 10 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-xl shadow-xl max-w-6xl w-full h-[85vh] flex flex-col overflow-hidden"
                >
                    {/* Tamaño fijo con flex y h-[85vh] */}
                    <div className="flex flex-1 min-h-0 overflow-hidden">
                        {/* Lado Izquierdo - Selección de productos */}
                        <div className="w-1/2 border-r border-gray-200 flex flex-col bg-gray-50">
                            <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        <TruckIcon className="h-5 w-5 text-blue-600" />
                                        <h2 className="text-lg font-bold text-gray-900">Nuevo Traspaso</h2>
                                    </div>
                                    <button
                                        onClick={onCerrar}
                                        className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="bg-blue-50 p-2.5 rounded-lg mb-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPinIcon className="h-4 w-4 text-blue-600" />
                                        <span className="font-semibold text-blue-700">Origen:</span>
                                        <span className="text-blue-900">{sucursalActual?.nombre}</span>
                                    </div>
                                </div>

                                <div className="relative" ref={searchRef}>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={busqueda}
                                        onChange={(e) => {
                                            setBusqueda(e.target.value);
                                            setMostrarResultados(true);
                                        }}
                                        onFocus={() => setMostrarResultados(true)}
                                        placeholder="Buscar producto por código o nombre..."
                                        className="w-full px-4 py-2 pl-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        disabled={cargandoProductos}
                                    />
                                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    {cargandoProductos && (
                                        <div className="absolute right-3 top-2.5">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Lista de Productos - scrollable y altura fija */}
                            {!productoSeleccionado && (
                                <div className="flex-1 overflow-y-auto p-3 min-h-0">
                                    {productosFiltrados.length === 0 && busqueda ? (
                                        <div className="text-center py-8">
                                            <CubeIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No se encontraron productos</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {(productosFiltrados.length > 0 ? productosFiltrados : productos.slice(0, 20)).map((producto) => (
                                                <div
                                                    key={producto.id}
                                                    onClick={() => handleSeleccionarProducto(producto)}
                                                    className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-gray-900 text-sm truncate">{producto.nombre}</div>
                                                            <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                                                                <span>Código: {producto.codigo}</span>
                                                                <span className="text-green-600">Stock: {producto.stock_actual}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-3">
                                                            <p className="text-xs text-gray-500">Costo</p>
                                                            <p className="font-bold text-gray-900 text-sm">Bs. {producto.precio?.toFixed(2) || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Formulario para producto seleccionado */}
                            <AnimatePresence mode="wait">
                                {productoSeleccionado && (
                                    <motion.div
                                        key="producto-form"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 30 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-gray-200 bg-white flex-shrink-0"
                                    >
                                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-semibold text-blue-600 text-xs uppercase tracking-wide">
                                                    Producto Seleccionado
                                                </h3>
                                                <button
                                                    onClick={() => {
                                                        setProductoSeleccionado(null);
                                                        setBusqueda('');
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-xs font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <div className="font-medium text-gray-900 text-sm">{productoSeleccionado.nombre}</div>
                                                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                    <span>Código: {productoSeleccionado.codigo}</span>
                                                    <span className="text-green-600">Stock: {productoSeleccionado.stock_actual}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Cantidad *
                                                    </label>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="number"
                                                            name="cantidad"
                                                            min="1"
                                                            max={stockDisponible}
                                                            value={formTraspaso.cantidad || 1}
                                                            onChange={handleChangeForm}
                                                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChangeForm({
                                                                target: { name: 'cantidad', value: Math.max(1, (formTraspaso.cantidad || 1) - 1) }
                                                            })}
                                                            className="px-3 py-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium"
                                                        >
                                                            -
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChangeForm({
                                                                target: { name: 'cantidad', value: Math.min(stockDisponible, (formTraspaso.cantidad || 1) + 1) }
                                                            })}
                                                            className="px-3 py-1.5 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm font-medium"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Sucursal Destino *
                                                    </label>
                                                    <select
                                                        ref={selectRef}
                                                        name="sucursal_destino_id"
                                                        value={formTraspaso.sucursal_destino_id}
                                                        onChange={handleChangeForm}
                                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                        style={{ WebkitAppearance: 'menulist', appearance: 'menulist' }}
                                                    >
                                                        <option value="">Seleccionar</option>
                                                        {sucursalesDisponibles.map(sucursal => (
                                                            <option key={sucursal.id} value={sucursal.id}>
                                                                {sucursal.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Observaciones (Opcional)
                                                </label>
                                                <textarea
                                                    name="observaciones"
                                                    value={formTraspaso.observaciones}
                                                    onChange={handleChangeForm}
                                                    rows={2}
                                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                                    placeholder="Motivo del traspaso..."
                                                />
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Subtotal:</span>
                                                    <span className="font-semibold">Bs. {valorTotalItemSeleccionado.toFixed(2)}</span>
                                                </div>
                                                {sucursalDestinoSeleccionada && (
                                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                        <span>Destino:</span>
                                                        <span>{sucursalDestinoSeleccionada.nombre}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleAgregarAlCarrito}
                                                disabled={!formTraspaso.sucursal_destino_id || formTraspaso.cantidad < 1 || formTraspaso.cantidad > stockDisponible}
                                                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <PlusCircleIcon className="h-4 w-4" />
                                                Agregar al Carrito
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Espacio para mantener altura cuando no hay producto seleccionado */}
                            {!productoSeleccionado && (
                                <div className="flex-shrink-0 p-3 text-center text-xs text-gray-400 border-t border-gray-200 bg-gray-50">
                                    Selecciona un producto para continuar
                                </div>
                            )}
                        </div>

                        {/* Lado Derecho - Carrito de Traspasos - Tamaño fijo */}
                        <div className="w-1/2 flex flex-col bg-white min-h-0">
                            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                                    <h3 className="text-base font-bold text-gray-900">Carrito</h3>
                                    {totalTraspasos > 0 && (
                                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                            {totalTraspasos}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 min-h-0">
                                {carrito.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-8">
                                        <TruckIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm">Carrito vacío</p>
                                        <p className="text-xs">Selecciona productos del lado izquierdo</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {carrito.map((item) => (
                                            <div
                                                key={item.id}
                                                className="border border-gray-200 rounded-lg p-2 bg-gray-50"
                                            >
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.producto.nombre}</h4>
                                                        <p className="text-xs text-gray-500">Código: {item.producto.codigo}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleEliminarDelCarrito(item.id)}
                                                        className="text-red-500 hover:text-red-700 p-0.5"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-500">Cant:</span>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleActualizarCantidadCarrito(item.id, item.cantidad - 1)}
                                                                className="px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="text-sm font-medium w-6 text-center">{item.cantidad}</span>
                                                            <button
                                                                onClick={() => handleActualizarCantidadCarrito(item.id, item.cantidad + 1)}
                                                                className="px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 text-xs"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-gray-500">Total:</span>
                                                        <span className="ml-1 text-sm font-semibold text-blue-600">Bs. {item.total_linea.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer del carrito - siempre visible */}
                            <div className="border-t border-gray-200 p-3 bg-gray-50 flex-shrink-0">
                                {carrito.length > 0 ? (
                                    <>
                                        <div className="space-y-1 mb-3">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Productos:</span>
                                                <span className="font-medium">{totalTraspasos}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Unidades:</span>
                                                <span className="font-medium">{totalCantidad}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Destino:</span>
                                                <span className="font-medium text-blue-600 truncate max-w-[150px]">{sucursalDestinoNombre || '—'}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200">
                                                <span>Total:</span>
                                                <span className="text-green-600">Bs. {totalValor.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {(error || successMessage) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={`mb-2 p-2 rounded-lg text-xs ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {error ? <ExclamationCircleIcon className="h-3 w-3" /> : <CheckCircleIcon className="h-3 w-3" />}
                                                        <p>{error || successMessage}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <div className="h-16" />
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={onCerrar}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg transition-colors text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={creando || carrito.length === 0}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {creando ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                <span>Procesando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <TruckIcon className="h-4 w-4" />
                                                <span>Traspasar ({totalTraspasos})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}