import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function Tabla({
    productos,
    onEditar,
    loading,
    sucursalSeleccionada,
    filtro = '',
    categoriaFiltro = '',
    soloActivos = false
}) {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [visibleCount, setVisibleCount] = useState(20); // Cantidad inicial
    const tableContainerRef = useRef(null);
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;

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

    // Resetear contador cuando cambian los filtros
    useEffect(() => {
        setVisibleCount(20);
    }, [filtro, categoriaFiltro, soloActivos]);

    // Productos visibles (primeros N)
    const productosVisibles = useMemo(() => {
        return productosFiltrados.slice(0, visibleCount);
    }, [productosFiltrados, visibleCount]);

    // Efecto para detectar scroll y cargar más
    useEffect(() => {
        const tableContainer = tableContainerRef.current;

        const handleScroll = () => {
            if (!tableContainer) return;

            // Calcular progreso del scroll
            const scrollTop = tableContainer.scrollTop;
            const scrollHeight = tableContainer.scrollHeight - tableContainer.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            setScrollProgress(Math.min(progress, 100));

            // Cargar más cuando esté cerca del final (80%)
            if (progress > 80 && visibleCount < productosFiltrados.length) {
                setVisibleCount(prev => Math.min(prev + 20, productosFiltrados.length));
            }
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
    }, [visibleCount, productosFiltrados.length]);

    // Resetear cuando cambian los productos o filtros
    useEffect(() => {
        if (tableContainerRef.current) {
            tableContainerRef.current.scrollTop = 0;
        }
    }, [filtro, categoriaFiltro, soloActivos]);

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
            {/* Tabla con scroll interno */}
            <div
                ref={tableContainerRef}
                className="overflow-x-auto max-h-[73vh] overflow-y-auto"
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 bg-gray-50 z-40">
                        <tr>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Código
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Productos
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sucursal / Categoría
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Stock
                            </th>
                            <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Comisión base
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Activo
                            </th>
                            <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {productosVisibles.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50 group">
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm uppercase font-medium text-gray-900">
                                    {producto.codigo}
                                </td>
                                <td className="px-1 py-3 w-min text-sm text-start text-gray-900 font-semibold uppercase"
                                    style={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    <div className="flex items-center h-full min-h-[3rem]">
                                        {producto.nombre}
                                    </div>
                                    {producto.descripcion && (
                                        <div className="relative w-full h-6 overflow-hidden">
                                            <h3
                                                className="absolute left-0 top-0 whitespace-nowrap text-gray-600
                                                transition-none
                                                group-hover:transition-transform group-hover:duration-[6000ms] 
                                                group-hover:ease-linear group-hover:-translate-x-full text-xs"
                                            >
                                                {producto.descripcion}
                                            </h3>
                                        </div>
                                    )}
                                </td>
                                <td className="px-1 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                                    <div>{producto.sucursales?.nombre || 'N/A'}</div>
                                    <div className="inline-block px-2 py-0.5 mt-1 text-[12px] font-bold text-amber-600 bg-amber-100 rounded-full">
                                        {producto.categorias?.nombre || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-1 py-3 text-center whitespace-nowrap font-medium text-sm text-gray-900">
                                    Bs. {parseFloat(producto.precio).toFixed(2)}
                                </td>
                                <td className="px-1 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                                    <div className="flex flex-col">
                                        <span>Actual: {producto.stock_actual}</span>
                                        <span className="text-xs text-gray-500">Mín: {producto.stock_minimo}</span>
                                    </div>
                                </td>
                                <td className="px-1 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                                    <span className="inline-flex px-2 py-1 font-semibold rounded-full">
                                        {producto.comision_variable ?
                                            `Bs. ${parseFloat(producto.comision_variable).toFixed(2)}`
                                            : producto.categorias?.reglas_comision?.comision_base ?
                                                `Bs. ${parseFloat(producto.categorias.reglas_comision.comision_base).toFixed(2)}`
                                                : '-'
                                        }
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 font-semibold rounded-full ${producto.activo
                                        ? 'bg-green-100 text-green-800 text-xs'
                                        : 'bg-red-100 text-red-800 text-xs'
                                        }`}>
                                        {producto.activo ? 'Si' : 'No'}
                                    </span>
                                </td>
                                <td className="px-2 py-3 text-center whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => currentUser?.roles?.nombre === 'admin' && onEditar(producto)}
                                        disabled={currentUser?.roles?.nombre !== 'admin'}
                                        className={`
                                            rounded-full px-2 py-1 transition-colors
                                            ${currentUser?.roles?.nombre === 'admin'
                                                ? 'text-sky-900 cursor-pointer hover:text-sky-600 bg-sky-100'
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

                {/* Indicador de carga */}
                {visibleCount < productosFiltrados.length && (
                    <div className="py-4 text-center text-sm text-gray-500">
                        <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Cargando más productos... ({visibleCount} de {productosFiltrados.length})
                        </span>
                    </div>
                )}

                {/* Mostrar total */}
                {visibleCount >= productosFiltrados.length && productosFiltrados.length > 0 && (
                    <div className="py-4 text-center text-sm text-gray-500">
                        Mostrando {productosFiltrados.length} de {productosFiltrados.length} productos
                    </div>
                )}
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