"use client";

import { useVentasEstadisticas } from "../hooks/useVentasEstadisticas";
import { useEffect, useMemo, Fragment } from "react";
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
    ShoppingCart
} from "lucide-react";

export default function ModalComisionesPorUsuario({ abierto, onCerrar }) {
    const {
        ventas,
        loading,
        error,
        currentSucursal,
        calcularComision
    } = useVentasEstadisticas();

    // Extraer todas las categorías únicas con sus reglas de comisión
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

    // Función para obtener los datos de un usuario en una categoría específica
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

    const totalGeneralComisiones = useMemo(() => {
        return ventas?.reduce((total, usuario) => total + calcularComisionTotalUsuario(usuario), 0) || 0;
    }, [ventas]);

    useEffect(() => {
        if (ventas && ventas.length > 0) {
            console.log("=== VENTAS Y COMISIONES DESDE MODAL ===");
            console.log("Total de usuarios con ventas:", ventas.length);
            console.log("Categorías únicas:", todasLasCategorias);
            console.log("Totales por categoría:", totalesPorCategoria);

            ventas.forEach(usuario => {
                console.log(`\n📊 ${usuario.usuario_nombre}: ${calcularTotalUsuario(usuario)} productos | $${calcularComisionTotalUsuario(usuario).toFixed(2)} comisión`);
                usuario.categorias?.forEach(categoria => {
                    console.log(`   ├─ ${categoria.categoria_nombre}: ${categoria.cantidad} ventas | $${categoria.comision.toFixed(2)}`);
                });
            });
        }
    }, [ventas, todasLasCategorias, totalesPorCategoria]);

    // Formatear dinero
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Función para obtener color según categoría
    const getCategoryColor = (index) => {
        const colors = [
            'bg-gradient-to-r from-cyan-500 to-blue-500',
            'bg-gradient-to-r from-emerald-500 to-green-500',
            'bg-gradient-to-r from-amber-500 to-orange-500',
            'bg-gradient-to-r from-purple-500 to-pink-500',
            'bg-gradient-to-r from-rose-500 to-red-500',
            'bg-gradient-to-r from-violet-500 to-indigo-500',
            'bg-gradient-to-r from-teal-500 to-cyan-500',
            'bg-gradient-to-r from-lime-500 to-emerald-500'
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onCerrar}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 pointer-events-auto"
                        >
                            {/* Header */}
                            <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                                                <Award className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                                Comisiones por Promotor
                                            </h2>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                                                <ShoppingCart className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{currentSucursal?.nombre || "Sucursal actual"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                                                <Users className="w-4 h-4 text-emerald-500" />
                                                <span>{ventas.length} promotores</span>
                                            </div>
                                            <div className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-gray-200">
                                                <Package className="w-4 h-4 text-amber-500" />
                                                <span>{totalGeneralProductos} productos vendidos</span>
                                            </div>
                                        </div>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.1, rotate: 90 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onCerrar}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <X className="w-10 h-10 cursor-pointer" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Contenido - Tabla */}
                            <div className="flex-1 overflow-auto bg-gradient-to-b from-white to-gray-50/50">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-64">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"
                                        />
                                        <p className="text-gray-600 font-medium">Calculando comisiones...</p>
                                        <p className="text-sm text-gray-500 mt-1">Por favor espere</p>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center justify-center h-64 p-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mb-4">
                                            <X className="w-8 h-8 text-red-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
                                        <p className="text-gray-600 text-center mb-6 max-w-md">{error}</p>
                                        <button
                                            onClick={onCerrar}
                                            className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:shadow-lg transition-shadow font-medium"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                ) : !ventas || ventas.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 p-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
                                            <BarChart3 className="w-8 h-8 text-amber-500" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Sin datos</h3>
                                        <p className="text-gray-600 text-center mb-6">No hay ventas registradas para mostrar.</p>
                                        <button
                                            onClick={onCerrar}
                                            className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl hover:shadow-lg transition-shadow font-medium"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="min-w-full">
                                        <table className="min-w-full divide-y divide-gray-200/50">
                                            <thead className="bg-gradient-to-r from-gray-50 to-white/80 backdrop-blur-sm sticky top-0 shadow-sm">
                                                <tr>
                                                    {/* Columna Vendedores */}
                                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider bg-white/90 sticky left-0 z-20 min-w-[220px] border-r border-gray-200/50">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-blue-500" />
                                                            <span>Vendedores</span>
                                                        </div>
                                                    </th>

                                                    {/* Columnas de Categorías - Cantidad y Comisión */}
                                                    {todasLasCategorias.map((categoria, index) => (
                                                        <th
                                                            key={categoria.nombre}
                                                            colSpan={2}
                                                            className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider"
                                                        >
                                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${getCategoryColor(index)} bg-opacity-10 border border-gray-200/50`}>
                                                                <Package className="w-4 h-4" />
                                                                <span className="font-bold">{categoria.nombre}</span>
                                                            </div>
                                                            <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1">
                                                                    <Package className="w-3 h-3" />
                                                                    Cantidad
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <DollarSign className="w-3 h-3" />
                                                                    Comisión
                                                                </span>
                                                            </div>
                                                        </th>
                                                    ))}

                                                    {/* Columnas Totales */}
                                                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider bg-gradient-to-r from-gray-50 to-white/90" colSpan={2}>
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 text-white">
                                                            <TrendingUp className="w-4 h-4" />
                                                            <span>Total</span>
                                                        </div>
                                                        <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Package className="w-3 h-3" />
                                                                Cantidad
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <DollarSign className="w-3 h-3" />
                                                                Comisión
                                                            </span>
                                                        </div>
                                                    </th>

                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-gray-200/30">
                                                {ventas.map((usuario, usuarioIndex) => {
                                                    const totalUsuario = calcularTotalUsuario(usuario);
                                                    const totalComisionUsuario = calcularComisionTotalUsuario(usuario);

                                                    return (
                                                        <motion.tr
                                                            key={`usuario-${usuario.usuario_id || usuarioIndex}`}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: usuarioIndex * 0.05 }}
                                                            className={`hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-white/80 transition-colors ${usuarioIndex % 2 === 0 ? 'bg-white/50' : 'bg-gray-50/30'}`}
                                                        >
                                                            {/* Celda Vendedor */}
                                                            <td className="px-6 py-4 whitespace-nowrap bg-white/90 sticky left-0 z-10 min-w-[220px] border-r border-gray-200/50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${usuario.usuario_rol === 'admin' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`}>
                                                                        <span className="text-white font-bold text-sm">
                                                                            {usuario.usuario_nombre.charAt(0)}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-gray-900">{usuario.usuario_nombre}</div>
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            {usuario.usuario_rol === 'admin' ? (
                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200">
                                                                                    <Shield className="w-3 h-3" />
                                                                                    {usuario.usuario_rol}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200">
                                                                                    <ShoppingCart className="w-3 h-3" />
                                                                                    {usuario.usuario_rol} - {usuario.usuario_caja}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Celdas de Cantidades y Comisiones por Categoría */}
                                                            {todasLasCategorias.map((categoria, catIndex) => {
                                                                const datos = obtenerDatosPorCategoria(usuario, categoria.nombre);
                                                                return (
                                                                    <Fragment key={`${usuario.usuario_id}-${categoria.nombre}-${catIndex}`}>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                                            {datos.cantidad > 0 ? (
                                                                                <motion.span
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 font-bold border border-cyan-200 shadow-sm"
                                                                                >
                                                                                    {datos.cantidad}
                                                                                </motion.span>
                                                                            ) : (
                                                                                <span className="text-gray-400">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                                                                            {datos.comision > 0 ? (
                                                                                <motion.span
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 font-semibold border border-emerald-200 shadow-sm"
                                                                                >
                                                                                    Bs. {parseFloat(datos.comision).toFixed(2)}
                                                                                </motion.span>
                                                                            ) : (
                                                                                <span className="text-gray-400">-</span>
                                                                            )}
                                                                        </td>
                                                                    </Fragment>
                                                                );
                                                            })}

                                                            {/* Celdas Total */}
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-center bg-gradient-to-r from-gray-50 to-white/50">
                                                                <motion.span
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 text-white font-bold shadow-lg"
                                                                >
                                                                    {totalUsuario}
                                                                </motion.span>
                                                            </td>

                                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-center bg-gradient-to-r from-gray-50 to-white/50">
                                                                <motion.span
                                                                    initial={{ scale: 0 }}
                                                                    animate={{ scale: 1 }}
                                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-lg"
                                                                >
                                                                    Bs. {parseFloat(totalComisionUsuario).toFixed(2)}
                                                                </motion.span>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </tbody>

                                            {/* Footer - Totales por Categoría */}
                                            <tfoot className="bg-gradient-to-r from-gray-50 to-white/90 backdrop-blur-sm border-t border-gray-200/50 sticky bottom-0">
                                                <tr>
                                                    <td className="px-6 py-4 text-sm font-bold text-gray-900 bg-white/90 sticky left-0 z-10 border-r border-gray-200/50">
                                                        <div className="flex items-center gap-2">
                                                            <TrendingUp className="w-4 h-4 text-gray-700" />
                                                            <span>TOTALES</span>
                                                        </div>
                                                    </td>

                                                    {todasLasCategorias.map((categoria, index) => (
                                                        <Fragment key={`footer-${categoria.nombre}-${index}`}>
                                                            <td className="px-4 py-4 text-sm font-bold text-center">
                                                                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-md">
                                                                    {totalesPorCategoria[categoria.nombre]?.cantidad || 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-4 text-sm font-bold text-center">
                                                                <span className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-md">
                                                                    Bs. {parseFloat(totalesPorCategoria[categoria.nombre]?.comision || 0).toFixed(2)}
                                                                </span>
                                                            </td>
                                                        </Fragment>
                                                    ))}

                                                    <td className="px-4 py-4 text-sm font-bold text-center">
                                                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold shadow-lg">
                                                            {Object.values(totalesPorCategoria).reduce((a, b) => a + (b.cantidad || 0), 0)}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-4 text-sm font-bold text-center">
                                                        <span className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold shadow-lg">
                                                            Bs. {parseFloat(Object.values(totalesPorCategoria).reduce((a, b) => a + (b.comision || 0), 0)).toFixed(2)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-white to-gray-50/80 flex justify-between items-center">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span>{todasLasCategorias.length} categorías</span>
                                    </div>
                                    <div className="w-px h-4 bg-gray-300"></div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        <span>Mes actual</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}