// src/app/dashboard/hooks/useDashboardData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

const fetchWithRetry = async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
                continue;
            }
            throw error;
        }
    }
};

export const useDashboardData = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [currentSucursal, setCurrentSucursal] = useState(null);
    const [rawVentas, setRawVentas] = useState([]);
    const [rawProductos, setRawProductos] = useState([]);

    // Ref para evitar múltiples cargas
    const isMounted = useRef(true);
    const loadingRef = useRef(false);

    const getLocalStorageData = useCallback(() => {
        try {
            const user = localStorage.getItem('currentUser');
            const sucursal = localStorage.getItem('sucursalSeleccionada');
            setCurrentUser(user ? JSON.parse(user) : null);
            setCurrentSucursal(sucursal ? JSON.parse(sucursal) : null);
            return { user: user ? JSON.parse(user) : null, sucursal: sucursal ? JSON.parse(sucursal) : null };
        } catch (err) {
            console.error('Error leyendo localStorage:', err);
            return { user: null, sucursal: null };
        }
    }, []);

    const obtenerVentas = useCallback(async (sucursalId) => {
        if (!sucursalId) return [];

        const { data, error: supabaseError } = await supabase
            .from('ventas')
            .select(`
                id,
                total_precio_venta,
                fecha_venta,
                estado,
                cantidad,
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
            .eq('sucursal_id', sucursalId)
            .eq('estado', 'activa')
            .order('fecha_venta', { ascending: false });

        if (supabaseError) {
            throw new Error(`Error al obtener ventas: ${supabaseError.message}`);
        }

        return (data || []).map(venta => ({
            ...venta,
            producto_nombre: venta.productos?.nombre || `Producto ${venta.producto_id}`,
            categoria_nombre: venta.productos?.categorias?.nombre || 'Sin Categoría',
            categoria_id: venta.productos?.categorias?.id || null,
        }));
    }, []);

    // 🔹 MODIFICADO: Obtener productos desde productos_stock (solo stock de la sucursal actual)
    const obtenerProductos = useCallback(async (sucursalId) => {
        if (!sucursalId) return [];

        const { data, error: supabaseError } = await supabase
            .from('productos_stock')
            .select(`
                stock_actual,
                producto:producto_id (
                    id,
                    nombre,
                    categoria_id,
                    categorias:categoria_id (
                        id,
                        nombre
                    )
                )
            `)
            .eq('sucursal_id', sucursalId)
            .eq('producto.activo', true);

        if (supabaseError) {
            throw new Error(`Error al obtener productos: ${supabaseError.message}`);
        }

        // Transformar datos a la estructura esperada por el dashboard
        return (data || []).map(item => ({
            id: item.producto.id,
            nombre: item.producto.nombre,
            stock_actual: item.stock_actual,
            categoria_id: item.producto.categoria_id,
            categorias: item.producto.categorias
        }));
    }, []);

    const getCurrentMonth = useCallback(() => {
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return meses[new Date().getMonth()];
    }, []);

    const getMonthNumber = useCallback((monthName) => {
        const meses = {
            'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
            'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
        };
        return meses[monthName] !== undefined ? meses[monthName] : new Date().getMonth();
    }, []);

    // Calcular ventas por categoría para un mes específico (o año completo si monthName es null)
    const calcularVentasPorCategoria = useCallback((ventas, productos, monthName = null) => {
        if (!ventas.length) return [];

        // Filtrar ventas por mes si se especifica
        let ventasFiltradas = ventas;
        let añoActual = new Date().getFullYear();

        if (monthName) {
            const mesNumero = getMonthNumber(monthName);

            // Ajustar año si el mes seleccionado es mayor al mes actual
            const ahora = new Date();
            if (mesNumero > ahora.getMonth()) {
                añoActual = añoActual - 1;
            }

            ventasFiltradas = ventas.filter(venta => {
                const fecha = new Date(venta.fecha_venta);
                return fecha.getMonth() === mesNumero && fecha.getFullYear() === añoActual;
            });
        }

        const categoriasMap = new Map();

        // Obtener categorías de productos
        productos.forEach(producto => {
            const categoriaNombre = producto.categorias?.nombre || 'Sin Categoría';
            const categoriaId = producto.categorias?.id || 0;

            if (!categoriasMap.has(categoriaNombre)) {
                const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
                const colorIndex = categoriasMap.size % colors.length;

                categoriasMap.set(categoriaNombre, {
                    id: categoriaId,
                    name: categoriaNombre,
                    totalIngresos: 0,
                    totalUnidades: 0,
                    trend: 0,
                    color: colors[colorIndex],
                    topProduct: null,
                    topProductSales: 0,
                    totalSalesCount: 0,
                    totalProducts: 0
                });
            }
        });

        // Contar productos por categoría
        productos.forEach(producto => {
            const categoriaNombre = producto.categorias?.nombre || 'Sin Categoría';
            const categoria = categoriasMap.get(categoriaNombre);
            if (categoria) {
                categoria.totalProducts++;
            }
        });

        // Acumular ventas filtradas por categoría
        ventasFiltradas.forEach(venta => {
            const categoriaNombre = venta.categoria_nombre || 'Sin Categoría';
            const unidades = venta.cantidad || 1;
            const ingresos = parseFloat(venta.total_precio_venta || 0);

            let categoria = categoriasMap.get(categoriaNombre);
            if (!categoria) {
                const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
                categoria = {
                    id: categoriasMap.size + 1,
                    name: categoriaNombre,
                    totalIngresos: 0,
                    totalUnidades: 0,
                    trend: 0,
                    color: colors[categoriasMap.size % colors.length],
                    topProduct: null,
                    topProductSales: 0,
                    totalSalesCount: 0,
                    totalProducts: 0
                };
                categoriasMap.set(categoriaNombre, categoria);
            }

            categoria.totalIngresos += ingresos;
            categoria.totalUnidades += unidades;
            categoria.totalSalesCount++;

            // Producto más vendido (por unidades)
            const productoNombre = venta.producto_nombre;
            if (unidades > categoria.topProductSales) {
                categoria.topProductSales = unidades;
                categoria.topProduct = productoNombre;
            }
        });

        // Calcular tendencia (comparar mes actual vs mes anterior)
        let mesActualKey = null;
        let mesAnteriorKey = null;

        if (monthName) {
            const mesNumero = getMonthNumber(monthName);
            const mesAnteriorNumero = mesNumero === 0 ? 11 : mesNumero - 1;
            const añoAnterior = mesNumero === 0 ? añoActual - 1 : añoActual;

            mesActualKey = `${añoActual}-${mesNumero}`;
            mesAnteriorKey = `${añoAnterior}-${mesAnteriorNumero}`;
        } else {
            const ahora = new Date();
            const mesActual = ahora.getMonth();
            const mesAnterior = mesActual === 0 ? 11 : mesActual - 1;
            const añoAnterior = mesActual === 0 ? ahora.getFullYear() - 1 : ahora.getFullYear();

            mesActualKey = `${ahora.getFullYear()}-${mesActual}`;
            mesAnteriorKey = `${añoAnterior}-${mesAnterior}`;
        }

        // Recolectar ventas por mes para tendencia (de todas las ventas, no filtradas)
        const ventasPorMes = new Map();
        ventas.forEach(venta => {
            const fecha = new Date(venta.fecha_venta);
            const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`;
            const categoriaNombre = venta.categoria_nombre || 'Sin Categoría';

            if (!ventasPorMes.has(categoriaNombre)) {
                ventasPorMes.set(categoriaNombre, new Map());
            }
            const catVentas = ventasPorMes.get(categoriaNombre);
            catVentas.set(mesKey, (catVentas.get(mesKey) || 0) + (venta.cantidad || 1));
        });

        const categoriasArray = Array.from(categoriasMap.values()).map(cat => {
            const catVentasMes = ventasPorMes.get(cat.name);
            const ventasMesActual = catVentasMes?.get(mesActualKey) || 0;
            const ventasMesAnterior = catVentasMes?.get(mesAnteriorKey) || 0;

            let trend = 0;
            if (ventasMesAnterior > 0) {
                trend = ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100;
            } else if (ventasMesActual > 0) {
                trend = 100;
            }

            return {
                id: cat.id,
                name: cat.name,
                sales: cat.totalIngresos,
                totalUnits: cat.totalUnidades,
                totalIngresos: cat.totalIngresos,
                trend: Math.round(trend),
                color: cat.color,
                totalProducts: cat.totalProducts,
                totalSalesCount: cat.totalSalesCount,
                topProduct: cat.topProduct,
            };
        });

        return categoriasArray.sort((a, b) => b.sales - a.sales);
    }, [getMonthNumber]);

    // Calcular ventas mensuales (para el gráfico)
    const calcularVentasMensuales = useCallback((ventas) => {
        if (!ventas.length) return [];

        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const añoActual = new Date().getFullYear();

        const monthlyData = meses.map((month, index) => ({
            month,
            ventas: 0,
            unidades: 0,
            categorias: {},
            categoriasUnidades: {}
        }));

        ventas.forEach(venta => {
            const fecha = new Date(venta.fecha_venta);
            if (fecha.getFullYear() === añoActual) {
                const mesIndex = fecha.getMonth();
                const categoria = venta.categoria_nombre || 'Sin Categoría';
                const ingresos = parseFloat(venta.total_precio_venta || 0);
                const unidades = venta.cantidad || 1;

                monthlyData[mesIndex].ventas += ingresos;
                monthlyData[mesIndex].unidades += unidades;
                monthlyData[mesIndex].categorias[categoria] =
                    (monthlyData[mesIndex].categorias[categoria] || 0) + ingresos;
                monthlyData[mesIndex].categoriasUnidades[categoria] =
                    (monthlyData[mesIndex].categoriasUnidades[categoria] || 0) + unidades;
            }
        });

        return monthlyData;
    }, []);

    const calcularTopProductosPorMes = useCallback((ventas, monthName) => {
        if (!ventas.length) return {};

        let mesNumero;
        let año = new Date().getFullYear();

        if (monthName) {
            mesNumero = getMonthNumber(monthName);
            const ahora = new Date();
            if (mesNumero > ahora.getMonth()) {
                año = año - 1;
            }
        } else {
            const ahora = new Date();
            mesNumero = ahora.getMonth();
            año = ahora.getFullYear();
        }

        const ventasFiltradas = ventas.filter(venta => {
            const fecha = new Date(venta.fecha_venta);
            return fecha.getMonth() === mesNumero && fecha.getFullYear() === año;
        });

        if (!ventasFiltradas.length) return {};

        const productosMap = new Map();

        ventasFiltradas.forEach(venta => {
            const productoId = venta.producto_id;
            const cantidad = venta.cantidad || 1;
            const totalVenta = parseFloat(venta.total_precio_venta || 0);
            const categoria = venta.categoria_nombre || 'Sin Categoría';
            const productoNombre = venta.producto_nombre || `Producto ${productoId}`;

            if (!productosMap.has(productoId)) {
                productosMap.set(productoId, {
                    id: productoId,
                    name: productoNombre,
                    category: categoria,
                    sales: 0,
                    revenue: 0
                });
            }

            const producto = productosMap.get(productoId);
            producto.sales += cantidad;
            producto.revenue += totalVenta;
        });

        const topProductsByCategory = {};

        productosMap.forEach(producto => {
            const category = producto.category;
            if (!topProductsByCategory[category]) {
                topProductsByCategory[category] = [];
            }
            topProductsByCategory[category].push({
                name: producto.name,
                sales: producto.sales,
                revenue: producto.revenue
            });
        });

        Object.keys(topProductsByCategory).forEach(category => {
            topProductsByCategory[category] = topProductsByCategory[category]
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 10);
        });

        return topProductsByCategory;
    }, [getMonthNumber]);

    // Función para obtener categorías filtradas por un mes específico
    const getCategoriesByMonth = useCallback((monthName) => {
        if (!rawVentas.length || !rawProductos.length) return [];
        return calcularVentasPorCategoria(rawVentas, rawProductos, monthName);
    }, [rawVentas, rawProductos, calcularVentasPorCategoria]);

    const getTopProductsByMonth = useCallback((monthName) => {
        if (!rawVentas.length) return {};
        return calcularTopProductosPorMes(rawVentas, monthName);
    }, [rawVentas, calcularTopProductosPorMes]);

    // Función principal para cargar datos - optimizada
    const cargarDatos = useCallback(async () => {
        // Evitar ejecución múltiple simultánea
        if (loadingRef.current) {
            console.log('Carga ya en progreso, omitiendo...');
            return;
        }

        loadingRef.current = true;

        try {
            const { user, sucursal } = getLocalStorageData();

            if (!sucursal) {
                if (isMounted.current) {
                    setDashboardData(null);
                    setLoading(false);
                }
                loadingRef.current = false;
                return;
            }

            if (isMounted.current) {
                setLoading(true);
                setError(null);
            }

            const [ventas, productos] = await Promise.all([
                obtenerVentas(sucursal.id),
                obtenerProductos(sucursal.id)
            ]);

            if (!isMounted.current) return;

            setRawVentas(ventas);
            setRawProductos(productos);

            // Datos del año completo (vista global)
            const categories = calcularVentasPorCategoria(ventas, productos, null);
            const monthlySales = calcularVentasMensuales(ventas);
            const topProducts = calcularTopProductosPorMes(ventas, null);

            const ventasActivas = ventas.filter(v => v.estado === 'activa');
            const totalIngresos = ventasActivas.reduce((sum, v) => sum + parseFloat(v.total_precio_venta || 0), 0);
            const totalUnidades = ventasActivas.reduce((sum, v) => sum + (v.cantidad || 1), 0);

            setDashboardData({
                categories,
                monthlySales,
                topProducts,
                currentMonth: getCurrentMonth(),
                stats: {
                    totalVentas: ventasActivas.length,
                    totalIngresos,
                    totalUnidades,
                    totalProductos: productos.length,
                }
            });
        } catch (err) {
            console.error('Error cargando datos:', err);
            if (isMounted.current) {
                setError(err.message);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
            loadingRef.current = false;
        }
    }, [getLocalStorageData, obtenerVentas, obtenerProductos, calcularVentasPorCategoria, calcularVentasMensuales, calcularTopProductosPorMes, getCurrentMonth]);

    // Efecto principal con dependencias mínimas
    useEffect(() => {
        isMounted.current = true;

        // Cargar datos iniciales
        cargarDatos();

        // Event listener para cambios en localStorage
        const handleStorageChange = () => {
            cargarDatos();
        };

        window.addEventListener('storage', handleStorageChange);

        // Intervalo para recargar cada 5 minutos
        const interval = setInterval(() => {
            cargarDatos();
        }, 5 * 60 * 1000);

        return () => {
            isMounted.current = false;
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, [cargarDatos]);

    return {
        dashboardData,
        loading,
        error,
        currentUser,
        currentSucursal,
        getTopProductsByMonth,
        getCategoriesByMonth,
        refetch: cargarDatos
    };
};