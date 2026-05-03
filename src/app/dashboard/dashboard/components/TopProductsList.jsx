// src/app/dashboard/components/TopProductsList.jsx
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function TopProductsList({
    products,
    categories,
    selectedCategory,
    currentMonth = 'Diciembre',
    selectedMonth // Nueva prop: mes seleccionado desde la gráfica
}) {
    const [hoveredProduct, setHoveredProduct] = useState(null);

    // Determinar qué mes mostrar (priorizar selectedMonth de la gráfica)
    const displayMonth = selectedMonth || currentMonth;

    // Obtener todos los productos de todas las categorías y ordenar por ventas
    const getAllProducts = () => {
        const allProducts = [];

        if (selectedCategory) {
            // Si hay categoría seleccionada, mostrar solo sus productos
            const categoryProducts = products[selectedCategory] || [];
            return categoryProducts.map(p => ({
                ...p,
                category: selectedCategory,
                categoryColor: categories.find(c => c.name === selectedCategory)?.color
            }));
        } else {
            // Si no, mostrar top 10 global
            Object.keys(products).forEach(category => {
                if (products[category] && Array.isArray(products[category])) {
                    products[category].forEach(product => {
                        allProducts.push({
                            ...product,
                            category,
                            categoryColor: categories.find(c => c.name === category)?.color
                        });
                    });
                }
            });
            // Ordenar por ventas (units) y tomar top 10
            return allProducts.sort((a, b) => b.sales - a.sales).slice(0, 10);
        }
    };

    const displayProducts = getAllProducts();
    const isGlobalView = !selectedCategory;
    const hasProducts = displayProducts.length > 0;

    // Calcular total de ingresos
    const totalRevenue = displayProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const maxSales = displayProducts[0]?.sales || 1;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden h-full flex flex-col"
        >
            {/* Header compacto */}
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">🏆</span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">
                                Top Productos {displayMonth}
                            </h3>
                            <p className="text-[10px] text-gray-500">
                                {isGlobalView
                                    ? `Top 10 general · ${displayProducts.length} productos`
                                    : `${selectedCategory} · ${displayProducts.length} productos`
                                }
                            </p>
                        </div>
                    </div>

                    {/* Badge de ranking */}
                    <div className="text-right">
                        <div className="bg-white/60 rounded-lg px-2 py-1">
                            <p className="text-[10px] font-bold text-orange-600">
                                {isGlobalView ? 'TOP 10' : 'RANKING'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de productos - Scroll interno */}
            <div className="flex-1 overflow-y-auto max-h-[500px]">
                {!hasProducts ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="text-5xl mb-3">📭</div>
                        <p className="text-sm text-gray-500 font-medium">No hay productos</p>
                        <p className="text-xs text-gray-400 mt-1">
                            {selectedCategory
                                ? `No se encontraron ventas en ${selectedCategory} para ${displayMonth}`
                                : `No hay ventas registradas en ${displayMonth}`
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {displayProducts.map((product, index) => {
                            const rank = index + 1;
                            const isTop3 = rank <= 3;
                            const salesPercentage = (product.sales / maxSales) * 100;

                            // Colores para medallas
                            const medalColors = {
                                1: 'from-yellow-500 to-amber-600',
                                2: 'from-gray-400 to-gray-500',
                                3: 'from-orange-500 to-orange-600',
                            };

                            const medalIcon = {
                                1: '🥇',
                                2: '🥈',
                                3: '🥉',
                            };

                            return (
                                <motion.div
                                    key={`${product.category}-${product.name}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    onHoverStart={() => setHoveredProduct(product.name)}
                                    onHoverEnd={() => setHoveredProduct(null)}
                                    className={`
                                        group relative px-4 py-2.5 hover:bg-gray-50 transition-all duration-200 cursor-pointer
                                        ${isTop3 ? 'bg-gradient-to-r from-amber-50/50' : ''}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Ranking con medalla */}
                                        <div className="relative">
                                            {isTop3 ? (
                                                <div className={`
                                                    w-8 h-8 rounded-full bg-gradient-to-br ${medalColors[rank]} 
                                                    flex items-center justify-center shadow-sm
                                                `}>
                                                    <span className="text-sm font-bold text-white">
                                                        {medalIcon[rank]}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-gray-500">
                                                        {rank}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Indicador de posición */}
                                            {isTop3 && (
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>

                                        {/* Información del producto */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {product.name}
                                                </p>
                                                {isGlobalView && product.category && (
                                                    <span
                                                        className="text-[9px] px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap"
                                                        style={{
                                                            backgroundColor: `${product.categoryColor}15`,
                                                            color: product.categoryColor
                                                        }}
                                                    >
                                                        {product.category}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 mt-0.5">
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                                    </svg>
                                                    <span className="text-xs font-medium text-gray-700">
                                                        {product.sales.toLocaleString()} und
                                                    </span>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="text-xs font-medium text-gray-700">
                                                        ${formatRevenue(product.revenue)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Métrica de rendimiento */}
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">
                                                ${formatRevenue(product.revenue, true)}
                                            </p>
                                            <div className="flex items-center justify-end gap-1 mt-0.5">
                                                <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${salesPercentage}%` }}
                                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                                    />
                                                </div>
                                                <span className="text-[9px] text-gray-400">
                                                    {Math.round(salesPercentage)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barra de progreso de fondo en hover */}
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${salesPercentage}%` }}
                                        className="absolute left-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    />
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer con estadísticas compactas */}
            {hasProducts && (
                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[10px]">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                <span className="text-gray-600">Top ventas</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                                <span className="text-gray-600">Más ingresos</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-gray-400">Total:</span>
                            <span className="font-semibold text-gray-800">
                                ${formatRevenue(totalRevenue, true)}
                            </span>
                        </div>
                    </div>

                    {!selectedCategory && displayProducts.length >= 10 && (
                        <p className="text-[9px] text-center text-gray-400 mt-1.5">
                            💡 Haz clic en una categoría de las cards para ver su ranking completo
                        </p>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// Función para formatear ingresos
function formatRevenue(value, compact = false) {
    if (value >= 1000000) {
        return compact ? `${(value / 1000000).toFixed(1)}M` : `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
        return compact ? `${(value / 1000).toFixed(1)}k` : `${(value / 1000).toFixed(1)}k`;
    }
    return value.toLocaleString();
}