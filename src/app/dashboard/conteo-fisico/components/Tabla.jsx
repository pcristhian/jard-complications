'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";

export default function Tabla({
    productos,
    loading,
    sucursalSeleccionada,
    filtro = '',
    categoriaFiltro = '',
    soloActivos = false
}) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const tableContainerRef = useRef(null);

    // Efecto para el scroll
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
    }, [productos]);

    const colorGroups = {
        informacion: "bg-blue-50/30 border-blue-100",
        codigos: "bg-green-50/30 border-green-100",
        stock: "bg-amber-50/30 border-amber-100",
        input: "bg-purple-50/30 border-purple-100",
        separador: "bg-gray-100/50",
    };


    // Filtrar productos
    const productosFiltrados = useMemo(() => {
        return productos.filter(producto => {
            const coincideTexto =
                producto.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
                producto.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
                producto.precio.toString().includes(filtro) ||
                parseFloat(producto.precio).toFixed(2).includes(filtro);

            const coincideCategoria = categoriaFiltro
                ? producto.categorias?.id === Number(categoriaFiltro)
                : true;

            const coincideActivo = soloActivos ? producto.activo : true;

            return coincideTexto && coincideCategoria && coincideActivo;
        });
    }, [productos, filtro, categoriaFiltro, soloActivos]);

    if (loading && productos.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow">
                <div className="p-6 text-center">
                    <p>Cargando productos...</p>
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
            {/* Barra de progreso del scroll */}
            <div className="sticky top-0 z-50 w-full bg-gray-200 h-1 overflow-hidden">
                <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: `${scrollProgress}%` }}
                    transition={{ duration: 0 }}
                />
            </div>

            {/* Tabla para desktop - visible solo en pantallas grandes */}
            <div className="hidden lg:block">
                <div
                    ref={tableContainerRef}
                    className="overflow-x-auto max-h-[73vh] overflow-y-auto"
                >
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="sticky top-0 bg-gray-50 z-40">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Descripción
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {productosFiltrados.map((producto) => (
                                <tr key={producto.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {producto.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {producto.descripcion || 'Sin descripción'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-mono uppercase">
                                        {producto.codigo}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {producto.categorias?.nombre || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="flex flex-col">
                                            <span>Actual: {producto.stock_actual}</span>
                                            <span className="text-xs text-gray-500">Mín: {producto.stock_minimo}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <input
                                            type="text"
                                            placeholder="Input aquí"
                                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        // Aquí puedes agregar onChange, value, etc.
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


            <div className="lg:hidden">
                <div
                    ref={tableContainerRef}
                    className="overflow-x-auto max-h-[75vh] overflow-y-auto"
                >
                    <table className="min-w-full divide-y divide-gray-200">
                        <tbody className="divide-y divide-gray-200">
                            <AnimatePresence>
                                {productosFiltrados.map((producto, index) => (
                                    <motion.tr
                                        key={producto.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.03 }}
                                        exit={{ opacity: 0 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td colSpan="2" className="p-0">
                                            <div className="space-y-0 p-1">
                                                {/* Grupo 1: Información básica */}
                                                <motion.div
                                                    className={`p-1 rounded-lg ${colorGroups.informacion} border`}
                                                    whileHover={{ scale: 1.005 }}
                                                    transition={{ type: "spring", stiffness: 400 }}
                                                >
                                                    <div className="grid grid-cols-4 gap-1 items-start">
                                                        {/* Nombre */}
                                                        <div className="col-span-3">
                                                            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-0">
                                                                Nombre
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900 leading-tight">
                                                                {producto.nombre}
                                                            </div>
                                                        </div>

                                                        {/* Categoría */}
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-0">
                                                                Categoría
                                                            </div>
                                                            <div className="text-xs text-gray-600 font-medium">
                                                                {producto.categorias?.nombre || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Descripción */}
                                                    {producto.descripcion && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            className="mt-0 pt-0 border-t border-blue-100/50"
                                                        >
                                                            <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-0">
                                                                Descripción
                                                            </div>
                                                            <div className="text-xs text-gray-600 leading-relaxed">
                                                                {producto.descripcion?.trim() || 'Sin descripción'}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </motion.div>

                                                {/* Grupo 2: Códigos y Stock */}
                                                <div className="grid grid-cols-2 gap-1">
                                                    {/* Código */}
                                                    <motion.div
                                                        className={`p-1 rounded-lg ${colorGroups.codigos} border`}
                                                        whileHover={{ scale: 1.01 }}
                                                        transition={{ type: "spring", stiffness: 400 }}
                                                    >
                                                        <div className="text-[10px] font-semibold text-green-700 uppercase tracking-wider mb-0">
                                                            Código
                                                        </div>
                                                        <div className="text-sm font-mono font-bold text-gray-900">
                                                            {producto.codigo}
                                                        </div>
                                                    </motion.div>

                                                    {/* Stock Actual */}
                                                    <motion.div
                                                        className={`p-1 rounded-lg ${colorGroups.stock} border`}
                                                        whileHover={{ scale: 1.01 }}
                                                        transition={{ type: "spring", stiffness: 400 }}
                                                    >
                                                        <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-0">
                                                            Stock Actual
                                                        </div>
                                                        <div className="text-lg font-bold text-gray-900 text-center">
                                                            {producto.stock_actual}
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                {/* Grupo 3: Input para Stock Hoy */}
                                                <motion.div
                                                    className={`p-2 rounded-lg ${colorGroups.input} border`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                    whileHover={{ scale: 1.005 }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider mb-0.5">
                                                                Stock Hoy
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Actualizar cantidad
                                                            </div>
                                                        </div>
                                                        <motion.div
                                                            className="w-24"
                                                            whileFocus={{ scale: 1.02 }}
                                                        >
                                                            <input
                                                                type="number"
                                                                placeholder="-"
                                                                className="w-full px-2 py-1.5 text-gray-900 font-bold text-center border-2 border-purple-300 rounded-lg text-sm bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition-all"
                                                            // Agrega aquí tus handlers
                                                            />
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            </div>

                                            {/* Separador animado */}
                                            <motion.div
                                                className={`h-1 ${colorGroups.separador} mt-2 mb-2 mx-2 rounded-full`}
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ delay: 0.2 }}
                                            />
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Empty state mejorado */}
            {productosFiltrados.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                    {!sucursalSeleccionada
                        ? 'Selecciona una sucursal para ver los productos'
                        : productos.length === 0
                            ? `No hay productos registrados en ${sucursalSeleccionada.nombre}`
                            : 'No se encontraron productos con ese filtro o están inactivos.'
                    }
                </div>
            )}
        </motion.div>
    );
}