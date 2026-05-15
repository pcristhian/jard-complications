// hooks/useTraspasos.js
import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

const TIPO_MOVIMIENTO = {
    ENTRADA_STOCK: 'entrada_stock',
    SALIDA_STOCK: 'salida_stock',
    AJUSTE_STOCK: 'ajuste_stock',
    TRASLADO_SUCURSAL: 'traslado_sucursal',
    CREACION_PRODUCTO: 'creacion_producto',
    ACTUALIZACION_PRODUCTO: 'actualizacion_producto',
    ELIMINACION_PRODUCTO: 'eliminacion_producto',
    ANULACION: 'anulacion'
};

export const useTraspasos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Obtiene el stock actual de un producto en una sucursal específica
     */
    const getStockActual = useCallback(async (productoId, sucursalId) => {
        try {
            const { data, error } = await supabase
                .from('productos_stock')
                .select('stock_actual')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data?.stock_actual || 0;
        } catch (err) {
            console.error('Error al obtener stock actual:', err);
            return 0;
        }
    }, []);

    /**
     * Actualiza el stock en productos_stock
     */
    const actualizarStock = useCallback(async (productoId, sucursalId, nuevoStock) => {
        try {
            const { data: existingStock, error: findError } = await supabase
                .from('productos_stock')
                .select('id')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .single();

            if (findError && findError.code !== 'PGRST116') throw findError;

            if (existingStock) {
                const { error: updateError } = await supabase
                    .from('productos_stock')
                    .update({
                        stock_actual: nuevoStock,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingStock.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('productos_stock')
                    .insert({
                        producto_id: productoId,
                        sucursal_id: sucursalId,
                        stock_actual: nuevoStock,
                        stock_inicial: nuevoStock,
                        stock_minimo: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (insertError) throw insertError;
            }

            return true;
        } catch (err) {
            console.error('Error al actualizar stock:', err);
            throw err;
        }
    }, []);

    /**
     * Registra un movimiento en la tabla movimientos
     */
    const registrarMovimiento = useCallback(async ({
        usuarioId,
        sucursalId,
        tipoMovimiento,
        producto,
        cantidad,
        observaciones = '',
        fecha = new Date(),
        stockNuevo = null,
        datosAdicionales = {},
        movimientoAnuladoId = null
    }) => {
        try {
            const movimientoData = {
                fecha: fecha.toISOString(),
                cantidad,
                producto_id: producto.id,
                producto_codigo: producto.codigo,
                producto_nombre: producto.nombre,
                observaciones,
                stock_nuevo: stockNuevo,
                movimiento_anulado_id: movimientoAnuladoId,
                ...datosAdicionales
            };

            const { error: movimientoError } = await supabase
                .from('movimientos')
                .insert({
                    usuario_id: usuarioId,
                    sucursal_id: sucursalId,
                    tipo_movimiento: tipoMovimiento,
                    datos: movimientoData,
                    estado: 'activo',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

            if (movimientoError) throw movimientoError;
            return true;
        } catch (err) {
            console.error('Error al registrar movimiento:', err);
            throw err;
        }
    }, []);

    /**
     * Registra una anulación en la tabla auditoria
     */
    const registrarAuditoria = useCallback(async ({
        usuarioId,
        movimientoId,
        movimientoOriginal,
        motivo,
        datosAnteriores,
        datosNuevos
    }) => {
        try {
            const { error } = await supabase
                .from('auditoria')
                .insert({
                    tabla_afectada: 'movimientos',
                    registro_id: movimientoId,
                    accion: 'anular',
                    datos_anteriores: datosAnteriores,
                    datos_nuevos: datosNuevos,
                    datos_completos: movimientoOriginal,
                    motivo: motivo,
                    usuario_id: usuarioId,
                    fecha_evento: new Date().toISOString(),
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Error al registrar auditoría:', err);
            throw err;
        }
    }, []);

    /**
     * Obtiene un movimiento por ID para su anulación
     */
    const obtenerMovimientoPorId = useCallback(async (movimientoId) => {
        try {
            const { data, error } = await supabase
                .from('movimientos')
                .select('*')
                .eq('id', movimientoId)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error al obtener movimiento:', err);
            throw err;
        }
    }, []);

    /**
     * Realiza un aumento de stock (entrada)
     */
    const aumentarStock = useCallback(async ({
        usuarioId,
        sucursalId,
        producto,
        cantidad,
        observaciones = '',
        motivo = 'aumento_manual'
    }) => {
        setLoading(true);
        setError(null);

        try {
            if (cantidad <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            const stockActual = await getStockActual(producto.id, sucursalId);
            const nuevoStock = stockActual + cantidad;

            await actualizarStock(producto.id, sucursalId, nuevoStock);

            await registrarMovimiento({
                usuarioId,
                sucursalId,
                tipoMovimiento: TIPO_MOVIMIENTO.ENTRADA_STOCK,
                producto,
                cantidad,
                observaciones,
                stockNuevo: nuevoStock,
                datosAdicionales: { motivo }
            });

            return {
                success: true,
                stockAnterior: stockActual,
                stockNuevo: nuevoStock,
                cantidadAumentada: cantidad
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [getStockActual, actualizarStock, registrarMovimiento]);

    /**
     * Realiza una salida de stock (disminución)
     */
    const disminuirStock = useCallback(async ({
        usuarioId,
        sucursalId,
        producto,
        cantidad,
        observaciones = '',
        motivo = 'salida_manual'
    }) => {
        setLoading(true);
        setError(null);

        try {
            if (cantidad <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            const stockActual = await getStockActual(producto.id, sucursalId);

            if (stockActual < cantidad) {
                throw new Error(`Stock insuficiente. Stock actual: ${stockActual}, solicitado: ${cantidad}`);
            }

            const nuevoStock = stockActual - cantidad;

            await actualizarStock(producto.id, sucursalId, nuevoStock);

            await registrarMovimiento({
                usuarioId,
                sucursalId,
                tipoMovimiento: TIPO_MOVIMIENTO.SALIDA_STOCK,
                producto,
                cantidad,
                observaciones,
                stockNuevo: nuevoStock,
                datosAdicionales: { motivo }
            });

            return {
                success: true,
                stockAnterior: stockActual,
                stockNuevo: nuevoStock,
                cantidadDisminuida: cantidad
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [getStockActual, actualizarStock, registrarMovimiento]);

    /**
     * Realiza un ajuste de stock (cambiar a un valor específico)
     */
    const ajustarStock = useCallback(async ({
        usuarioId,
        sucursalId,
        producto,
        nuevoStock,
        observaciones = '',
        motivo = 'ajuste_manual'
    }) => {
        setLoading(true);
        setError(null);

        try {
            if (nuevoStock < 0) {
                throw new Error('El stock no puede ser negativo');
            }

            const stockActual = await getStockActual(producto.id, sucursalId);
            const diferencia = nuevoStock - stockActual;

            await actualizarStock(producto.id, sucursalId, nuevoStock);

            const tipoMovimiento = diferencia > 0 ? TIPO_MOVIMIENTO.ENTRADA_STOCK : TIPO_MOVIMIENTO.SALIDA_STOCK;

            await registrarMovimiento({
                usuarioId,
                sucursalId,
                tipoMovimiento,
                producto,
                cantidad: Math.abs(diferencia),
                observaciones,
                stockNuevo: nuevoStock,
                datosAdicionales: { motivo, ajuste: true, stockAnterior: stockActual }
            });

            return {
                success: true,
                stockAnterior: stockActual,
                stockNuevo: nuevoStock,
                diferencia,
                tipo: diferencia > 0 ? 'aumento' : 'disminucion'
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [getStockActual, actualizarStock, registrarMovimiento]);

    /**
     * Realiza un traspaso entre sucursales
     */
    const traspasarStock = useCallback(async ({
        usuarioId,
        sucursalOrigenId,
        sucursalDestinoId,
        producto,
        cantidad,
        observaciones = '',
        motivo = 'traslado_sucursal'
    }) => {
        setLoading(true);
        setError(null);

        try {
            if (cantidad <= 0) {
                throw new Error('La cantidad debe ser mayor a 0');
            }

            if (sucursalOrigenId === sucursalDestinoId) {
                throw new Error('La sucursal de origen y destino deben ser diferentes');
            }

            const stockOrigen = await getStockActual(producto.id, sucursalOrigenId);

            if (stockOrigen < cantidad) {
                throw new Error(`Stock insuficiente en sucursal origen. Stock: ${stockOrigen}, solicitado: ${cantidad}`);
            }

            const stockDestino = await getStockActual(producto.id, sucursalDestinoId);
            const nuevoStockOrigen = stockOrigen - cantidad;
            const nuevoStockDestino = stockDestino + cantidad;

            await actualizarStock(producto.id, sucursalOrigenId, nuevoStockOrigen);
            await actualizarStock(producto.id, sucursalDestinoId, nuevoStockDestino);

            await registrarMovimiento({
                usuarioId,
                sucursalId: sucursalOrigenId,
                tipoMovimiento: TIPO_MOVIMIENTO.TRASLADO_SUCURSAL,
                producto,
                cantidad,
                observaciones: `${observaciones} - Traspaso a sucursal ${sucursalDestinoId}`,
                stockNuevo: nuevoStockOrigen,
                datosAdicionales: {
                    motivo,
                    tipo: 'salida_traspaso',
                    sucursal_destino_id: sucursalDestinoId
                }
            });

            await registrarMovimiento({
                usuarioId,
                sucursalId: sucursalDestinoId,
                tipoMovimiento: TIPO_MOVIMIENTO.TRASLADO_SUCURSAL,
                producto,
                cantidad,
                observaciones: `${observaciones} - Traspaso desde sucursal ${sucursalOrigenId}`,
                stockNuevo: nuevoStockDestino,
                datosAdicionales: {
                    motivo,
                    tipo: 'entrada_traspaso',
                    sucursal_origen_id: sucursalOrigenId
                }
            });

            return {
                success: true,
                traspaso: {
                    cantidad,
                    sucursalOrigen: {
                        id: sucursalOrigenId,
                        stockAnterior: stockOrigen,
                        stockNuevo: nuevoStockOrigen
                    },
                    sucursalDestino: {
                        id: sucursalDestinoId,
                        stockAnterior: stockDestino,
                        stockNuevo: nuevoStockDestino
                    }
                }
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [getStockActual, actualizarStock, registrarMovimiento]);

    /**
     * Revierte un aumento de stock (entrada)
     */
    const revertirAumentoStock = useCallback(async ({
        movimientoId,
        usuarioId,
        motivo = 'Anulación de aumento de stock'
    }) => {
        setLoading(true);
        setError(null);

        try {
            const movimiento = await obtenerMovimientoPorId(movimientoId);

            if (!movimiento) {
                throw new Error('Movimiento no encontrado');
            }

            if (movimiento.estado === 'anulado') {
                throw new Error('Este movimiento ya fue anulado');
            }

            if (movimiento.tipo_movimiento !== TIPO_MOVIMIENTO.ENTRADA_STOCK) {
                throw new Error('Solo se pueden anular movimientos de entrada de stock');
            }

            const producto = {
                id: movimiento.datos.producto_id,
                codigo: movimiento.datos.producto_codigo,
                nombre: movimiento.datos.producto_nombre
            };

            const cantidad = movimiento.datos.cantidad;
            const sucursalId = movimiento.sucursal_id;
            const stockActual = await getStockActual(producto.id, sucursalId);
            const nuevoStock = stockActual - cantidad;

            if (nuevoStock < 0) {
                throw new Error(`No se puede anular. Stock actual (${stockActual}) es menor a la cantidad a revertir (${cantidad})`);
            }

            await actualizarStock(producto.id, sucursalId, nuevoStock);

            await registrarMovimiento({
                usuarioId,
                sucursalId,
                tipoMovimiento: TIPO_MOVIMIENTO.ANULACION,
                producto,
                cantidad,
                observaciones: motivo,
                stockNuevo: nuevoStock,
                datosAdicionales: {
                    motivo_anulacion: motivo,
                    movimiento_anulado_id: movimientoId,
                    tipo_original: movimiento.tipo_movimiento
                },
                movimientoAnuladoId: movimientoId
            });

            await supabase
                .from('movimientos')
                .update({
                    estado: 'anulado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', movimientoId);

            await registrarAuditoria({
                usuarioId,
                movimientoId,
                movimientoOriginal: movimiento,
                motivo,
                datosAnteriores: { stock_antes: stockActual + cantidad, estado: 'activo' },
                datosNuevos: { stock_despues: nuevoStock, estado: 'anulado' }
            });

            return {
                success: true,
                message: 'Aumento de stock anulado correctamente'
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [obtenerMovimientoPorId, getStockActual, actualizarStock, registrarMovimiento, registrarAuditoria]);

    /**
     * Función genérica para anular cualquier movimiento
     */
    const anularMovimiento = useCallback(async ({
        movimientoId,
        usuarioId,
        motivo = 'Anulación manual'
    }) => {
        setLoading(true);
        setError(null);

        try {
            const movimiento = await obtenerMovimientoPorId(movimientoId);

            if (!movimiento) {
                throw new Error('Movimiento no encontrado');
            }

            if (movimiento.estado === 'anulado') {
                throw new Error('Este movimiento ya fue anulado');
            }

            let resultado;

            switch (movimiento.tipo_movimiento) {
                case TIPO_MOVIMIENTO.ENTRADA_STOCK:
                    resultado = await revertirAumentoStock({ movimientoId, usuarioId, motivo });
                    break;
                case TIPO_MOVIMIENTO.SALIDA_STOCK:
                    // Similar a revertirAumentoStock pero sumando
                    resultado = await (async () => {
                        const movimientoLocal = movimiento;
                        const producto = {
                            id: movimientoLocal.datos.producto_id,
                            codigo: movimientoLocal.datos.producto_codigo,
                            nombre: movimientoLocal.datos.producto_nombre
                        };
                        const cantidad = movimientoLocal.datos.cantidad;
                        const sucursalId = movimientoLocal.sucursal_id;
                        const stockActual = await getStockActual(producto.id, sucursalId);
                        const nuevoStock = stockActual + cantidad;

                        await actualizarStock(producto.id, sucursalId, nuevoStock);
                        await registrarMovimiento({
                            usuarioId,
                            sucursalId,
                            tipoMovimiento: TIPO_MOVIMIENTO.ANULACION,
                            producto,
                            cantidad,
                            observaciones: motivo,
                            stockNuevo: nuevoStock,
                            datosAdicionales: {
                                motivo_anulacion: motivo,
                                movimiento_anulado_id: movimientoId,
                                tipo_original: movimientoLocal.tipo_movimiento
                            }
                        });
                        await supabase.from('movimientos').update({ estado: 'anulado' }).eq('id', movimientoId);

                        return { success: true, message: 'Salida de stock anulada correctamente' };
                    })();
                    break;
                default:
                    throw new Error(`No se puede anular movimientos de tipo: ${movimiento.tipo_movimiento}`);
            }

            return resultado;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [obtenerMovimientoPorId, getStockActual, actualizarStock, registrarMovimiento, registrarAuditoria, revertirAumentoStock]);

    /**
     * Obtiene movimientos activos (no anulados)
     */
    const obtenerMovimientosActivos = useCallback(async (filtros = {}) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('movimientos')
                .select(`
                    *,
                    usuarios:usuario_id (id, nombre),
                    sucursales:sucursal_id (id, nombre)
                `)
                .eq('estado', 'activo')
                .order('created_at', { ascending: false });

            if (filtros.tipo_movimiento) {
                query = query.eq('tipo_movimiento', filtros.tipo_movimiento);
            }

            if (filtros.sucursal_id) {
                query = query.eq('sucursal_id', filtros.sucursal_id);
            }

            if (filtros.producto_id) {
                query = query.eq('datos->>producto_id', filtros.producto_id.toString());
            }

            if (filtros.limit) {
                query = query.limit(filtros.limit);
            }

            const { data, error } = await query;

            if (error) throw error;

            return {
                success: true,
                movimientos: data
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message, movimientos: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Obtiene el stock actual de múltiples productos en una sucursal
     */
    const obtenerStocksSucursal = useCallback(async (sucursalId, productoIds = null) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('productos_stock')
                .select(`
                    *,
                    productos:producto_id (id, codigo, nombre, precio, categoria_id)
                `)
                .eq('sucursal_id', sucursalId);

            if (productoIds && productoIds.length > 0) {
                query = query.in('producto_id', productoIds);
            }

            const { data, error } = await query;

            if (error) throw error;

            return {
                success: true,
                stocks: data
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message, stocks: [] };
        } finally {
            setLoading(false);
        }
    }, []);

    // RETORNAR TODAS LAS FUNCIONES
    return {
        loading,
        error,
        aumentarStock,
        disminuirStock,
        ajustarStock,
        traspasarStock,
        anularMovimiento,
        obtenerMovimientosActivos,
        obtenerStocksSucursal,
        getStockActual,
        TIPO_MOVIMIENTO
    };
};