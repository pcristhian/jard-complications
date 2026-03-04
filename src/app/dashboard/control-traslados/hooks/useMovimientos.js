import { supabase } from '@/lib/supabase/client';

export const useMovimientos = () => {
    const registrarMovimiento = async (tipoMovimiento, datos, usuarioId, sucursalId) => {
        try {
            const movimientoData = {
                tipo_movimiento: tipoMovimiento,
                datos: datos,
                usuario_id: usuarioId,
                sucursal_id: sucursalId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('movimientos')
                .insert([movimientoData])
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error registrando movimiento:', error);
            return { success: false, error: error.message };
        }
    };

    // Registrar entrada de stock
    const registrarEntradaStock = async (producto, cantidad, observaciones, usuarioId, sucursalId) => {
        const datosMovimiento = {
            producto_id: producto.id,
            producto_codigo: producto.codigo,
            producto_nombre: producto.nombre,
            cantidad: cantidad,
            stock_anterior: producto.stock_actual,
            stock_nuevo: producto.stock_actual + cantidad,
            observaciones: observaciones,
            fecha: new Date().toISOString()
        };

        return await registrarMovimiento('entrada_stock', datosMovimiento, usuarioId, sucursalId);
    };

    // Registrar salida de stock
    const registrarSalidaStock = async (producto, cantidad, observaciones, usuarioId, sucursalId) => {
        const datosMovimiento = {
            producto_id: producto.id,
            producto_codigo: producto.codigo,
            producto_nombre: producto.nombre,
            cantidad: cantidad,
            stock_anterior: producto.stock_actual,
            stock_nuevo: producto.stock_actual - cantidad,
            observaciones: observaciones,
            fecha: new Date().toISOString()
        };

        return await registrarMovimiento('salida_stock', datosMovimiento, usuarioId, sucursalId);
    };

    // Registrar traslado entre sucursales
    const registrarTraslado = async (producto, cantidad, sucursalOrigen, sucursalDestino, observaciones, usuarioId) => {
        const datosMovimiento = {
            producto_id: producto.id,
            producto_codigo: producto.codigo,
            producto_nombre: producto.nombre,
            cantidad: cantidad,
            sucursal_origen_id: sucursalOrigen.id,
            sucursal_origen_nombre: sucursalOrigen.nombre,
            sucursal_destino_id: sucursalDestino.id,
            sucursal_destino_nombre: sucursalDestino.nombre,
            stock_anterior: producto.stock_actual,
            stock_nuevo: producto.stock_actual - cantidad, // Se resta de la sucursal origen
            observaciones: observaciones,
            fecha: new Date().toISOString()
        };

        return await registrarMovimiento('traslado_sucursal', datosMovimiento, usuarioId, sucursalOrigen.id);
    };

    // Registrar creación de producto
    const registrarCreacionProducto = async (producto, usuarioId, sucursalId) => {
        const datosMovimiento = {
            producto_id: producto.id,
            producto_codigo: producto.codigo,
            producto_nombre: producto.nombre,
            categoria_id: producto.categoria_id,
            precio: producto.precio,
            costo: producto.costo,
            stock_inicial: producto.stock_inicial,
            stock_actual: producto.stock_actual,
            fecha: new Date().toISOString()
        };

        return await registrarMovimiento('creacion_producto', datosMovimiento, usuarioId, sucursalId);
    };

    // Registrar actualización de producto
    const registrarActualizacionProducto = async (productoAnterior, productoNuevo, usuarioId, sucursalId) => {
        const datosMovimiento = {
            producto_id: productoNuevo.id,
            producto_codigo: productoNuevo.codigo,
            producto_nombre: productoNuevo.nombre,
            cambios: {
                precio: { anterior: productoAnterior.precio, nuevo: productoNuevo.precio },
                costo: { anterior: productoAnterior.costo, nuevo: productoNuevo.costo },
                stock_actual: { anterior: productoAnterior.stock_actual, nuevo: productoNuevo.stock_actual },
                stock_minimo: { anterior: productoAnterior.stock_minimo, nuevo: productoNuevo.stock_minimo },
                activo: { anterior: productoAnterior.activo, nuevo: productoNuevo.activo }
            },
            fecha: new Date().toISOString()
        };

        return await registrarMovimiento('actualizacion_producto', datosMovimiento, usuarioId, sucursalId);
    };

    // Obtener movimientos por sucursal
    const obtenerMovimientosPorSucursal = async (sucursalId, limite = 50) => {
        try {
            const { data, error } = await supabase
                .from('movimientos')
                .select('*')
                .eq('sucursal_id', sucursalId)
                .order('created_at', { ascending: false })
                .limit(limite);

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error obteniendo movimientos:', error);
            return { success: false, error: error.message };
        }
    };

    // Obtener movimientos por producto
    const obtenerMovimientosPorProducto = async (productoId, limite = 50) => {
        try {
            const { data, error } = await supabase
                .from('movimientos')
                .select('*')
                .filter('datos', 'cs', `{"producto_id": ${productoId}}`)
                .order('created_at', { ascending: false })
                .limit(limite);

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error obteniendo movimientos por producto:', error);
            return { success: false, error: error.message };
        }
    };

    return {
        registrarMovimiento,
        registrarEntradaStock,
        registrarSalidaStock,
        registrarTraslado,
        registrarCreacionProducto,
        registrarActualizacionProducto,
        obtenerMovimientosPorSucursal,
        obtenerMovimientosPorProducto
    };
};