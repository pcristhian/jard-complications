
// components/TablaResumen.jsx (actualizada)
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TablaResumen({
    productosMasVendidos = [],
    productosBajoStock = [],
    mesesDisponibles = [],
    mesSeleccionado,
    onCambiarMes,
    loading = false,
    sucursalSeleccionada
}) {
    const [vistaActiva, setVistaActiva] = useState('masVendidos');
    const [scrollProgress, setScrollProgress] = useState(0);
    const tableContainerRef = useRef(null);

    useEffect(() => {
        const tableContainer = tableContainerRef.current;

        const handleScroll = () => {
            if (!tableContainer) return;

            const scrollTop = tableContainer.scrollTop;
            const scrollHeight = tableContainer.scrollHeight - tableContainer.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            setScrollProgress(Math.min(progress, 100));
        };

        if (tableContainer) {
            tableContainer.addEventListener('scroll', handleScroll);
            handleScroll();
        }

        return () => {
            if (tableContainer) {
                tableContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [vistaActiva, productosMasVendidos, productosBajoStock]);

    if (!sucursalSeleccionada) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4m-9 4v10" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona una sucursal</h3>
                <p className="text-gray-500">Para ver el dashboard, primero debes seleccionar una sucursal</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow overflow-hidden"
        >
            {/* Barra de progreso del scroll */}
            <div className="sticky top-0 z-50 w-full bg-gray-200 h-1 overflow-hidden">
                <motion.div
                    className="h-full bg-amber-500"
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ duration: 0 }}
                />
            </div>

            {/* Selector de vista y filtros */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setVistaActiva('masVendidos')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${vistaActiva === 'masVendidos'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                Más vendidos
                            </span>
                        </button>
                        <button
                            onClick={() => setVistaActiva('bajoStock')}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${vistaActiva === 'bajoStock'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Bajo stock
                            </span>
                        </button>
                    </div>

                    {/* Selector de meses (solo visible en más vendidos) */}
                    <AnimatePresence mode="wait">
                        {vistaActiva === 'masVendidos' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-2"
                            >
                                <span className="text-sm text-gray-600">Período:</span>
                                <select
                                    value={mesSeleccionado?.id}
                                    onChange={(e) => {
                                        const mes = mesesDisponibles.find(m => m.id === parseInt(e.target.value));
                                        onCambiarMes(mes);
                                    }}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                                >
                                    {mesesDisponibles.map((mes) => (
                                        <option key={mes.id} value={mes.id}>
                                            {mes.nombre} {mes.esActual ? '(Actual)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Resumen de la vista actual */}
                <div className="mt-3 text-sm text-gray-600">
                    {vistaActiva === 'masVendidos' ? (
                        <p>
                            <span className="font-semibold">{sucursalSeleccionada.nombre}</span> -
                            Productos más vendidos por categoría en {mesSeleccionado?.nombre.toLowerCase()}
                            {productosMasVendidos.length === 0 && ' (sin ventas en este período)'}
                        </p>
                    ) : (
                        <p>
                            <span className="font-semibold">{sucursalSeleccionada.nombre}</span> -
                            {productosBajoStock.length} productos con stock por debajo del mínimo
                            {productosBajoStock.filter(p => p.alerta === 'sin_stock').length > 0 && (
                                <span className="ml-2 text-red-600 font-semibold">
                                    ({productosBajoStock.filter(p => p.alerta === 'sin_stock').length} sin stock)
                                </span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Resto del código de la tabla se mantiene igual */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto max-h-[65vh] overflow-y-auto"
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 bg-gray-50 z-40">
                        <tr>
                            {vistaActiva === 'masVendidos' ? (
                                // Headers para productos más vendidos
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Categoría
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Producto más vendido
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cantidad vendida
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contribución
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock actual
                                    </th>
                                </>
                            ) : (
                                // Headers para productos con bajo stock
                                <>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Categoría
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock actual
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock mínimo
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Diferencia
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <AnimatePresence mode="wait">
                            {vistaActiva === 'masVendidos' ? (
                                // Filas de productos más vendidos
                                productosMasVendidos.map((item, index) => (
                                    <motion.tr
                                        key={`${item.categoriaId}-${item.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-amber-50 group"
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {item.categoria}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-semibold">
                                                {item.nombre}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: index * 0.05 + 0.2, type: "spring" }}
                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800"
                                            >
                                                {item.cantidad}
                                            </motion.span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-600">
                                                {Math.round((item.cantidad / productosMasVendidos.reduce((acc, curr) => acc + curr.cantidad, 0)) * 100)}%
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="text-sm text-gray-600">
                                                {item.stock_actual || 0} / {item.stock_minimo || 0}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                // Filas de productos con bajo stock
                                productosBajoStock.map((producto, index) => (
                                    <motion.tr
                                        key={producto.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`hover:bg-red-50 group ${producto.alerta === 'sin_stock' ? 'bg-red-50' : 'bg-yellow-50'
                                            }`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {producto.nombre}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {producto.categoria}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`text-sm font-bold ${producto.alerta === 'sin_stock' ? 'text-red-600' : 'text-yellow-600'
                                                }`}>
                                                {producto.stockActual}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className="text-sm text-gray-600">
                                                {producto.stockMinimo}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className="text-sm font-semibold text-red-600">
                                                -{producto.diferencia}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <motion.span
                                                animate={{
                                                    scale: producto.alerta === 'sin_stock' ? [1, 1.1, 1] : 1
                                                }}
                                                transition={{
                                                    duration: 1.5,
                                                    repeat: producto.alerta === 'sin_stock' ? Infinity : 0
                                                }}
                                                className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${producto.alerta === 'sin_stock'
                                                    ? 'bg-red-200 text-red-800'
                                                    : 'bg-yellow-200 text-yellow-800'
                                                    }`}
                                            >
                                                {producto.alerta === 'sin_stock' ? 'SIN STOCK' : 'BAJO STOCK'}
                                            </motion.span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}