// src/app/dashboard/gestion-inventario/hooks/useInventarioFisico.js

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useInventarioFisico() {
    const [productos, setProductos] = useState([]);
    const [conteos, setConteos] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState({});

    const debounceTimers = useRef({});

    const cargarProductos = useCallback(async (sucursalId, categoriaId = null) => {
        if (!sucursalId) return;

        setLoading(true);
        setError(null);

        try {
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

            const { data: productosData, error: productosError } = await query.order('codigo');

            if (productosError) throw productosError;

            if (!productosData || productosData.length === 0) {
                setProductos([]);
                return [];
            }

            const productosIds = productosData.map(p => p.id);
            const { data: stocks, error: stocksError } = await supabase
                .from('productos_stock')
                .select('producto_id, stock_actual')
                .eq('sucursal_id', sucursalId)
                .in('producto_id', productosIds);

            if (stocksError) throw stocksError;

            const stockMap = new Map();
            if (stocks) {
                stocks.forEach(stock => {
                    stockMap.set(stock.producto_id, stock.stock_actual || 0);
                });
            }

            const productosConStock = productosData.map(producto => ({
                id: producto.id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                precio: producto.precio,
                categoria: producto.categorias?.nombre || 'Sin categoría',
                stock_actual: stockMap.get(producto.id) || 0
            }));

            setProductos(productosConStock);
            return productosConStock;

        } catch (err) {
            console.error('Error cargando productos:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const cargarConteos = useCallback(async (sucursalId, fechaConteo) => {
        if (!sucursalId || !fechaConteo) return {};

        try {
            const { data, error } = await supabase
                .from('inventario_fisico')
                .select('producto_id, conteos')
                .eq('sucursal_id', sucursalId)
                .eq('fecha_conteo', fechaConteo);

            if (error) throw error;

            const conteosMap = {};
            if (data) {
                data.forEach(item => {
                    conteosMap[item.producto_id] = item.conteos || {};
                });
            }

            setConteos(conteosMap);
            return conteosMap;

        } catch (err) {
            console.error('Error cargando conteos:', err);
            return {};
        }
    }, []);

    const guardarConteoReal = useCallback(async (sucursalId, productoId, columna, valor, fechaConteo) => {
        setSaving(prev => ({ ...prev, [`${productoId}_${columna}`]: true }));

        try {
            const { data: existente, error: fetchError } = await supabase
                .from('inventario_fisico')
                .select('id, conteos')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .eq('fecha_conteo', fechaConteo)
                .maybeSingle();

            if (fetchError) throw fetchError;

            const conteosActuales = existente?.conteos || {};
            const nuevosConteos = {
                ...conteosActuales,
                [columna]: valor
            };

            let result;
            if (existente) {
                result = await supabase
                    .from('inventario_fisico')
                    .update({ conteos: nuevosConteos })
                    .eq('id', existente.id);
            } else {
                result = await supabase
                    .from('inventario_fisico')
                    .insert([{
                        producto_id: productoId,
                        sucursal_id: sucursalId,
                        fecha_conteo: fechaConteo,
                        conteos: nuevosConteos,
                        tipo_conteo: 'normal'
                    }]);
            }

            if (result.error) throw result.error;

            setConteos(prev => ({
                ...prev,
                [productoId]: nuevosConteos
            }));

            return { success: true };

        } catch (err) {
            console.error('Error guardando:', err);
            return { success: false, error: err.message };
        } finally {
            setSaving(prev => {
                const newState = { ...prev };
                delete newState[`${productoId}_${columna}`];
                return newState;
            });
        }
    }, []);

    const guardarConteo = useCallback((sucursalId, productoId, columna, valor, fechaConteo) => {
        const key = `${productoId}_${columna}`;

        if (debounceTimers.current[key]) {
            clearTimeout(debounceTimers.current[key]);
        }

        setConteos(prev => ({
            ...prev,
            [productoId]: {
                ...(prev[productoId] || {}),
                [columna]: valor
            }
        }));

        debounceTimers.current[key] = setTimeout(async () => {
            await guardarConteoReal(sucursalId, productoId, columna, valor, fechaConteo);
            delete debounceTimers.current[key];
        }, 800);
    }, [guardarConteoReal]);

    return {
        productos,
        conteos,
        loading,
        error,
        saving,
        cargarProductos,
        cargarConteos,
        guardarConteo
    };
}