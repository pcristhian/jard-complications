// src/app/dashboard/ventas/components/Header.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, ShieldCheck, DollarSign } from 'lucide-react';

// Variantes definidas fuera del componente para evitar recreación en cada render
const containerVariants = {
    hidden: { opacity: 0, y: -12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
};

const chipVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.18, ease: "easeOut" },
    }),
};

const btnVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: (delay) => ({
        opacity: 1,
        y: 0,
        transition: { delay, duration: 0.18, ease: "easeOut" },
    }),
};

const CHIPS = [
    { icon: Building2, label: "Sucursal", key: "sucursal" },
    { icon: User, label: "Usuario", key: "usuario" },
    { icon: ShieldCheck, label: "Rol", key: "rol" },
];

export default function Header({
    onMostrarComisiones,
    onNuevaVenta,
    currentSucursal,
    rolNombre,
    currentUser,
    sucursalSeleccionada,
}) {
    const [ready, setReady] = useState(false);
    // Ref para evitar setState en componente desmontado
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!currentUser || !currentSucursal) return;
        // Diferimos un frame para asegurar que el DOM está pintado antes de animar
        const id = requestAnimationFrame(() => {
            if (mountedRef.current) setReady(true);
        });
        return () => cancelAnimationFrame(id);
    }, [currentUser, currentSucursal]);

    const chipValues = [
        currentSucursal?.nombre,
        currentUser?.nombre,
        rolNombre,
    ];

    return (
        // Un solo contenedor siempre montado — sin desmonte/remonte que cause doble animación
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-gray-800 divide-gray-700 p-3 rounded-xl shadow border border-slate-800 border-l-[3px] border-l-cyan-400"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                {/* Info */}
                <div className="flex-1">
                    <h1 className="text-base font-semibold text-slate-100 mb-2">
                        Revisión de ventas
                    </h1>

                    <div className="flex flex-wrap items-center gap-2 min-h-[28px]">
                        <AnimatePresence mode="wait">
                            {!ready ? (
                                // Skeleton de chips mientras carga
                                <motion.div
                                    key="skeleton"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                    className="flex gap-2"
                                >
                                    {[80, 72, 56].map((w) => (
                                        <div
                                            key={w}
                                            className="h-6 rounded-full bg-slate-800 border border-slate-700 animate-pulse"
                                            style={{ width: w }}
                                        />
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="chips"
                                    className="flex flex-wrap items-center gap-2"
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {CHIPS.map(({ icon: Icon, label }, i) => (
                                        <motion.div
                                            key={label}
                                            custom={i}
                                            variants={chipVariants}
                                            className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-1 rounded-full"
                                        >
                                            <Icon className="w-3.5 h-3.5 text-cyan-400" />
                                            <span className="text-slate-400 text-xs">{label}</span>
                                            <span className="text-slate-100 text-xs font-medium">
                                                {chipValues[i]}
                                            </span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {!ready ? (
                            // Skeleton de botones
                            <motion.div
                                key="btn-skeleton"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0.1 } }}
                                className="flex gap-2"
                            >
                                <div className="h-8 w-32 rounded-lg bg-slate-800 border border-slate-700 animate-pulse" />
                                <div className="h-8 w-24 rounded-lg bg-slate-800 animate-pulse" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="btns"
                                className="flex items-center gap-2"
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.button
                                    custom={0}
                                    variants={btnVariants}
                                    onClick={onMostrarComisiones}
                                    disabled={!sucursalSeleccionada || currentUser?.roles?.nombre !== 'admin'}
                                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="bg-slate-700 p-1 rounded-md">
                                        <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
                                    </span>
                                    Ver comisiones
                                </motion.button>

                                <motion.button
                                    custom={0.06}
                                    variants={btnVariants}
                                    onClick={onNuevaVenta}
                                    whileTap={{ scale: 0.96 }}
                                    className="inline-flex items-center gap-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <span className="text-base leading-none">+</span>
                                    Nueva venta
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </motion.div>
    );
}