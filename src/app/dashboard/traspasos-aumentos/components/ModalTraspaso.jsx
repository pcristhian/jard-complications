// components/ModalTraspaso.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    CubeIcon,
    TruckIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    MapPinIcon,
    PlusCircleIcon,
    TrashIcon,
    ShoppingCartIcon,
    XMarkIcon
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
    // ============================================================
    // 🧠 LÓGICA (SIN CAMBIOS)
    // ============================================================
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

        // 🔥 Validar cantidad
        const cantidadRaw = formTraspaso.cantidad;
        const cantidad = parseInt(cantidadRaw, 10);

        if (!cantidadRaw || isNaN(cantidad) || cantidad < 1) {
            setError('Debes ingresar una cantidad válida (mínimo 1)');
            return;
        }

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
            cantidad: 1, // 🔥 Resetear a 1 para el próximo producto
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

        if (name === 'cantidad') {
            // 🔥 Aceptar '' como valor temporal (input vacío)
            if (value === '' || value === 0) {
                setFormTraspaso(prev => ({ ...prev, cantidad: '' }));
                setError('');
                return;
            }

            const num = parseInt(value, 10);
            setFormTraspaso(prev => ({ ...prev, cantidad: isNaN(num) ? '' : num }));
            setError('');
            return;
        }

        setFormTraspaso(prev => ({
            ...prev,
            [name]: value
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
            }, 800);

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

    // ============================================================
    // 🎨 UI (ESTILOS NUEVOS - PALETA AZUL)
    // ============================================================
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
                    className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[85vh] flex flex-col overflow-hidden"
                >
                    <div className="flex flex-1 min-h-0 overflow-hidden">

                        {/* ==================== LADO IZQUIERDO ==================== */}
                        <div className="w-1/2 bg-sky-50 border-r border-gray-200 flex flex-col min-h-0">

                            {/* Header */}
                            <div className="p-3 pb-2 border-b border-sky-100 flex-shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-blue-100 p-1.5 rounded-lg">
                                            <TruckIcon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">Nuevo Traspaso</h2>
                                    </div>
                                    <button
                                        onClick={onCerrar}
                                        className="p-1.5 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500 cursor-pointer"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Info sucursal origen */}
                                <div className="bg-white p-2.5 rounded-lg ring-1 ring-blue-100 mb-2">
                                    <div className="flex items-center gap-2 text-sm border-l-[3px] border-blue-400 pl-2">
                                        <MapPinIcon className="h-4 w-4 text-blue-600" />
                                        <span className="font-semibold text-blue-700">Origen:</span>
                                        <span className="font-medium text-blue-900">{sucursalActual?.nombre}</span>
                                    </div>
                                </div>

                                {/* Buscador */}
                                <div className="relative w-full flex items-center gap-3" ref={searchRef}>
                                    <span className="text-sm font-medium text-gray-700">Buscar:</span>
                                    <div className="relative flex-1">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={busqueda}
                                            onChange={(e) => {
                                                setBusqueda(e.target.value);
                                                setMostrarResultados(true);
                                            }}
                                            onFocus={() => setMostrarResultados(true)}
                                            placeholder="Producto por nombre o código..."
                                            className="w-full ring-1 ring-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={cargandoProductos}
                                        />
                                        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        {cargandoProductos && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                            </div>
                                        )}
                                        {busqueda && !cargandoProductos && (
                                            <button
                                                onClick={() => setBusqueda('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-lg cursor-pointer hover:text-gray-700"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Lista de productos */}
                            {!productoSeleccionado && (
                                <div className="flex-1 overflow-y-auto p-2 pt-2 min-h-0">
                                    {cargandoProductos ? (
                                        <div className="flex justify-center items-center py-10">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    ) : productosFiltrados.length === 0 && busqueda ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                                            <CubeIcon className="h-12 w-12 text-blue-200" />
                                            <p className="text-sm font-medium text-slate-500">Sin resultados</p>
                                            <p className="text-xs text-slate-400">Intenta con otro nombre o código</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {(productosFiltrados.length > 0 ? productosFiltrados : productos.slice(0, 20)).map((producto) => (
                                                <div
                                                    key={producto.id}
                                                    onClick={() => handleSeleccionarProducto(producto)}
                                                    className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group"
                                                >
                                                    <div className="flex justify-between items-start gap-5">
                                                        <div className="flex-1 text-left min-w-0">
                                                            <div className="relative w-full h-6 overflow-hidden">
                                                                <h3 className="absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900 transition-none group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear group-hover:-translate-x-full">
                                                                    {producto.nombre}
                                                                </h3>
                                                            </div>
                                                            <p className="text-xs text-gray-500">Código: {producto.codigo}</p>
                                                            <p className="text-xs text-gray-500">Categoría: {producto.categoria}</p>
                                                            <p className="text-xs font-medium text-blue-600">
                                                                Stock: {producto.stock_actual} unidades
                                                            </p>
                                                        </div>
                                                        <div className="text-right shrink-0">
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

                            {/* Formulario producto seleccionado */}
                            <AnimatePresence mode="wait">
                                {productoSeleccionado && (
                                    <motion.div
                                        key="producto-form"
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 30 }}
                                        transition={{ duration: 0.2 }}
                                        className="border-t border-sky-200 bg-stone-50 flex-shrink-0 max-h-[70vh] overflow-y-auto"
                                    >
                                        {/* Header producto seleccionado */}
                                        <div className="p-3 border-b border-sky-200 bg-sky-100/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="font-semibold text-blue-700 text-xs uppercase tracking-wide">
                                                    Producto Seleccionado
                                                </h3>
                                                <button
                                                    onClick={() => {
                                                        setProductoSeleccionado(null);
                                                        setBusqueda('');
                                                    }}
                                                    className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                                                >
                                                    ✕ Cancelar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-3 space-y-3">
                                            {/* Card del producto */}
                                            <div className="flex bg-sky-50 ring-1 ring-sky-200 rounded-lg p-2 items-start gap-5 group">
                                                <div className="flex-1 text-left min-w-0">
                                                    <div className="relative w-full h-6 overflow-hidden">
                                                        <h3 className="absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900 transition-none group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear group-hover:-translate-x-full">
                                                            {productoSeleccionado.nombre}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600">Código: {productoSeleccionado.codigo}</p>
                                                    <p className="text-xs text-gray-600">Categoría: {productoSeleccionado.categoria}</p>
                                                    <p className="text-xs font-medium text-blue-600">
                                                        Stock: {productoSeleccionado.stock_actual} unidades
                                                    </p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="font-bold text-gray-900 text-sm">Bs. {productoSeleccionado.precio?.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            {/* Cantidad + Sucursal destino */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                                        Cantidad *
                                                    </label>
                                                    <div className="flex items-center gap-1">
                                                        <input
                                                            type="text"
                                                            name="cantidad"
                                                            value={formTraspaso.cantidad === 0 ? '' : formTraspaso.cantidad}
                                                            onChange={(e) => {
                                                                const valor = e.target.value;

                                                                // 🔥 Permitir vacío temporalmente
                                                                if (valor === '') {
                                                                    handleChangeForm({ target: { name: 'cantidad', value: '' } });
                                                                    return;
                                                                }

                                                                // 🔥 Solo dígitos
                                                                const soloDigitos = valor.replace(/[^0-9]/g, '');
                                                                if (soloDigitos === '') return;

                                                                // 🔥 Limitar al stock disponible
                                                                const stockMax = productoSeleccionado?.stock_actual || 999999;
                                                                let numero = parseInt(soloDigitos, 10);
                                                                if (numero > stockMax) numero = stockMax;
                                                                if (numero < 1) numero = 1;

                                                                handleChangeForm({ target: { name: 'cantidad', value: numero } });
                                                            }}
                                                            onKeyPress={(e) => {
                                                                const charCode = e.which ? e.which : e.keyCode;
                                                                if (charCode < 48 || charCode > 57) {
                                                                    e.preventDefault();
                                                                    return false;
                                                                }
                                                                return true;
                                                            }}
                                                            onPaste={(e) => {
                                                                e.preventDefault();
                                                                const texto = e.clipboardData.getData('text');
                                                                const soloDigitos = texto.replace(/[^0-9]/g, '');
                                                                if (soloDigitos) {
                                                                    const stockMax = productoSeleccionado?.stock_actual || 999999;
                                                                    let numero = parseInt(soloDigitos, 10);
                                                                    if (numero > stockMax) numero = stockMax;
                                                                    if (numero < 1) numero = 1;
                                                                    handleChangeForm({ target: { name: 'cantidad', value: numero } });
                                                                }
                                                            }}
                                                            onBlur={(e) => {
                                                                // 🔥 Si el usuario sale sin escribir nada, restaurar a 1
                                                                if (e.target.value === '' || parseInt(e.target.value, 10) < 1) {
                                                                    handleChangeForm({ target: { name: 'cantidad', value: 1 } });
                                                                }
                                                            }}
                                                            pattern="[0-9]*"
                                                            inputMode="numeric"
                                                            required
                                                            className="flex-1 ring-1 ring-blue-200 bg-white rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChangeForm({
                                                                target: { name: 'cantidad', value: Math.max(1, (formTraspaso.cantidad || 1) - 1) }
                                                            })}
                                                            className="px-2.5 py-1.5 bg-gray-200 rounded-md hover:bg-gray-300 text-sm font-bold cursor-pointer"
                                                        >
                                                            −
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleChangeForm({
                                                                target: { name: 'cantidad', value: Math.min(stockDisponible, (formTraspaso.cantidad || 1) + 1) }
                                                            })}
                                                            className="px-2.5 py-1.5 bg-gray-200 rounded-md hover:bg-gray-300 text-sm font-bold cursor-pointer"
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
                                                        className="w-full ring-1 ring-blue-200 bg-white rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

                                            {/* Observaciones */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Observaciones (Opcional)
                                                </label>
                                                <textarea
                                                    name="observaciones"
                                                    value={formTraspaso.observaciones}
                                                    onChange={handleChangeForm}
                                                    rows={2}
                                                    className="w-full ring-1 ring-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                                    placeholder="Motivo del traspaso..."
                                                />
                                            </div>

                                            {/* Subtotal */}
                                            <div className="bg-white ring-1 ring-sky-200 rounded-lg p-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Subtotal:</span>
                                                    <span className="font-semibold text-blue-700">Bs. {valorTotalItemSeleccionado.toFixed(2)}</span>
                                                </div>
                                                {sucursalDestinoSeleccionada && (
                                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                        <span>Destino:</span>
                                                        <span className="font-medium text-blue-600">{sucursalDestinoSeleccionada.nombre}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Botón agregar */}
                                            <button
                                                onClick={handleAgregarAlCarrito}
                                                disabled={
                                                    !formTraspaso.sucursal_destino_id ||
                                                    !formTraspaso.cantidad ||
                                                    parseInt(formTraspaso.cantidad, 10) < 1 ||
                                                    parseInt(formTraspaso.cantidad, 10) > stockDisponible
                                                } className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer shadow-sm"
                                            >
                                                <PlusCircleIcon className="h-4 w-4" />
                                                Agregar al Carrito
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Placeholder cuando no hay producto */}
                            {!productoSeleccionado && (
                                <div className="flex-shrink-0 p-3 text-center text-xs text-gray-400 border-t border-sky-100 bg-white">
                                    👆 Selecciona un producto para continuar
                                </div>
                            )}
                        </div>

                        {/* ==================== LADO DERECHO - CARRITO ==================== */}
                        <div className="w-1/2 flex flex-col bg-white min-h-0">

                            {/* Header carrito */}
                            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="bg-blue-100 p-1.5 rounded-lg">
                                        <ShoppingCartIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Carrito de Traspasos</h3>
                                    {totalTraspasos > 0 && (
                                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                                            {totalTraspasos} {totalTraspasos === 1 ? 'producto' : 'productos'} · {totalCantidad} u.
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Lista carrito */}
                            <div className="flex-1 overflow-y-auto p-3 min-h-0 bg-white">
                                {carrito.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-8">
                                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <TruckIcon className="h-10 w-10 text-blue-300" />
                                        </div>
                                        <p className="text-sm font-medium">Carrito vacío</p>
                                        <p className="text-xs text-gray-400 mt-1">Selecciona productos del lado izquierdo</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <AnimatePresence>
                                            {[...carrito].reverse().map((item) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="ring-1 ring-blue-100 rounded-lg px-3 py-2 bg-blue-50/50 group"
                                                >
                                                    {/* Header item */}
                                                    <div className="flex justify-between items-start mb-2 gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="relative w-full h-5 overflow-hidden">
                                                                <h4 className="absolute left-0 top-0 whitespace-nowrap font-semibold text-gray-900 text-sm transition-none group-hover:transition-transform group-hover:duration-[6000ms] group-hover:ease-linear group-hover:-translate-x-full">
                                                                    {item.producto.nombre}
                                                                </h4>
                                                            </div>
                                                            <p className="text-xs text-gray-500">Código: {item.producto.codigo}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleEliminarDelCarrito(item.id)}
                                                            className="cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-red-600 hover:text-red-700 text-xs font-semibold transition-colors shrink-0 flex items-center gap-1"
                                                        >
                                                            <TrashIcon className="h-3.5 w-3.5" />
                                                            Eliminar
                                                        </button>
                                                    </div>

                                                    {/* Cantidad */}
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500 font-medium">Cant:</span>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleActualizarCantidadCarrito(item.id, item.cantidad - 1)}
                                                                    className="w-6 h-6 bg-white ring-1 ring-gray-300 rounded hover:bg-gray-100 text-xs font-bold cursor-pointer flex items-center justify-center"
                                                                >
                                                                    −
                                                                </button>
                                                                <span className="text-sm font-semibold w-8 text-center text-gray-900">{item.cantidad}</span>
                                                                <button
                                                                    onClick={() => handleActualizarCantidadCarrito(item.id, item.cantidad + 1)}
                                                                    className="w-6 h-6 bg-white ring-1 ring-gray-300 rounded hover:bg-gray-100 text-xs font-bold cursor-pointer flex items-center justify-center"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs text-gray-500">Total: </span>
                                                            <span className="text-sm font-semibold text-blue-700">Bs. {item.total_linea.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    {/* Destino + Observaciones */}
                                                    <div className="pt-1.5 border-t border-blue-100 space-y-1">
                                                        <p className="text-xs text-blue-700 flex items-center gap-1">
                                                            <MapPinIcon className="h-3 w-3" />
                                                            <strong>Destino:</strong>
                                                            <span className="truncate">{sucursales?.find(s => s.id === item.sucursal_destino_id)?.nombre || '—'}</span>
                                                        </p>
                                                        {item.observaciones && (
                                                            <p className="text-xs text-gray-500 italic">
                                                                💬 {item.observaciones}
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Footer carrito */}
                            <div className="border-t border-gray-200 p-3 bg-gray-50 flex-shrink-0">
                                {carrito.length > 0 ? (
                                    <>
                                        <div className="space-y-1.5 mb-3 bg-white rounded-lg p-2.5 ring-1 ring-gray-200">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Productos:</span>
                                                <span className="font-semibold text-gray-900">{totalTraspasos}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Unidades:</span>
                                                <span className="font-semibold text-gray-900">{totalCantidad}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-gray-600">Destino:</span>
                                                <span className="font-semibold text-blue-700 truncate max-w-[150px]">{sucursalDestinoNombre || '—'}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-1">
                                                <span className="text-gray-800">Total:</span>
                                                <span className="text-blue-700">Bs. {totalValor.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {(error || successMessage) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className={`mb-2 p-2 rounded-lg text-xs ring-1 ${error
                                                        ? 'bg-red-50 text-red-700 ring-red-200'
                                                        : 'bg-green-50 text-green-700 ring-green-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        {error ? (
                                                            <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
                                                        ) : (
                                                            <CheckCircleIcon className="h-4 w-4 shrink-0" />
                                                        )}
                                                        <p className="font-medium">{error || successMessage}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </>
                                ) : (
                                    <div className="h-20" />
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={onCerrar}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2.5 rounded-md transition-colors text-sm font-semibold cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={creando || carrito.length === 0}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                                    >
                                        {creando ? (
                                            <>
                                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
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