// components/ModalTraspaso.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    ArrowRightCircleIcon,
    MagnifyingGlassIcon,
    CubeIcon,
    TagIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    TruckIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    MapPinIcon,
    ScaleIcon
} from '@heroicons/react/24/outline';

export default function ModalTraspaso({
    abierto,
    onCerrar,
    onTraspaso,
    sucursalActual,
    sucursales,
    loading
}) {
    const [formData, setFormData] = useState({
        producto_id: '',
        cantidad: 1,
        sucursal_destino_id: '',
        observaciones: ''
    });
    const [busqueda, setBusqueda] = useState('');
    const [productos, setProductos] = useState([]);
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [cargandoProductos, setCargandoProductos] = useState(false);

    const searchRef = useRef(null);
    const inputRef = useRef(null);

    // Cargar productos con stock de la sucursal actual
    useEffect(() => {
        if (abierto && sucursalActual) {
            cargarProductosConStock();
            setFormData({
                producto_id: '',
                cantidad: 1,
                sucursal_destino_id: '',
                observaciones: ''
            });
            setBusqueda('');
            setMostrarResultados(false);
            setError('');
            setSuccessMessage('');
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

    const seleccionarProducto = (producto) => {
        setFormData(prev => ({
            ...prev,
            producto_id: producto.id,
            cantidad: Math.min(prev.cantidad, producto.stock_actual)
        }));
        setBusqueda(`${producto.codigo} - ${producto.nombre}`);
        setMostrarResultados(false);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'cantidad' ? parseInt(value) || 0 : value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));

        if (!formData.producto_id) {
            setError('Por favor selecciona un producto');
            return;
        }

        if (!formData.sucursal_destino_id) {
            setError('Por favor selecciona una sucursal destino');
            return;
        }

        if (formData.cantidad < 1) {
            setError('La cantidad debe ser al menos 1');
            return;
        }

        if (productoSeleccionado && productoSeleccionado.stock_actual < formData.cantidad) {
            setError(`Stock insuficiente. Disponible: ${productoSeleccionado.stock_actual} unidades`);
            return;
        }

        const resultado = await onTraspaso({
            producto: productoSeleccionado,
            cantidad: formData.cantidad,
            sucursalDestinoId: parseInt(formData.sucursal_destino_id),
            observaciones: formData.observaciones
        });

        if (resultado.success) {
            setSuccessMessage('¡Traspaso realizado exitosamente!');
            setTimeout(() => {
                onCerrar();
            }, 1500);
        } else {
            setError(resultado.error || 'Error al realizar el traspaso');
        }
    };

    const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));
    const stockDisponible = productoSeleccionado?.stock_actual || 0;
    const sucursalDestino = sucursales?.find(s => s.id === parseInt(formData.sucursal_destino_id));
    const valorTotalTraspaso = productoSeleccionado ? productoSeleccionado.costo * formData.cantidad : 0;

    // Animaciones
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.95, y: 20 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { duration: 0.3, ease: "easeOut" }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 20,
            transition: { duration: 0.2 }
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    if (!abierto) return null;

    return (
        <AnimatePresence>
            <motion.div
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={onCerrar}
            >
                <motion.div
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header con gradiente */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-2xl z-20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                    className="p-2 bg-white/20 rounded-xl"
                                >
                                    <TruckIcon className="h-6 w-6" />
                                </motion.div>
                                <div>
                                    <h2 className="text-xl font-bold">Realizar Traspaso de Stock</h2>
                                    <div className="flex items-center space-x-2 mt-1 text-sm text-white/80">
                                        <MapPinIcon className="h-4 w-4" />
                                        <span>Sucursal Origen: {sucursalActual?.nombre}</span>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCerrar}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </motion.button>
                        </div>
                    </div>

                    {/* Mensajes de alerta */}
                    <AnimatePresence>
                        {(error || successMessage) && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`mx-6 mt-6 p-4 rounded-xl ${error
                                    ? 'bg-red-50 border border-red-200'
                                    : 'bg-green-50 border border-green-200'
                                    }`}
                            >
                                <div className="flex items-center">
                                    {error ? (
                                        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                    ) : (
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                    )}
                                    <p className={error ? 'text-red-700' : 'text-green-700'}>
                                        {error || successMessage}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Buscador de Productos */}
                        <div className="space-y-2 relative" ref={searchRef}>
                            <label className="block text-sm font-semibold text-gray-700">
                                <MagnifyingGlassIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                                Buscar Producto *
                            </label>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => {
                                        setBusqueda(e.target.value);
                                        setMostrarResultados(true);
                                    }}
                                    onFocus={() => setMostrarResultados(true)}
                                    placeholder="Buscar por código o nombre..."
                                    className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={cargandoProductos}
                                />
                                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                {cargandoProductos && (
                                    <div className="absolute right-3 top-3.5">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                    </div>
                                )}
                            </div>

                            {/* Resultados de búsqueda - ahora con posición relativa y max-height controlada */}
                            <AnimatePresence>
                                {mostrarResultados && busqueda && productosFiltrados.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-y-auto"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            maxHeight: '300px'
                                        }}
                                    >
                                        {productosFiltrados.map((producto, idx) => (
                                            <motion.div
                                                key={producto.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => seleccionarProducto(producto)}
                                                className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {producto.codigo} - {producto.nombre}
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                                                            <span className="flex items-center">
                                                                <CubeIcon className="h-3 w-3 mr-1" />
                                                                Stock: {producto.stock_actual}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <TagIcon className="h-3 w-3 mr-1" />
                                                                {producto.categoria}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                                                                ${producto.precio}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ArrowRightCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}

                                {/* Mensaje sin resultados */}
                                {mostrarResultados && busqueda && productosFiltrados.length === 0 && !cargandoProductos && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-30 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                            right: 0
                                        }}
                                    >
                                        <CubeIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">
                                            No se encontraron productos con stock disponible
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                            Solo se muestran productos con stock en {sucursalActual?.nombre}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Información del producto seleccionado */}
                        {productoSeleccionado && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-800">Producto Seleccionado</p>
                                            <p className="text-lg font-bold text-gray-900">{productoSeleccionado.nombre}</p>
                                            <p className="text-sm text-gray-600">Código: {productoSeleccionado.codigo}</p>
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <span className="text-gray-600">Stock disponible:</span>
                                                <span className="font-semibold text-blue-600">{stockDisponible} unidades</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Costo unitario</p>
                                        <p className="text-lg font-bold text-gray-900">
                                            ${productoSeleccionado.costo?.toFixed(2) || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Grid de Cantidad y Sucursal Destino */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Cantidad */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    <ScaleIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                                    Cantidad a Traspasar *
                                </label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    min="1"
                                    max={stockDisponible}
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    disabled={!productoSeleccionado}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                                {formData.cantidad > stockDisponible && stockDisponible > 0 && (
                                    <p className="text-xs text-red-500">
                                        ⚠️ La cantidad excede el stock disponible
                                    </p>
                                )}
                                {valorTotalTraspaso > 0 && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        Valor total del traspaso: <span className="font-semibold text-blue-600">${valorTotalTraspaso.toFixed(2)}</span>
                                    </p>
                                )}
                            </div>

                            {/* Sucursal Destino */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    <BuildingOfficeIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                                    Sucursal Destino *
                                </label>
                                <select
                                    name="sucursal_destino_id"
                                    value={formData.sucursal_destino_id}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar sucursal</option>
                                    {sucursales?.filter(s => s.id !== sucursalActual?.id).map(sucursal => (
                                        <option key={sucursal.id} value={sucursal.id}>
                                            {sucursal.nombre}
                                        </option>
                                    ))}
                                </select>
                                {sucursalDestino && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                                        <ArrowRightCircleIcon className="h-3 w-3" />
                                        <span>Traspaso desde {sucursalActual?.nombre} hacia {sucursalDestino.nombre}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Observaciones */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">
                                <DocumentTextIcon className="h-4 w-4 inline mr-2 text-gray-400" />
                                Observaciones (Opcional)
                            </label>
                            <textarea
                                name="observaciones"
                                value={formData.observaciones}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Ej: Reabastecimiento de inventario, venta especial, ajuste entre sucursales..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            />
                        </div>

                        {/* Resumen del Traspaso */}
                        {productoSeleccionado && sucursalDestino && formData.cantidad > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                            >
                                <h3 className="font-semibold text-gray-900 mb-3">Resumen del Traspaso</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Producto:</p>
                                        <p className="font-medium">{productoSeleccionado.nombre}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Cantidad:</p>
                                        <p className="font-medium">{formData.cantidad} unidades</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Sucursal Origen:</p>
                                        <p className="font-medium">{sucursalActual?.nombre}</p>
                                        <p className="text-xs text-gray-400">Stock: {stockDisponible} → {stockDisponible - formData.cantidad}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Sucursal Destino:</p>
                                        <p className="font-medium">{sucursalDestino.nombre}</p>
                                        <p className="text-xs text-green-600">Recibirá +{formData.cantidad} unidades</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onCerrar}
                                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Cancelar
                            </motion.button>
                            <motion.button
                                type="submit"
                                disabled={loading || !formData.producto_id || !formData.sucursal_destino_id || formData.cantidad < 1 || formData.cantidad > stockDisponible}
                                whileHover={!loading ? { scale: 1.02 } : {}}
                                whileTap={!loading ? { scale: 0.98 } : {}}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-md flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Procesando...</span>
                                    </>
                                ) : (
                                    <>
                                        <TruckIcon className="h-4 w-4" />
                                        <span>Realizar Traspaso</span>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}