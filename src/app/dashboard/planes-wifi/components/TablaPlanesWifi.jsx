// components/PlanesWifi/TablaPlanesWifi.jsx
'use client';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function TablaPlanesWifi({
    planes,
    onEditar,
    onCambiarEstado,
    loading: loadingProp,
    onRefresh
}) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [filtroMes, setFiltroMes] = useState('');
    const [filtroAnio, setFiltroAnio] = useState('');
    const [soloActivos, setSoloActivos] = useState(false);
    const [añosDisponibles, setAñosDisponibles] = useState([]);
    const [mesesDisponibles, setMesesDisponibles] = useState([]);
    const [updatingEstadoId, setUpdatingEstadoId] = useState(null);
    const [forceUpdate, setForceUpdate] = useState(0); // Para forzar actualización si es necesario
    const tableContainerRef = useRef(null);
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;

    // Establecer filtro al mes actual al cargar
    useEffect(() => {
        const fechaActual = new Date();
        setFiltroMes(fechaActual.getMonth() + 1);
        setFiltroAnio(fechaActual.getFullYear());
    }, []);

    // Calcular años y meses disponibles basados en los planes
    useEffect(() => {
        if (!planes || planes.length === 0) {
            setAñosDisponibles([]);
            setMesesDisponibles([]);
            return;
        }

        const años = [...new Set(planes.map(plan => {
            const fecha = new Date(plan.fecha);
            return fecha.getFullYear();
        }))].sort((a, b) => b - a);

        setAñosDisponibles(años);

        let meses = [];
        if (filtroAnio) {
            meses = [...new Set(planes
                .map(plan => {
                    const fecha = new Date(plan.fecha);
                    if (fecha.getFullYear() === parseInt(filtroAnio)) {
                        return fecha.getMonth() + 1;
                    }
                    return null;
                })
                .filter(m => m !== null)
            )].sort((a, b) => a - b);
        } else {
            meses = [...new Set(planes
                .map(plan => {
                    const fecha = new Date(plan.fecha);
                    return fecha.getMonth() + 1;
                })
                .filter(m => m !== null)
            )].sort((a, b) => a - b);
        }

        setMesesDisponibles(meses);
    }, [planes, filtroAnio]);

    // Scroll progress
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
    }, [planes]);

    // Manejar cambio de estado con actualización suave
    const handleCambiarEstado = async (id, estadoId) => {
        setUpdatingEstadoId(id);

        try {
            const resultado = await onCambiarEstado(id, estadoId);
            if (resultado.success) {
                // Forzar una actualización suave de la UI
                setForceUpdate(prev => prev + 1);

                // Mostrar feedback sutil
                const fila = document.getElementById(`plan-row-${id}`);
                if (fila) {
                    fila.classList.add('bg-green-50');
                    setTimeout(() => {
                        fila.classList.remove('bg-green-50');
                    }, 500);
                }
            } else {
                alert('Error al cambiar estado: ' + resultado.error);
            }
        } catch (error) {
            alert('Error al cambiar estado: ' + error.message);
        } finally {
            setUpdatingEstadoId(null);
        }
    };

    const meses = [
        { value: 1, nombre: 'Enero' },
        { value: 2, nombre: 'Febrero' },
        { value: 3, nombre: 'Marzo' },
        { value: 4, nombre: 'Abril' },
        { value: 5, nombre: 'Mayo' },
        { value: 6, nombre: 'Junio' },
        { value: 7, nombre: 'Julio' },
        { value: 8, nombre: 'Agosto' },
        { value: 9, nombre: 'Septiembre' },
        { value: 10, nombre: 'Octubre' },
        { value: 11, nombre: 'Noviembre' },
        { value: 12, nombre: 'Diciembre' }
    ];

    const planesFiltrados = useMemo(() => {
        let resultado = planes;

        if (filtroMes || filtroAnio) {
            resultado = resultado.filter(plan => {
                const fechaPlan = new Date(plan.fecha);
                const cumpleMes = filtroMes ? fechaPlan.getMonth() + 1 === parseInt(filtroMes) : true;
                const cumpleAnio = filtroAnio ? fechaPlan.getFullYear() === parseInt(filtroAnio) : true;
                return cumpleMes && cumpleAnio;
            });
        }

        if (soloActivos) {
            resultado = resultado.filter(plan => plan.estado_id === 1 || plan.estado_id === 2);
        }

        return resultado;
    }, [planes, filtroMes, filtroAnio, soloActivos, forceUpdate]);

    const getEstadoColor = (estadoId) => {
        switch (estadoId) {
            case 1: return 'bg-yellow-300 text-yellow-800';
            case 2: return 'bg-green-300 text-green-800';
            case 3: return 'bg-red-300 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const toTitleCase = (text) => {
        if (!text) return '';
        return text.toLowerCase().split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const manejarCambioMes = (e) => {
        setFiltroMes(e.target.value);
    };

    const manejarCambioAnio = (e) => {
        setFiltroAnio(e.target.value);
        setFiltroMes('');
    };

    const manejarCambioActivos = (e) => {
        setSoloActivos(e.target.checked);
    };

    const limpiarFiltros = () => {
        const fechaActual = new Date();
        setFiltroMes(fechaActual.getMonth() + 1);
        setFiltroAnio(fechaActual.getFullYear());
        setSoloActivos(false);
    };

    const mostrarBotonLimpiar = filtroMes !== '' || filtroAnio !== '' || soloActivos;
    const tieneFiltrosActivos = filtroMes !== '' || filtroAnio !== '' || soloActivos;

    if (loadingProp && planes.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando planes WiFi...</p>
                </div>
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
            {/* Filtros integrados */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500 font-medium">Año:</label>
                            <select
                                value={filtroAnio}
                                onChange={manejarCambioAnio}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todos los años</option>
                                {añosDisponibles.map((a) => (
                                    <option key={a} value={a}>
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-500 font-medium">Mes:</label>
                            <select
                                value={filtroMes}
                                onChange={manejarCambioMes}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Todos los meses</option>
                                {mesesDisponibles.map((m) => {
                                    const mesData = meses.find(mes => mes.value === m);
                                    return (
                                        <option key={m} value={m}>
                                            {mesData?.nombre || m}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={soloActivos}
                                    onChange={manejarCambioActivos}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 font-medium">
                                    Solo activos (Pendientes y Completados)
                                </span>
                            </label>
                        </div>

                        <AnimatePresence>
                            {mostrarBotonLimpiar && (
                                <motion.div
                                    initial={{ scale: 0, opacity: 0, x: -20 }}
                                    animate={{ scale: 1, opacity: 1, x: 0 }}
                                    exit={{ scale: 0, opacity: 0, x: -20 }}
                                    transition={{
                                        duration: 0.3,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 20
                                    }}
                                    className='flex items-center gap-2'
                                >
                                    <button
                                        onClick={limpiarFiltros}
                                        className="px-3 py-2 text-sm text-white bg-red-500 ring ring-red-300 rounded-md hover:bg-red-700 cursor-pointer transition-colors"
                                    >
                                        Restablecer filtros
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {tieneFiltrosActivos && (
                        <div className="text-xs text-gray-500">
                            {filtroAnio && `Año: ${filtroAnio} `}
                            {filtroMes && `· Mes: ${meses.find(m => m.value === parseInt(filtroMes))?.nombre} `}
                            {soloActivos && '· Solo activos'}
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="sticky top-0 z-50 w-full bg-gray-200 h-1 overflow-hidden">
                <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ duration: 0 }}
                />
            </div>

            {/* Tabla */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto max-h-[73vh] overflow-y-auto"
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 bg-gray-50 z-40">
                        <tr>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider w-12">#</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Código</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Cliente</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Plan</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Celular</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Instalación (Bs)</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Estado</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Fecha</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Promotor</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Observación</th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {planesFiltrados.map((plan, index) => (
                            <motion.tr
                                key={`${plan.id}-${forceUpdate}`}
                                id={`plan-row-${plan.id}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                className="hover:bg-gray-50 group transition-colors duration-300"
                            >
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-500">
                                    {index + 1}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-medium">
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-md">
                                        {plan.codigo_cliente}
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-left whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    {toTitleCase(plan.nombre_cliente)}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-black">
                                    {plan.nombre_plan}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-black">
                                    {plan.celular_cliente}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap font-medium text-sm">
                                    <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-md">
                                        Bs. {parseFloat(plan.costo).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap">
                                    <select
                                        value={plan.estado_id}
                                        onChange={(e) => handleCambiarEstado(plan.id, parseInt(e.target.value))}
                                        disabled={updatingEstadoId === plan.id}
                                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all ${getEstadoColor(plan.estado_id)} focus:bg-white focus:text-gray-700 focus:ring-0 focus:outline-none ${updatingEstadoId === plan.id ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        <option value={1}>Pendiente</option>
                                        <option value={2}>Completado</option>
                                        <option value={3}>Cancelado</option>
                                    </select>
                                    {updatingEstadoId === plan.id && (
                                        <div className="inline-block ml-2">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                                    {new Date(plan.fecha).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm">
                                    {plan.usuario ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-white text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1 rounded-lg shadow-sm">
                                                {plan.usuario.nombre}
                                            </span>
                                            <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold transition-colors duration-300 ${plan.usuario.caja === 'promotor' || plan.usuario.roles?.nombre === 'promotor'
                                                    ? 'bg-green-500 text-white'
                                                    : plan.usuario.caja === 'admin' || plan.usuario.roles?.nombre === 'admin'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-gray-500 text-white'
                                                }`}>
                                                {plan.usuario.caja || plan.usuario.roles?.nombre || 'Sin rol'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-500">Sin datos</span>
                                    )}
                                </td>
                                <td className="px-2 py-3 text-center text-sm text-gray-500 max-w-xs truncate" title={plan.observacion || ''}>
                                    {plan.observacion || '-'}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => onEditar(plan)}
                                        className="rounded-full px-2 py-1 transition-colors text-blue-900 cursor-pointer hover:text-blue-600 bg-blue-100"
                                    >
                                        Editar
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {planesFiltrados.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    {planes.length === 0
                        ? 'No hay planes WiFi registrados'
                        : 'No se encontraron planes para el período seleccionado'}
                </div>
            )}

            {/* Footer con resumen */}
            {planesFiltrados.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <div>
                            Mostrando {planesFiltrados.length} de {planes.length} planes
                            {tieneFiltrosActivos && ' (filtrados)'}
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
                                <span>Pendientes: {planesFiltrados.filter(p => p.estado_id === 1).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-300"></div>
                                <span>Completados: {planesFiltrados.filter(p => p.estado_id === 2).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-300"></div>
                                <span>Cancelados: {planesFiltrados.filter(p => p.estado_id === 3).length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span>Total ingresos: Bs. {planesFiltrados
                                    .filter(p => p.estado_id === 2)
                                    .reduce((sum, plan) => sum + (plan.costo || 0), 0)
                                    .toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}