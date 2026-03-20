import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { toast } from "react-hot-toast";
export default function Tabla({
    onAnularVenta,
    onActualizarDepositado,
    onActualizarConfirmacionDepositado,
    currentUser,
    rolNombre,
    obtenerMisVentas,
    currentSucursal,
    ventas,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [anulando, setAnulando] = useState(null);
    const [actualizando, setActualizando] = useState(null);
    const [actualizandoConfirmacion, setActualizandoConfirmacion] = useState(null);
    const ventasSeguras = Array.isArray(ventas) ? ventas : [];
    //para barra de progreso en tabla
    const [scrollProgress, setScrollProgress] = useState(0);
    const tableContainerRef = useRef(null);

    //estados para modal anulacion
    const [mostrarModalAnulacion, setMostrarModalAnulacion] = useState(false);
    const [motivoAnulacion, setMotivoAnulacion] = useState("");
    const [ventaAAnular, setVentaAAnular] = useState(null);



    useEffect(() => {
        obtenerMisVentas();
        setLoading(false);
    }, [currentUser, currentSucursal]);

    // Nuevo efecto para el scroll
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
    }, [ventas]); // Se recalcula cuando cambian las ventas

    const handleAnularVenta = (ventaId) => {
        setVentaAAnular(ventaId);
        setMotivoAnulacion("");
        setMostrarModalAnulacion(true);
    };
    const confirmarAnulacion = async () => {
        if (!motivoAnulacion.trim()) {
            toast.custom((t) => (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ duration: 0.3 }}
                    className={`${t.visible ? "animate-enter" : "animate-leave"
                        } bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3`}
                >
                    <span className="text-xl">⚠️</span>
                    <span className="font-medium">¡Atención! Debe ingresar un motivo.</span>
                </motion.div>
            ), { position: 'top-right', duration: 400 });

            return;
        }

        setAnulando(ventaAAnular);

        try {
            await onAnularVenta(ventaAAnular, motivoAnulacion);
            await obtenerMisVentas();
        } catch (err) {
            alert("Error al anular venta: " + err.message);
        } finally {
            setAnulando(null);
            setMostrarModalAnulacion(false);
            setVentaAAnular(null);
        }
    };



    const handleToggleDepositado = async (ventaId, currentValue) => {
        const nuevoValor = !currentValue;
        const ventaIdStr = ventaId.toString();

        try {
            setActualizando(ventaIdStr);
            await onActualizarDepositado(ventaId, nuevoValor);

        } catch (err) {
            alert("Error al actualizar depósito: " + err.message);
        } finally {
            setActualizando(null);
        }
    };
    const handleToggleConfirmacionDepositado = async (ventaId, currentValue) => {
        const nuevoValor = !currentValue;
        const ventaIdStr = ventaId.toString();

        try {
            setActualizandoConfirmacion(ventaIdStr);
            await onActualizarConfirmacionDepositado(ventaId, nuevoValor);

            toast.success(
                `Confirmación ${nuevoValor ? 'activada' : 'desactivada'} correctamente`,
                {
                    duration: 3000,
                    icon: nuevoValor ? '✅' : '↩️',
                }
            );
        } catch (err) {
            // Toast de error
            toast.error(`Error al actualizar depósito: ${err.message}`, {
                duration: 4000,
            });
        } finally {
            setActualizandoConfirmacion(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-8 rounded-lg shadow text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando mis ventas...</p>
            </div>
        );
    }

    if (!navigator.onLine) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0, y: -120 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl shadow-lg border border-yellow-200 text-center"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 3
                        }}
                        className="inline-block mb-4"
                    >
                        <WifiOff className="w-12 h-12 text-yellow-600 mx-auto" />
                    </motion.div>

                    <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-yellow-800 text-xl font-bold mb-2"
                    >
                        Sin conexión a internet
                    </motion.h3>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-yellow-700 mb-4"
                    >
                        Revisa tu conexión e inténtalo nuevamente.
                    </motion.p>

                    <motion.button
                        initial={{ scale: 5 }}
                        animate={{ scale: 1 }}
                        onClick={() => window.location.reload()}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reintentar
                    </motion.button>
                </motion.div>
            </AnimatePresence>
        );
    }

    if (ventas.length === 0) {
        return (
            <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500 text-lg">No hay ventas registradas</p>
                <p className="text-gray-400">Comience creando una nueva venta</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <p className="text-red-600 font-semibold">Error: {error}</p>
                <button
                    onClick={obtenerMisVentas}
                    className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
                >
                    Reintentar
                </button>
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
                    <thead className="sticky top-0 bg-gray-500 z-50 text-white">
                        <tr>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Fecha <br /> Venta
                            </th>
                            <th className="px-2 py-3 text-start text-xs font-medium uppercase tracking-wider">
                                Codigo
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Promotor/a
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Categoria
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Precio
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Comision
                            </th>
                            {rolNombre === "admin" && (
                                <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                    Observaciones
                                </th>
                            )}

                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Deposito <br /> Confirmado
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ventasSeguras.map((venta) => (
                            <tr key={venta.id} className="hover:bg-gray-50 relative group">
                                <td className="px-1 py-1 text-sm text-center text-gray-900">
                                    {new Date(venta.fecha_venta).toLocaleDateString()} <br />
                                    <span className="text-xs text-orange-600">
                                        {new Date(venta.fecha_venta).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                </td>
                                <td className="px-2 py-2 w-min text-sm font-medium text-gray-900">
                                    {venta.producto_codigo}
                                </td>
                                <td className="px-1 py-2 w-min text-sm text-start text-gray-900"
                                    style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {venta.producto_nombre}
                                </td>
                                <td className="px-1 py-2 text-center text-sm whitespace-nowrap leading-[1]">
                                    {venta.usuarios?.nombre} <br />
                                    {venta.rol_nombre !== 'promotor' ?
                                        <span className="text-blue-600 font-semibold text-[12px]"> {venta.rol_nombre}</span>
                                        : <span className="text-green-600 font-semibold text-[12px]"> {venta.usuarios?.caja}</span>
                                    }
                                </td>
                                <td className="px-1 py-2 text-sm text-center text-gray-900">
                                    {venta.categoria_nombre}
                                </td>
                                <td className="px-1 py-2 text-sm text-center font-semibold text-gray-900">
                                    {venta.cantidad || "sin datos"}
                                </td>
                                <td className="px-1 py-2 text-sm text-gray-900 text-start">
                                    <span className="font-semibold"> Bs. {parseFloat(venta.total_precio_venta).toFixed(2)}</span><br />
                                    {venta.descuento_venta ? (
                                        <span className="text-[12px] font-semibold text-orange-600">
                                            Bs. - {parseFloat(venta.descuento_venta).toFixed(2)} desc. <br />
                                            {venta.cantidad === 1 && (
                                                <>
                                                    <span className="text-blue-500 text-[12px] text-center font-semibold">
                                                        Bs. {parseFloat(venta.producto_precio).toFixed(2)} x unid
                                                    </span>
                                                </>
                                            )}  </span>

                                    ) : ''}
                                    {venta.cantidad > 1 && (
                                        <>
                                            <span className="text-blue-500 text-[12px] text-center font-semibold">
                                                Bs. {parseFloat(venta.producto_precio).toFixed(2)} x unid
                                            </span>
                                        </>
                                    )}
                                </td>
                                <td className="px-1 py-2 text-center text-sm font-semibold">
                                    {venta.productos?.comision_variable ?
                                        <span>Bs. {parseFloat(venta.productos?.comision_variable).toFixed(2)}</span>
                                        :
                                        <span className="px-1 py-2 text-center text-sm text-gray-900">
                                            {(() => {
                                                const reglas = venta.productos?.categorias?.reglas_comision
                                                return reglas?.comision_base > 0
                                                    ? <span>
                                                        Bs. {parseFloat(reglas.comision_base).toFixed(2)}
                                                    </span>
                                                    : "—";
                                            })()}
                                        </span>
                                    }
                                </td>
                                {rolNombre === "admin" && (
                                    <td className={`
                                        ${venta.observaciones ? 'px-1 py-2 text-sm text-center text-orange-600' : 'px-1 py-2 text-sm text-center text-gray-700 font-bold'}`}>
                                        {venta.observaciones ?
                                            <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block" }}>
                                                "{venta.observaciones}"</span>
                                            : <span> - </span>}
                                    </td>
                                )}
                                <td className="px-1 py-2 text-center whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={venta.confirmacion_depositado}
                                        onChange={() => handleToggleConfirmacionDepositado(venta.id, venta.confirmacion_depositado)}
                                        disabled={venta.estado === "anulada" || actualizandoConfirmacion === venta.id.toString()}
                                        className={`h-4 w-4 text-blue-600 rounded ml-3 ${venta.estado === 'activa' ? 'cursor-pointer' : 'cursor-not-allowed'} ${actualizandoConfirmacion === venta.id.toString() ? 'opacity-50' : ''}`}
                                        style={{
                                            accentColor: venta.confirmacion_depositado ? '#2f9e2fff' : '#ec1b1bff'
                                        }}
                                    />
                                </td>
                                <td className="px-2 py-2 whitespace-nowrap text-center text-sm">
                                    {venta.estado === "activa" ? (
                                        <span className="inline-block bg-green-100 text-green-800 font-semibold text-xs px-3 py-1 rounded-lg shadow-sm">
                                            activa
                                        </span>
                                    ) : (
                                        <span className="inline-block bg-orange-100 text-orange-800 font-semibold text-xs px-3 py-1 rounded-lg shadow-sm">
                                            anulada
                                        </span>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {
                mostrarModalAnulacion && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.06 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.08 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
                        >
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                                Anular Venta
                            </h2>

                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Motivo de anulación
                            </label>

                            <textarea
                                className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-red-500"
                                placeholder="Escriba el motivo..."
                                value={motivoAnulacion}
                                onChange={(e) => setMotivoAnulacion(e.target.value)}
                            />

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setMostrarModalAnulacion(false)}
                                    className="px-4 py-2 bg-gray-200 cursor-pointer hover:bg-gray-300 rounded-lg"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={confirmarAnulacion}
                                    className="px-4 py-2 bg-red-600  cursor-pointer hover:bg-red-700 text-white rounded-lg"
                                >
                                    {anulando === ventaAAnular ? "Anulando..." : "Anular"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )
            }

        </motion.div >
    );
}