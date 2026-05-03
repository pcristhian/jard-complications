// src/config/metas.js

export const METAS = {
    // Configuración por categoría: qué tipo de meta usar
    config: {
        'Celulares': { type: 'quantity', label: 'Unidades', suffix: 'und', icon: '📱' },
        'Ropa': { type: 'quantity', label: 'Unidades', suffix: 'und', icon: '👕' },
        'Electrónicos': { type: 'revenue', label: 'Ingresos', suffix: '$', icon: '💻' },
        'Zapatos': { type: 'quantity', label: 'Unidades', suffix: 'und', icon: '👟' },
        'Libros': { type: 'revenue', label: 'Ingresos', suffix: '$', icon: '📚' },
        'Accesorios': { type: 'quantity', label: 'Unidades', suffix: 'und', icon: '⌚' },
        'Hogar': { type: 'revenue', label: 'Ingresos', suffix: '$', icon: '🏠' },
        'default': { type: 'quantity', label: 'Unidades', suffix: 'und', icon: '📦' }
    },

    // Metas mensuales (valores numéricos)
    mensuales: {
        'Enero': {
            'Celulares': 100,
            'Ropa': 200,
            'Electrónicos': 50000,
            'Zapatos': 150,
            'Libros': 8000
        },
        'Febrero': {
            'Celulares': 110,
            'Ropa': 210,
            'Electrónicos': 55000,
            'Zapatos': 160,
            'Libros': 8500
        },
        'Marzo': {},
        'Abril': {},
        'Mayo': {},
        'Junio': {},
        'Julio': {},
        'Agosto': {},
        'Septiembre': {},
        'Octubre': {},
        'Noviembre': {},
        'Diciembre': {}
    }
};

// Obtener configuración de una categoría
export const getCategoryConfig = (categoryName) => {
    return METAS.config[categoryName] || METAS.config.default;
};

// Obtener meta para una categoría y mes (puede ser null si no hay meta asignada)
export const getMeta = (month, categoryName, metas = null) => {
    const metasData = metas || METAS;
    const monthData = metasData.mensuales?.[month];

    if (!monthData) return null;

    // Buscar meta específica de la categoría
    const metaValue = monthData[categoryName];

    if (metaValue !== undefined && metaValue !== null) {
        return metaValue;
    }

    // Buscar meta por defecto del mes
    if (monthData.default !== undefined && monthData.default !== null) {
        return monthData.default;
    }

    return null;
};

// Obtener el valor real según el tipo de meta
export const getRealValue = (category, metaType) => {
    if (!category) return 0;

    if (metaType === 'quantity') {
        return category.totalUnits || 0;
    } else if (metaType === 'revenue') {
        return category.sales || 0;
    }

    return category.sales || 0;
};

// Formatear valores para mostrar - VERSIÓN CORREGIDA
export const getFormat = (type, value) => {
    if (value === null || value === undefined) {
        return 'Sin meta';
    }

    if (type === 'quantity') {
        // Mostrar como unidades
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return value.toLocaleString();
    } else {
        // Mostrar como ingresos (moneda)
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
        return `$${value.toLocaleString()}`;
    }
};

// Nueva función: obtener el sufijo según el tipo de meta
export const getMetaSuffix = (type) => {
    if (type === 'quantity') {
        return 'und';
    } else {
        return 'ingresos';
    }
};

// Nueva función: obtener la etiqueta completa para mostrar
export const getMetaLabel = (categoryName, type) => {
    const config = getCategoryConfig(categoryName);
    const suffix = getMetaSuffix(type);

    if (type === 'quantity') {
        return `🎯 Meta (${suffix})`;
    } else {
        return `💰 Meta (${suffix})`;
    }
};

// Funciones para localStorage (persistencia)
export const loadMetas = () => {
    if (typeof window === 'undefined') return METAS;
    const saved = localStorage.getItem('metas_config');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            return METAS;
        }
    }
    return METAS;
};

export const saveMetas = (metas) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('metas_config', JSON.stringify(metas));
};

export const updateMeta = (month, categoryName, value, type) => {
    const metas = loadMetas();

    if (!metas.mensuales[month]) {
        metas.mensuales[month] = {};
    }

    if (value === null || value === undefined || value === '') {
        delete metas.mensuales[month][categoryName];
    } else {
        metas.mensuales[month][categoryName] = Number(value);
    }

    if (type) {
        if (!metas.config) metas.config = {};
        metas.config[categoryName] = {
            type,
            label: type === 'quantity' ? 'Unidades' : 'Ingresos',
            suffix: type === 'quantity' ? 'und' : '$',
            icon: metas.config[categoryName]?.icon || (type === 'quantity' ? '📦' : '💰')
        };
    }

    saveMetas(metas);
    return metas;
};

// Obtener progreso (maneja metas null)
export const getProgress = (realValue, meta) => {
    if (!meta || meta === 0 || meta === null) return null;
    return Math.min(Math.round((realValue / meta) * 100), 150);
};

// Obtener color del progreso
export const getProgressColor = (progress, metaExists) => {
    if (!metaExists) return 'bg-gray-300';
    if (progress >= 100) return 'bg-emerald-600';
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 30) return 'bg-orange-500';
    return 'bg-red-500';
};

// Función para obtener texto completo de la meta mostrada
export const getMetaDisplayText = (categoryName, type, value) => {
    const config = getCategoryConfig(categoryName);
    const suffix = getMetaSuffix(type);
    const formattedValue = getFormat(type, value);

    if (type === 'quantity') {
        return `${formattedValue} ${suffix}`;
    } else {
        return `${formattedValue} ${suffix}`;
    }
};