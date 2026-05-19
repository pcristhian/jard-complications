// src/app/dashboard/gestion-inventario/hooks/useInventarioPeriodo.js
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useInventarioPeriodo() {
    const [inventario, setInventario] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [periodo, setPeriodo] = useState({
        fecha_inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        fecha_fin: new Date()
    });

    const cargarCategorias = useCallback(async () => {
        try {
            const { data, error: catError } = await supabase
                .from('categorias')
                .select('id, nombre')
                .eq('activo', true)
                .order('nombre');

            if (catError) throw catError;
            setCategorias(data || []);
            return data;
        } catch (err) {
            console.error('Error cargando categorías:', err);
            return [];
        }
    }, []);

    const registrarConteoFisico = useCallback(async (productoId, sucursalId, stockReal, observacion) => {
        console.log('Guardando conteo:', { productoId, sucursalId, stockReal, observacion });

        const hoy = new Date().toISOString().split('T')[0];

        const nuevoConteo = {
            producto_id: Number(productoId),
            sucursal_id: Number(sucursalId),
            stock_hoy: Number(stockReal),
            fecha_conteo: hoy,
            observaciones: observacion || null
        };

        try {
            // Verificar si ya existe un conteo hoy para este producto
            const { data: existente } = await supabase
                .from('inventario_fisico')
                .select('id')
                .eq('producto_id', nuevoConteo.producto_id)
                .eq('sucursal_id', nuevoConteo.sucursal_id)
                .eq('fecha_conteo', hoy)
                .maybeSingle();

            let result;

            if (existente) {
                // Actualizar conteo existente
                console.log('Actualizando conteo existente:', existente.id);
                result = await supabase
                    .from('inventario_fisico')
                    .update({
                        stock_hoy: nuevoConteo.stock_hoy,
                        observaciones: nuevoConteo.observaciones
                    })
                    .eq('id', existente.id);
            } else {
                // Insertar nuevo conteo
                console.log('Insertando nuevo conteo');
                result = await supabase
                    .from('inventario_fisico')
                    .insert([nuevoConteo]);
            }

            if (result.error) {
                console.error('Error al guardar:', result.error);
                return { success: false, error: result.error.message };
            }

            console.log('Conteo guardado exitosamente');
            return { success: true };

        } catch (err) {
            console.error('Error inesperado:', err);
            return { success: false, error: err.message };
        }
    }, []);

    const cargarInventario = useCallback(async (sucursalId, fechaInicio, fechaFin, categoriaId = null) => {
        if (!sucursalId) return;

        setLoading(true);
        setError(null);

        try {
            const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
            const fechaFinStr = fechaFin.toISOString().split('T')[0];

            let query = supabase
                .from('productos')
                .select(`
                    id,
                    codigo,
                    nombre,
                    precio,
                    categoria_id,
                    categorias (nombre)
                `)
                .eq('activo', true);

            if (categoriaId) {
                query = query.eq('categoria_id', categoriaId);
            }

            const { data: productos, error: productosError } = await query.order('codigo');

            if (productosError) throw productosError;

            if (!productos || productos.length === 0) {
                setInventario([]);
                return [];
            }

            const { data: stocksIniciales } = await supabase
                .from('productos_stock')
                .select('producto_id, stock_actual')
                .eq('sucursal_id', sucursalId)
                .lt('created_at', fechaInicioStr)
                .order('created_at', { ascending: false });

            const stockInicialMap = new Map();
            if (stocksIniciales) {
                const productosUnicos = new Set();
                for (const stock of stocksIniciales) {
                    if (!productosUnicos.has(stock.producto_id)) {
                        productosUnicos.add(stock.producto_id);
                        stockInicialMap.set(stock.producto_id, stock.stock_actual);
                    }
                }
            }

            const { data: movimientosEntrada } = await supabase
                .from('movimientos')
                .select('datos')
                .eq('sucursal_id', sucursalId)
                .eq('estado', 'activo')
                .in('tipo_movimiento', ['entrada_stock', 'creacion_producto'])
                .gte('created_at', fechaInicioStr)
                .lte('created_at', fechaFinStr);

            const aumentosMap = new Map();
            if (movimientosEntrada) {
                for (const movimiento of movimientosEntrada) {
                    const productoId = movimiento.datos?.producto_id;
                    const cantidad = movimiento.datos?.cantidad || 0;
                    if (productoId) {
                        aumentosMap.set(productoId, (aumentosMap.get(productoId) || 0) + cantidad);
                    }
                }
            }

            const { data: ventas } = await supabase
                .from('ventas')
                .select('producto_id, cantidad')
                .eq('sucursal_id', sucursalId)
                .eq('estado', 'activa')
                .gte('fecha_venta', fechaInicioStr)
                .lte('fecha_venta', fechaFinStr);

            const ventasMap = new Map();
            if (ventas) {
                for (const venta of ventas) {
                    ventasMap.set(venta.producto_id, (ventasMap.get(venta.producto_id) || 0) + venta.cantidad);
                }
            }

            const inventarioData = productos.map((producto, index) => {
                const stockInicial = stockInicialMap.get(producto.id) || 0;
                const aumentos = aumentosMap.get(producto.id) || 0;
                const ventas = ventasMap.get(producto.id) || 0;
                const stockCalculado = stockInicial + aumentos - ventas;

                return {
                    numero: index + 1,
                    producto_id: producto.id,
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    precio: producto.precio || 0,
                    categoria_nombre: producto.categorias?.nombre || 'Sin categoría',
                    stock_inicial: stockInicial,
                    aumentos: aumentos,
                    ventas: ventas,
                    stock_calculado: stockCalculado
                };
            });

            setInventario(inventarioData);
            return inventarioData;

        } catch (err) {
            console.error('Error:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        inventario,
        categorias,
        loading,
        error,
        periodo,
        cargarInventario,
        cargarCategorias,
        actualizarPeriodo: setPeriodo,
        registrarConteoFisico
    };
}