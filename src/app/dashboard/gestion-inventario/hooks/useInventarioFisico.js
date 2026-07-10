// src/app/dashboard/gestion-inventario/hooks/useInventarioFisico.js
"use client";

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useInventarioFisico() {
    const [productos, setProductos] = useState([]);
    const [conteos, setConteos] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState({});
    const [fechaActual, setFechaActual] = useState(new Date().toISOString().split('T')[0]);

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
        if (!sucursalId || !fechaConteo) {
            setConteos({});
            return {};
        }

        try {
            console.log('Cargando conteos para fecha:', fechaConteo);

            const { data, error } = await supabase
                .from('inventario_fisico')
                .select('producto_id, conteos')
                .eq('sucursal_id', sucursalId)
                .eq('fecha_conteo', fechaConteo);

            if (error) throw error;

            const conteosMap = {};
            if (data && data.length > 0) {
                data.forEach(item => {
                    conteosMap[item.producto_id] = item.conteos || {};
                });
            }

            console.log('Conteos cargados:', Object.keys(conteosMap).length, 'productos');
            setConteos(conteosMap);
            return conteosMap;

        } catch (err) {
            console.error('Error cargando conteos:', err);
            setConteos({});
            return {};
        }
    }, []);

    const limpiarConteos = useCallback(() => {
        setConteos({});
    }, []);

    const guardarConteoReal = useCallback(async (sucursalId, productoId, columna, valor, fechaConteo) => {
        // Validar parámetros
        if (!sucursalId || !productoId || !columna || !fechaConteo) {
            console.error('Parámetros inválidos:', { sucursalId, productoId, columna, fechaConteo });
            return { success: false, error: 'Parámetros inválidos' };
        }

        const savingKey = `${productoId}_${columna}`;
        setSaving(prev => ({ ...prev, [savingKey]: true }));

        try {
            // Limpiar el valor (string vacío si es null o undefined)
            const valorLimpio = (valor === null || valor === undefined) ? '' : String(valor);

            console.log(`Guardando: producto ${productoId}, ${columna} = "${valorLimpio}"`);

            // ✅ Estrategia: UPSERT - intentar actualizar o insertar en una sola operación
            // Primero, obtener el registro actual
            const { data: existente, error: fetchError } = await supabase
                .from('inventario_fisico')
                .select('id, conteos')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .eq('fecha_conteo', fechaConteo)
                .maybeSingle();

            if (fetchError) {
                console.error('Error al buscar registro:', fetchError);
                throw fetchError;
            }

            let nuevosConteos;
            let result;

            if (existente) {
                // ✅ Actualizar registro existente
                nuevosConteos = {
                    ...(existente.conteos || {}),
                    [columna]: valorLimpio
                };

                const { data, error } = await supabase
                    .from('inventario_fisico')
                    .update({
                        conteos: nuevosConteos
                    })
                    .eq('id', existente.id)
                    .select();

                if (error) throw error;
                result = data;
            } else {
                // ✅ Insertar nuevo registro
                nuevosConteos = {
                    [columna]: valorLimpio
                };

                const { data, error } = await supabase
                    .from('inventario_fisico')
                    .insert({
                        producto_id: productoId,
                        sucursal_id: sucursalId,
                        fecha_conteo: fechaConteo,
                        conteos: nuevosConteos,
                        tipo_conteo: 'normal',
                        estado: 'pendiente'
                    })
                    .select();

                if (error) throw error;
                result = data;
            }

            // ✅ Verificar que la operación fue exitosa
            if (!result || result.length === 0) {
                throw new Error('No se recibieron datos de la operación');
            }

            console.log(`✅ Guardado exitoso: ${columna} = "${valorLimpio}"`);

            // ✅ Actualizar estado local con los datos devueltos
            const conteoGuardado = result[0].conteos || nuevosConteos;
            setConteos(prev => ({
                ...prev,
                [productoId]: conteoGuardado
            }));

            return { success: true };

        } catch (err) {
            console.error(`❌ Error guardando ${columna}:`, err);
            console.error('Detalles:', {
                message: err.message,
                code: err.code,
                details: err.details
            });

            return {
                success: false,
                error: err.message || 'Error al guardar'
            };
        } finally {
            setSaving(prev => {
                const newState = { ...prev };
                delete newState[savingKey];
                return newState;
            });
        }
    }, []);

    const guardarConteo = useCallback((sucursalId, productoId, columna, valor, fechaConteo) => {
        const key = `${productoId}_${columna}`;

        // Limpiar timer anterior
        if (debounceTimers.current[key]) {
            clearTimeout(debounceTimers.current[key]);
        }

        // ✅ Asegurar que el valor sea string
        const valorLimpio = (valor === null || valor === undefined) ? '' : String(valor);

        // ✅ Actualizar estado local inmediatamente
        setConteos(prev => {
            const conteosProducto = prev[productoId] || {};
            return {
                ...prev,
                [productoId]: {
                    ...conteosProducto,
                    [columna]: valorLimpio
                }
            };
        });

        // ✅ Guardar en base de datos con debounce
        debounceTimers.current[key] = setTimeout(async () => {
            try {
                await guardarConteoReal(sucursalId, productoId, columna, valorLimpio, fechaConteo);
            } catch (err) {
                console.error('Error en guardado programado:', err);
            } finally {
                delete debounceTimers.current[key];
            }
        }, 600);
    }, [guardarConteoReal]);

    return {
        productos,
        conteos,
        loading,
        error,
        saving,
        fechaActual,
        setFechaActual,
        cargarProductos,
        cargarConteos,
        guardarConteo,
        limpiarConteos
    };
}