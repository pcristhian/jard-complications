// components/PlanesWifi/TablaPlanesWifi.jsx
'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function TablaPlanesWifi({
    planes,
    soloActivos,
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
        let resultado = planes;

        // Filtrar por mes y año
        if (filtroMes || filtroAnio) {
            resultado = resultado.filter(plan => {
                const fechaPlan = new Date(plan.fecha);
                const cumpleMes = filtroMes ? fechaPlan.getMonth() + 1 === parseInt(filtroMes) : true;
                const cumpleAnio = filtroAnio ? fechaPlan.getFullYear() === parseInt(filtroAnio) : true;
                return cumpleMes && cumpleAnio;
            });
        }

        // Filtrar solo activos (pendiente=1 o completado=2)
        if (soloActivos) {
            resultado = resultado.filter(plan => plan.estado_id === 1 || plan.estado_id === 2);
        }

        return resultado;
    }, [planes, filtroMes, filtroAnio, soloActivos]);

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

    const getEstadoNombre = (estadoId) => {
        switch (estadoId) {
            case 1: return 'Pendiente';
            case 2: return 'Completado';
            case 3: return 'Cancelado';
            default: return 'Desconocido';
        }
    };

    // Función para obtener el color del badge del rol
    const getRolColor = (rolNombre) => {
        if (!rolNombre) return 'bg-gray-100 text-gray-700';
        switch (rolNombre.toLowerCase()) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'vendedor':
                return 'bg-blue-100 text-blue-800';
            case 'tecnico':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-700';
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
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider w-12">
                                #
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Código
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Plan
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Celular
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Instalación (Bs)
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Promotor
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Observación
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {planesFiltrados.map((plan, index) => (
                            <tr key={plan.id} className="hover:bg-gray-50 group">
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
                                        onChange={(e) => onCambiarEstado(plan.id, parseInt(e.target.value))}
                                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${getEstadoColor(plan.estado_id)} focus:bg-white focus:text-gray-700 focus:ring-0 focus:outline-none`}
                                    >
                                        <option value={1}>Pendiente</option>
                                        <option value={2}>Completado</option>
                                        <option value={3}>Cancelado</option>
                                    </select>
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

                                            <span className={`text-[10px] rounded-full px-2 py-0.5 font-bold ${plan.usuario.caja === 'promotor' || plan.usuario.roles?.nombre === 'promotor'
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