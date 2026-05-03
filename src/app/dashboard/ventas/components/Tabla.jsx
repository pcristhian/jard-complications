import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, RefreshCw, X, AlertCircle, Loader2, Hash } from 'lucide-react';
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

    // Estados para infinite scroll
    const [displayCount, setDisplayCount] = useState(20);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const ventasSeguras = Array.isArray(ventas) ? ventas : [];

    // Calcular ventas a mostrar basado en displayCount
    const ventasToShow = useMemo(() => {
        return ventasSeguras.slice(0, displayCount);
    }, [ventasSeguras, displayCount]);

    // Verificar si hay más datos para cargar
    useEffect(() => {
        setHasMore(displayCount < ventasSeguras.length);
    }, [displayCount, ventasSeguras.length]);

    // Resetear displayCount cuando cambien las ventas (por filtros)
    useEffect(() => {
        setDisplayCount(20);
        setHasMore(true);
        setIsLoadingMore(false);
    }, [ventasSeguras.length]);

    //para barra de progreso en tabla
    const [scrollProgress, setScrollProgress] = useState(0);
    const tableContainerRef = useRef(null);
    const loadMoreTriggerRef = useRef(null);

    //estados para modal anulacion
    const [mostrarModalAnulacion, setMostrarModalAnulacion] = useState(false);
    const [motivoAnulacion, setMotivoAnulacion] = useState("");
    const [ventaAAnular, setVentaAAnular] = useState(null);
    const [motivoRapido, setMotivoRapido] = useState(null);

    // Función para cargar más registros
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        await new Promise(resolve => setTimeout(resolve, 300));

        setDisplayCount(prev => Math.min(prev + 20, ventasSeguras.length));
        setIsLoadingMore(false);
    }, [isLoadingMore, hasMore, ventasSeguras.length]);

    // Observador de intersección para infinite scroll
    useEffect(() => {
        if (!loadMoreTriggerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1, rootMargin: "100px" }
        );

        observer.observe(loadMoreTriggerRef.current);

        return () => {
            if (loadMoreTriggerRef.current) {
                observer.unobserve(loadMoreTriggerRef.current);
            }
        };
    }, [hasMore, isLoadingMore, loadMore, ventasToShow.length]);

    useEffect(() => {
        obtenerMisVentas();
        setLoading(false);
    }, [currentUser, currentSucursal]);

    // Efecto para el scroll (barra de progreso)
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
    }, [ventasToShow]);

    const MOTIVOS_RAPIDOS = [
        "Error en el monto",
        "Pedido duplicado",
        "Solicitud del cliente",
        "Producto no disponible",
    ];

    const COLORES = [
        "text-white bg-violet-950",
        "text-white bg-fuchsia-900",
        "text-white bg-teal-600",
        "text-white bg-neutral-800",
        "text-orange-300 bg-orange-950",
    ];

    const colorCaja = (caja) => {
        if (!caja) return COLORES[0];
        const hash = [...caja].reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return COLORES[hash % COLORES.length];
    };

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
            toast.error(`Error al actualizar depósito: ${err.message}`, {
                duration: 4000,
            });
        } finally {
            setActualizandoConfirmacion(null);
        }
    };

    // Renderizado condicional (loading, offline, sin datos, error)
    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="bg-white border border-gray-200 border-l-[3px] border-l-blue-500 rounded-xl flex flex-col items-center justify-center text-center min-h-[60vh] shadow-sm"
            >
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 20 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 border border-gray-200 mb-6"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-blue-500"
                    />
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.18, ease: "easeOut" }}
                    className="text-gray-800 text-base font-semibold mb-1"
                >
                    Cargando ventas
                </motion.p>
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24, duration: 0.18, ease: "easeOut" }}
                    className="text-gray-500 text-sm"
                >
                    Esto tomará solo un momento...
                </motion.p>
            </motion.div>
        );
    }

    if (!navigator.onLine) {
        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key="offline"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="bg-white border border-slate-800 border-l-[3px] border-l-amber-400 rounded-xl flex flex-col items-center justify-center text-center min-h-[60vh]"
                >
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 20 }}
                        className="flex items-center justify-center mx-auto mb-6 w-16 h-16 rounded-full bg-slate-800 border border-slate-700"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.12, 1], rotate: [0, -6, 6, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
                        >
                            <WifiOff className="w-7 h-7 text-amber-400" />
                        </motion.div>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.18, ease: "easeOut" }}
                        className="text-slate-200 text-base font-semibold mb-1"
                    >
                        Sin conexión a internet
                    </motion.p>
                    <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24, duration: 0.18, ease: "easeOut" }}
                        className="text-slate-500 text-sm mb-6"
                    >
                        Revisa tu conexión e inténtalo nuevamente.
                    </motion.p>
                    <motion.button
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.18, ease: "easeOut" }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-900 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reintentar
                    </motion.button>
                </motion.div>
            </AnimatePresence>
        );
    }

    if (ventasSeguras.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="bg-white border border-gray-200 border-l-[3px] border-l-blue-500 rounded-xl flex flex-col items-center justify-center text-center min-h-[60vh] shadow-sm"
            >
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 20 }}
                    className="flex items-center justify-center mx-auto mb-6 w-16 h-16 rounded-full bg-gray-50 border border-gray-200"
                >
                    <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 0h6M3 17h18M5 17V9a2 2 0 012-2h10a2 2 0 012 2v8" />
                    </svg>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.18, ease: "easeOut" }}
                    className="text-gray-800 text-base font-semibold mb-1"
                >
                    No hay ventas registradas
                </motion.p>
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24, duration: 0.18, ease: "easeOut" }}
                    className="text-gray-500 text-sm"
                >
                    Comience creando una nueva venta
                </motion.p>
            </motion.div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="bg-slate-950 border border-slate-800 border-l-[3px] border-l-red-500 rounded-xl flex flex-col items-center justify-center text-center min-h-[60vh]"
            >
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 20 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-6"
                >
                    <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.18, ease: "easeOut" }}
                    className="text-slate-200 text-base font-semibold mb-1"
                >
                    Ocurrió un error
                </motion.p>
                <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24, duration: 0.18, ease: "easeOut" }}
                    className="text-slate-500 text-sm mb-6 max-w-xs"
                >
                    {error}
                </motion.p>
                <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.18, ease: "easeOut" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={obtenerMisVentas}
                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-red-800 text-red-400 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reintentar
                </motion.button>
            </motion.div>
        );
    }

    // Renderizado principal con infinite scroll y números consecutivos
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
                    <thead className="sticky top-0 bg-slate-600 z-50 text-white">
                        <tr>
                            {/* Nueva columna de número consecutivo */}
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider w-12">
                                <div className="flex items-center justify-center gap-1">
                                    <Hash className="w-3 h-3" />
                                    <span>N°</span>
                                </div>
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-2 py-3 text-start text-xs font-medium uppercase tracking-wider">
                                Código
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Producto
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Promotor/a
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Categoría
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Cantidad
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Precio
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Comisión
                            </th>
                            {rolNombre === "admin" && (
                                <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                    Observaciones
                                </th>
                            )}
                            <th className="px-1 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Depositado
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wider">
                                Estado
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-amber-50/30 divide-y divide-amber-200/50">
                        {ventasToShow.map((venta, index) => (
                            <tr key={venta.id}
                                className="hover:bg-amber-50 transition-colors duration-150 group">
                                {/* Celda del número consecutivo */}
                                <td className="px-1 py-2 text-center">
                                    <span className="text-xs font-mono font-bold text-black bg-cyan-950/50 px-2 py-1 rounded-md">
                                        #{index + 1}
                                    </span>
                                </td>
                                <td className="px-1 py-1 text-center">
                                    <span className="text-xs font-bold text-black block">
                                        {new Date(venta.fecha_venta).toLocaleDateString()}
                                    </span>
                                    <span className="text-[11px] text-amber-600 font-semibold   block">
                                        {new Date(venta.fecha_venta).toLocaleTimeString([], { hour12: false })}
                                    </span>
                                </td>
                                <td className="px-2 py-2">
                                    <span className="text-xs tracking-widest font-mono font-semibold text-sky-300 bg-sky-950 px-1.5 py-0.5 rounded">
                                        {venta.producto_codigo}
                                    </span>
                                </td>
                                <td className="px-1 py-3 max-w-[260px] overflow-hidden">
                                    <div className="relative group">
                                        <span className="
            absolute left-0 top-0 whitespace-nowrap text-sm text-black block leading-snug
            transition-none
            group-hover:transition-transform
            group-hover:duration-[6000ms]
            group-hover:ease-linear
            group-hover:-translate-x-full
        ">
                                            {venta.producto_nombre}
                                        </span>
                                        <span className="invisible whitespace-nowrap text-sm text-slate-300 block leading-snug">
                                            {venta.producto_nombre}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="text-xs font-semibold text-black block leading-snug">
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
                                    <span className="text-sm text-black">{venta.categoria_nombre}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                    <span className="text-sm font-semibold text-black">
                                        {venta.cantidad || "—"}
                                    </span>
                                </td>
                                <td className="px-1 py-2 text-sm text-black text-start">
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
                                        <span className="px-1 py-2 text-center text-sm text-black font-semibold">
                                            {(() => {
                                                const reglas = venta.productos?.categorias?.reglas_comision;
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
                                        ${venta.observaciones ? 'px-1 py-2 text-[12px] text-center text-indigo-700' : 'px-1 py-2 text-sm text-center text-black'}`}>
                                        {venta.observaciones ?
                                            <span style={{ maxWidth: "190px", overflow: "hidden", textOverflow: "ellipsis", display: "inline-block" }}>
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
                                                    : "border-red-600 text-red-700 hover:bg-red-500 hover:border-red-700 hover:text-white active:scale-95 cursor-pointer"
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
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-950 border border-gray-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            Anulada
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Trigger para infinite scroll */}
                {hasMore && (
                    <div ref={loadMoreTriggerRef} className="py-4 flex justify-center items-center">
                        {isLoadingMore ? (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-sm">Cargando más ventas...</span>
                            </div>
                        ) : (
                            <div className="h-8" />
                        )}
                    </div>
                )}

                {/* Indicador de que ya no hay más datos */}
                {!hasMore && ventasSeguras.length > 20 && (
                    <div className="py-4 text-center">
                        <p className="text-xs text-slate-500">
                            Mostrando {ventasSeguras.length} de {ventasSeguras.length} ventas
                        </p>
                    </div>
                )}
            </div>

            {/* Modal de anulación (sin cambios) */}
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
                            <div className="px-6 py-4 flex flex-col gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-2">Motivo rápido</p>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        {MOTIVOS_RAPIDOS.map((m) => (
                                            <button
                                                key={m}
                                                onClick={() => {
                                                    const nuevo = motivoRapido === m ? null : m;
                                                    setMotivoRapido(nuevo);
                                                    setMotivoAnulacion(nuevo ?? "");
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
        </motion.div>
    );
}
