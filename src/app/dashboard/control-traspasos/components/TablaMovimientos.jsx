// components/TablaMovimientos.jsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { useTraspasos } from '../hooks/useTraspasos';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";
import toast from 'react-hot-toast';

export default function TablaMovimientos({ sucursalSeleccionada, refreshTrigger, onMovimientoAnulado }) {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState('activo'); // ✅ Cambiado de 'todos' a 'activo'
    const [busqueda, setBusqueda] = useState('');
    const [anulando, setAnulando] = useState(null);
    const [modalAnulacion, setModalAnulacion] = useState({ abierto: false, movimientoId: null, movimiento: null });

    const { anularMovimiento, loading: anulandoLoading } = useTraspasos();
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;

    useEffect(() => {
        if (sucursalSeleccionada) {
            cargarMovimientos();
        }
    }, [sucursalSeleccionada, refreshTrigger, filtroTipo, filtroEstado]);

    const cargarMovimientos = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('movimientos')
                .select(`
                    *,
                    usuarios:usuario_id (id, nombre),
                    sucursales:sucursal_id (id, nombre)
                `)
                .order('created_at', { ascending: false });

            // Filtrar por sucursal si está seleccionada
            if (sucursalSeleccionada?.id) {
                query = query.eq('sucursal_id', sucursalSeleccionada.id);
            }

            // Filtrar por tipo de movimiento
            if (filtroTipo !== 'todos') {
                query = query.eq('tipo_movimiento', filtroTipo);
            }

            // Filtrar por estado (SOLO si no es 'todos')
            if (filtroEstado !== 'todos') {
                query = query.eq('estado', filtroEstado);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // Procesar los datos para extraer información del JSON
            const movimientosProcesados = data.map(mov => ({
                ...mov,
                producto_nombre: mov.datos?.producto_nombre || 'N/A',
                producto_codigo: mov.datos?.producto_codigo || 'N/A',
                cantidad: mov.datos?.cantidad || 0,
                observaciones: mov.datos?.observaciones || mov.observaciones || '',
                fecha_movimiento: mov.datos?.fecha || mov.created_at,
                movimiento_anulado_id: mov.datos?.movimiento_anulado_id || null,
                tipo_original: mov.datos?.tipo_original || null,
                es_anulable: mov.estado === 'activo' &&
                    mov.tipo_movimiento !== 'anulacion' &&
                    mov.tipo_movimiento !== 'creacion_producto' &&
                    mov.tipo_movimiento !== 'actualizacion_producto' &&
                    mov.tipo_movimiento !== 'eliminacion_producto'
            }));

            setMovimientos(movimientosProcesados);
        } catch (err) {
            console.error('Error al cargar movimientos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Función para obtener el color y texto según el tipo de movimiento
    const getTipoMovimientoInfo = (tipo) => {
        const tipos = {
            'entrada_stock': {
                color: 'bg-emerald-100 text-emerald-800',
                icono: '📥',
                texto: 'Entrada de Stock'
            },
            'salida_stock': {
                color: 'bg-red-100 text-red-800',
                icono: '📤',
                texto: 'Salida de Stock'
            },
            'ajuste_stock': {
                color: 'bg-yellow-100 text-yellow-800',
                icono: '⚙️',
                texto: 'Ajuste de Stock'
            },
            'traslado_sucursal': {
                color: 'bg-blue-100 text-blue-800',
                icono: '🔄',
                texto: 'Traspaso'
            },
            'creacion_producto': {
                color: 'bg-purple-100 text-purple-800',
                icono: '✨',
                texto: 'Creación'
            },
            'actualizacion_producto': {
                color: 'bg-indigo-100 text-indigo-800',
                icono: '📝',
                texto: 'Actualización'
            },
            'eliminacion_producto': {
                color: 'bg-rose-100 text-rose-800',
                icono: '🗑️',
                texto: 'Eliminación'
            },
            'anulacion': {
                color: 'bg-gray-100 text-gray-600',
                icono: '🚫',
                texto: 'Anulación'
            }
        };
        return tipos[tipo] || { color: 'bg-gray-100 text-gray-800', icono: '📋', texto: tipo };
    };

    const handleAnularClick = (movimiento) => {
        setModalAnulacion({
            abierto: true,
            movimientoId: movimiento.id,
            movimiento: movimiento
        });
    };

    const handleConfirmarAnulacion = async (motivo) => {
        if (!motivo || motivo.trim() === '') {
            toast.error('Debe ingresar un motivo para la anulación');
            return;
        }

        setAnulando(modalAnulacion.movimientoId);
        const result = await anularMovimiento({
            movimientoId: modalAnulacion.movimientoId,
            usuarioId: currentUser?.id,
            motivo: motivo
        });

        if (result.success) {
            toast.success(result.message || 'Movimiento anulado correctamente');
            setModalAnulacion({ abierto: false, movimientoId: null, movimiento: null });
            cargarMovimientos();
            if (onMovimientoAnulado) onMovimientoAnulado();
        } else {
            toast.error(result.error || 'Error al anular el movimiento');
        }
        setAnulando(null);
    };

    // Filtrar por búsqueda
    const movimientosFiltrados = movimientos.filter(mov => {
        if (!busqueda) return true;
        const busquedaLower = busqueda.toLowerCase();
        return (
            mov.producto_nombre?.toLowerCase().includes(busquedaLower) ||
            mov.producto_codigo?.toLowerCase().includes(busquedaLower) ||
            mov.usuarios?.nombre?.toLowerCase().includes(busquedaLower) ||
            mov.observaciones?.toLowerCase().includes(busquedaLower)
        );
    });

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando movimientos...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-md p-8">
                <div className="text-center py-8">
                    <div className="text-red-600 text-5xl mb-4">❌</div>
                    <p className="text-red-600 font-semibold">Error al cargar los movimientos</p>
                    <p className="text-gray-600 text-sm mt-2">{error}</p>
                    <button
                        onClick={cargarMovimientos}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
            >
                {/* Header con filtros */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Historial de Movimientos
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Total: {movimientosFiltrados.length} movimientos
                                {filtroEstado === 'activo' && ' (Activos)'}
                                {filtroEstado === 'anulado' && ' (Anulados)'}
                                {filtroEstado === 'todos' && ' (Todos los estados)'}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            {/* Buscador */}
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar producto, usuario..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Filtro por tipo */}
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="todos">Todos los tipos</option>
                                <option value="entrada_stock">Entradas de Stock</option>
                                <option value="salida_stock">Salidas de Stock</option>
                                <option value="ajuste_stock">Ajustes de Stock</option>
                                <option value="traslado_sucursal">Traspasos</option>
                                <option value="anulacion">Anulaciones</option>
                                <option value="creacion_producto">Creaciones</option>
                                <option value="actualizacion_producto">Actualizaciones</option>
                                <option value="eliminacion_producto">Eliminaciones</option>
                            </select>

                            {/* Filtro por estado - Ahora con 'activo' por defecto */}
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="activo">✅ Solo Activos</option>
                                <option value="anulado">🚫 Solo Anulados</option>
                                <option value="todos">📋 Todos los estados</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cantidad
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sucursal
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Observaciones
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <AnimatePresence>
                                {movimientosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <p className="font-medium">No hay movimientos</p>
                                                <p className="text-sm">
                                                    {filtroEstado === 'activo' && 'No hay movimientos activos con los filtros actuales'}
                                                    {filtroEstado === 'anulado' && 'No hay movimientos anulados con los filtros actuales'}
                                                    {filtroEstado === 'todos' && 'No se encontraron movimientos con los filtros actuales'}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientosFiltrados.map((movimiento, index) => {
                                        const tipoInfo = getTipoMovimientoInfo(movimiento.tipo_movimiento);
                                        const esAnulado = movimiento.estado === 'anulado';
                                        const esAnulable = movimiento.es_anulable && !esAnulado;

                                        return (
                                            <motion.tr
                                                key={movimiento.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`hover:bg-gray-50 transition-colors ${esAnulado ? 'bg-gray-50 opacity-75' : ''}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                                    {new Date(movimiento.fecha_movimiento).toLocaleString('es-ES', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${tipoInfo.color}`}>
                                                        <span>{tipoInfo.icono}</span>
                                                        <span>{tipoInfo.texto}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {esAnulado ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            <span>🚫</span>
                                                            <span>Anulado</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            <span>✅</span>
                                                            <span>Activo</span>
                                                        </span>
                                                    )}

                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div>
                                                        <div className={`text-sm font-medium ${esAnulado ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                            {movimiento.producto_nombre}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Código: {movimiento.producto_codigo}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className={`text-sm font-semibold ${movimiento.tipo_movimiento === 'entrada_stock' ? 'text-emerald-600' :
                                                        movimiento.tipo_movimiento === 'salida_stock' ? 'text-red-600' :
                                                            movimiento.tipo_movimiento === 'anulacion' ? 'text-gray-500' :
                                                                'text-gray-900'
                                                        } ${esAnulado ? 'line-through' : ''}`}>
                                                        {movimiento.tipo_movimiento === 'entrada_stock' ? '+' :
                                                            movimiento.tipo_movimiento === 'salida_stock' ? '-' : ''}
                                                        {movimiento.cantidad}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                                    {movimiento.usuarios?.nombre || 'Sistema'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                                                    {movimiento.sucursales?.nombre || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-center text-gray-500 max-w-xs truncate" title={movimiento.observaciones}>
                                                    {movimiento.observaciones || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                    {esAnulable && (
                                                        <button
                                                            onClick={() => handleAnularClick(movimiento)}
                                                            disabled={anulando === movimiento.id}
                                                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium disabled:opacity-50"
                                                        >
                                                            {anulando === movimiento.id ? (
                                                                <>
                                                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                                                                    <span>Anulando...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span>🚫</span>
                                                                    <span>Anular</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Footer con resumen */}
                {movimientosFiltrados.length > 0 && (
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <div>
                                Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos
                                {filtroEstado !== 'todos' && ` (${filtroEstado === 'activo' ? 'activos' : 'anulados'})`}
                            </div>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span>Entradas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span>Salidas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span>Traspasos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                    <span>Anulados</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modal de confirmación de anulación */}
            <AnimatePresence>
                {modalAnulacion.abierto && (
                    <ModalConfirmarAnulacion
                        movimiento={modalAnulacion.movimiento}
                        onConfirmar={handleConfirmarAnulacion}
                        onCerrar={() => setModalAnulacion({ abierto: false, movimientoId: null, movimiento: null })}
                        loading={anulandoLoading}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// Componente Modal de confirmación de anulación
function ModalConfirmarAnulacion({ movimiento, onConfirmar, onCerrar, loading }) {
    const [motivo, setMotivo] = useState('');

    const tipoTexto = {
        'entrada_stock': 'aumento de stock',
        'salida_stock': 'salida de stock',
        'traslado_sucursal': 'traspaso'
    }[movimiento?.tipo_movimiento] || 'este movimiento';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onCerrar}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-full">
                            <span className="text-2xl">🚫</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Confirmar Anulación</h3>
                            <p className="text-sm text-gray-500">
                                {movimiento?.producto_nombre} - {movimiento?.cantidad} unidades
                            </p>
                        </div>
                    </div>

                    <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                            ⚠️ Esta acción revertirá completamente el {tipoTexto} realizado.
                            El stock volverá a su estado anterior.
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo de la anulación *
                        </label>
                        <textarea
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Ej: Error en el registro, duplicado, cantidad incorrecta, etc."
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCerrar}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirmar(motivo)}
                            disabled={loading || !motivo.trim()}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Anulando...' : 'Confirmar Anulación'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}