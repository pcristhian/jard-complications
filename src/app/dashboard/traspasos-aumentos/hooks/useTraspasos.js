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
 * Obtiene el movimiento "par" de un traspaso.
 * Un traspaso genera 2 movimientos:
 *  - salida_traspaso (en sucursal origen)
 *  - entrada_traspaso (en sucursal destino)
 * Dado uno, devuelve el otro.
 */
    const obtenerMovimientoParTraspaso = useCallback(async (movimiento) => {
        try {
            const datos = movimiento?.datos || {};
            const tipo = datos.tipo; // 'salida_traspaso' | 'entrada_traspaso'
            const esMultiple = datos.es_multiple === true;

            // Si no es traspaso, no hay par
            if (movimiento.tipo_movimiento !== TIPO_MOVIMIENTO.TRASLADO_SUCURSAL) {
                return null;
            }

            // Determinar sucursal y dirección del par
            const sucursalOrigenId = tipo === 'salida_traspaso'
                ? movimiento.sucursal_id
                : datos.sucursal_origen_id;

            const sucursalDestinoId = tipo === 'salida_traspaso'
                ? datos.sucursal_destino_id
                : movimiento.sucursal_id;

            if (!sucursalOrigenId || !sucursalDestinoId) return null;

            // Buscar el movimiento par: mismo producto, misma cantidad,
            // sucursal opuesta, tipo TRASLADO_SUCURSAL, estado activo,
            // y creado en un margen de tiempo cercano (±2 min)
            const fechaMovimiento = new Date(movimiento.created_at || movimiento.fecha || Date.now());
            const margen = 2 * 60 * 1000;
            const desde = new Date(fechaMovimiento.getTime() - margen).toISOString();
            const hasta = new Date(fechaMovimiento.getTime() + margen).toISOString();

            const sucursalParId = tipo === 'salida_traspaso'
                ? sucursalDestinoId
                : sucursalOrigenId;

            const productoId = datos.producto_id;

            let query = supabase
                .from('movimientos')
                .select('*')
                .eq('tipo_movimiento', TIPO_MOVIMIENTO.TRASLADO_SUCURSAL)
                .eq('sucursal_id', sucursalParId)
                .eq('estado', 'activo')
                .neq('id', movimiento.id)
                .gte('created_at', desde)
                .lte('created_at', hasta);

            if (productoId) {
                query = query.eq('datos->>producto_id', productoId.toString());
            }

            const { data, error } = await query.limit(5);

            if (error) throw error;
            if (!data || data.length === 0) return null;

            // Filtrar el que tenga tipo opuesto
            const tipoParEsperado = tipo === 'salida_traspaso'
                ? 'entrada_traspaso'
                : 'salida_traspaso';

            const par = data.find(m => {
                const d = m.datos || {};
                return d.tipo === tipoParEsperado
                    && Number(d.cantidad) === Number(datos.cantidad);
            });

            return par || null;
        } catch (err) {
            console.error('Error obteniendo movimiento par del traspaso:', err);
            return null;
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
 * Revierte un traspaso entre sucursales.
 * Maneja ambos lados: devuelve stock a origen y lo quita de destino.
 */
    const revertirTraspasoStock = useCallback(async ({
        movimientoId,
        usuarioId,
        motivo = 'Anulación de traspaso entre sucursales'
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

            if (movimiento.tipo_movimiento !== TIPO_MOVIMIENTO.TRASLADO_SUCURSAL) {
                throw new Error('Este movimiento no es un traspaso entre sucursales');
            }

            const datos = movimiento.datos || {};
            const tipo = datos.tipo; // 'salida_traspaso' | 'entrada_traspaso'

            const sucursalOrigenId = tipo === 'salida_traspaso'
                ? movimiento.sucursal_id
                : datos.sucursal_origen_id;

            const sucursalDestinoId = tipo === 'salida_traspaso'
                ? datos.sucursal_destino_id
                : movimiento.sucursal_id;

            if (!sucursalOrigenId || !sucursalDestinoId) {
                throw new Error('No se pudo determinar el origen/destino del traspaso');
            }

            const producto = {
                id: datos.producto_id,
                codigo: datos.producto_codigo,
                nombre: datos.producto_nombre
            };

            const cantidad = Number(datos.cantidad) || 0;

            if (cantidad <= 0) {
                throw new Error('Cantidad inválida en el movimiento');
            }

            // Verificar stock en destino (necesitamos quitar lo que se envió)
            const stockDestino = await getStockActual(producto.id, sucursalDestinoId);

            if (stockDestino < cantidad) {
                throw new Error(
                    `No se puede anular el traspaso: la sucursal destino tiene ${stockDestino} unidades de "${producto.nombre}", ` +
                    `pero se necesitan al menos ${cantidad} para revertir.`
                );
            }

            // Buscar el movimiento par (el otro lado del traspaso)
            const movimientoPar = await obtenerMovimientoParTraspaso(movimiento);

            // Stock actual en origen
            const stockOrigen = await getStockActual(producto.id, sucursalOrigenId);

            // Calcular nuevos stocks: revertir el traspaso
            const nuevoStockOrigen = stockOrigen + cantidad;    // devolvemos
            const nuevoStockDestino = stockDestino - cantidad;  // quitamos

            // Actualizar stocks
            await actualizarStock(producto.id, sucursalOrigenId, nuevoStockOrigen);
            await actualizarStock(producto.id, sucursalDestinoId, nuevoStockDestino);

            // Registrar movimiento de reversión en ORIGEN (entrada por anulación)
            await registrarMovimiento({
                usuarioId,
                sucursalId: sucursalOrigenId,
                tipoMovimiento: TIPO_MOVIMIENTO.ANULACION,
                producto,
                cantidad,
                observaciones: `${motivo} - Devolución a origen`,
                stockNuevo: nuevoStockOrigen,
                datosAdicionales: {
                    motivo_anulacion: motivo,
                    movimiento_anulado_id: movimiento.id,
                    movimiento_par_anulado_id: movimientoPar?.id || null,
                    tipo_original: TIPO_MOVIMIENTO.TRASLADO_SUCURSAL,
                    subtipo_original: tipo,
                    sucursal_destino_id: sucursalDestinoId,
                    es_reversion_traspaso: true
                },
                movimientoAnuladoId: movimiento.id
            });

            // Registrar movimiento de reversión en DESTINO (salida por anulación)
            await registrarMovimiento({
                usuarioId,
                sucursalId: sucursalDestinoId,
                tipoMovimiento: TIPO_MOVIMIENTO.ANULACION,
                producto,
                cantidad,
                observaciones: `${motivo} - Retiro de destino`,
                stockNuevo: nuevoStockDestino,
                datosAdicionales: {
                    motivo_anulacion: motivo,
                    movimiento_anulado_id: movimientoPar?.id || movimiento.id,
                    movimiento_par_anulado_id: movimiento.id,
                    tipo_original: TIPO_MOVIMIENTO.TRASLADO_SUCURSAL,
                    subtipo_original: tipo === 'salida_traspaso' ? 'entrada_traspaso' : 'salida_traspaso',
                    sucursal_origen_id: sucursalOrigenId,
                    es_reversion_traspaso: true
                },
                movimientoAnuladoId: movimientoPar?.id || null
            });

            // Marcar el movimiento actual como anulado
            await supabase
                .from('movimientos')
                .update({
                    estado: 'anulado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', movimiento.id);

            // Marcar el movimiento par como anulado (si existe)
            if (movimientoPar?.id) {
                await supabase
                    .from('movimientos')
                    .update({
                        estado: 'anulado',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', movimientoPar.id);
            }

            // Auditoría
            await registrarAuditoria({
                usuarioId,
                movimientoId: movimiento.id,
                movimientoOriginal: movimiento,
                motivo,
                datosAnteriores: {
                    stock_origen_antes: stockOrigen,
                    stock_destino_antes: stockDestino,
                    estado: 'activo'
                },
                datosNuevos: {
                    stock_origen_despues: nuevoStockOrigen,
                    stock_destino_despues: nuevoStockDestino,
                    estado: 'anulado',
                    movimiento_par_id: movimientoPar?.id || null
                }
            });

            return {
                success: true,
                message: 'Traspaso anulado correctamente',
                detalles: {
                    producto: producto.nombre,
                    cantidad,
                    sucursalOrigen: { id: sucursalOrigenId, stockNuevo: nuevoStockOrigen },
                    sucursalDestino: { id: sucursalDestinoId, stockNuevo: nuevoStockDestino },
                    movimientoParAnulado: !!movimientoPar?.id
                }
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [obtenerMovimientoPorId, obtenerMovimientoParTraspaso, getStockActual, actualizarStock, registrarMovimiento, registrarAuditoria]);


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

                // 🔥 NUEVO: Traspaso entre sucursales
                case TIPO_MOVIMIENTO.TRASLADO_SUCURSAL:
                    resultado = await revertirTraspasoStock({ movimientoId, usuarioId, motivo });
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

    const traspasarMultiplesStocks = useCallback(async ({
        usuarioId,
        sucursalOrigenId,
        items, // Array de { producto, cantidad, sucursalDestinoId, observaciones }
    }) => {
        setLoading(true);
        setError(null);

        try {
            if (!items || items.length === 0) {
                throw new Error('No hay items para traspasar');
            }

            // Verificar que todos los items tengan la misma sucursal destino
            const sucursalesDestino = [...new Set(items.map(item => item.sucursalDestinoId))];
            if (sucursalesDestino.length > 1) {
                throw new Error('Todos los productos deben ir a la misma sucursal destino');
            }

            const resultados = [];

            for (const item of items) {
                if (item.cantidad <= 0) {
                    throw new Error(`La cantidad debe ser mayor a 0 para ${item.producto.nombre}`);
                }

                const sucursalDestinoId = item.sucursalDestinoId;

                if (sucursalOrigenId === sucursalDestinoId) {
                    throw new Error(`La sucursal de origen y destino deben ser diferentes para ${item.producto.nombre}`);
                }

                // Verificar stock en origen
                const stockOrigen = await getStockActual(item.producto.id, sucursalOrigenId);

                if (stockOrigen < item.cantidad) {
                    throw new Error(`Stock insuficiente para ${item.producto.nombre} en sucursal origen. Stock: ${stockOrigen}, solicitado: ${item.cantidad}`);
                }

                // Obtener stock actual en destino
                const stockDestino = await getStockActual(item.producto.id, sucursalDestinoId);

                // Calcular nuevos stocks
                const nuevoStockOrigen = stockOrigen - item.cantidad;
                const nuevoStockDestino = stockDestino + item.cantidad;

                // Actualizar stocks
                await actualizarStock(item.producto.id, sucursalOrigenId, nuevoStockOrigen);
                await actualizarStock(item.producto.id, sucursalDestinoId, nuevoStockDestino);

                // Registrar movimiento de salida (origen)
                await registrarMovimiento({
                    usuarioId,
                    sucursalId: sucursalOrigenId,
                    tipoMovimiento: TIPO_MOVIMIENTO.TRASLADO_SUCURSAL,
                    producto: item.producto,
                    cantidad: item.cantidad,
                    observaciones: item.observaciones || 'Traspaso múltiple',
                    stockNuevo: nuevoStockOrigen,
                    datosAdicionales: {
                        motivo: 'traslado_sucursal',
                        tipo: 'salida_traspaso',
                        sucursal_destino_id: sucursalDestinoId,
                        es_multiple: true
                    }
                });

                // Registrar movimiento de entrada (destino)
                await registrarMovimiento({
                    usuarioId,
                    sucursalId: sucursalDestinoId,
                    tipoMovimiento: TIPO_MOVIMIENTO.TRASLADO_SUCURSAL,
                    producto: item.producto,
                    cantidad: item.cantidad,
                    observaciones: item.observaciones || 'Traspaso múltiple',
                    stockNuevo: nuevoStockDestino,
                    datosAdicionales: {
                        motivo: 'traslado_sucursal',
                        tipo: 'entrada_traspaso',
                        sucursal_origen_id: sucursalOrigenId,
                        es_multiple: true
                    }
                });

                resultados.push({
                    success: true,
                    producto: item.producto,
                    cantidad: item.cantidad,
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
                });
            }

            return {
                success: true,
                resultados,
                totalTraspasos: resultados.length
            };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [getStockActual, actualizarStock, registrarMovimiento]);

    // RETORNAR TODAS LAS FUNCIONES
    return {
        loading,
        error,
        aumentarStock,
        disminuirStock,
        ajustarStock,
        traspasarStock,
        traspasarMultiplesStocks,
        anularMovimiento,
        obtenerMovimientosActivos,
        obtenerStocksSucursal,
        getStockActual,
        TIPO_MOVIMIENTO
    };
};