// src/app/dashboard/reportes/components/Tabla.jsx
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Tabla({
    data = [],
    loading = false,
    filters,
    onFilterChange,
    categorias = [],
    usuarios = [],
    sucursales = [],
    monthOptions = []
}) {
    const [showFilters, setShowFilters] = useState(true);

    // Aplicar filtros en tiempo real sobre los datos
    const filteredData = useMemo(() => {
        if (!data.length) return [];

        return data.filter(item => {
            // Filtro por categoría
            if (filters.categoria && filters.categoria !== '') {
                // Comparar usando categoriaId (número contra string)
                if (item.categoriaId !== parseInt(filters.categoria)) {
                    return false;
                }
            }

            // Filtro por mes
            if (filters.mes && filters.mes !== '') {
                const [year, month] = filters.mes.split('-');
                const itemDate = new Date(item.fechaOriginal || item.fecha);
                if (itemDate.getFullYear() !== parseInt(year) ||
                    (itemDate.getMonth() + 1) !== parseInt(month)) {
                    return false;
                }
            }

            // Filtro por usuario
            if (filters.usuario && filters.usuario !== '') {
                // Comparar usando promotorId (número contra string)
                if (item.promotorId !== parseInt(filters.usuario)) {
                    return false;
                }
            }

            // Filtro por búsqueda (en tiempo real)
            if (filters.busqueda && filters.busqueda.trim() !== '') {
                const busquedaLower = filters.busqueda.toLowerCase().trim();
                const productoMatch = item.producto?.toLowerCase().includes(busquedaLower);
                const codigoMatch = item.codigo?.toLowerCase().includes(busquedaLower);
                if (!productoMatch && !codigoMatch) return false;
            }

            return true;
        });
    }, [data, filters]);

    const getSucursalNombre = (sucursalId) => {
        if (!sucursalId) return '';
        const sucursal = sucursales.find(s => s.id === parseInt(sucursalId));
        return sucursal?.nombre || sucursalId;
    };

    // Calcular estadísticas basadas en los datos filtrados
    const estadisticas = useMemo(() => {
        if (!filteredData.length) return {
            totalRegistros: 0,
            totalVentas: 0,
            totalProductos: 0,
            ticketPromedio: 0
        };

        const totalVentas = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
        const totalProductos = filteredData.reduce((sum, item) => sum + (item.cantidad || 0), 0);

        return {
            totalRegistros: filteredData.length,
            totalVentas,
            totalProductos,
            ticketPromedio: totalVentas / filteredData.length
        };
    }, [filteredData]);

    // Función para obtener el nombre de la categoría por ID
    const getCategoriaNombre = (categoriaId) => {
        if (!categoriaId) return '';
        const categoria = categorias.find(c => c.id === parseInt(categoriaId));
        return categoria?.nombre || categoriaId;
    };

    // Función para obtener el nombre del usuario por ID
    const getUsuarioNombre = (usuarioId) => {
        if (!usuarioId) return '';
        const usuario = usuarios.find(u => u.id === parseInt(usuarioId));
        return usuario?.nombre || usuarioId;
    };

    // Función para obtener el nombre del mes por valor
    const getMesNombre = (mesValue) => {
        if (!mesValue) return '';
        const mes = monthOptions.find(m => m.value === mesValue);
        return mes?.label || mesValue;
    };

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-8"
            >
                <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <p className="mt-4 text-gray-600">Cargando datos...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
        >
            {/* Header de la tabla con contador y toggle de filtros */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <svg
                                className={`w-5 h-5 transform transition-transform ${showFilters ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="font-medium">Filtros</span>
                        </button>

                        <div className="h-6 w-px bg-gray-300"></div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Registros:</span>
                            <span className="font-bold text-purple-600">{estadisticas.totalRegistros}</span>
                            {estadisticas.totalRegistros !== data.length && (
                                <span className="text-xs text-gray-500">
                                    (filtrados de {data.length})
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Mini resumen */}
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-600">Total ventas:</span>
                            <span className="font-semibold text-green-600">
                                ${estadisticas.totalVentas.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-600">Productos:</span>
                            <span className="font-semibold text-blue-600">
                                {estadisticas.totalProductos}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Panel de filtros expandible */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Filtro por sucursal */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Sucursal
                                    </label>
                                    <select
                                        value={filters.sucursal || ''}
                                        onChange={(e) => onFilterChange('sucursal', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Todas las sucursales</option>
                                        {sucursales.map((suc) => (
                                            <option key={suc.id} value={suc.id}>
                                                {suc.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Filtro por categoría */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Categoría
                                    </label>
                                    <select
                                        value={filters.categoria || ''}
                                        onChange={(e) => {
                                            console.log('Cambiando categoría a:', e.target.value);
                                            onFilterChange('categoria', e.target.value);
                                        }}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Todas las categorías</option>
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por mes */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Mes
                                    </label>
                                    <select
                                        value={filters.mes || ''}
                                        onChange={(e) => onFilterChange('mes', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Todos los meses</option>
                                        {monthOptions.map((month) => (
                                            <option key={month.value} value={month.value}>
                                                {month.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Filtro por usuario */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Usuario
                                    </label>
                                    <select
                                        value={filters.usuario || ''}
                                        onChange={(e) => onFilterChange('usuario', e.target.value)}
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    >
                                        <option value="">Todos los usuarios</option>
                                        {usuarios.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Buscador */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Buscar producto
                                    </label>
                                    <input
                                        type="text"
                                        value={filters.busqueda || ''}
                                        onChange={(e) => onFilterChange('busqueda', e.target.value)}
                                        placeholder="Nombre o código..."
                                        className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>

                            {/* Indicador de filtros activos */}
                            {Object.values(filters).some(v => v && v !== '') && (
                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {filters.sucursal && filters.sucursal !== '' && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                            >
                                                Sucursal: {getSucursalNombre(filters.sucursal)}
                                                <button
                                                    onClick={() => onFilterChange('sucursal', '')}
                                                    className="ml-1 hover:text-purple-900"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </motion.span>
                                        )}
                                        {filters.categoria && filters.categoria !== '' && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                            >
                                                Categoría: {getCategoriaNombre(filters.categoria)}
                                                <button
                                                    onClick={() => onFilterChange('categoria', '')}
                                                    className="ml-1 hover:text-purple-900"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </motion.span>
                                        )}

                                        {filters.mes && filters.mes !== '' && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                            >
                                                Mes: {getMesNombre(filters.mes)}
                                                <button
                                                    onClick={() => onFilterChange('mes', '')}
                                                    className="ml-1 hover:text-purple-900"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </motion.span>
                                        )}

                                        {filters.usuario && filters.usuario !== '' && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                            >
                                                Usuario: {getUsuarioNombre(filters.usuario)}
                                                <button
                                                    onClick={() => onFilterChange('usuario', '')}
                                                    className="ml-1 hover:text-purple-900"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </motion.span>
                                        )}

                                        {filters.busqueda && filters.busqueda !== '' && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                            >
                                                Búsqueda: "{filters.busqueda}"
                                                <button
                                                    onClick={() => onFilterChange('busqueda', '')}
                                                    className="ml-1 hover:text-purple-900"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Tabla de datos filtrados */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Categoría
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Promotor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sucursal
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                P. Unitario
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                        </svg>
                                        <p className="text-lg font-medium">No hay datos para mostrar</p>
                                        <p className="text-sm">Prueba ajustando los filtros</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((item, index) => (
                                <motion.tr
                                    key={item.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {item.fecha}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.producto}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.codigo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                                            {item.categoria}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.promotor}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.sucursal}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                        {item.cantidad}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                        ${item.precio_unitario?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-bold">
                                        ${item.total?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.estado === 'activa'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {item.estado}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer de la tabla
            {filteredData.length > 0 && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>
                            Mostrando <span className="font-medium">{filteredData.length}</span> registros
                            {filteredData.length !== data.length && (
                                <span className="text-gray-400"> (filtrados de {data.length} totales)</span>
                            )}
                        </span>
                        <span>
                            Última actualización: {new Date().toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            )} */}
        </motion.div>
    );
}