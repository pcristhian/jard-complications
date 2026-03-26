// src/app/dashboard/ventas/components/Header.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Building2, User, ShieldCheck, DollarSign } from 'lucide-react';
export default function Header({
    onMostrarComisiones,
    onNuevaVenta,
    currentSucursal,
    rolNombre,
    currentUser,
    sucursalSeleccionada
}) {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !currentSucursal) return;
        setLoading(false);
    }, [currentUser, currentSucursal]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col mx-5 ">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Revision de Ventas
                        </h1>

                        <p className="text-gray-600 font-semibold">
                            Sucursal: {currentSucursal?.nombre}
                        </p>

                        <p className="text-gray-600 font-semibold">
                            Usuario: {currentUser?.nombre}
                        </p>

                        <p className="font-semibold">
                            Rol: {rolNombre}
                        </p>
                    </div>
                    <AnimatePresence>
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
                        </motion.div>
                    </AnimatePresence>
                </div>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando mis Filtros...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 border-l-[3px] border-l-blue-600"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Info */}
                <div className="flex-1">
                    <h1 className="text-base font-semibold text-gray-900 mb-2">
                        Revisión de ventas
                    </h1>
                    <div className="flex flex-wrap items-center gap-2">
                        {[
                            { icon: <Building2 className="w-3.5 h-3.5" />, label: "Sucursal", val: currentSucursal.nombre },
                            { icon: <User className="w-3.5 h-3.5" />, label: "Usuario", val: currentUser.nombre },
                            { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Rol", val: rolNombre },
                        ].map(({ icon, label, val }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 + i * 0.07, duration: 0.2 }}
                                className="inline-flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full"
                            >
                                <span className="text-blue-400 w-3.5 h-3.5">{icon}</span>
                                <span className="text-blue-400 text-xs">{label}</span>
                                <span className="text-blue-800 text-xs font-medium">{val}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2">
                    <motion.button
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.2 }}
                        onClick={onMostrarComisiones}
                        disabled={!sucursalSeleccionada || currentUser?.roles?.nombre !== 'admin'}
                        className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="bg-blue-100 p-1 rounded-md">
                            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        </span>
                        Ver comisiones
                    </motion.button>

                    <motion.button
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.24, duration: 0.2 }}
                        onClick={onNuevaVenta}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        <span className="text-base leading-none">+</span>
                        Nueva venta
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}