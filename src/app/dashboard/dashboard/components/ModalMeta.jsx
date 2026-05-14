// src/app/dashboard/components/ModalMeta.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ModalMeta({ isOpen, onClose, categories, currentMonth }) {
    // Estado local para las metas (sin guardar inmediatamente)
    const [localMetas, setLocalMetas] = useState({});
    const [localTypes, setLocalTypes] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [message, setMessage] = useState(null);

    // Estados para los selects dinámicos
    const [availableMonths, setAvailableMonths] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [loadingPeriods, setLoadingPeriods] = useState(true);
    const [hasData, setHasData] = useState(false);

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

    // Obtener años únicos con datos
    const cargarPeriodosDisponibles = async () => {
        setLoadingPeriods(true);
        try {
            // Obtener años únicos con datos
            const { data: yearsData, error: yearsError } = await supabase
                .from('metas_categorias')
                .select('anio', { distinct: true })
                .order('anio', { ascending: true });

            if (yearsError) throw yearsError;

            // 🔹 Asegurar que los años sean únicos y eliminar duplicados
            let years = [...new Set(yearsData?.map(y => y.anio) || [])];

            // Si no hay años, usar el año actual
            const currentYear = new Date().getFullYear();
            if (years.length === 0) {
                years = [currentYear];
            }

            // 🔹 También agregar el año actual si no está en la lista (para poder crear metas nuevas)
            if (!years.includes(currentYear)) {
                years.push(currentYear);
                years.sort((a, b) => a - b);
            }

            setAvailableYears(years);

            // Para el año seleccionado, obtener los meses disponibles
            const yearToUse = selectedYear || years[0];

            const { data: monthsData, error: monthsError } = await supabase
                .from('metas_categorias')
                .select('mes', { distinct: true })
                .eq('anio', yearToUse)
                .order('mes', { ascending: true });

            if (monthsError) throw monthsError;

            let months = monthsData?.map(m => getMonthName(m.mes)) || [];

            // Si no hay meses para este año, ver si hay ventas en ese período
            let hasDataInPeriod = months.length > 0;

            if (!hasDataInPeriod) {
                // Verificar si hay ventas en este período
                const { count: ventasCount, error: ventasError } = await supabase
                    .from('ventas')
                    .select('id', { count: 'exact', head: true })
                    .gte('fecha_venta', `${yearToUse}-01-01`)
                    .lt('fecha_venta', `${yearToUse + 1}-01-01`);

                if (!ventasError && ventasCount > 0) {
                    hasDataInPeriod = true;
                    // Si hay ventas pero no metas, usar el mes actual como opción
                    const currentMonthName = getMonthName(new Date().getMonth() + 1);
                    months = [currentMonthName];
                }
            }

            setHasData(hasDataInPeriod);

            // Si no hay meses específicos, usar el mes actual
            const currentMonthName = getMonthName(new Date().getMonth() + 1);
            const finalMonths = months.length > 0 ? [...new Set(months)] : [currentMonthName]; // 🔹 Eliminar duplicados de meses
            setAvailableMonths(finalMonths);

            // Si el mes seleccionado no está disponible, seleccionar el primero
            if (selectedMonth && !finalMonths.includes(selectedMonth)) {
                setSelectedMonth(finalMonths[0]);
            }

        } catch (error) {
            console.error('Error cargando períodos disponibles:', error);
            // Fallback: usar valores por defecto
            const currentYear = new Date().getFullYear();
            const currentMonthName = getMonthName(new Date().getMonth() + 1);
            setAvailableYears([currentYear]);
            setAvailableMonths([currentMonthName]);
            setHasData(true);
        } finally {
            setLoadingPeriods(false);
        }
    };

    // Cargar metas desde la BD
    const cargarMetas = async () => {
        if (!categories?.length) return;

        setLoading(true);
        const mesNumero = getMonthNumber(selectedMonth);

        try {
            const { data, error } = await supabase
                .from('metas_categorias')
                .select('*')
                .eq('mes', mesNumero)
                .eq('anio', selectedYear);

            if (error) throw error;

            const metasMap = {};
            const typesMap = {};

            data?.forEach(meta => {
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

        } catch (error) {
            console.error('Error cargando metas:', error);
            setMessage({ type: 'error', text: 'Error al cargar metas' });
        } finally {
            setLoading(false);
        }
    };

    // Guardar todas las metas de una vez
    const guardarTodo = async () => {
        setSaving(true);
        const mesNumero = getMonthNumber(selectedMonth);
        let hasError = false;

        try {
            // Procesar cada categoría
            for (const category of categories) {
                const categoriaId = category.id;
                const valorMeta = localMetas[categoriaId] || null;
                const tipoMeta = localTypes[categoriaId] || 'quantity';

                // Buscar si ya existe
                const { data: existing } = await supabase
                    .from('metas_categorias')
                    .select('id')
                    .eq('categoria_id', categoriaId)
                    .eq('mes', mesNumero)
                    .eq('anio', selectedYear);

                if (valorMeta && valorMeta > 0) {
                    // Guardar o actualizar
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
                    // Eliminar si existe y no tiene valor
                    if (existing && existing.length > 0) {
                        await supabase
                            .from('metas_categorias')
                            .delete()
                            .eq('id', existing[0].id);
                    }
                }
            }

            setMessage({ type: 'success', text: '✅ Metas guardadas correctamente' });

            // Recargar períodos disponibles después de guardar
            await cargarPeriodosDisponibles();

            setTimeout(() => {
                setMessage(null);
                onClose();
            }, 1500);

        } catch (error) {
            console.error('Error guardando:', error);
            setMessage({ type: 'error', text: '❌ Error al guardar metas' });
            hasError = true;
        } finally {
            setSaving(false);
        }
    };

    // Actualizar meta localmente (sin guardar en BD)
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

    // Actualizar tipo localmente
    const handleTypeChange = (categoriaId, type) => {
        setLocalTypes(prev => ({ ...prev, [categoriaId]: type }));
    };

    // Cambiar año
    const handleYearChange = async (year) => {
        setSelectedYear(year);
        setLoading(true);

        // Cargar meses disponibles para este año
        try {
            const { data: monthsData, error } = await supabase
                .from('metas_categorias')
                .select('mes', { distinct: true })
                .eq('anio', year)
                .order('mes', { ascending: true });

            if (!error && monthsData?.length > 0) {
                const months = monthsData.map(m => getMonthName(m.mes));
                setAvailableMonths(months);

                // Si el mes actual no está disponible, seleccionar el primero
                if (!months.includes(selectedMonth)) {
                    setSelectedMonth(months[0]);
                } else {
                    // Recargar metas con el nuevo año y mes actual
                    await cargarMetas();
                }
            } else {
                // Si no hay metas para este año, verificar si hay ventas
                const { count: ventasCount } = await supabase
                    .from('ventas')
                    .select('id', { count: 'exact', head: true })
                    .gte('fecha_venta', `${year}-01-01`)
                    .lt('fecha_venta', `${year + 1}-01-01`);

                if (ventasCount > 0) {
                    // Usar el mes actual
                    const currentMonthName = getMonthName(new Date().getMonth() + 1);
                    setAvailableMonths([currentMonthName]);
                    setSelectedMonth(currentMonthName);
                }
                await cargarMetas();
            }
        } catch (error) {
            console.error('Error cargando meses:', error);
            await cargarMetas();
        } finally {
            setLoading(false);
        }
    };

    // Cambiar mes
    const handleMonthChange = (month) => {
        setSelectedMonth(month);
        cargarMetas();
    };

    // Cargar períodos cuando se abre el modal
    useEffect(() => {
        if (isOpen && categories?.length) {
            cargarPeriodosDisponibles();
        }
    }, [isOpen]);

    // Cargar metas cuando cambia el mes/año
    useEffect(() => {
        if (isOpen && categories?.length && selectedMonth && selectedYear) {
            cargarMetas();
        }
    }, [selectedMonth, selectedYear, isOpen]);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const years = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

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
                            ) : !hasData && availableYears.length === 1 && availableMonths.length === 1 ? (
                                <div className="text-center py-2 text-amber-600 text-sm">
                                    ⚠️ No hay datos de ventas o metas para este período. Crea una meta para comenzar.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Año</label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => handleYearChange(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-lg cursor-pointer"
                                        >
                                            {/* 🔹 Usar Set para eliminar duplicados en el render */}
                                            {[...new Set(availableYears)].map(year => (
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
                                            disabled={availableMonths.length === 0}
                                        >
                                            {availableMonths.map(month => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                        {availableMonths.length === 0 && (
                                            <p className="text-xs text-amber-500 mt-1">
                                                No hay metas para este año
                                            </p>
                                        )}
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
                                    <p className="text-gray-500 mt-2">Cargando metas...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {categories.map((category) => {
                                        const currentType = localTypes[category.id] || 'quantity';
                                        const currentValue = localMetas[category.id] || '';

                                        return (
                                            <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                                                        style={{ backgroundColor: `${category.color}15` }}
                                                    >
                                                        {getCategoryIcon(category.name)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-black">{category.name}</p>
                                                        <p className="text-[10px] text-green-600">
                                                            Ventas actuales: {currentType === 'quantity'
                                                                ? `${(category.totalUnits || 0).toLocaleString()} unidades`
                                                                : `Bs. ${(category.sales || 0).toLocaleString()}`
                                                            }
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
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

                        {/* Footer con botón Guardar */}
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