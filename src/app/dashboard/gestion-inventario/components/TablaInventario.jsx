// src/app/dashboard/gestion-inventario/components/TablaInventario.jsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function TablaInventario({
    inventario,
    categorias,
    loading,
    filtros,
    onFiltroChange,
    onRegistrarConteo,
    sucursalNombre
}) {
    const [conteos, setConteos] = useState({});
    const tableContainerRef = useRef(null);
    const [tableHeight, setTableHeight] = useState('calc(100vh - 280px)');

    useEffect(() => {
        const updateHeight = () => {
            const viewportHeight = window.innerHeight;
            const headerOffset = 280; // Altura aproximada de header + filtros
            setTableHeight(`${viewportHeight - headerOffset}px`);
        };

        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    const añoActual = new Date().getFullYear();
    const años = Array.from({ length: 7 }, (_, i) => añoActual - 3 + i);
    const meses = [
        { value: 1, nombre: 'Enero' }, { value: 2, nombre: 'Febrero' }, { value: 3, nombre: 'Marzo' },
        { value: 4, nombre: 'Abril' }, { value: 5, nombre: 'Mayo' }, { value: 6, nombre: 'Junio' },
        { value: 7, nombre: 'Julio' }, { value: 8, nombre: 'Agosto' }, { value: 9, nombre: 'Septiembre' },
        { value: 10, nombre: 'Octubre' }, { value: 11, nombre: 'Noviembre' }, { value: 12, nombre: 'Diciembre' }
    ];

    const handleConteoChange = (productoId, columna, valor) => {
        setConteos(prev => ({
            ...prev,
            [`${productoId}_${columna}`]: valor
        }));
    };

    // Actualiza el handleGuardarConteo en TablaInventario.jsx
    const handleGuardarConteo = async (producto, columna, valor) => {
        if (!valor || valor.trim() === '') return;

        let stockReal;
        if (valor.toLowerCase() === 'ok') {
            stockReal = producto.stock_calculado;
        } else {
            stockReal = parseInt(valor);
            if (isNaN(stockReal)) return;
        }

        // Guardar el valor en el estado local inmediatamente
        setConteos(prev => ({
            ...prev,
            [`${producto.producto_id}_${columna}`]: valor
        }));

        const resultado = await onRegistrarConteo(
            producto.producto_id,
            stockReal,
            `${columna} - ${new Date().toLocaleDateString()}`
        );

        if (resultado.success) {
            // Mostrar feedback visual
            const input = document.getElementById(`input_${producto.producto_id}_${columna}`);
            if (input) {
                input.classList.add('bg-green-100', 'border-green-500');
                setTimeout(() => {
                    input.classList.remove('bg-green-100', 'border-green-500');
                }, 1000);
            }
        } else {
            alert('Error al guardar: ' + resultado.error);
            // Revertir el valor si hubo error
            setConteos(prev => {
                const newState = { ...prev };
                delete newState[`${producto.producto_id}_${columna}`];
                return newState;
            });
        }
    };


    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Cargando inventario...</p>
                </div>
            </div>
        );
    }

    const totalStockInicial = inventario.reduce((sum, i) => sum + (i.stock_inicial || 0), 0);
    const totalAumentos = inventario.reduce((sum, i) => sum + (i.aumentos || 0), 0);
    const totalVentas = inventario.reduce((sum, i) => sum + (i.ventas || 0), 0);
    const totalStockCalculado = inventario.reduce((sum, i) => sum + (i.stock_calculado || 0), 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col"
        >
            {/* Filtros - Siempre visibles */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b flex-shrink-0">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Mes</label>
                        <select
                            value={filtros.mes}
                            onChange={(e) => onFiltroChange('mes', parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        >
                            {meses.map(mes => (
                                <option key={mes.value} value={mes.value}>{mes.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Año</label>
                        <select
                            value={filtros.año}
                            onChange={(e) => onFiltroChange('año', parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm"
                        >
                            {años.map(año => (
                                <option key={año} value={año}>{año}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
                        <select
                            value={filtros.categoriaId || ''}
                            onChange={(e) => onFiltroChange('categoriaId', e.target.value || null)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm min-w-[150px]"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="text-sm text-gray-500 ml-auto">
                        Sucursal: <span className="font-semibold text-amber-600">{sucursalNombre}</span>
                    </div>
                </div>
            </div>

            {/* Contenedor de tabla con scroll solo en el cuerpo */}
            <div
                ref={tableContainerRef}
                className="overflow-auto relative"
                style={{ height: tableHeight }}
            >
                <table className="min-w-full divide-y divide-gray-200">
                    {/* Header fijo dentro del scroll */}
                    <thead className="bg-gradient-to-r from-amber-50 to-amber-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-16 bg-amber-100">
                                #
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px] bg-amber-100">
                                Codigo
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px] bg-amber-100">
                                Nombre
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px] bg-amber-100">
                                Precio
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[110px] bg-amber-100">
                                Stock Inicial
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-green-700 uppercase tracking-wider min-w-[100px] bg-green-50">
                                + Aumentos
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-red-700 uppercase tracking-wider min-w-[100px] bg-red-50">
                                - Ventas
                            </th>
                            <th className="px-3 py-3 text-right text-xs font-bold text-blue-700 uppercase tracking-wider min-w-[110px] bg-blue-50">
                                = Stock Sistema
                            </th>
                            {[1, 2, 3, 4, 5].map(num => (
                                <th key={num} className="px-2 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider min-w-[80px] bg-purple-50">
                                    Conteo {num}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {inventario.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="px-4 py-8 text-center text-gray-500">
                                    No hay productos para este período
                                </td>
                            </tr>
                        ) : (
                            inventario.map((item) => (
                                <tr
                                    key={item.producto_id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-center text-gray-500">
                                        {item.numero}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-mono font-medium text-gray-900 bg-white z-10 shadow-sm">
                                        {item.codigo}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 bg-white z-10 shadow-sm">
                                        <div>
                                            <div className="font-medium">{item.nombre}</div>
                                            <div className="text-xs text-gray-500">{item.categoria_nombre}</div>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                                        ${item.precio?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-semibold">
                                        {item.stock_inicial?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-green-600 font-semibold">
                                        + {item.aumentos?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-red-600 font-semibold">
                                        - {item.ventas?.toLocaleString() || 0}
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                                        {item.stock_calculado?.toLocaleString() || 0}
                                    </td>
                                    {[1, 2, 3, 4, 5].map(num => (
                                        <td key={num} className="px-2 py-2 text-center">
                                            <input
                                                id={`input_${item.producto_id}_conteo_${num}`}
                                                type="text"
                                                value={conteos[`${item.producto_id}_conteo_${num}`] || ''}
                                                onChange={(e) => handleConteoChange(item.producto_id, `conteo_${num}`, e.target.value)}
                                                onBlur={(e) => handleGuardarConteo(item, `Conteo ${num}`, e.target.value)}
                                                placeholder="ok/num"
                                                className="w-16 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>

                    {/* Footer de totales - sticky bottom */}
                    {inventario.length > 0 && (
                        <tfoot className="bg-gray-50 sticky bottom-0 border-t-2 border-gray-300 shadow-lg">
                            <tr>
                                <td colSpan="4" className="px-3 py-2 text-right font-bold text-gray-700">
                                    TOTALES:
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-gray-700">
                                    {totalStockInicial.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-green-600">
                                    + {totalAumentos.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-red-600">
                                    - {totalVentas.toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-blue-600">
                                    = {totalStockCalculado.toLocaleString()}
                                </td>
                                <td colSpan="5"></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </motion.div>
    );
}