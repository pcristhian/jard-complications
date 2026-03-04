// src/app/dashboard/gestion-categorias/components/Tabla.jsx
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TagIcon,
    CubeIcon,
    CheckCircleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    PencilIcon,
    TrashIcon,
    ArrowPathIcon,
    FunnelIcon,
    InformationCircleIcon,
    AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

const Tabla = ({
    categorias,
    onEditar,
    onEliminar,
    onReactivar,
    onReglasComision
}) => {
    const [filtroActivo, setFiltroActivo] = useState('activos');
    const [scrollProgress, setScrollProgress] = useState(0);
    const tableContainerRef = useRef(null);

    // Efecto para el scroll
    useEffect(() => {
        const tableContainer = tableContainerRef.current;

        const handleScroll = () => {
            if (!tableContainer) return;

            const scrollTop = tableContainer.scrollTop;
            const scrollHeight = tableContainer.scrollHeight - tableContainer.clientHeight;
            const progress = (scrollTop / scrollHeight) * 100;

            setScrollProgress(Math.min(progress, 100));
        };

        if (tableContainer) {
            tableContainer.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (tableContainer) {
                tableContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [categorias]);

    // Memoizar el cálculo de categorías filtradas
    const categoriasFiltradas = useMemo(() => {
        return categorias.filter(cat => {
            if (filtroActivo === 'activos') return cat.activo;
            if (filtroActivo === 'inactivos') return !cat.activo;
            return true;
        });
    }, [categorias, filtroActivo]);

    // Memoizar estadísticas para evitar cálculos repetidos
    const estadisticas = useMemo(() => {
        const activas = categoriasFiltradas.filter(c => c.activo).length;
        const inactivas = categoriasFiltradas.filter(c => !c.activo).length;
        const totalProductos = categoriasFiltradas.reduce((sum, cat) => sum + cat.total_productos, 0);
        return { activas, inactivas, totalProductos };
    }, [categoriasFiltradas]);

    // Función para formatear montos en Bs.
    const formatBs = useCallback((monto) => {
        if (monto === null || monto === undefined) return 'Bs. 0.00';
        return `Bs. ${parseFloat(monto).toFixed(2)}`;
    }, []);

    // Función para mostrar los detalles de la comisión
    const renderDetallesComision = useCallback((categoria) => {
        const { tipo_comision_mostrar, detalles_comision } = categoria;

        if (!detalles_comision) {
            return (
                <div className="flex items-center space-x-2 justify-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                        {tipo_comision_mostrar || 'Sin configurar'}
                    </span>
                </div>
            );
        }

        if (tipo_comision_mostrar === 'Escalonada') {
            return (
                <div className="space-y-2 text-center">
                    <div className="flex items-center space-x-2 justify-center">
                        <ChartBarIcon className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-900">
                            Comisión Escalonada
                        </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center space-x-1 justify-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span>Base: <span className="font-semibold text-blue-600">{formatBs(detalles_comision.base)}</span></span>
                        </div>
                        <div className="flex items-center space-x-1 justify-center">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>Hasta: <span className="font-semibold text-green-600">{detalles_comision.limite} uds</span></span>
                        </div>
                        <div className="flex items-center space-x-1 justify-center">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            <span>Después: <span className="font-semibold text-purple-600">{formatBs(detalles_comision.post_limite)}</span></span>
                        </div>
                    </div>
                </div>
            );
        }

        if (tipo_comision_mostrar?.startsWith('Fija')) {
            return (
                <div className="flex items-center space-x-2 justify-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-blue-500" />
                    <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                            Comisión Fija
                        </div>
                        {detalles_comision.base && (
                            <div className="text-xs text-blue-600 font-medium">
                                {formatBs(detalles_comision.base)} por unidad
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (tipo_comision_mostrar?.includes('Variable')) {
            return (
                <div className="flex items-center space-x-2 justify-center">
                    <AdjustmentsHorizontalIcon className="h-4 w-4 text-green-500" />
                    <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                            Comisión Variable
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                            Configurada por producto
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-2 justify-center">
                <InformationCircleIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-900">
                    {tipo_comision_mostrar}
                </span>
            </div>
        );
    }, [formatBs]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full"
        >
            {/* Barra de progreso del scroll */}
            <div className="sticky top-0 z-50 w-full bg-gray-200 h-1 overflow-hidden">
                <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ duration: 0 }}
                />
            </div>

            {/* Filtros - Fijos en la parte superior */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-2    flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-600 rounded-lg">
                            <FunnelIcon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                Filtro de categorías
                            </p>
                            <p className="text-xs text-gray-600">
                                Mostrando {categoriasFiltradas.length} de {categorias.length} categorías
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {[
                            { key: 'todos', label: 'Todas', icon: TagIcon },
                            { key: 'activos', label: 'Activas', icon: CheckCircleIcon },
                            { key: 'inactivos', label: 'Inactivas', icon: XCircleIcon }
                        ].map((filtro) => (
                            <button
                                key={filtro.key}
                                onClick={() => setFiltroActivo(filtro.key)}
                                className={`flex items-center space-x-2 px-4 py-2 cursor-pointer rounded-lg transition-all duration-150 ${filtroActivo === filtro.key
                                    ? 'bg-blue-500 text-white shadow'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <filtro.icon className="h-4 w-4" />
                                <span className="text-sm font-medium">{filtro.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Contenedor principal con scroll interno */}
            <div
                ref={tableContainerRef}
                className="flex-1 overflow-y-auto max-h-[65vh]">
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Encabezados de tabla - Sticky */}
                    <thead className="sticky top-0 bg-gray-500 z-40 text-white">
                        <tr>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Nombre
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Productos
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Activos
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Tipo Comisión
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>

                    {/* Cuerpo de la tabla */}
                    <tbody className="bg-white">
                        {categoriasFiltradas.length > 0 ? (
                            categoriasFiltradas.map((categoria) => (
                                <tr
                                    key={categoria.id}
                                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                >
                                    {/* Nombre */}
                                    <td className="px-1 py-4 text-center">
                                        <div className="flex flex-col items-center space-y-1">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                <TagIcon className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {categoria.nombre}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Productos Totales */}
                                    <td className="px-1 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center space-x-1">
                                                <CubeIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {categoria.total_productos}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                totales
                                            </div>
                                        </div>
                                    </td>

                                    {/* Productos Activos */}
                                    <td className="px-1 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center space-x-1">
                                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                <span className={`text-sm font-semibold ${categoria.productos_activos > 0
                                                    ? 'text-green-700'
                                                    : 'text-gray-500'
                                                    }`}>
                                                    {categoria.productos_activos}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                activos
                                            </div>
                                        </div>
                                    </td>

                                    {/* Tipo Comisión */}
                                    <td className="px-1 py-4 text-center">
                                        {renderDetallesComision(categoria)}
                                    </td>

                                    {/* Estado */}
                                    <td className="px-1 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${categoria.activo
                                            ? 'bg-green-50 text-emerald-700 border border-green-200'
                                            : 'bg-red-50 text-rose-700 border border-red-200'
                                            }`}>
                                            {categoria.activo ? (
                                                <>
                                                    <CheckCircleIcon className="h-3 w-3 mr-1.5 text-emerald-500" />
                                                    Activa
                                                </>
                                            ) : (
                                                <>
                                                    <XCircleIcon className="h-3 w-3 mr-1.5 text-rose-500" />
                                                    Inactiva
                                                </>
                                            )}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="px-1 py-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            {/* Botón Reglas */}
                                            <button
                                                onClick={() => onReglasComision(categoria)}
                                                className="flex items-center space-x-2 cursor-pointer px-3 py-1.5 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-150 font-medium text-xs"
                                            >
                                                <ChartBarIcon className="h-3 w-3" />
                                                <span>Reglas</span>
                                            </button>

                                            {/* Botón Editar */}
                                            <button
                                                onClick={() => onEditar(categoria)}
                                                className="flex items-center space-x-2 px-3 py-1.5 cursor-pointer text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-150 font-medium text-xs"
                                            >
                                                <PencilIcon className="h-3 w-3" />
                                                <span>Editar</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-12">
                                    <div className="text-center">
                                        <div className="max-w-sm mx-auto">
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                                <TagIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                No se encontraron categorías
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-6">
                                                {filtroActivo === 'activos'
                                                    ? 'No hay categorías activas registradas.'
                                                    : filtroActivo === 'inactivos'
                                                        ? 'No hay categorías inactivas.'
                                                        : 'No hay categorías registradas.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer de la tabla - Fijo en la parte inferior */}
            {
                categoriasFiltradas.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200 px-6 py-3 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">{categoriasFiltradas.length}</span> categorías mostradas
                                </div>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span className="text-xs text-gray-600">
                                            {estadisticas.activas} activas
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span className="text-xs text-gray-600">
                                            {estadisticas.inactivas} inactivas
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600">
                                Total productos: <span className="font-semibold">{estadisticas.totalProductos}</span>
                            </div>
                        </div>
                    </div>
                )
            }
        </motion.div >
    );
};

export default Tabla;