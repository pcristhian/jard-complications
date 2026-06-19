// ModalComisionesPorUsuario.jsx
"use client";

import { useVentasEstadisticas } from "../hooks/useVentasEstadisticas";
import { useEffect, useMemo, Fragment, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Users,
    TrendingUp,
    DollarSign,
    Package,
    Award,
    Calendar,
    Filter,
    BarChart3,
    Shield,
    ShoppingCart,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

export default function ModalComisionesPorUsuario({ abierto, onCerrar }) {
    const {
        ventas: ventasOriginal,
        loading,
        error,
        currentSucursal,
        calcularComision,
        mesSeleccionado,
        cambiarMes,
        obtenerMesesDisponibles,
        obtenerMisVentas, // ← IMPORTANTE: agregar esta función
        productosExcluidos
    } = useVentasEstadisticas();

    const [mesesDisponibles, setMesesDisponibles] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Ordenar ventas por comisión total de mayor a menor
    const ventas = useMemo(() => {
        if (!ventasOriginal || ventasOriginal.length === 0) return [];
        return [...ventasOriginal].sort((a, b) => {
            const comisionA = a.categorias?.reduce((total, cat) => total + (cat.comision || 0), 0) || 0;
            const comisionB = b.categorias?.reduce((total, cat) => total + (cat.comision || 0), 0) || 0;
            return comisionB - comisionA;
        });
    }, [ventasOriginal]);

    // Recargar datos cuando se abre el modal
    useEffect(() => {
        if (abierto) {
            setMesesDisponibles(obtenerMesesDisponibles());
            // Forzar recarga de datos al abrir el modal
            refrescarDatos();
        }
    }, [abierto]);

    // Función para refrescar los datos
    const refrescarDatos = async () => {
        setRefreshing(true);
        await obtenerMisVentas(mesSeleccionado);
        setRefreshing(false);
    };

    // Función para cambiar de mes y recargar
    const cambiarAMes = async (fecha) => {
        await cambiarMes(fecha);
    };

    // Resto del código igual...
    // (mantén todas las demás funciones y el renderizado igual)

    // Extraer todas las categorías únicas
    const todasLasCategorias = useMemo(() => {
        if (!ventas || ventas.length === 0) return [];
        const categoriasMap = new Map();
        ventas.forEach(usuario => {
            usuario.categorias?.forEach(cat => {
                if (cat.categoria_nombre) {
                    categoriasMap.set(cat.categoria_nombre, {
                        nombre: cat.categoria_nombre,
                        reglas_comision: cat.reglas_comision
                    });
                }
            });
        });
        return Array.from(categoriasMap.values());
    }, [ventas]);

    // Calcular totales por categoría
    const totalesPorCategoria = useMemo(() => {
        const totales = {};
        todasLasCategorias.forEach(cat => {
            totales[cat.nombre] = {
                cantidad: 0,
                comision: 0
            };
        });

        ventas?.forEach(usuario => {
            usuario.categorias?.forEach(cat => {
                if (cat.categoria_nombre && cat.cantidad) {
                    totales[cat.categoria_nombre] = {
                        cantidad: (totales[cat.categoria_nombre]?.cantidad || 0) + cat.cantidad,
                        comision: (totales[cat.categoria_nombre]?.comision || 0) + cat.comision
                    };
                }
            });
        });

        return totales;
    }, [ventas, todasLasCategorias]);

    // Función para obtener datos por categoría
    const obtenerDatosPorCategoria = (usuario, categoriaNombre) => {
        const categoria = usuario.categorias?.find(cat =>
            cat.categoria_nombre === categoriaNombre
        );
        return {
            cantidad: categoria?.cantidad || 0,
            comision: categoria?.comision || 0
        };
    };

    // Calcular total por usuario
    const calcularTotalUsuario = (usuario) => {
        return usuario.categorias?.reduce((total, cat) => total + (cat.cantidad || 0), 0) || 0;
    };

    // Calcular comisión total por usuario
    const calcularComisionTotalUsuario = (usuario) => {
        return usuario.categorias?.reduce((total, cat) => total + (cat.comision || 0), 0) || 0;
    };

    // Calcular total general
    const totalGeneralProductos = useMemo(() => {
        return ventas?.reduce((total, usuario) => total + calcularTotalUsuario(usuario), 0) || 0;
    }, [ventas]);

    // Función para cambiar al mes anterior
    const mesAnterior = async () => {
        const nuevaFecha = new Date(mesSeleccionado);
        nuevaFecha.setMonth(nuevaFecha.getMonth() - 1);
        await cambiarAMes(nuevaFecha);
    };

    // Función para cambiar al mes siguiente
    const mesSiguiente = async () => {
        const nuevaFecha = new Date(mesSeleccionado);
        nuevaFecha.setMonth(nuevaFecha.getMonth() + 1);
        const hoy = new Date();
        if (nuevaFecha <= hoy) {
            await cambiarAMes(nuevaFecha);
        }
    };

    // Formatear dinero
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Formatear mes para mostrar
    const formatearMes = (fecha) => {
        return fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    };

    // Función para obtener color según categoría
    const getCategoryColor = (index) => {
        const colors = [
            'from-cyan-500 to-blue-500',
            'from-emerald-500 to-green-500',
            'from-amber-500 to-orange-500',
            'from-purple-500 to-pink-500',
            'from-rose-500 to-red-500',
            'from-violet-500 to-indigo-500',
            'from-teal-500 to-cyan-500',
            'from-lime-500 to-emerald-500'
        ];
        return colors[index % colors.length];
    };

    if (!abierto) return null;

    return (
        <AnimatePresence>
            {abierto && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                        onClick={onCerrar}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 pointer-events-auto"
                        >
                            {/* Header con botón de refrescar */}
                            <div className="flex justify-between items-center px-5 py-3 border-b border-gray-100 bg-white">
                                <div className="flex items-center gap-3">
                                    <Award className="w-5 h-5 text-gray-700" />
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Comisiones por Promotor
                                    </h2>

                                    {/* Selector de Mes */}
                                    <div className="flex items-center gap-1 ml-4">
                                        <button
                                            onClick={mesAnterior}
                                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="relative">
                                            <select
                                                value={`${mesSeleccionado.getFullYear()}-${String(mesSeleccionado.getMonth() + 1).padStart(2, '0')}`}
                                                onChange={async (e) => {
                                                    const [year, month] = e.target.value.split('-');
                                                    const nuevaFecha = new Date(parseInt(year), parseInt(month) - 1, 1);
                                                    await cambiarAMes(nuevaFecha);
                                                }}
                                                className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-1.5 pr-8 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 cursor-pointer"
                                            >
                                                {mesesDisponibles.map((mes) => (
                                                    <option key={mes.valor} value={mes.valor}>
                                                        {mes.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        </div>
                                        <button
                                            onClick={mesSiguiente}
                                            disabled={new Date() <= new Date(mesSeleccionado.getFullYear(), mesSeleccionado.getMonth(), 1)}
                                            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Botón de refrescar */}
                                    <button
                                        onClick={refrescarDatos}
                                        disabled={refreshing || loading}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
                                        title="Refrescar datos"
                                    >
                                        <svg
                                            className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>

                                    <div className="flex items-center gap-3 ml-2 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {ventas.length}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {totalGeneralProductos}
                                        </span>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onCerrar}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Contenido - Tabla */}
                            <div className="flex-1 overflow-auto bg-gray-50">
                                {loading || refreshing ? (
                                    <div className="flex flex-col items-center justify-center h-64">
                                        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mb-3" />
                                        <p className="text-sm text-gray-500">
                                            {refreshing ? 'Actualizando datos...' : `Cargando datos de ${formatearMes(mesSeleccionado)}...`}
                                        </p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center h-64 p-6">
                                        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-3">
                                            <X className="w-6 h-6 text-red-500" />
                                        </div>
                                        <p className="text-sm text-gray-600 text-center">{error}</p>
                                        <button
                                            onClick={onCerrar}
                                            className="mt-4 px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                ) : !ventas || ventas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 p-6">
                                        <BarChart3 className="w-12 h-12 text-gray-300 mb-3" />
                                        <p className="text-sm text-gray-500">No hay ventas no depositadas en {formatearMes(mesSeleccionado)}</p>
                                        {productosExcluidos > 0 && (
                                            <p className="text-xs text-amber-600 mt-2">
                                                ⚠️ {productosExcluidos} productos fueron excluidos por estar depositados
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="min-w-full">
                                        {/* Tabla - mantener igual */}
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-100 sticky top-0">
                                                <tr className="border-b border-gray-200">
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase sticky left-0 bg-gray-100 z-10 w-20">
                                                    </th>
                                                    {todasLasCategorias.map((categoria, index) => (
                                                        <th
                                                            key={categoria.nombre}
                                                            colSpan={2}
                                                            className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase w-15"
                                                        >
                                                            <span className={`inline-block px-2 py-0.5 text-[11px] w-30 font-semibold bg-gradient-to-r ${getCategoryColor(index)} text-white rounded`}>
                                                                {categoria.nombre}
                                                            </span>
                                                        </th>
                                                    ))}
                                                    <th colSpan={2} className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase bg-gray-100">
                                                        Total
                                                    </th>
                                                </tr>
                                                <tr className="border-b border-gray-200">
                                                    <th className="px-4 py-1.5 text-left text-xs text-gray-500 sticky left-0 bg-gray-100 z-10 w-15">
                                                        Promotor
                                                    </th>
                                                    {todasLasCategorias.map((categoria) => (
                                                        <Fragment key={`sub-${categoria.nombre}`}>
                                                            <th className="px-2 py-1.5 text-center text-[12px] font-bold text-olive-600 w-15">
                                                                Cantidad
                                                            </th>
                                                            <th className="px-2 py-1.5 text-center text-[12px] font-bold text-green-600 w-15">
                                                                Comisión
                                                            </th>
                                                        </Fragment>
                                                    ))}
                                                    <th className="px-2 py-1.5 text-center text-[12px] font-bold text-olive-600 w-15">
                                                        Cantidad
                                                    </th>
                                                    <th className="px-2 py-1.5 text-center text-[12px] font-bold text-green-600 w-15">
                                                        Comisión
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {ventas.map((usuario, usuarioIndex) => {
                                                    const totalUsuario = calcularTotalUsuario(usuario);
                                                    const totalComisionUsuario = calcularComisionTotalUsuario(usuario);

                                                    return (
                                                        <motion.tr
                                                            key={`usuario-${usuario.usuario_id || usuarioIndex}`}
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: usuarioIndex * 0.03 }}
                                                            className={`border-b border-gray-100 hover:bg-gray-100/50 transition-colors ${usuarioIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                                        >
                                                            <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-inherit z-10">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${usuario.usuario_rol === 'admin' ? 'bg-gray-700' : 'bg-gray-600'}`}>
                                                                        {usuario.usuario_nombre.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-medium text-gray-900 text-sm">{usuario.usuario_nombre}</div>
                                                                        <div className="text-[10px] text-gray-500">
                                                                            {usuario.usuario_rol === 'admin' ? (
                                                                                <span className="flex items-center gap-0.5">
                                                                                    <Shield className="w-2.5 h-2.5" />
                                                                                    admin
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                                                    {usuario.usuario_caja}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {todasLasCategorias.map((categoria, catIndex) => {
                                                                const datos = obtenerDatosPorCategoria(usuario, categoria.nombre);
                                                                return (
                                                                    <Fragment key={`${usuario.usuario_id}-${categoria.nombre}-${catIndex}`}>
                                                                        <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                                                                            {datos.cantidad > 0 ? (
                                                                                <span className="font-bold text-gray-700">
                                                                                    {datos.cantidad}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-black">—</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-2 py-2 whitespace-nowrap text-left font-bold text-sm">
                                                                            {datos.comision > 0 ? (
                                                                                <span className="font-bold text-emerald-600">
                                                                                    Bs. {datos.comision.toFixed(0)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-black">—</span>
                                                                            )}
                                                                        </td>
                                                                    </Fragment>
                                                                );
                                                            })}

                                                            <td className="px-2 py-2 whitespace-nowrap text-center">
                                                                <span className="font-semibold text-gray-800 text-sm">
                                                                    {totalUsuario}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-left">
                                                                <span className="font-semibold text-emerald-700 text-sm">
                                                                    Bs. {totalComisionUsuario.toFixed(0)}
                                                                </span>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>

                                            {/* Footer */}
                                            <tfoot className="bg-gray-100  border-gray-200 sticky bottom-0 border-t-2 border-t-gray-400">
                                                <tr>
                                                    <td className="px-4 py-2 text-xs font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                                                        TOTAL
                                                    </td>
                                                    {todasLasCategorias.map((categoria, index) => (
                                                        <Fragment key={`footer-${categoria.nombre}-${index}`}>
                                                            <td className="px-2 py-2 text-center font-bold text-sm">
                                                                <span className="text-gray-700">
                                                                    {totalesPorCategoria[categoria.nombre]?.cantidad || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-2 py-2 text-left text-sm font-bold">
                                                                <span className="text-emerald-700">
                                                                    Bs. {(totalesPorCategoria[categoria.nombre]?.comision || 0).toFixed(0)}
                                                                </span>
                                                            </td>
                                                        </Fragment>
                                                    ))}
                                                    <td className="px-2 py-2 text-center">
                                                        <span className="text-sm font-bold text-gray-800">
                                                            {Object.values(totalesPorCategoria).reduce((a, b) => a + (b.cantidad || 0), 0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-left">
                                                        <span className="text-sm font-bold text-emerald-700">
                                                            Bs. {Object.values(totalesPorCategoria).reduce((a, b) => a + (b.comision || 0), 0).toFixed(0)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer con información y productos excluidos */}
                            <div className="px-5 py-2 border-t border-gray-100 bg-white flex justify-between items-center text-xs text-black">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {formatearMes(mesSeleccionado)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        Total comisiones: Bs. {Object.values(totalesPorCategoria).reduce((a, b) => a + (b.comision || 0), 0).toFixed(0)}
                                    </span>
                                    {productosExcluidos > 0 && (
                                        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            {productosExcluidos} producto{productosExcluidos !== 1 ? 's' : ''} excluido{productosExcluidos !== 1 ? 's' : ''} de comisiones (observados)
                                        </span>
                                    )}
                                </div>
                                <div className="text-[12px] text-black font-semibold">
                                    Última actualización: {new Date().toLocaleTimeString()}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}