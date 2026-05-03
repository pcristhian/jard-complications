// src/app/dashboard/components/CategoryCards.jsx
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useMetas } from '../hooks/useMetas';

export default function CategoryCards({
    categories,
    selectedCategory,
    onSelectCategory,
    currentMonth,
    selectedMonth,
}) {
    const [hoveredCard, setHoveredCard] = useState(null);

    const displayMonth = selectedMonth || currentMonth;
    const currentYear = new Date().getFullYear();

    // Hook para metas
    const { metas, loading: metasLoading, guardarMeta } = useMetas(categories, displayMonth, currentYear);

    // Función para obtener el progreso
    const getProgress = (realValue, metaValor) => {
        if (!metaValor || metaValor === 0) return null;
        return Math.min(Math.round((realValue / metaValor) * 100), 150);
    };

    // Función para obtener el color del progreso
    const getProgressColor = (progress, hasMeta) => {
        if (!hasMeta) return 'bg-gray-300';
        if (progress >= 100) return 'bg-emerald-600';
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 30) return 'bg-orange-500';
        return 'bg-red-500';
    };

    // Formatear números - SIN FORMATO, mostrar tal cual
    const formatNumber = (value) => {
        return value?.toLocaleString() || 0;
    };

    // Formatear valores según tipo - SIN FORMATO
    const formatValue = (value, type) => {
        if (type === 'quantity') {
            return value?.toLocaleString() || 0;
        } else {
            return `Bs. ${value?.toLocaleString() || 0}`;
        }
    };

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {categories.map((category, index) => {
                    // Definir tipo de meta por defecto según categoría
                    const categoriasUnidades = ['Celulares', 'Ropa', 'Zapatos', 'Accesorios'];
                    const defaultType = categoriasUnidades.includes(category.name) ? 'quantity' : 'revenue';

                    const meta = metas[category.id];
                    const metaType = meta?.tipo || defaultType;
                    const metaValue = meta?.valor || null;
                    const hasMeta = metaValue !== null && metaValue > 0;

                    // Valor real según tipo
                    const realValue = metaType === 'quantity'
                        ? category.totalUnits || 0
                        : category.sales || 0;

                    const progress = hasMeta ? getProgress(realValue, metaValue) : null;
                    const progressColor = getProgressColor(progress, hasMeta);
                    const isMet = hasMeta && progress >= 100;

                    // Valores formateados - AHORA SIN FORMATO
                    const formattedReal = formatValue(realValue, metaType);
                    const formattedMeta = hasMeta ? formatValue(metaValue, metaType) : 'Sin meta';
                    const formattedSales = category.sales?.toLocaleString() || 0;

                    return (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                delay: index * 0.05,
                                type: "spring",
                                stiffness: 300,
                                damping: 20
                            }}
                            onClick={() => onSelectCategory(category.name === selectedCategory ? null : category.name)}
                            onHoverStart={() => setHoveredCard(category.id)}
                            onHoverEnd={() => setHoveredCard(null)}
                            className={`
                                relative group cursor-pointer
                                rounded-xl transition-all duration-300
                                ${selectedCategory === category.name
                                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-emerald-500/30'
                                    : 'bg-white hover:shadow-md border border-gray-100'
                                }
                            `}
                        >
                            <div className="p-3 relative">
                                {/* Fila superior: Icono + Tendencia */}
                                <div className="flex items-center justify-between mb-2">
                                    <motion.div
                                        whileHover={{ scale: 1.1, rotate: 5 }}
                                        className={`
                                            w-10 h-10 rounded-lg flex items-center justify-center text-xl
                                            ${selectedCategory === category.name ? 'bg-white/20' : ''}
                                        `}
                                        style={selectedCategory === category.name ? {} : { backgroundColor: `${category.color}15` }}
                                    >
                                        <span className={selectedCategory === category.name ? 'text-white' : ''}>
                                            {getCategoryIcon(category.name)}
                                        </span>
                                    </motion.div>

                                    <div className="flex gap-1">
                                        {isMet && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                ✅ Metas
                                            </span>
                                        )}
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: index * 0.05 + 0.2 }}
                                            className={`
                                                text-xs font-bold px-2 py-0.5 rounded-full
                                                ${category.trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                                ${selectedCategory === category.name && category.trend >= 0 ? 'bg-green-500/20 text-green-100' : ''}
                                                ${selectedCategory === category.name && category.trend < 0 ? 'bg-red-500/20 text-red-100' : ''}
                                            `}
                                        >
                                            {category.trend >= 0 ? '↑' : '↓'} {Math.abs(category.trend)}%
                                        </motion.span>
                                    </div>
                                </div>

                                {/* Nombre de categoría */}
                                <h3 className={`font-bold text-sm mb-1 truncate ${selectedCategory === category.name ? 'text-white' : 'text-gray-700'}`}>
                                    {category.name}
                                </h3>

                                {/* Indicador del mes */}
                                {displayMonth && (
                                    <div className="mb-1">
                                        <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-blue-100 text-blue-700">
                                            📍 {displayMonth}
                                        </span>
                                    </div>
                                )}

                                {/* Valor de ventas - SIN FORMATO */}
                                <p className={`text-2xl font-bold tracking-tight ${selectedCategory === category.name ? 'text-white' : 'text-gray-900'}`}>
                                    Bs. {category.sales?.toLocaleString() || 0}
                                </p>

                                {/* Meta */}
                                <div className="mt-2 pt-1">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                            <span className={`text-[10px] font-medium ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                                Meta: {metaType === 'quantity' ? 'Unidades' : 'Ingresos'}
                                            </span>
                                        </div>
                                        {hasMeta && (
                                            <span className={`text-[10px] font-bold ${selectedCategory === category.name
                                                ? 'text-white'
                                                : progress >= 100
                                                    ? 'text-emerald-600'
                                                    : progress >= 80
                                                        ? 'text-green-600'
                                                        : 'text-gray-500'
                                                }`}>
                                                {progress}%
                                            </span>
                                        )}
                                    </div>

                                    <div className={`
                                        h-1.5 rounded-full overflow-hidden
                                        ${selectedCategory === category.name ? 'bg-white/30' : 'bg-gray-100'}
                                    `}>
                                        {hasMeta ? (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(progress, 100)}%` }}
                                                transition={{ duration: 0.6, delay: index * 0.05 }}
                                                className={`h-full rounded-full transition-all ${progressColor}`}
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-gray-300 rounded-full opacity-50" />
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-0.5">
                                        <span className={`text-[10px] ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                            Logrado: {metaType === 'quantity'
                                                ? (realValue?.toLocaleString() || 0)
                                                : `Bs. ${realValue?.toLocaleString() || 0}`
                                            }
                                        </span>
                                        <span className={`text-[10px] ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                            Meta: {formattedMeta}
                                        </span>
                                    </div>
                                </div>

                                {/* Información adicional - Unidades vendidas */}
                                <div className="mt-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <svg className={`w-3 h-3 ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                            <span className={`text-[9px] font-medium ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                                Unidades vendidas
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            <span className={`text-xs font-bold ${selectedCategory === category.name ? 'text-white' : 'text-gray-700'}`}>
                                                {category.totalUnits?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Producto más vendido */}
                                <div className="mt-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px]">⭐</span>
                                        <span className={`text-[9px] font-medium ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                            Más vendido:
                                        </span>
                                        <span className={`text-[9px] font-medium truncate max-w-[100px] text-right ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                            {category.topProduct || '—'}
                                        </span>
                                    </div>
                                </div>

                                {/* Productos y ventas totales */}
                                <div className="mt-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                            📦 {category.totalProducts?.toLocaleString() || 0} productos
                                        </span>
                                        <span className={`text-[10px] ${selectedCategory === category.name ? 'text-white' : 'text-gray-600'}`}>
                                            🏷️ {category.totalSalesCount?.toLocaleString() || 0} ventas
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedCategory === category.name && (
                                <motion.div
                                    layoutId="activeCardIndicator"
                                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </>
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