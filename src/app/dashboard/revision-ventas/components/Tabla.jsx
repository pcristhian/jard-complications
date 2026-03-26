import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, X, AlertCircle, Loader2 } from 'lucide-react';
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

    const [motivoRapido, setMotivoRapido] = useState(null);

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

    const MOTIVOS_RAPIDOS = [
        "Error en el monto",
        "Pedido duplicado",
        "Solicitud del cliente",
        "Producto no disponible",
    ];

    const COLORES = [
        "text-blue-300 bg-blue-950",
        "text-violet-300 bg-violet-950",
        "text-amber-300 bg-amber-950",
        "text-rose-300 bg-rose-950",
        "text-teal-300 bg-teal-950",
        "text-orange-300 bg-orange-950",
    ]
    const colorCaja = (caja) => {
        const hash = [...caja].reduce((acc, c) => acc + c.charCodeAt(0), 0)
        return COLORES[hash % COLORES.length]
    }

    const handleAnularVenta = (ventaId) => {
        setVentaAAnular(ventaId);
        setMotivoAnulacion("");
        setMotivoRapido(null);
        setMostrarModalAnulacion(true);
    };
    const motivoFinal = motivoRapido || motivoAnulacion.trim();
    const confirmarAnulacion = async () => {
        if (!motivoFinal) {
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
            await onAnularVenta(ventaAAnular, motivoFinal);
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
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                        {ventasSeguras.map((venta) => (
                            <tr key={venta.id}
                                className="hover:bg-slate-800/60 transition-colors duration-150 group">
                                <td className="px-1 py-1 text-center">
                                    <span className="text-xs font-medium text-slate-400 block">
                                        {new Date(venta.fecha_venta).toLocaleDateString()}
                                    </span>
                                    <span className="text-[11px] text-amber-400 font-medium">
                                        {new Date(venta.fecha_venta).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                </td>
                                <td className="px-2 py-2">
                                    <span className="text-xs font-mono font-semibold text-sky-300 bg-sky-950 px-1.5 py-0.5 rounded">
                                        {venta.producto_codigo}
                                    </span>
                                </td>
                                <td className="px-3 py-3 max-w-[260px]">
                                    <span className="text-sm text-slate-300 truncate block leading-snug">
                                        {venta.producto_nombre}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="text-xs font-medium text-slate-200 block leading-snug">
                                        {venta.usuarios?.nombre}
                                    </span>
                                    {venta.rol_nombre !== "promotor" ? (
                                        <span className="inline-block mt-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-950 px-1.5 py-0.5 rounded-full">
                                            {venta.rol_nombre}
                                        </span>
                                    ) : (
                                        <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${colorCaja(venta.usuarios?.caja)}`}>
                                            {venta.usuarios?.caja}
                                        </span>
                                    )}
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="text-sm text-slate-400">{venta.categoria_nombre}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="text-sm font-semibold text-slate-100">
                                        {venta.cantidad || "—"}
                                    </span>
                                </td>
                                <td className="px-1 py-2 text-sm text-slate-200 text-start">
                                    <span className="font-semibold">
                                        Bs. {parseFloat(venta.total_precio_venta).toFixed(2)}
                                    </span><br />
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
                                        <span className="px-1 py-2 text-center text-sm text-slate-200">
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
                                        ${venta.observaciones ? 'px-1 py-2 text-sm text-center text-slate-500' : 'px-1 py-2 text-sm text-center text-slate-200 font-bold'}`}>
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
                                <td className="px-2 whitespace-nowrap text-center text-sm font-medium">
                                    {venta.estado === "activa" && (
                                        <button
                                            onClick={() => handleAnularVenta(venta.id)}
                                            disabled={anulando === venta.id}
                                            className={`
        inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium
        border transition-all duration-150
        ${anulando === venta.id
                                                    ? "border-red-300 text-red-400 bg-red-50 opacity-60 cursor-not-allowed"
                                                    : "border-red-600 text-red-700 hover:bg-red-50 hover:border-red-700 active:scale-95 cursor-pointer"
                                                }
      `}
                                        >
                                            {anulando === venta.id ? (
                                                <>
                                                    <svg className="animate-spin w-3 h-3" viewBox="0 0 12 12" fill="none">
                                                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 6" />
                                                    </svg>
                                                    Anulando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none">
                                                        <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                                    </svg>
                                                    Anular
                                                </>
                                            )}
                                        </button>
                                    )}

                                    {venta.estado === "anulada" && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-gray-400 bg-gray-100 border border-gray-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                            Anulada
                                        </span>
                                    )}
                                </td>

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {mostrarModalAnulacion && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-4 border-b border-gray-100">
                                <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center">
                                    <AlertCircle className="w-5 h-5 text-red-700" />
                                </div>
                                <h2 className="text-base font-medium text-gray-900">Anular venta</h2>
                                <p className="text-sm text-gray-500 text-center leading-snug">
                                    Esta acción no se puede deshacer.<br />
                                    Selecciona o escribe el motivo.
                                </p>
                            </div>

                            {/* Body */}
                            <div className="px-6 py-4 flex flex-col gap-4">
                                {/* Chips */}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">Motivo rápido</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {MOTIVOS_RAPIDOS.map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => {
                                                    const nuevo = motivoRapido === m ? null : m;
                                                    setMotivoRapido(nuevo);
                                                    setMotivoAnulacion(nuevo ?? "");  // siempre sincroniza, limpia si deselecciona
                                                }}
                                                className={`text-xs px-3 py-2 rounded-lg border text-center transition-all ${motivoRapido === m
                                                    ? "border-red-600 bg-red-50 text-red-800 font-medium"
                                                    : "border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-700 hover:bg-red-50"
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea */}
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-1">
                                        Detalle adicional{" "}
                                        <span className="font-normal opacity-60">(opcional)</span>
                                    </p>
                                    <textarea
                                        className="w-full border border-gray-200 rounded-lg p-3 h-20 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none"
                                        placeholder="Describe el motivo con más detalle..."
                                        maxLength={200}
                                        value={motivoAnulacion}
                                        onChange={(e) => setMotivoAnulacion(e.target.value)}
                                    />
                                    <p className={`text-right text-xs mt-0.5 ${motivoAnulacion.length > 160 ? "text-amber-600" : "text-gray-400"
                                        }`}>
                                        {motivoAnulacion.length} / 200
                                    </p>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex gap-2 px-6 pb-5">
                                <button
                                    onClick={() => { setMostrarModalAnulacion(false); setMotivoRapido(null); }}
                                    className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmarAnulacion}
                                    disabled={(!motivoRapido && motivoAnulacion.trim().length < 3) || anulando === ventaAAnular}
                                    className="flex-[2] py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                    {anulando === ventaAAnular ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Anulando...
                                        </>
                                    ) : "Anular venta"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

        </motion.div >
    );
}