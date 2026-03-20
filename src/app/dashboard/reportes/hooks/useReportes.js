// hooks/useReportes.js - Versión corregida
import { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
export const useReportes = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        categoria: null, // Cambiado de 'todas' a null
        mes: null, // Cambiado de 'todos' a null
        usuario: null, // Cambiado de 'todos' a null
        sucursal: null, // Nuevo filtro para sucursal
        busqueda: ''
    });


    const [sucursales, setSucursales] = useState([]);

    // Obtener datos para la tabla principal con filtros
    // hooks/useReportes.js - Actualizar fetchReportData para incluir IDs
    const fetchReportData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('ventas')
                .select(`
        id,
        cantidad,
        total_precio_venta,
        descuento_venta,
        fecha_venta,
        observaciones,
        estado,
        depositado,
        producto_id,
        promotor_id,
        sucursal_id,
        productos:producto_id (
          id,
          nombre,
          codigo,
          precio,
          costo,
          categoria_id,
          categorias:categoria_id (
            id,
            nombre
          )
        ),
        promotor:promotor_id (
          id,
          nombre
        ),
        sucursal:sucursal_id (
          id,
          nombre
        )
      `);

            // hooks/useReportes.js - Dentro de fetchReportData, después del filtro de usuario
            // Aplicar filtros
            if (filters.categoria && filters.categoria !== '') {
                query = query.eq('productos.categoria_id', filters.categoria);
            }

            if (filters.mes && filters.mes !== '') {
                const [year, month] = filters.mes.split('-');
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);

                query = query
                    .gte('fecha_venta', startDate.toISOString())
                    .lte('fecha_venta', endDate.toISOString());
            }

            if (filters.usuario && filters.usuario !== '') {
                query = query.eq('promotor_id', filters.usuario);
            }

            // ← AGREGAR filtro de sucursal
            if (filters.sucursal && filters.sucursal !== '') {
                query = query.eq('sucursal_id', filters.sucursal);
            }

            const { data: result, error } = await query.order('fecha_venta', { ascending: false });

            if (error) throw error;

            // Transformar datos para la tabla INCLUYENDO IDs
            const transformedData = result.map(item => ({
                id: item.id,
                fecha: format(new Date(item.fecha_venta), 'dd/MM/yyyy HH:mm'),
                fechaOriginal: item.fecha_venta, // Guardar fecha original para filtros
                producto: item.productos?.nombre || 'N/A',
                productoId: item.productos?.id,
                codigo: item.productos?.codigo || 'N/A',
                categoria: item.productos?.categorias?.nombre || 'N/A',
                categoriaId: item.productos?.categoria_id, // ID de categoría para filtrar
                promotor: item.promotor?.nombre || 'N/A',
                promotorId: item.promotor_id, // ID de promotor para filtrar
                sucursal: item.sucursal?.nombre || 'N/A',
                sucursalId: item.sucursal_id,
                cantidad: item.cantidad,
                precio_unitario: item.productos?.precio || 0,
                total: item.total_precio_venta,
                descuento: item.descuento_venta,
                estado: item.estado,
                depositado: item.depositado ? 'Sí' : 'No'
            }));

            setData(transformedData);
            return transformedData;
        } catch (err) {
            console.error('Error en fetchReportData:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Obtener productos por sucursal
    const fetchProductosPorSucursal = useCallback(async () => {
        try {
            const { data: sucursales, error: sucursalesError } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('activo', true);

            if (sucursalesError) throw sucursalesError;

            const productosPorSucursal = {};

            for (const sucursal of sucursales) {
                const { data: productos, error } = await supabase
                    .from('productos')
                    .select(`
            id,
            codigo,
            nombre,
            descripcion,
            precio,
            costo,
            stock_actual,
            stock_minimo,
            activo,
            categorias:categoria_id (
              nombre
            )
          `)
                    .eq('sucursal_id', sucursal.id)
                    .eq('activo', true);

                if (error) throw error;

                productosPorSucursal[sucursal.nombre] = productos.map(p => ({
                    codigo: p.codigo,
                    nombre: p.nombre,
                    descripcion: p.descripcion || '',
                    categoria: p.categorias?.nombre || 'N/A',
                    precio: p.precio,
                    costo: p.costo || 0,
                    stock_actual: p.stock_actual,
                    stock_minimo: p.stock_minimo,
                    estado: p.activo ? 'Activo' : 'Inactivo'
                }));
            }

            return productosPorSucursal;
        } catch (err) {
            console.error('Error en fetchProductosPorSucursal:', err);
            setError(err.message);
            return {};
        }
    }, []);

    // Obtener productos más vendidos
    const fetchProductosMasVendidos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('ventas')
                .select(`
          cantidad,
          productos:producto_id (
            id,
            nombre,
            codigo,
            categorias:categoria_id (
              nombre
            )
          )
        `)
                .eq('estado', 'activa');

            if (error) throw error;

            // Agrupar y sumar cantidades por producto
            const ventasPorProducto = data.reduce((acc, venta) => {
                if (!venta.productos) return acc;

                const productoId = venta.productos.id;
                if (!acc[productoId]) {
                    acc[productoId] = {
                        id: productoId,
                        nombre: venta.productos.nombre,
                        codigo: venta.productos.codigo,
                        categoria: venta.productos.categorias?.nombre || 'N/A',
                        total_vendido: 0
                    };
                }
                acc[productoId].total_vendido += venta.cantidad;
                return acc;
            }, {});

            // Convertir a array y ordenar por cantidad vendida
            return Object.values(ventasPorProducto)
                .sort((a, b) => b.total_vendido - a.total_vendido)
                .map((item, index) => ({
                    posicion: index + 1,
                    codigo: item.codigo,
                    nombre: item.nombre,
                    categoria: item.categoria,
                    total_vendido: item.total_vendido
                }));

        } catch (err) {
            console.error('Error en fetchProductosMasVendidos:', err);
            setError(err.message);
            return [];
        }
    }, []);

    // Función principal para descargar Excel
    const downloadExcel = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener todos los datos necesarios
            const [tablaPrincipal, productosPorSucursal, productosMasVendidos] = await Promise.all([
                fetchReportData(),
                fetchProductosPorSucursal(),
                fetchProductosMasVendidos()
            ]);

            // Crear libro de Excel
            const wb = XLSX.utils.book_new();
            let hasSheets = false;

            // Hoja 1: Tabla principal filtrada
            if (tablaPrincipal && tablaPrincipal.length > 0) {
                const ws1 = XLSX.utils.json_to_sheet(tablaPrincipal);
                XLSX.utils.book_append_sheet(wb, ws1, 'Reporte Ventas');
                hasSheets = true;
            }

            // Hojas por sucursal
            if (productosPorSucursal && Object.keys(productosPorSucursal).length > 0) {
                for (const [sucursal, productos] of Object.entries(productosPorSucursal)) {
                    if (productos && productos.length > 0) {
                        const ws = XLSX.utils.json_to_sheet(productos);
                        // Limitar nombre de hoja a 31 caracteres (límite de Excel)
                        const sheetName = `Productos ${sucursal}`.substring(0, 31);
                        XLSX.utils.book_append_sheet(wb, ws, sheetName);
                        hasSheets = true;
                    }
                }
            }

            // Hoja de productos más vendidos
            if (productosMasVendidos && productosMasVendidos.length > 0) {
                const wsMasVendidos = XLSX.utils.json_to_sheet(productosMasVendidos);
                XLSX.utils.book_append_sheet(wb, wsMasVendidos, 'Más Vendidos');
                hasSheets = true;
            }

            // Verificar si hay al menos una hoja
            if (!hasSheets) {
                // Crear una hoja con mensaje informativo
                const wsEmpty = XLSX.utils.json_to_sheet([{
                    'Mensaje': 'No hay datos disponibles para exportar',
                    'Fecha': format(new Date(), 'dd/MM/yyyy HH:mm'),
                    'Filtros Aplicados': filters.categoria ? `Categoría: ${filters.categoria}` : 'Sin filtros'
                }]);
                XLSX.utils.book_append_sheet(wb, wsEmpty, 'Sin Datos');
            }

            // Generar nombre del archivo con fecha
            const fileName = `reporte_completo_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;

            // Descargar archivo
            XLSX.writeFile(wb, fileName);

        } catch (err) {
            console.error('Error en downloadExcel:', err);
            setError(err.message);

            // Opcional: Crear un archivo con el error para no dejar al usuario sin respuesta
            try {
                const wbError = XLSX.utils.book_new();
                const wsError = XLSX.utils.json_to_sheet([{
                    'Error': 'Ocurrió un error al generar el reporte',
                    'Mensaje': err.message,
                    'Fecha': format(new Date(), 'dd/MM/yyyy HH:mm')
                }]);
                XLSX.utils.book_append_sheet(wbError, wsError, 'Error');

                const errorFileName = `error_reporte_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
                XLSX.writeFile(wbError, errorFileName);
            } catch (fallbackErr) {
                console.error('Error al crear archivo de error:', fallbackErr);
            }
        } finally {
            setLoading(false);
        }
    }, [fetchReportData, fetchProductosPorSucursal, fetchProductosMasVendidos, filters]);


    // hooks/useReportes.js - Modificar fetchFilterOptions
    const fetchFilterOptions = useCallback(async () => {
        try {
            const [categorias, usuarios, sucursalesData] = await Promise.all([
                supabase.from('categorias').select('id, nombre').eq('activo', true),
                supabase.from('usuarios').select('id, nombre').eq('activo', true),
                supabase.from('sucursales').select('id, nombre').eq('activo', true)
            ]);

            setSucursales(sucursalesData.data || []); // ← Guardar en estado

            return {
                categorias: categorias.data || [],
                usuarios: usuarios.data || [],
                sucursales: sucursalesData.data || []
            };
        } catch (err) {
            console.error('Error en fetchFilterOptions:', err);
            setError(err.message);
            return { categorias: [], usuarios: [], sucursales: [] };
        }
    }, []);

    // hooks/useReportes.js - Modificar hasActiveFilters
    const hasActiveFilters = useMemo(() => {
        return filters.categoria !== '' ||
            filters.mes !== '' ||
            filters.usuario !== '' ||
            filters.sucursal !== '' || // ← AGREGAR
            filters.busqueda !== '';
    }, [filters]);

    // Limpiar filtros
    // hooks/useReportes.js - Modificar clearFilters
    const clearFilters = useCallback(() => {
        setFilters({
            categoria: null,
            mes: null,
            usuario: null,
            sucursal: null, // ← AGREGAR
            busqueda: ''
        });
        fetchReportData();
    }, [fetchReportData]);

    // Actualizar un filtro específico
    const updateFilter = useCallback((key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    // Generar opciones de meses (últimos 12 meses)
    const monthOptions = useMemo(() => {
        const options = [];
        const today = new Date();
        const monthsInSpanish = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        for (let i = 0; i < 12; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = date.getFullYear();
            const month = date.getMonth();
            const value = `${year}-${String(month + 1).padStart(2, '0')}`;
            const label = `${monthsInSpanish[month]} ${year}`;
            options.push({ value, label });
        }

        return options.sort((a, b) => new Date(b.value) - new Date(a.value)); // Ordenar de más reciente a más antiguo
    }, []);

    return {
        loading,
        error,
        data,
        sucursales,
        filters,
        hasActiveFilters,
        monthOptions,
        fetchReportData,
        downloadExcel,
        fetchFilterOptions,
        clearFilters,
        updateFilter
    };
};