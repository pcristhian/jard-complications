import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export const useMovements = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarMovimientos();
    }, []);

    const cargarMovimientos = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Cargando movimientos de entrada_stock y traslado_sucursal...');

            // Consulta con relaciones completas
            const { data, error } = await supabase
                .from('movimientos')
                .select(`
                    id,
                    created_at,
                    tipo_movimiento,
                    datos,
                    usuario:usuario_id (
                        id,
                        nombre,
                        rol_id,
                        caja,
                        roles:rol_id (
                            id,
                            nombre
                        )
                    ),
                    sucursal_origen:sucursal_id (
                        id,
                        nombre,
                        direccion,
                        telefono
                    )
                `)
                .in('tipo_movimiento', ['entrada_stock', 'traslado_sucursal'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error de Supabase:', error);
                throw error;
            }

            console.log('Datos crudos recibidos:', data);

            if (!data || data.length === 0) {
                setMovimientos([]);
                return;
            }

            // Transformar los datos con todas las relaciones
            const movimientosTransformados = await Promise.all(data.map(async (mov) => {
                const datos = mov.datos || {};

                // Formatear fecha
                const fecha = new Date(mov.created_at).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                // Base del movimiento con relaciones de usuario y sucursal origen
                const movimientoBase = {
                    id: mov.id,
                    fecha: fecha,
                    fecha_original: mov.created_at,
                    tipo: mov.tipo_movimiento,

                    // Datos del usuario que hizo el movimiento
                    usuario: {
                        id: mov.usuario?.id,
                        nombre: mov.usuario?.nombre || 'Usuario desconocido',
                        rol: mov.usuario?.roles?.nombre || 'Sin rol',
                        caja: mov.usuario?.caja || 'Sin caja'
                    },

                    // Datos de la sucursal origen
                    sucursal_origen: {
                        id: mov.sucursal_origen?.id,
                        nombre: mov.sucursal_origen?.nombre || 'Sucursal desconocida',
                        direccion: mov.sucursal_origen?.direccion,
                        telefono: mov.sucursal_origen?.telefono
                    }
                };

                // Procesar según el tipo de movimiento
                if (mov.tipo_movimiento === 'entrada_stock') {
                    // Para entrada_stock, obtener datos del producto si existe
                    let productoData = null;
                    if (datos.producto_id) {
                        const { data: producto } = await supabase
                            .from('productos')
                            .select(`
                                id,
                                nombre,
                                codigo,
                                precio,
                                comision_variable,
                                categoria:categoria_id (
                                    id,
                                    nombre,
                                    reglas_comision
                                )
                            `)
                            .eq('id', datos.producto_id)
                            .single();

                        productoData = producto;
                    }

                    return {
                        ...movimientoBase,
                        tipo_descripcion: 'Entrada de Stock',
                        tipo_icono: '📦',
                        tipo_color: 'bg-green-100 text-green-800',

                        // Datos del producto desde la relación
                        producto: productoData || {
                            id: datos.producto_id,
                            nombre: datos.producto_nombre || 'Producto desconocido',
                            codigo: datos.producto_codigo || 'Sin código'
                        },

                        // Datos específicos de la entrada
                        cantidad: datos.cantidad || 0,
                        stock_anterior: datos.stock_anterior || 0,
                        stock_nuevo: datos.stock_nuevo || 0,
                        observaciones: datos.observaciones || '',

                        // Resumen claro y entendible
                        resumen: `${datos.cantidad || 0} unidades de ${datos.producto_nombre || 'producto'} ingresaron a ${mov.sucursal_origen?.nombre || 'sucursal'}`,

                        // Detalles para mostrar
                        detalles: [
                            { label: 'Producto', valor: `${datos.producto_nombre || 'N/A'} (${datos.producto_codigo || 'Sin código'})` },
                            { label: 'Cantidad', valor: datos.cantidad || 0 },
                            { label: 'Stock anterior', valor: datos.stock_anterior || 0 },
                            { label: 'Stock nuevo', valor: datos.stock_nuevo || 0 },
                            { label: 'Observaciones', valor: datos.observaciones || 'Sin observaciones' }
                        ]
                    };
                }

                if (mov.tipo_movimiento === 'traslado_sucursal') {
                    // Para traslado_sucursal, obtener datos de la sucursal destino
                    let sucursalDestinoData = null;
                    if (datos.sucursal_destino_id) {
                        const { data: sucursal } = await supabase
                            .from('sucursales')
                            .select(`
                                id,
                                nombre,
                                direccion,
                                telefono
                            `)
                            .eq('id', datos.sucursal_destino_id)
                            .single();

                        sucursalDestinoData = sucursal;
                    }

                    // Obtener datos del producto trasladado (viene como un solo producto en el JSON)
                    let productoData = null;
                    if (datos.producto_id) {
                        const { data: producto } = await supabase
                            .from('productos')
                            .select(`
                                id,
                                nombre,
                                codigo,
                                precio,
                                comision_variable,
                                categoria:categoria_id (
                                    id,
                                    nombre,
                                    reglas_comision
                                )
                            `)
                            .eq('id', datos.producto_id)
                            .single();

                        productoData = producto;
                    }

                    // Crear array de productos para mantener compatibilidad con la vista
                    const productoTrasladado = {
                        producto_id: datos.producto_id,
                        cantidad: datos.cantidad || 0,
                        producto_nombre: datos.producto_nombre || productoData?.nombre || 'Producto desconocido',
                        producto_codigo: datos.producto_codigo || productoData?.codigo || 'Sin código',
                        producto_detalle: productoData
                    };

                    const productosArray = [productoTrasladado];

                    return {
                        ...movimientoBase,
                        tipo_descripcion: 'Traslado entre Sucursales',
                        tipo_icono: '🔄',
                        tipo_color: 'bg-purple-100 text-purple-800',

                        // Datos de la sucursal destino
                        sucursal_destino: sucursalDestinoData || {
                            id: datos.sucursal_destino_id,
                            nombre: datos.sucursal_destino_nombre || 'Destino desconocido'
                        },

                        // Datos del producto trasladado (formato simple)
                        producto: productoData || {
                            id: datos.producto_id,
                            nombre: datos.producto_nombre || 'Producto desconocido',
                            codigo: datos.producto_codigo || 'Sin código'
                        },
                        cantidad: datos.cantidad || 0,
                        stock_anterior: datos.stock_anterior || 0,
                        stock_nuevo: datos.stock_nuevo || 0,

                        // Productos trasladados (array para compatibilidad)
                        productos: productosArray,
                        total_productos: 1,
                        total_unidades: datos.cantidad || 0,

                        observaciones: datos.observaciones || '',

                        // Resumen claro y entendible
                        resumen: `${datos.cantidad || 0} unidades de ${datos.producto_nombre || 'producto'} trasladadas de ${mov.sucursal_origen?.nombre || 'origen'} a ${sucursalDestinoData?.nombre || datos.sucursal_destino_nombre || 'destino'}`,

                        // Detalles para mostrar
                        detalles: [
                            {
                                label: 'De sucursal',
                                valor: mov.sucursal_origen?.nombre || 'Origen desconocido',
                                direccion: mov.sucursal_origen?.direccion
                            },
                            {
                                label: 'A sucursal',
                                valor: sucursalDestinoData?.nombre || datos.sucursal_destino_nombre || 'Destino desconocido',
                                direccion: sucursalDestinoData?.direccion
                            },
                            { label: 'Producto', valor: `${datos.producto_nombre || 'N/A'} (${datos.producto_codigo || 'Sin código'})` },
                            { label: 'Cantidad', valor: datos.cantidad || 0 },
                            { label: 'Stock anterior', valor: datos.stock_anterior || 0 },
                            { label: 'Stock nuevo', valor: datos.stock_nuevo || 0 },
                            { label: 'Observaciones', valor: datos.observaciones || 'Sin observaciones' }
                        ],

                        // Lista de productos para mostrar en tabla
                        productos_lista: productosArray.map(item => ({
                            nombre: item.producto_nombre || item.producto_detalle?.nombre || 'Producto',
                            codigo: item.producto_codigo || item.producto_detalle?.codigo || 'N/A',
                            cantidad: item.cantidad || 0
                        }))
                    };
                }

                return movimientoBase;
            }));

            console.log('Movimientos transformados con relaciones:', movimientosTransformados);
            setMovimientos(movimientosTransformados);

        } catch (err) {
            console.error('Error cargando movimientos:', err);
            setError(err.message || 'Error al cargar los movimientos');
        } finally {
            setLoading(false);
        }
    };

    const refetch = () => {
        cargarMovimientos();
    };

    return {
        movimientos,
        loading,
        error,
        refetch
    };
};