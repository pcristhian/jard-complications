import { useState, useEffect } from 'react';
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
    CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ModalTraslado({
    abierto,
    onCerrar,
    onRealizarTraslado,
    productos,
    sucursalActual,
    loading
}) {
    const [formData, setFormData] = useState({
        producto_id: '',
        cantidad: 1,
        sucursal_destino_id: '',
        observaciones: ''
    });
    const [sucursales, setSucursales] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [productosFiltrados, setProductosFiltrados] = useState([]);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (abierto) {
            cargarSucursales();
            setFormData({
                producto_id: '',
                cantidad: 1,
                sucursal_destino_id: '',
                observaciones: ''
            });
            setBusqueda('');
            setMostrarResultados(false);
            setError('');
        }
    }, [abierto]);

    // Filtrar productos con stock en tiempo real
    useEffect(() => {
        if (busqueda.trim() === '') {
            setProductosFiltrados([]);
            return;
        }
        const productosSucursalActual = productos.filter(producto =>
            producto.sucursal_id === sucursalActual?.id && producto.stock_actual > 0
        );

        const filtrados = productosSucursalActual.filter(producto =>
            producto.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
            producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
        );
        setProductosFiltrados(filtrados);
    }, [busqueda, productos, sucursalActual]);

    const cargarSucursales = async () => {
        try {
            const { data, error } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('activo', true)
                .neq('id', sucursalActual?.id)
                .order('nombre');

            if (error) throw error;
            setSucursales(data || []);
        } catch (error) {
            console.error('Error cargando sucursales:', error);
            setError('Error al cargar sucursales disponibles');
        }
    };

    const handleBusquedaChange = (e) => {
        setBusqueda(e.target.value);
        setMostrarResultados(true);
        setError('');
    };

    const seleccionarProducto = (producto) => {
        setFormData(prev => ({
            ...prev,
            producto_id: producto.id,
            cantidad: Math.min(prev.cantidad, producto.stock_actual)
        }));
        setBusqueda(`${producto.codigo} - ${producto.nombre} (Stock: ${producto.stock_actual})`);
        setMostrarResultados(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));

        if (!formData.producto_id) {
            setError('Por favor selecciona un producto');
            return;
        }

        if (!formData.sucursal_destino_id) {
            setError('Por favor selecciona una sucursal destino');
            return;
        }

        // Validar stock disponible
        if (productoSeleccionado && productoSeleccionado.stock_actual < parseInt(formData.cantidad)) {
            setError('Stock insuficiente para realizar el traslado');
            return;
        }

        if (parseInt(formData.cantidad) < 1) {
            setError('La cantidad debe ser al menos 1');
            return;
        }

        const resultado = await onRealizarTraslado(
            formData.producto_id,
            parseInt(formData.cantidad),
            formData.sucursal_destino_id,
            formData.observaciones
        );

        if (resultado.success) {
            onCerrar();
        } else {
            setError(resultado.error || 'Error al realizar el traslado');
        }
    };

    const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));
    const stockDisponible = productoSeleccionado?.stock_actual || 0;

    // Animaciones
    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 20,
            transition: {
                duration: 0.2
            }
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    const resultVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.2,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: {
                duration: 0.15
            }
        }
    };

    return (
        <AnimatePresence>
            {abierto && (
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
                        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg"
                                    >
                                        <TruckIcon className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Realizar Traslado
                                        </h2>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                {sucursalActual?.nombre}
                                            </div>
                                            <ArrowRightCircleIcon className="h-4 w-4 text-purple-400" />
                                            <span className="text-sm text-gray-600">
                                                Sucursal destino
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onCerrar}
                                    className="p-2 hover:bg-white rounded-full transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Alertas */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mx-6 mt-6"
                                >
                                    <div className="p-3 bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 rounded-xl">
                                        <div className="flex items-center">
                                            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                            <p className="text-red-700 text-sm font-medium">{error}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="p-6">
                            {/* Distribución horizontal en grid */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Búsqueda de Producto */}
                                <motion.div
                                    variants={itemVariants}
                                    className="space-y-2 col-span-1"
                                >
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <MagnifyingGlassIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Buscar Producto *
                                    </label>
                                    <div className="relative">
                                        <motion.input
                                            whileFocus={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                            type="text"
                                            value={busqueda}
                                            onChange={handleBusquedaChange}
                                            onFocus={() => setMostrarResultados(true)}
                                            placeholder="Buscar productos con stock disponible..."
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200"
                                        />
                                        <MagnifyingGlassIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                                    </div>

                                    {/* Resultados de búsqueda */}
                                    <AnimatePresence>
                                        {mostrarResultados && productosFiltrados.length > 0 && (
                                            <motion.div
                                                variants={resultVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="exit"
                                                className="absolute z-20 w-full max-w-[calc(50%-3rem)] mt-1 bg-white border border-gray-300 rounded-xl shadow-xl max-h-64 overflow-y-auto"
                                            >
                                                {productosFiltrados.map((producto, index) => (
                                                    <motion.div
                                                        key={producto.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.05 }}
                                                        onClick={() => seleccionarProducto(producto)}
                                                        whileHover={{ backgroundColor: "rgba(243, 232, 255, 0.5)" }}
                                                        className="px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-200"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {producto.codigo} - {producto.nombre}
                                                                </div>
                                                                <div className="flex items-center space-x-3 mt-1">
                                                                    <div className="flex items-center space-x-1">
                                                                        <CubeIcon className="h-3 w-3 text-gray-400" />
                                                                        <span className="text-xs text-gray-600">
                                                                            Stock: {producto.stock_actual}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <TagIcon className="h-3 w-3 text-gray-400" />
                                                                        <span className="text-xs text-gray-600">
                                                                            {producto.categorias?.nombre || 'Sin categoría'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <CurrencyDollarIcon className="h-3 w-3 text-gray-400" />
                                                                        <span className="text-xs text-gray-600">
                                                                            ${parseFloat(producto.precio).toFixed(2)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <ArrowRightCircleIcon className="h-5 w-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* Mensaje si no hay resultados */}
                                        {mostrarResultados && busqueda.trim() !== '' && productosFiltrados.length === 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute z-20 w-full max-w-[calc(50%-3rem)] mt-1 bg-white border border-gray-300 rounded-xl shadow-xl p-4"
                                            >
                                                <div className="flex flex-col items-center justify-center space-y-2">
                                                    <CubeIcon className="h-8 w-8 text-gray-300" />
                                                    <p className="text-gray-500 text-sm font-medium">
                                                        No se encontraron productos con stock
                                                    </p>
                                                    <p className="text-gray-400 text-xs text-center">
                                                        Solo se muestran productos con stock disponible en {sucursalActual?.nombre}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Cantidad */}
                                <motion.div
                                    variants={itemVariants}
                                    className="space-y-2 col-span-1"
                                >
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <CubeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            Cantidad a trasladar *
                                        </label>
                                        <div className="text-sm text-gray-500">
                                            Máx: <span className="font-semibold text-purple-600">{stockDisponible}</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <motion.input
                                            whileFocus={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                            type="number"
                                            min="1"
                                            max={stockDisponible}
                                            name="cantidad"
                                            value={formData.cantidad}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200"
                                            required
                                        />
                                        <div className="absolute right-3 top-3 text-gray-500">
                                            unidades
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {parseInt(formData.cantidad) > stockDisponible && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-xs text-red-500 mt-1"
                                            >
                                                ⚠️ La cantidad excede el stock disponible
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            {/* Segunda fila horizontal */}
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Producto seleccionado */}
                                <AnimatePresence>
                                    {formData.producto_id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 col-span-1"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <CheckCircleIcon className="h-5 w-5 text-purple-500 mt-0.5" />
                                                <div>
                                                    <div className="text-sm font-semibold text-purple-800 mb-1">
                                                        Producto seleccionado
                                                    </div>
                                                    <div className="text-sm text-purple-700">
                                                        {busqueda}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Sucursal Destino */}
                                <motion.div
                                    variants={itemVariants}
                                    className="space-y-2 col-span-1"
                                >
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Sucursal Destino *
                                    </label>
                                    <div className="relative">
                                        <motion.select
                                            whileFocus={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                            name="sucursal_destino_id"
                                            value={formData.sucursal_destino_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 appearance-none"
                                            required
                                        >
                                            <option value="" className="text-gray-500">Seleccionar sucursal destino</option>
                                            {sucursales.map(sucursal => (
                                                <option key={sucursal.id} value={sucursal.id} className="text-gray-900">
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                        </motion.select>
                                        <div className="absolute right-3 top-3 pointer-events-none">
                                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                        </div>
                                    </div>
                                    {sucursales.length === 0 && (
                                        <p className="text-sm text-red-500 mt-1">No hay otras sucursales disponibles</p>
                                    )}
                                </motion.div>
                            </div>

                            {/* Observaciones - Fila completa */}
                            <motion.div
                                variants={itemVariants}
                                className="space-y-2 mb-6"
                            >
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    Observaciones
                                </label>
                                <motion.textarea
                                    whileFocus={{ scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 resize-none"
                                    placeholder="Ej: Reubicación de inventario, venta especial, ajuste entre sucursales..."
                                />
                            </motion.div>

                            {/* Botones */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-end space-x-3 pt-6 border-t border-gray-200"
                            >
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05, x: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onCerrar}
                                    className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={loading || !formData.producto_id || !formData.sucursal_destino_id || parseInt(formData.cantidad) > stockDisponible}
                                    whileHover={!loading ? { scale: 1.05 } : {}}
                                    whileTap={!loading ? { scale: 0.95 } : {}}
                                    className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            <span>Realizando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <TruckIcon className="h-4 w-4" />
                                            <span>Realizar Traslado</span>
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}