// hooks/useDashboardData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export const useDashboardData = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [productosMasVendidos, setProductosMasVendidos] = useState([]);
    const [productosBajoStock, setProductosBajoStock] = useState([]);
    const [mesesDisponibles, setMesesDisponibles] = useState([]);
    const [mesSeleccionado, setMesSeleccionado] = useState(null);

    // Obtener la sucursal del localStorage
    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { sucursalSeleccionada } = values;

    // Generar lista de últimos 6 meses
    const generarMesesDisponibles = useCallback(() => {
        const meses = [];
        const ahora = new Date();
        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Generar últimos 6 meses (incluyendo el actual)
        for (let i = 0; i < 6; i++) {
            const fecha = new Date(ahora);
            fecha.setMonth(ahora.getMonth() - i);

            const año = fecha.getFullYear();
            const mes = fecha.getMonth();
            const mesNombre = nombresMeses[mes];

            // Formato: YYYY-MM para filtros en la BD
            const fechaInicio = new Date(año, mes, 1);
            const fechaFin = new Date(año, mes + 1, 0);

            meses.push({
                id: i,
                nombre: `${mesNombre} ${año}`,
                valor: `${año}-${String(mes + 1).padStart(2, '0')}`,
                fechaInicio: fechaInicio.toISOString(),
                fechaFin: fechaFin.toISOString(),
                esActual: i === 0 // El primer elemento es el mes actual
            });
        }

        setMesesDisponibles(meses);

        // Seleccionar el mes actual por defecto
        if (meses.length > 0 && !mesSeleccionado) {
            setMesSeleccionado(meses[0]);
        }
    }, [mesSeleccionado]);

    const cargarProductosMasVendidos = async (mes) => {
        if (!sucursalSeleccionada?.id || !mes) return;

        try {
            let query = supabase
                .from('ventas')
                .select(`
                    producto_id,
                    cantidad,
                    fecha_venta,
                    productos!inner(
                        id,
                        nombre,
                        stock_actual,
                        stock_minimo,
                        categoria_id,
                        categorias!inner(
                            id,
                            nombre
                        )
                    )
                `)
                .eq('estado', 'activa')
                .eq('sucursal_id', sucursalSeleccionada.id)
                .gte('fecha_venta', mes.fechaInicio)
                .lte('fecha_venta', mes.fechaFin);

            const { data: ventasData, error: ventasError } = await query;

            if (ventasError) throw ventasError;

            // Procesar los datos para agrupar por categoría y producto
            const ventasPorCategoria = {};

            ventasData.forEach(venta => {
                if (!venta.productos) return;

                const categoriaId = venta.productos.categoria_id;
                const categoriaNombre = venta.productos.categorias?.nombre || 'Sin categoría';
                const productoId = venta.producto_id;
                const productoNombre = venta.productos.nombre;
                const stockActual = venta.productos.stock_actual || 0;
                const stockMinimo = venta.productos.stock_minimo || 0;

                if (!ventasPorCategoria[categoriaId]) {
                    ventasPorCategoria[categoriaId] = {
                        id: categoriaId,
                        nombre: categoriaNombre,
                        productos: {}
                    };
                }

                if (!ventasPorCategoria[categoriaId].productos[productoId]) {
                    ventasPorCategoria[categoriaId].productos[productoId] = {
                        id: productoId,
                        nombre: productoNombre,
                        cantidad: 0,
                        stock_actual: stockActual,
                        stock_minimo: stockMinimo
                    };
                }

                ventasPorCategoria[categoriaId].productos[productoId].cantidad += venta.cantidad;
            });

            // Obtener el producto más vendido por cada categoría
            const productosMasVendidosArray = Object.values(ventasPorCategoria)
                .map(categoria => {
                    const productosArray = Object.values(categoria.productos);
                    if (productosArray.length === 0) return null;

                    const masVendido = productosArray.reduce((max, producto) =>
                        producto.cantidad > max.cantidad ? producto : max
                        , productosArray[0]);

                    return {
                        categoria: categoria.nombre,
                        categoriaId: categoria.id,
                        ...masVendido
                    };
                })
                .filter(item => item !== null)
                .sort((a, b) => b.cantidad - a.cantidad);

            setProductosMasVendidos(productosMasVendidosArray);
        } catch (err) {
            console.error('Error cargando productos más vendidos:', err);
            throw err;
        }
    };

    const cargarProductosBajoStock = async () => {
        if (!sucursalSeleccionada?.id) return;

        try {
            const { data: stockData, error: stockError } = await supabase
                .from('productos')
                .select(`
                    id,
                    nombre,
                    stock_actual,
                    stock_minimo,
                    categorias!inner(
                        id,
                        nombre
                    )
                `)
                .eq('activo', true)
                .eq('sucursal_id', sucursalSeleccionada.id);

            if (stockError) throw stockError;

            const productosBajoStockArray = stockData
                .filter(producto => producto.stock_actual <= producto.stock_minimo)
                .map(producto => ({
                    id: producto.id,
                    nombre: producto.nombre,
                    categoria: producto.categorias?.nombre || 'Sin categoría',
                    categoriaId: producto.categorias?.id,
                    stockActual: producto.stock_actual || 0,
                    stockMinimo: producto.stock_minimo || 0,
                    diferencia: (producto.stock_minimo || 0) - (producto.stock_actual || 0),
                    alerta: producto.stock_actual === 0 ? 'sin_stock' : 'bajo_stock',
                    porcentajeStock: producto.stock_minimo > 0
                        ? Math.round((producto.stock_actual / producto.stock_minimo) * 100)
                        : 0
                }))
                .sort((a, b) => {
                    if (a.alerta === 'sin_stock' && b.alerta !== 'sin_stock') return -1;
                    if (a.alerta !== 'sin_stock' && b.alerta === 'sin_stock') return 1;
                    return b.diferencia - a.diferencia;
                });

            setProductosBajoStock(productosBajoStockArray);
        } catch (err) {
            console.error('Error cargando productos con bajo stock:', err);
            throw err;
        }
    };

    const cargarDatosDashboard = useCallback(async () => {
        if (!sucursalSeleccionada?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await Promise.all([
                cargarProductosMasVendidos(mesSeleccionado),
                cargarProductosBajoStock()
            ]);

        } catch (err) {
            console.error('Error cargando datos del dashboard:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [sucursalSeleccionada?.id, mesSeleccionado]);

    // Función para cambiar el mes seleccionado
    const cambiarMes = (nuevoMes) => {
        setMesSeleccionado(nuevoMes);
    };

    // Efecto para generar meses disponibles al iniciar
    useEffect(() => {
        generarMesesDisponibles();
    }, [generarMesesDisponibles]);

    // Efecto para cargar datos cuando cambia la sucursal o el mes
    useEffect(() => {
        if (sucursalSeleccionada?.id && mesSeleccionado) {
            cargarDatosDashboard();
        }
    }, [sucursalSeleccionada?.id, mesSeleccionado, cargarDatosDashboard]);

    return {
        loading,
        error,
        productosMasVendidos,
        productosBajoStock,
        mesesDisponibles,
        mesSeleccionado,
        cambiarMes,
        sucursalSeleccionada,
        recargar: cargarDatosDashboard
    };
};