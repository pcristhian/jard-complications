// components/PlanesWifi/TablaPlanesWifi.jsx
'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function TablaPlanesWifi({
    planes,
    onEditar,
    onCambiarEstado,
    loading,
    filtroMes,
    filtroAnio
}) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const tableContainerRef = useRef(null);
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;

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

    const planesFiltrados = useMemo(() => {
        if (!filtroMes && !filtroAnio) return planes;

        return planes.filter(plan => {
            const fechaPlan = new Date(plan.fecha);
            const cumpleMes = filtroMes ? fechaPlan.getMonth() + 1 === parseInt(filtroMes) : true;
            const cumpleAnio = filtroAnio ? fechaPlan.getFullYear() === parseInt(filtroAnio) : true;
            return cumpleMes && cumpleAnio;
        });
    }, [planes, filtroMes, filtroAnio]);

    const getEstadoColor = (estadoId) => {
        switch (estadoId) {
            case 1: return 'bg-yellow-100 text-yellow-800';
            case 2: return 'bg-green-100 text-green-800';
            case 3: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoNombre = (estadoId) => {
        switch (estadoId) {
            case 1: return 'Pendiente';
            case 2: return 'Completado';
            case 3: return 'Cancelado';
            default: return 'Desconocido';
        }
    };

    if (loading && planes.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 text-center">
                    <p>Cargando planes WiFi...</p>
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
            <div className="sticky top-0 z-50 w-full bg-gray-200 h-1 overflow-hidden">
                <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ duration: 0 }}
                />
            </div>

            <div
                ref={tableContainerRef}
                className="overflow-x-auto max-h-[73vh] overflow-y-auto"
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 bg-gray-50 z-40">
                        <tr>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código Cliente
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Plan
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Celular
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Costo (Bs)
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Vendedor
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Observación
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {planesFiltrados.map((plan) => (
                            <tr key={plan.id} className="hover:bg-gray-50 group">
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-medium text-gray-900">
                                    {plan.codigo_cliente}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-gray-900 font-semibold">
                                    {plan.nombre_cliente}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                                    {plan.nombre_plan}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                                    {plan.celular_cliente}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap font-medium text-sm text-gray-900">
                                    Bs. {parseFloat(plan.costo).toFixed(2)}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap">
                                    {currentUser?.roles?.nombre === 'admin' ? (
                                        <select
                                            value={plan.estado_id}
                                            onChange={(e) => onCambiarEstado(plan.id, parseInt(e.target.value))}
                                            className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getEstadoColor(plan.estado_id)}`}
                                        >
                                            <option value={1}>Pendiente</option>
                                            <option value={2}>Completado</option>
                                            <option value={3}>Cancelado</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getEstadoColor(plan.estado_id)}`}>
                                            {getEstadoNombre(plan.estado_id)}
                                        </span>
                                    )}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                                    {new Date(plan.fecha).toLocaleDateString()}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm text-gray-600">
                                    {plan.usuario?.nombre || 'N/A'}
                                </td>
                                <td className="px-2 py-3 text-left text-sm text-gray-500 max-w-xs truncate" title={plan.observacion || ''}>
                                    {plan.observacion || '-'}
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => currentUser?.roles?.nombre === 'admin' && onEditar(plan)}
                                        disabled={currentUser?.roles?.nombre !== 'admin'}
                                        className={`
                                            rounded-full px-2 py-1 transition-colors
                                            ${currentUser?.roles?.nombre === 'admin'
                                                ? 'text-blue-900 cursor-pointer hover:text-blue-600 bg-blue-100'
                                                : 'text-gray-400 cursor-not-allowed bg-gray-100'
                                            }
                                        `}
                                    >
                                        Editar
                                    </button>
                                </td>
                            </tr>
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
        </motion.div>
    );
}