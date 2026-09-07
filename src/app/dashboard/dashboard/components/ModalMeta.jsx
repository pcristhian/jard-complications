// src/app/dashboard/components/ModalMeta.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ModalMeta({ isOpen, onClose, categories, currentMonth }) {
    const [localMetas, setLocalMetas] = useState({});
    const [localTypes, setLocalTypes] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [message, setMessage] = useState(null);

    const [availableMonths, setAvailableMonths] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [loadingPeriods, setLoadingPeriods] = useState(true);

    // 🔥 NUEVO: Estado para datos de ventas por categoría
    const [ventasPorCategoria, setVentasPorCategoria] = useState({});

    const getMonthNumber = (monthName) => {
        const meses = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
            'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
            'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
        };
        return meses[monthName] || 1;
    };

    const getMonthName = (monthNumber) => {
        const meses = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
            5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
            9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        };
        return meses[monthNumber] || 'Enero';
    };

    // 🔥 NUEVO: Cargar ventas por categoría para un mes/año específico
    // 🔥 CORREGIDO: Cargar ventas por categoría para un mes/año específico
    const cargarVentasPorCategoria = useCallback(async (mes, anio) => {
        if (!categories?.length) return {};

        try {
            const mesNumero = getMonthNumber(mes);

            // Construir fechas de inicio y fin del mes
            const fechaInicio = `${anio}-${String(mesNumero).padStart(2, '0')}-01`;
            const fechaFin = `${anio}-${String(mesNumero + 1).padStart(2, '0')}-01`;

            console.log('🔍 Buscando ventas para:', { mes, anio, fechaInicio, fechaFin });

            // ✅ CORRECCIÓN: Obtener ventas con la relación correcta
            const { data: ventas, error } = await supabase
                .from('ventas')
                .select(`
                id,
                cantidad,
                total_precio_venta,
                producto_id,
                productos:producto_id (
                    id,
                    nombre,
                    categoria_id,
                    categorias:categoria_id (
                        id,
                        nombre
                    )
                )
            `)
                .gte('fecha_venta', fechaInicio)
                .lt('fecha_venta', fechaFin)
                .eq('estado', 'activa');

            if (error) {
                console.error('Error en consulta Supabase:', error);
                throw error;
            }

            console.log('📊 Ventas encontradas:', ventas?.length || 0);

            // Inicializar objeto de ventas por categoría
            const ventasMap = {};
            categories.forEach(cat => {
                ventasMap[cat.id] = {
                    totalUnidades: 0,
                    totalIngresos: 0,
                    cantidadVentas: 0
                };
            });

            // Procesar ventas
            ventas?.forEach(venta => {
                // Obtener categoria_id de la relación productos -> categorias
                const categoriaId = venta.productos?.categoria_id;

                if (categoriaId && ventasMap[categoriaId] !== undefined) {
                    ventasMap[categoriaId].totalUnidades += venta.cantidad || 0;
                    ventasMap[categoriaId].totalIngresos += parseFloat(venta.total_precio_venta || 0);
                    ventasMap[categoriaId].cantidadVentas += 1;
                } else {
                    // Si no tiene categoría, asignar a "Sin Categoría"
                    console.log('⚠️ Venta sin categoría:', venta.id, 'categoriaId:', categoriaId);
                }
            });

            console.log('📊 Ventas por categoría:', ventasMap);

            return ventasMap;

        } catch (error) {
            console.error('Error cargando ventas por categoría:', error);
            return {};
        }
    }, [categories]);
    // Obtener años disponibles (siempre incluir el actual)
    const cargarPeriodosDisponibles = async () => {
        setLoadingPeriods(true);
        try {
            // Obtener años de metas
            const { data: yearsFromMetas } = await supabase
                .from('metas_categorias')
                .select('anio', { distinct: true })
                .order('anio', { ascending: true });

            // Obtener años de ventas
            const { data: yearsFromVentas } = await supabase
                .from('ventas')
                .select('fecha_venta');

            const allYearsSet = new Set();
            const currentYear = new Date().getFullYear();

            // Agregar años de metas
            yearsFromMetas?.forEach(y => allYearsSet.add(y.anio));

            // Agregar años de ventas
            if (yearsFromVentas) {
                yearsFromVentas.forEach(v => {
                    const year = new Date(v.fecha_venta).getFullYear();
                    if (!isNaN(year)) allYearsSet.add(year);
                });
            }

            // Siempre incluir el año actual
            allYearsSet.add(currentYear);

            let years = Array.from(allYearsSet);
            if (years.length === 0) years = [currentYear];
            years.sort((a, b) => a - b);

            setAvailableYears(years);

            const yearToUse = selectedYear || years[0] || currentYear;
            await cargarMesesDisponibles(yearToUse);

        } catch (error) {
            console.error('Error cargando períodos:', error);
            const currentYear = new Date().getFullYear();
            const currentMonthName = getMonthName(new Date().getMonth() + 1);
            setAvailableYears([currentYear]);
            setAvailableMonths([currentMonthName]);
        } finally {
            setLoadingPeriods(false);
        }
    };

    // Cargar meses disponibles
    const cargarMesesDisponibles = async (year) => {
        try {
            const currentYear = new Date().getFullYear();
            const currentMonthNum = new Date().getMonth() + 1;
            const currentMonthName = getMonthName(currentMonthNum);

            // Obtener meses con metas
            const { data: monthsFromMetas } = await supabase
                .from('metas_categorias')
                .select('mes', { distinct: true })
                .eq('anio', year)
                .order('mes', { ascending: true });

            // Obtener meses con ventas
            const { data: ventasEnAnio } = await supabase
                .from('ventas')
                .select('fecha_venta')
                .gte('fecha_venta', `${year}-01-01`)
                .lt('fecha_venta', `${year + 1}-01-01`);

            const monthsSet = new Set();

            // Agregar meses de metas
            monthsFromMetas?.forEach(m => {
                monthsSet.add(getMonthName(m.mes));
            });

            // Agregar meses de ventas
            if (ventasEnAnio) {
                ventasEnAnio.forEach(v => {
                    const monthNum = new Date(v.fecha_venta).getMonth() + 1;
                    monthsSet.add(getMonthName(monthNum));
                });
            }

            // Siempre incluir el mes actual (si es el año actual)
            if (year === currentYear) {
                monthsSet.add(currentMonthName);
            }

            let months = Array.from(monthsSet);

            if (months.length === 0) {
                if (year === currentYear) {
                    months = [currentMonthName];
                } else {
                    // Para años sin datos, mostrar todos los meses
                    months = Array.from({ length: 12 }, (_, i) => getMonthName(i + 1));
                }
            } else {
                months.sort((a, b) => getMonthNumber(a) - getMonthNumber(b));
            }

            // Limitar a meses <= actual si es el año actual
            if (year === currentYear) {
                months = months.filter(m => getMonthNumber(m) <= currentMonthNum);
            }

            setAvailableMonths(months);

            // Seleccionar mes actual si está disponible
            if (months.includes(currentMonthName)) {
                setSelectedMonth(currentMonthName);
            } else if (!selectedMonth || !months.includes(selectedMonth)) {
                setSelectedMonth(months[0] || currentMonthName);
            }

        } catch (error) {
            console.error('Error cargando meses:', error);
            const currentMonthName = getMonthName(new Date().getMonth() + 1);
            setAvailableMonths([currentMonthName]);
        }
    };

    // Cargar metas y ventas
    const cargarDatos = useCallback(async () => {
        if (!categories?.length || !selectedMonth || !selectedYear) return;

        setLoading(true);
        const mesNumero = getMonthNumber(selectedMonth);

        try {
            // 1. Cargar metas
            const { data: metasData, error: metasError } = await supabase
                .from('metas_categorias')
                .select('*')
                .eq('mes', mesNumero)
                .eq('anio', selectedYear);

            if (metasError) throw metasError;

            const metasMap = {};
            const typesMap = {};

            metasData?.forEach(meta => {
                metasMap[meta.categoria_id] = meta.valor_meta;
                typesMap[meta.categoria_id] = meta.tipo_meta;
            });

            setLocalMetas(metasMap);

            // Establecer tipos por categoría
            const types = {};
            categories.forEach(cat => {
                const defaultType = ['Celulares', 'Ropa', 'Zapatos', 'Accesorios'].includes(cat.name)
                    ? 'quantity' : 'revenue';
                types[cat.id] = typesMap[cat.id] || defaultType;
            });
            setLocalTypes(types);

            // 2. 🔥 Cargar ventas por categoría
            const ventasData = await cargarVentasPorCategoria(selectedMonth, selectedYear);
            setVentasPorCategoria(ventasData);

        } catch (error) {
            console.error('Error cargando datos:', error);
            setMessage({ type: 'error', text: 'Error al cargar datos' });
        } finally {
            setLoading(false);
        }
    }, [categories, selectedMonth, selectedYear, cargarVentasPorCategoria]);

    // Guardar metas
    const guardarTodo = async () => {
        setSaving(true);
        const mesNumero = getMonthNumber(selectedMonth);

        try {
            for (const category of categories) {
                const categoriaId = category.id;
                const valorMeta = localMetas[categoriaId] || null;
                const tipoMeta = localTypes[categoriaId] || 'quantity';

                const { data: existing } = await supabase
                    .from('metas_categorias')
                    .select('id')
                    .eq('categoria_id', categoriaId)
                    .eq('mes', mesNumero)
                    .eq('anio', selectedYear);

                if (valorMeta && valorMeta > 0) {
                    if (existing && existing.length > 0) {
                        await supabase
                            .from('metas_categorias')
                            .update({
                                tipo_meta: tipoMeta,
                                valor_meta: valorMeta,
                                updated_at: new Date()
                            })
                            .eq('id', existing[0].id);
                    } else {
                        await supabase
                            .from('metas_categorias')
                            .insert({
                                categoria_id: categoriaId,
                                mes: mesNumero,
                                anio: selectedYear,
                                tipo_meta: tipoMeta,
                                valor_meta: valorMeta
                            });
                    }
                } else {
                    if (existing && existing.length > 0) {
                        await supabase
                            .from('metas_categorias')
                            .delete()
                            .eq('id', existing[0].id);
                    }
                }
            }

            setMessage({ type: 'success', text: '✅ Metas guardadas correctamente' });
            await cargarPeriodosDisponibles();
            await cargarDatos();

            setTimeout(() => {
                setMessage(null);
                onClose();
            }, 1500);

        } catch (error) {
            console.error('Error guardando:', error);
            setMessage({ type: 'error', text: '❌ Error al guardar metas' });
        } finally {
            setSaving(false);
        }
    };

    const handleMetaChange = (categoriaId, value) => {
        const cleanValue = value.replace(/[^0-9]/g, '');
        const numValue = cleanValue === '' ? null : parseInt(cleanValue, 10);

        setLocalMetas(prev => {
            if (numValue === null || isNaN(numValue)) {
                const newMetas = { ...prev };
                delete newMetas[categoriaId];
                return newMetas;
            }
            return { ...prev, [categoriaId]: numValue };
        });
    };

    const handleTypeChange = (categoriaId, type) => {
        setLocalTypes(prev => ({ ...prev, [categoriaId]: type }));
        // Recargar ventas para actualizar la visualización
        cargarDatos();
    };

    const handleYearChange = async (year) => {
        setSelectedYear(parseInt(year));
        await cargarMesesDisponibles(parseInt(year));
    };

    const handleMonthChange = (month) => {
        setSelectedMonth(month);
    };

    // Efectos
    useEffect(() => {
        if (isOpen && categories?.length) {
            const mesActual = getMonthName(new Date().getMonth() + 1);
            const anioActual = new Date().getFullYear();
            setSelectedMonth(mesActual);
            setSelectedYear(anioActual);
            cargarPeriodosDisponibles();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && categories?.length && selectedMonth && selectedYear) {
            cargarDatos();
        }
    }, [selectedMonth, selectedYear, isOpen]);

    if (!categories?.length) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                   bg-white rounded-xl shadow-2xl z-50 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 bg-linear-to-r from-blue-500 to-blue-600 text-white shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎯</span>
                                    <h2 className="text-xl font-bold">Configurar Metas</h2>
                                </div>
                                <button onClick={onClose} className="text-white/80 hover:text-white cursor-pointer">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Selectores */}
                        <div className="px-6 py-4 bg-gray-50 border-b text-black shrink-0">
                            {loadingPeriods ? (
                                <div className="flex justify-center py-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Año</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => handleYearChange(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                                        >
                                            {availableYears.map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Mes</label>
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => handleMonthChange(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                                        >
                                            {availableMonths.map(month => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mensaje */}
                        {message && (
                            <div className={`px-6 py-2 border-b ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                    {message.text}
                                </p>
                            </div>
                        )}

                        {/* Lista de categorías */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                    <p className="text-gray-500 mt-2">Cargando datos...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {categories.map((category) => {
                                        const currentType = localTypes[category.id] || 'quantity';
                                        const currentValue = localMetas[category.id] || '';
                                        const ventas = ventasPorCategoria[category.id] || { totalUnidades: 0, totalIngresos: 0 };

                                        return (
                                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                                                        style={{ backgroundColor: `${category.color}15` }}
                                                    >
                                                        {getCategoryIcon(category.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-black truncate">{category.name}</p>
                                                        {/* 🔥 MOSTRAR VENTAS SEGÚN EL TIPO */}
                                                        <p className="text-[10px] text-green-600">
                                                            {currentType === 'quantity'
                                                                ? `📦 Ventas: ${ventas.totalUnidades.toLocaleString()} unidades (${ventas.cantidadVentas || 0} ventas)`
                                                                : `💰 Ventas: Bs. ${ventas.totalIngresos.toFixed(2).toLocaleString()}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 shrink-0">
                                                    <select
                                                        value={currentType}
                                                        onChange={(e) => handleTypeChange(category.id, e.target.value)}
                                                        className="text-xs px-2 py-1 border rounded-lg bg-white text-black cursor-pointer"
                                                    >
                                                        <option value="quantity">📦 Cantidad</option>
                                                        <option value="revenue">💰 Ingresos</option>
                                                    </select>

                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={currentValue}
                                                        onChange={(e) => handleMetaChange(category.id, e.target.value)}
                                                        className="w-28 px-2 py-1 border text-black rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Sin meta"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center shrink-0">
                            <div className="flex-1">
                                <p className="text-xs text-amber-600">
                                    💡 Las metas se guardan cuando presionas "Guardar Cambios"
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={guardarTodo}
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium shadow-sm cursor-pointer"
                                >
                                    {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function getCategoryIcon(categoryName) {
    const icons = {
        'Celulares': '📱', 'Ropa': '👕', 'Electrónicos': '💻',
        'Zapatos': '👟', 'Libros': '📚', 'Accesorios': '⌚',
        'Hogar': '🏠', 'Deportes': '⚽', 'Juguetes': '🎮',
        'Salud': '💊', 'Belleza': '💄', 'Alimentos': '🍔',
        'Bebidas': '🥤', 'Sin Categoría': '📦',
    };
    return icons[categoryName] || '📦';
}