// src/app/dashboard/components/SalesChart.jsx
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useState, useMemo, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function SalesChart({ data, categories, selectedCategory, onMonthSelect }) {
    const months = useMemo(() => data.map(item => item.month), [data]);
    const [hoveredMonth, setHoveredMonth] = useState(null);

    // Encontrar la categoría seleccionada
    const selectedCategoryData = useMemo(() =>
        categories.find(c => c.name === selectedCategory),
        [categories, selectedCategory]
    );
    const categoryColor = selectedCategoryData?.color || '#3B82F6';

    // Manejador de hover memoizado para evitar recreaciones
    const handleHover = useCallback((event, elements) => {
        if (elements && elements.length > 0) {
            const index = elements[0].index;
            const month = months[index];
            if (hoveredMonth !== month) {
                setHoveredMonth(month);
            }
        } else {
            if (hoveredMonth !== null) {
                setHoveredMonth(null);
            }
        }
    }, [months, hoveredMonth]);

    // Manejador de click memoizado
    const handleClick = useCallback((event, elements) => {
        if (elements && elements.length > 0 && onMonthSelect) {
            const index = elements[0].index;
            const month = months[index];
            onMonthSelect(month);
        }
    }, [months, onMonthSelect]);

    // Preparar datos según categoría seleccionada - memoizado
    const chartData = useMemo(() => {
        if (selectedCategory) {
            const categoryData = data.map(item => item.categorias[selectedCategory] || 0);

            return {
                labels: months,
                datasets: [{
                    label: selectedCategory,
                    data: categoryData,
                    borderColor: categoryColor,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, `${categoryColor}40`);
                        gradient.addColorStop(1, `${categoryColor}05`);
                        return gradient;
                    },
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 9,
                    pointBackgroundColor: (context) => {
                        const index = context.dataIndex;
                        if (hoveredMonth === months[index]) return '#FF6B6B';
                        return categoryColor;
                    },
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBorderWidth: 3,
                }]
            };
        }

        // Total ventas
        const totalVentas = data.map(item => item.ventas);
        return {
            labels: months,
            datasets: [{
                label: 'Total Ventas',
                data: totalVentas,
                borderColor: '#3B82F6',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointHoverRadius: 9,
                pointBackgroundColor: (context) => {
                    const index = context.dataIndex;
                    if (hoveredMonth === months[index]) return '#FF6B6B';
                    return '#3B82F6';
                },
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointHoverBorderWidth: 3,
            }]
        };
    }, [selectedCategory, data, months, categoryColor, hoveredMonth]);

    // Opciones del gráfico memoizadas
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        onClick: handleClick,
        onHover: handleHover,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#F3F4F6',
                bodyColor: '#D1D5DB',
                borderColor: categoryColor,
                borderWidth: 2,
                padding: 12,
                cornerRadius: 8,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 12 },
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        label += '$' + context.parsed.y.toLocaleString();
                        return label;
                    },
                    afterLabel: (context) => {
                        const monthIndex = context.dataIndex;
                        const previousMonth = monthIndex > 0 ? context.dataset.data[monthIndex - 1] : null;
                        if (previousMonth && previousMonth !== 0) {
                            const variation = ((context.parsed.y - previousMonth) / previousMonth) * 100;
                            return `vs mes anterior: ${variation >= 0 ? '↑' : '↓'} ${Math.abs(variation).toFixed(1)}%`;
                        }
                        return null;
                    },
                    footer: (tooltipItems) => {
                        if (tooltipItems.length > 0) {
                            return '💡 Haz clic para ver productos de este mes';
                        }
                        return null;
                    }
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#F3F4F6',
                    drawBorder: false,
                    lineWidth: 1,
                },
                border: { display: false },
                ticks: {
                    callback: (value) => {
                        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                        return `$${value}`;
                    },
                    font: { size: 11, weight: '500' },
                    color: '#6B7280',
                    stepSize: 20000,
                },
                title: {
                    display: false,
                },
            },
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: {
                    font: { size: 11, weight: '500' },
                    color: '#6B7280',
                    callback: (value, index) => {
                        return months[index];
                    }
                },
                title: {
                    display: false,
                },
            },
        },
        elements: {
            line: {
                borderJoin: 'round',
                capBezierPoints: true,
            },
            point: {
                hitRadius: 15,
            },
        },
        layout: {
            padding: {
                left: 5,
                right: 15,
                top: 20,
                bottom: 10,
            },
        },
    }), [handleClick, handleHover, categoryColor, months]);

    // Calcular métricas - memoizado
    const metrics = useMemo(() => {
        const sales = selectedCategory
            ? data.map(item => item.categorias[selectedCategory] || 0)
            : data.map(item => item.ventas);

        const validSales = sales.filter(s => s > 0);
        const total = validSales.reduce((a, b) => a + b, 0);
        const average = total / (validSales.length || 1);
        const max = Math.max(...validSales, 0);
        const min = Math.min(...validSales, 0);
        const lastMonth = sales[sales.length - 1];
        const previousMonth = sales[sales.length - 2];
        const variation = previousMonth ? ((lastMonth - previousMonth) / previousMonth) * 100 : 0;
        const bestMonth = months[sales.indexOf(max)] || '-';
        const worstMonth = months[sales.indexOf(min)] || '-';

        return { total, average, max, min, variation, bestMonth, worstMonth, lastMonth, validSales };
    }, [selectedCategory, data, months]);

    const isPositiveVariation = metrics.variation >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden group"
        >
            {/* Header compacto con información */}
            <div className="px-5 pt-4 pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                            Análisis Anual
                        </h3>
                        <p className="text-lg font-bold text-gray-800 mt-0.5">
                            {selectedCategory ? selectedCategory : 'Ventas Totales'}
                        </p>
                    </div>

                    {/* Badge de variación anual */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`
                            px-3 py-1.5 rounded-lg text-right
                            ${isPositiveVariation ? 'bg-green-50' : 'bg-red-50'}
                        `}
                    >
                        <p className={`text-xs font-medium ${isPositiveVariation ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositiveVariation ? '↑' : '↓'} {Math.abs(metrics.variation).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-500">vs mes anterior</p>
                    </motion.div>
                </div>
            </div>

            {/* Gráfico */}
            <div className="px-2 pt-2 pb-1" style={{ height: '280px' }}>
                <Line data={chartData} options={options} />
            </div>

            {/* Stats compactas */}
            <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Año</p>
                        <p className="text-sm font-bold text-gray-800">
                            ${(metrics.total / 1000).toFixed(0)}k
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Promedio</p>
                        <p className="text-sm font-bold text-gray-800">
                            ${(metrics.average / 1000).toFixed(0)}k
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Mejor Mes</p>
                        <p className="text-sm font-bold text-green-600">
                            {metrics.bestMonth}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold">Peor Mes</p>
                        <p className="text-sm font-bold text-red-600">
                            {metrics.worstMonth}
                        </p>
                    </div>
                </div>
            </div>

            {/* Mini indicador de tendencia por mes + instrucción */}
            <div className="px-5 py-2 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Tendencia mensual</span>
                    <div className="flex items-center gap-1">
                        {metrics.validSales.slice(-6).map((sale, idx) => {
                            const prevSale = idx > 0 ? metrics.validSales[metrics.validSales.length - 6 + idx - 1] : sale;
                            const trend = sale >= prevSale;
                            return (
                                <div key={idx} className="flex flex-col items-center">
                                    <div
                                        className={`w-1.5 rounded-full transition-all ${trend ? 'bg-green-500' : 'bg-red-500'}`}
                                        style={{ height: `${Math.max(4, (sale / metrics.max) * 20)}px` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <span className="text-[10px] text-gray-400">
                        Últimos 6 meses
                    </span>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[9px] text-gray-400">
                        💡 Haz clic en cualquier punto del gráfico para ver los productos de ese mes
                    </p>
                </div>
            </div>
        </motion.div>
    );
}