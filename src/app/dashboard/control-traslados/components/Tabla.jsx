import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";
import { useMovements } from '../hooks/useMovements';
import {
    ArrowPathIcon,
    FunnelIcon,
    BuildingStorefrontIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    InformationCircleIcon,
    UserIcon,
    TagIcon,
    CubeIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';

// Animaciones
const animations = {
    container: {
        hidden: { opacity: 0 },
        show: { opacity: 1 }
    },
    row: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, x: -10 }
    }
};

// Configuración por tipo de movimiento
const tipoConfig = {
    entrada_stock: {
        emoji: '📦',
        label: 'Entrada de Stock',
        color: 'bg-green-100 text-green-800',
        icono: CubeIcon,
        bgHover: 'hover:bg-green-50'
    },
    traslado_sucursal: {
        emoji: '🔄',
        label: 'Traslado',
        color: 'bg-purple-100 text-purple-800',
        icono: BuildingStorefrontIcon,
        bgHover: 'hover:bg-purple-50'
    }
};

// Nombres de meses en español
const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function TablaMovimientos({ onRecargar }) {
    const [filtro, setFiltro] = useState('');
    const [mesSeleccionado, setMesSeleccionado] = useState(() => {
        const ahora = new Date();
        return ahora.getMonth(); // 0-11, mes actual por defecto
    });
    const [añoSeleccionado, setAñoSeleccionado] = useState(() => {
        return new Date().getFullYear();
    });
    const [movimientoExpandido, setMovimientoExpandido] = useState(null);
    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { movimientos, loading, error, refetch } = useMovements();
    const sucursalAnteriorRef = useRef(null);

    // Escuchar cambios en localStorage
    useEffect(() => {
        const sucursalActual = values.sucursalSeleccionada;
        if (sucursalActual && sucursalActual.id !== sucursalAnteriorRef.current?.id) {
            refetch();
            sucursalAnteriorRef.current = sucursalActual;
        }
    }, [values.sucursalSeleccionada, refetch]);

    // Filtrar movimientos por texto y mes
    const movimientosFiltrados = movimientos.filter(mov => {
        // Filtro por texto
        const coincideTexto = !filtro || (
            mov.resumen?.toLowerCase().includes(filtro.toLowerCase()) ||
            mov.usuario?.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
            mov.sucursal_origen?.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
            mov.sucursal_destino?.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
            mov.producto?.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
            mov.observaciones?.toLowerCase().includes(filtro.toLowerCase())
        );

        // Filtro por mes
        const fechaMov = new Date(mov.fecha_original);
        const coincideMes = fechaMov.getMonth() === mesSeleccionado &&
            fechaMov.getFullYear() === añoSeleccionado;

        return coincideTexto && coincideMes;
    });

    if (loading && movimientos.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin">
                        <ArrowPathIcon className="w-8 h-8 text-blue-500" />
                    </div>
                    <p className="text-gray-500">Cargando movimientos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                    <InformationCircleIcon className="w-12 h-12 text-red-500" />
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={refetch}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            variants={animations.container}
            initial="hidden"
            animate="show"
            className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-200px)]"
        >
            {/* Filtros fijos en una sola línea */}
            <div className="p-3 border-b bg-gray-50 sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    {/* Sucursal y recargar */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <BuildingStorefrontIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-gray-700 truncate">
                            {values.sucursalSeleccionada?.nombre || 'Todas las sucursales'}
                        </span>
                        <button
                            onClick={refetch}
                            className="p-1.5 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                            title="Recargar"
                        >
                            <ArrowPathIcon className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Buscador */}
                    <div className="relative flex-1">
                        <FunnelIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Selector de mes */}
                    <div className="flex items-center gap-2 min-w-[200px]">
                        <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <select
                            value={mesSeleccionado}
                            onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                            className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {meses.map((mes, index) => (
                                <option key={index} value={index}>
                                    {mes} {añoSeleccionado}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Contador y tipos */}
                    <div className="flex items-center gap-3 text-sm min-w-[180px] justify-end">
                        <span className="text-gray-600 whitespace-nowrap">
                            {movimientosFiltrados.length} mov.
                        </span>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span className="text-gray-600 text-xs">Entradas</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                <span className="text-gray-600 text-xs">Traslados</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Indicador de filtro activo (opcional) */}
                {filtro && (
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Filtro: "{filtro}"
                        </span>
                        <button
                            onClick={() => setFiltro('')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            Limpiar
                        </button>
                    </div>
                )}
            </div>

            {/* Lista de movimientos scrolleable */}
            <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
                <AnimatePresence>
                    {movimientosFiltrados.map((movimiento) => {
                        const config = tipoConfig[movimiento.tipo] || tipoConfig.entrada_stock;
                        const Icono = config.icono;
                        const expandido = movimientoExpandido === movimiento.id;

                        return (
                            <motion.div
                                key={movimiento.id}
                                variants={animations.row}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                layout
                            >
                                {/* Tarjeta de movimiento */}
                                <div
                                    className={`p-3 ${config.bgHover} cursor-pointer transition-all duration-200 ${expandido ? 'bg-gray-50' : ''
                                        }`}
                                    onClick={() => setMovimientoExpandido(expandido ? null : movimiento.id)}
                                >
                                    {/* Cabecera siempre visible - todo en una línea */}
                                    <div className="flex items-center gap-3 text-sm">
                                        {/* Tipo */}
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color} min-w-[90px]`}>
                                            <Icono className="w-3 h-3 mr-1" />
                                            {config.label}
                                        </span>

                                        {/* Fecha */}
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {movimiento.fecha}
                                        </span>

                                        {/* Usuario */}
                                        <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                                            <UserIcon className="w-3 h-3 mr-1" />
                                            {movimiento.usuario?.nombre}
                                        </span>

                                        {/* Resumen/producto */}
                                        <span className="text-gray-900 font-medium flex-1 truncate">
                                            {movimiento.tipo === 'entrada_stock' && (
                                                <>
                                                    → {movimiento.sucursal_origen?.nombre} : {movimiento.producto?.nombre} x {movimiento.cantidad}
                                                </>
                                            )}
                                            {movimiento.tipo === 'traslado_sucursal' && (
                                                <>
                                                    {movimiento.sucursal_origen?.nombre} → {movimiento.sucursal_destino?.nombre}
                                                </>
                                            )}
                                        </span>

                                        {/* Detalle adicional */}
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {movimiento.tipo === 'entrada_stock' && (
                                                <>Stock: {movimiento.stock_nuevo}</>
                                            )}
                                            {movimiento.tipo === 'traslado_sucursal' && (
                                                <>{movimiento.cantidad} unid.</>
                                            )}
                                        </span>

                                        {/* Icono expandir */}
                                        <div className="ml-auto">
                                            {expandido ? (
                                                <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Detalles expandidos (igual que antes) */}
                                    <AnimatePresence>
                                        {expandido && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-3 pt-3 border-t border-gray-200"
                                            >
                                                {/* ... (todo el contenido expandido se mantiene igual) ... */}
                                                {/* Detalles específicos por tipo */}
                                                {movimiento.tipo === 'entrada_stock' && (
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {/* Información del producto */}
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                                    <CubeIcon className="w-4 h-4 mr-1 text-blue-500" />
                                                                    Producto
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <p><span className="text-gray-500">Nombre:</span> {movimiento.producto?.nombre}</p>
                                                                    <p><span className="text-gray-500">Código:</span> {movimiento.producto?.codigo}</p>
                                                                    {movimiento.producto?.precio && (
                                                                        <p><span className="text-gray-500">Precio:</span> ${movimiento.producto.precio}</p>
                                                                    )}
                                                                    {movimiento.producto?.categoria && (
                                                                        <p><span className="text-gray-500">Categoría:</span> {movimiento.producto.categoria.nombre}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Información del movimiento */}
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                                    <DocumentTextIcon className="w-4 h-4 mr-1 text-blue-500" />
                                                                    Detalles de entrada
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <p><span className="text-gray-500">Cantidad:</span> {movimiento.cantidad}</p>
                                                                    <p><span className="text-gray-500">Stock anterior:</span> {movimiento.stock_anterior}</p>
                                                                    <p><span className="text-gray-500">Stock nuevo:</span> {movimiento.stock_nuevo}</p>
                                                                    {movimiento.observaciones && (
                                                                        <p><span className="text-gray-500">Observaciones:</span> {movimiento.observaciones}</p>
                                                                    )}
                                                                    <p><span className="text-gray-500">Sucursal Destino:</span> {movimiento.sucursal_origen?.nombre}</p>

                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {movimiento.tipo === 'traslado_sucursal' && (
                                                    <div className="space-y-4">
                                                        {/* Sucursales */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                                    <BuildingStorefrontIcon className="w-4 h-4 mr-1 text-purple-500" />
                                                                    Sucursal Origen
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <p><span className="text-gray-500">Nombre:</span> {movimiento.sucursal_origen?.nombre}</p>
                                                                    {movimiento.sucursal_origen?.direccion && (
                                                                        <p><span className="text-gray-500">Dirección:</span> {movimiento.sucursal_origen.direccion}</p>
                                                                    )}
                                                                    {movimiento.sucursal_origen?.telefono && (
                                                                        <p><span className="text-gray-500">Teléfono:</span> {movimiento.sucursal_origen.telefono}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                                    <MapPinIcon className="w-4 h-4 mr-1 text-purple-500" />
                                                                    Sucursal Destino
                                                                </h4>
                                                                <div className="space-y-2 text-sm">
                                                                    <p><span className="text-gray-500">Nombre:</span> {movimiento.sucursal_destino?.nombre}</p>
                                                                    {movimiento.sucursal_destino?.direccion && (
                                                                        <p><span className="text-gray-500">Dirección:</span> {movimiento.sucursal_destino.direccion}</p>
                                                                    )}
                                                                    {movimiento.sucursal_destino?.telefono && (
                                                                        <p><span className="text-gray-500">Teléfono:</span> {movimiento.sucursal_destino.telefono}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Lista de productos trasladados */}
                                                        <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                                                <CubeIcon className="w-4 h-4 mr-1 text-purple-500" />
                                                                Productos Trasladados
                                                            </h4>
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full text-sm">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                                                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                                                                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Cantidad</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-200">
                                                                        {movimiento.productos_lista?.map((producto, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="px-3 py-2">{producto.nombre}</td>
                                                                                <td className="px-3 py-2 text-gray-500">{producto.codigo}</td>
                                                                                <td className="px-3 py-2 text-right font-medium">{producto.cantidad}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>

                                                        {movimiento.observaciones && (
                                                            <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                                <h4 className="text-sm font-semibold text-gray-700 mb-1">Observaciones</h4>
                                                                <p className="text-sm text-gray-600">{movimiento.observaciones}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Información del usuario siempre visible */}
                                                <div className="mt-4 pt-3 border-t border-gray-200">
                                                    <div className="flex items-center text-xs text-gray-500">
                                                        <UserIcon className="w-3 h-3 mr-1" />
                                                        <span>Registrado por: <span className="font-medium text-gray-700">{movimiento.usuario?.nombre}</span></span>
                                                        {movimiento.usuario?.caja && (
                                                            <>
                                                                <span className="mx-2">•</span>
                                                                <span>Caja: {movimiento.usuario.caja}</span>
                                                            </>
                                                        )}
                                                        {movimiento.usuario?.rol && (
                                                            <>
                                                                <span className="mx-2">•</span>
                                                                <span>Rol: {movimiento.usuario.rol}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Empty state */}
            {movimientosFiltrados.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 text-center flex-1 flex items-center justify-center"
                >
                    <div className="flex flex-col items-center space-y-3">
                        <InformationCircleIcon className="w-12 h-12 text-gray-400" />
                        <p className="text-gray-500 text-lg">
                            {!values.sucursalSeleccionada
                                ? 'Selecciona una sucursal para ver movimientos'
                                : movimientos.length === 0
                                    ? 'No hay movimientos de entrada o traslados registrados'
                                    : 'No se encontraron movimientos con ese filtro'}
                        </p>
                        {(filtro || movimientos.length > 0) && (
                            <button
                                onClick={() => setFiltro('')}
                                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Limpiar filtro
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}