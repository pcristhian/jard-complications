// src/app/dashboard/ventas/hooks/useVentas.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener';

// ✅ UTILIDADES DE FECHAS
import {
    formatUTCToBolivia,
    getCurrentUTCTime,
    getBoliviaDayRangeUTC
} from '@/utils/dateUtils';

// ✅ HELPER LOCAL: rango UTC del mes Bolivia (usa getBoliviaDayRangeUTC que ya funciona)
const getBoliviaMonthRangeUTC = (fecha = new Date()) => {
    const y = fecha.getFullYear();
    const m = fecha.getMonth();
    const primerDia = new Date(y, m, 1);
    const ultimoDia = new Date(y, m + 1, 0);

    const rangeInicio = getBoliviaDayRangeUTC(primerDia);
    const rangeFin = getBoliviaDayRangeUTC(ultimoDia);

    if (!rangeInicio || !rangeFin) return null;
    return { inicio: rangeInicio.inicio, fin: rangeFin.fin };
};

// ✅ Paginación interna para no chocar con el límite de Supabase (1000 filas)
const PAGE_SIZE = 1000;

export const useVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sucursalCargada, setSucursalCargada] = useState(false);
    const [rangoActual, setRangoActual] = useState(null); // trazabilidad

    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser',
        'sucursalSeleccionada'
    ]);

    const getCurrentUser = () => localStorageValues.currentUser || null;
    const getCurrentSucursal = () => localStorageValues.sucursalSeleccionada || null;

    const puedeConfirmarDepositos = () => {
        const currentUser = getCurrentUser();
        return currentUser && currentUser.rol_id === 1;
    };

    const getRolNombre = () => {
        const currentUser = getCurrentUser();
        return currentUser?.roles?.nombre || `Rol ${currentUser?.rol_id}`;
    };

    const puedeMarcarDepositado = () => {
        const currentUser = getCurrentUser();
        return currentUser && currentUser.rol_id !== 1;
    };

    // ─────────────────────────────────────────────
    // PRODUCTOS
    // ─────────────────────────────────────────────
    const obtenerProductos = async () => {
        try {
            const currentSucursal = getCurrentSucursal();
            if (!currentSucursal) {
                console.log('No hay sucursal seleccionada, esperando...');
                return;
            }

            setLoading(true);

            const { data, error: supabaseError } = await supabase
                .from('productos_stock')
                .select(`
                    stock_actual,
                    stock_minimo,
                    producto:producto_id (
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        precio,
                        costo,
                        comision_variable,
                        activo,
                        created_at,
                        updated_at,
                        categoria_id,
                        categorias (
                            id,
                            nombre,
                            reglas_comision
                        )
                    )
                `)
                .eq('sucursal_id', currentSucursal.id)
                .eq('producto.activo', true);

            if (supabaseError) {
                throw new Error(`Error al obtener productos: ${supabaseError.message}`);
            }

            const productosFormateados = data
                .filter(item => item.producto !== null)
                .map(item => ({
                    id: item.producto.id,
                    codigo: item.producto.codigo,
                    nombre: item.producto.nombre,
                    descripcion: item.producto.descripcion,
                    precio: item.producto.precio,
                    costo: item.producto.costo,
                    comision_variable: item.producto.comision_variable,
                    stock_actual: item.stock_actual,
                    stock_minimo: item.stock_minimo,
                    activo: item.producto.activo,
                    created_at: item.producto.created_at,
                    updated_at: item.producto.updated_at,
                    categoria_id: item.producto.categoria_id,
                    categorias: item.producto.categorias
                }));

            setProductos(productosFormateados || []);
        } catch (err) {
            console.error('Error obteniendo productos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // VENTAS — fetch paginado por rango
    // ─────────────────────────────────────────────
    const fetchVentasPorRango = async (sucursalId, inicioUTC, finUTC) => {
        let all = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .select(`
                    *,
                    productos:producto_id (
                        id,
                        nombre,
                        codigo,
                        precio,
                        comision_variable,
                        categoria_id,
                        categorias:categoria_id (
                            id,
                            nombre,
                            reglas_comision
                        )
                    ),
                    usuarios:promotor_id (
                        id,
                        nombre,
                        rol_id,
                        caja,
                        activo,
                        roles:rol_id (
                            id,
                            nombre
                        )
                    )
                `)
                .eq('sucursal_id', sucursalId)
                .gte('fecha_venta', inicioUTC)
                .lte('fecha_venta', finUTC)
                .order('fecha_venta', { ascending: false })
                .range(from, from + PAGE_SIZE - 1);

            if (supabaseError) {
                throw new Error(`Error al obtener ventas: ${supabaseError.message}`);
            }

            all = all.concat(data || []);
            hasMore = (data?.length || 0) === PAGE_SIZE;
            from += PAGE_SIZE;
        }

        return all;
    };

    const enriquecerVenta = (venta) => ({
        ...venta,
        fecha_venta_utc: venta.fecha_venta,
        fecha_venta_bolivia: formatUTCToBolivia(venta.fecha_venta, 'datetime'),
        fecha_venta_bolivia_date: formatUTCToBolivia(venta.fecha_venta, 'date'),
        fecha_venta_bolivia_time: formatUTCToBolivia(venta.fecha_venta, 'time'),
        producto_nombre: venta.productos?.nombre || `Producto ${venta.producto_id}`,
        comision_variable: venta.productos?.comision_variable || 'no var',
        producto_codigo: venta.productos?.codigo || `COD-${venta.producto_id}`,
        producto_precio: venta.productos?.precio || 0,
        categoria_nombre: venta.productos?.categorias?.nombre || `Categoría ${venta.productos?.categoria_id}`,
        usuario_nombre: venta.usuarios?.nombre || `Usuario ${venta.promotor_id}`,
        usuario_activo: venta.usuarios?.activo || false,
        rol_nombre: venta.usuarios?.roles?.nombre || `Rol ${venta.usuarios?.rol_id}`
    });

    // ✅ Acepta filtroFecha opcional. Sin args → mes actual Bolivia.
    const obtenerMisVentas = useCallback(async (filtroFecha = null) => {
        const currentUser = getCurrentUser();
        const currentSucursal = getCurrentSucursal();
        if (!currentUser || !currentSucursal) return;

        try {
            setLoading(true);

            const rango = (filtroFecha && filtroFecha.inicio && filtroFecha.fin)
                ? { inicio: filtroFecha.inicio, fin: filtroFecha.fin }
                : getBoliviaMonthRangeUTC(new Date());

            if (!rango) throw new Error('No se pudo calcular el rango de fechas');

            console.log('📅 obtenerMisVentas — rango:', rango);

            const ventasData = await fetchVentasPorRango(
                currentSucursal.id,
                rango.inicio,
                rango.fin
            );

            const ventasEnriquecidas = (ventasData || []).map(enriquecerVenta);

            console.log('✅ Ventas cargadas:', ventasEnriquecidas.length);
            if (ventasEnriquecidas.length > 0) {
                console.log('📅 Primera venta - UTC:', ventasEnriquecidas[0].fecha_venta_utc);
                console.log('📅 Primera venta - Bolivia:', ventasEnriquecidas[0].fecha_venta_bolivia);
            }

            setVentas(ventasEnriquecidas);
            setRangoActual(rango);
            setError(null);
        } catch (err) {
            setError(err.message);
            setVentas([]);
        } finally {
            setLoading(false);
        }
    }, [localStorageValues.sucursalSeleccionada, localStorageValues.currentUser]);

    // ✅ Consulta fresca para exportar (no depende del array en memoria)
    const obtenerVentasParaExportar = useCallback(async (filtroFecha = null) => {
        const currentSucursal = getCurrentSucursal();
        if (!currentSucursal) return [];

        const rango = (filtroFecha && filtroFecha.inicio && filtroFecha.fin)
            ? { inicio: filtroFecha.inicio, fin: filtroFecha.fin }
            : getBoliviaMonthRangeUTC(new Date());

        if (!rango) return [];

        const data = await fetchVentasPorRango(
            currentSucursal.id,
            rango.inicio,
            rango.fin
        );

        return (data || []).map(enriquecerVenta);
    }, [localStorageValues.sucursalSeleccionada]);

    // ─────────────────────────────────────────────
    // STOCK / MOVIMIENTOS
    // ─────────────────────────────────────────────
    const actualizarStockProducto = async (productoId, cantidad, sucursalId) => {
        try {
            const { data: stockActual, error: errorStock } = await supabase
                .from('productos_stock')
                .select('id, stock_actual')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .single();

            if (errorStock) {
                throw new Error(`Error al obtener stock: ${errorStock.message}`);
            }

            const nuevoStock = stockActual.stock_actual + cantidad;
            if (nuevoStock < 0) {
                throw new Error('Stock insuficiente');
            }

            const { error: errorUpdate } = await supabase
                .from('productos_stock')
                .update({
                    stock_actual: nuevoStock,
                    updated_at: getCurrentUTCTime()
                })
                .eq('id', stockActual.id);

            if (errorUpdate) {
                throw new Error(`Error al actualizar stock: ${errorUpdate.message}`);
            }

            return true;
        } catch (err) {
            console.error('Error actualizando stock:', err);
            throw err;
        }
    };

    const registrarMovimientoStock = async (productoId, cantidad, motivo, sucursalId) => {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            const { data: producto } = await supabase
                .from('productos')
                .select('codigo, nombre')
                .eq('id', productoId)
                .single();

            const movimiento = {
                usuario_id: currentUser.id,
                tipo_movimiento: 'salida_stock',
                datos: {
                    producto_id: productoId,
                    producto_codigo: producto?.codigo,
                    producto_nombre: producto?.nombre,
                    cantidad: cantidad,
                    motivo: motivo || 'Venta realizada',
                    tipo: 'venta'
                },
                sucursal_id: sucursalId,
                created_at: getCurrentUTCTime()
            };

            const { error } = await supabase
                .from('movimientos')
                .insert([movimiento]);

            if (error) {
                console.error('Error registrando movimiento:', error);
            }
        } catch (err) {
            console.error('Error en registrarMovimientoStock:', err);
        }
    };

    // ─────────────────────────────────────────────
    // CREAR VENTA
    // ─────────────────────────────────────────────
    const crearVenta = async (ventaData) => {
        try {
            setLoading(true);
            setError(null);

            const currentUser = getCurrentUser();
            const currentSucursal = getCurrentSucursal();

            if (!currentUser) throw new Error('No hay usuario logueado');
            if (!currentSucursal) throw new Error('No hay sucursal seleccionada');
            if (!ventaData.producto_id) throw new Error('Debe seleccionar un producto');

            const cantidad = ventaData.cantidad || 1;
            const promotorId = ventaData.promotor_id;

            if (!promotorId) throw new Error('Debe seleccionar un promotor/vendedor');

            const { data: stockActual, error: errorStock } = await supabase
                .from('productos_stock')
                .select('stock_actual')
                .eq('producto_id', ventaData.producto_id)
                .eq('sucursal_id', currentSucursal.id)
                .single();

            if (errorStock) {
                throw new Error(`Error al verificar stock: ${errorStock.message}`);
            }

            if (stockActual.stock_actual < cantidad) {
                throw new Error(`Stock insuficiente. Disponible: ${stockActual.stock_actual}`);
            }

            const fechaUTC = getCurrentUTCTime();

            const ventaCompleta = {
                ...ventaData,
                promotor_id: promotorId,
                sucursal_id: currentSucursal.id,
                fecha_venta: fechaUTC,
                estado: 'activa',
                depositado: false,
                confirmacion_depositado: false,
                cantidad: cantidad
            };

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .insert([ventaCompleta])
                .select(`
                    *,
                    productos:producto_id (
                        id,
                        nombre,
                        codigo,
                        precio,
                        comision_variable,
                        categoria_id,
                        categorias:categoria_id (
                            id,
                            nombre,
                            reglas_comision
                        )
                    ),
                    promotor:promotor_id (
                        id,
                        nombre,
                        rol_id,
                        caja,
                        roles:rol_id (
                            id,
                            nombre
                        )
                    )
                `)
                .single();

            if (supabaseError) {
                throw new Error(`Error al crear venta: ${supabaseError.message}`);
            }

            await actualizarStockProducto(ventaData.producto_id, -cantidad, currentSucursal.id);
            await registrarMovimientoStock(ventaData.producto_id, cantidad, 'Venta realizada', currentSucursal.id);

            // Enriquecer reutilizando el mapper (mapea 'promotor' a 'usuarios' del select)
            const ventaEnriquecida = {
                ...data,
                fecha_venta_utc: data.fecha_venta,
                fecha_venta_bolivia: formatUTCToBolivia(data.fecha_venta, 'datetime'),
                fecha_venta_bolivia_date: formatUTCToBolivia(data.fecha_venta, 'date'),
                fecha_venta_bolivia_time: formatUTCToBolivia(data.fecha_venta, 'time'),
                producto_nombre: data.productos?.nombre || `Producto ${data.producto_id}`,
                comision_variable: data.productos?.comision_variable || 'no var',
                producto_codigo: data.productos?.codigo || `COD-${data.producto_id}`,
                producto_precio: data.productos?.precio || 0,
                categoria_nombre: data.productos?.categorias?.nombre || `Categoría ${data.productos?.categoria_id}`,
                usuario_nombre: data.promotor?.nombre || `Vendedor ${promotorId}`,
                rol_nombre: data.promotor?.roles?.nombre || `Rol ${data.promotor?.rol_id}`,
                usuarios: data.promotor,
                promotor_nombre: data.promotor?.nombre || `Vendedor ${promotorId}`
            };

            // Si la venta cae dentro del rango actual, la insertamos en memoria.
            // Si el rango no incluye hoy (usuario viendo otro mes), no ensuciamos el array.
            const dentroDelRango = rangoActual
                ? new Date(data.fecha_venta) >= new Date(rangoActual.inicio) &&
                new Date(data.fecha_venta) <= new Date(rangoActual.fin)
                : true;

            if (dentroDelRango) {
                setVentas(prev => [ventaEnriquecida, ...prev]);
            }

            await obtenerProductos();

            return ventaEnriquecida;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const crearMultiplesVentas = async (ventasData) => {
        try {
            setLoading(true);
            setError(null);

            const currentUser = getCurrentUser();
            const currentSucursal = getCurrentSucursal();

            if (!currentUser) throw new Error('No hay usuario logueado');
            if (!currentSucursal) throw new Error('No hay sucursal seleccionada');

            const ventasCreadas = [];

            for (const ventaData of ventasData) {
                if (!ventaData.producto_id) throw new Error('Debe seleccionar un producto');

                const cantidad = ventaData.cantidad || 1;
                const promotorId = ventaData.promotor_id;

                if (!promotorId) throw new Error('Debe seleccionar un promotor/vendedor');

                const { data: stockActual, error: errorStock } = await supabase
                    .from('productos_stock')
                    .select('stock_actual')
                    .eq('producto_id', ventaData.producto_id)
                    .eq('sucursal_id', currentSucursal.id)
                    .single();

                if (errorStock) {
                    throw new Error(`Error al verificar stock: ${errorStock.message}`);
                }

                if (stockActual.stock_actual < cantidad) {
                    throw new Error(`Stock insuficiente para producto ID ${ventaData.producto_id}`);
                }

                const fechaUTC = getCurrentUTCTime();

                const ventaCompleta = {
                    ...ventaData,
                    promotor_id: promotorId,
                    sucursal_id: currentSucursal.id,
                    fecha_venta: fechaUTC,
                    estado: 'activa',
                    depositado: false,
                    confirmacion_depositado: false,
                    cantidad: cantidad
                };

                const { data, error: supabaseError } = await supabase
                    .from('ventas')
                    .insert([ventaCompleta])
                    .select(`
                        *,
                        productos:producto_id (
                            id,
                            nombre,
                            codigo,
                            precio,
                            comision_variable,
                            categoria_id,
                            categorias:categoria_id (
                                id,
                                nombre,
                                reglas_comision
                            )
                        ),
                        promotor:promotor_id (
                            id,
                            nombre,
                            rol_id,
                            caja,
                            roles:rol_id (
                                id,
                                nombre
                            )
                        )
                    `)
                    .single();

                if (supabaseError) {
                    throw new Error(`Error al crear venta: ${supabaseError.message}`);
                }

                await actualizarStockProducto(ventaData.producto_id, -cantidad, currentSucursal.id);
                await registrarMovimientoStock(ventaData.producto_id, cantidad, 'Venta realizada', currentSucursal.id);

                const ventaEnriquecida = {
                    ...data,
                    fecha_venta_utc: data.fecha_venta,
                    fecha_venta_bolivia: formatUTCToBolivia(data.fecha_venta, 'datetime'),
                    fecha_venta_bolivia_date: formatUTCToBolivia(data.fecha_venta, 'date'),
                    fecha_venta_bolivia_time: formatUTCToBolivia(data.fecha_venta, 'time'),
                    producto_nombre: data.productos?.nombre || `Producto ${data.producto_id}`,
                    comision_variable: data.productos?.comision_variable || 'no var',
                    producto_codigo: data.productos?.codigo || `COD-${data.producto_id}`,
                    producto_precio: data.productos?.precio || 0,
                    categoria_nombre: data.productos?.categorias?.nombre || `Categoría ${data.productos?.categoria_id}`,
                    usuario_nombre: data.promotor?.nombre || `Vendedor ${promotorId}`,
                    rol_nombre: data.promotor?.roles?.nombre || `Rol ${data.promotor?.rol_id}`,
                    usuarios: data.promotor,
                    promotor_nombre: data.promotor?.nombre || `Vendedor ${promotorId}`
                };

                ventasCreadas.push(ventaEnriquecida);
            }

            // Solo insertamos en memoria las que caen dentro del rango actual
            const dentroDelRango = (fechaVenta) => {
                if (!rangoActual) return true;
                const f = new Date(fechaVenta);
                return f >= new Date(rangoActual.inicio) && f <= new Date(rangoActual.fin);
            };

            const visibles = ventasCreadas.filter(v => dentroDelRango(v.fecha_venta));
            if (visibles.length > 0) {
                setVentas(prev => [...visibles, ...prev]);
            }

            await obtenerProductos();

            return ventasCreadas;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // VENDEDORES
    // ─────────────────────────────────────────────
    const obtenerVendedores = async () => {
        try {
            const currentSucursal = getCurrentSucursal();
            if (!currentSucursal) {
                console.log('No hay sucursal seleccionada');
                return [];
            }

            const { data, error: supabaseError } = await supabase
                .from('usuarios')
                .select(`
                    id, 
                    nombre,
                    roles!inner (id, nombre)
                `)
                .eq('sucursal_id', currentSucursal.id)
                .eq('roles.nombre', 'promotor')
                .eq('activo', true)
                .order('nombre');

            if (supabaseError) {
                throw new Error(`Error al obtener vendedores: ${supabaseError.message}`);
            }

            return data || [];
        } catch (err) {
            console.error('Error obteniendo vendedores:', err);
            return [];
        }
    };

    // ─────────────────────────────────────────────
    // ANULAR
    // ─────────────────────────────────────────────
    const anularVenta = async (ventaId, motivoAnulacion) => {
        try {
            setLoading(true);
            setError(null);

            const currentUser = getCurrentUser();
            const currentSucursal = getCurrentSucursal();

            if (!currentUser) throw new Error('No hay usuario logueado');

            const { data: venta, error: errorVenta } = await supabase
                .from('ventas')
                .select('producto_id, estado, cantidad')
                .eq('id', ventaId)
                .single();

            if (errorVenta) {
                throw new Error(`Error al obtener venta: ${errorVenta.message}`);
            }

            if (venta.estado === 'anulada') {
                throw new Error('La venta ya está anulada');
            }

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .update({
                    estado: 'anulada',
                    motivo_anulacion: motivoAnulacion,
                    usuario_anulacion: currentUser.id,
                    fecha_anulacion: getCurrentUTCTime()
                })
                .eq('id', ventaId)
                .select(`
                    *,
                    productos:producto_id (
                        id,
                        nombre,
                        codigo
                    ),
                    promotor:promotor_id (
                        id,
                        nombre
                    ),
                    usuario_anulacion (
                        id,
                        nombre
                    )
                `)
                .single();

            if (supabaseError) {
                throw new Error(`Error al anular venta: ${supabaseError.message}`);
            }

            await actualizarStockProducto(venta.producto_id, venta.cantidad, currentSucursal.id);
            await registrarMovimientoStock(venta.producto_id, venta.cantidad, `Anulación de venta: ${motivoAnulacion}`, currentSucursal.id);

            const ventaEnriquecida = {
                ...data,
                fecha_venta_utc: data.fecha_venta,
                fecha_venta_bolivia: formatUTCToBolivia(data.fecha_venta, 'datetime'),
                fecha_venta_bolivia_date: formatUTCToBolivia(data.fecha_venta, 'date'),
                fecha_venta_bolivia_time: formatUTCToBolivia(data.fecha_venta, 'time'),
                producto_nombre: data.productos?.nombre || `Producto ${data.producto_id}`,
                promotor_nombre: data.promotor?.nombre || `Usuario ${data.promotor_id}`,
                usuario_anulacion_nombre: data.usuario_anulacion?.nombre || `Usuario ${data.usuario_anulacion}`
            };

            setVentas(prev =>
                prev.map(ventaItem =>
                    ventaItem.id === ventaId ? { ...ventaItem, ...ventaEnriquecida } : ventaItem
                )
            );

            await obtenerProductos();

            return ventaEnriquecida;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // DEPÓSITOS
    // ─────────────────────────────────────────────
    const actualizarDepositado = async (ventaId, depositado) => {
        try {
            setError(null);

            const currentUser = getCurrentUser();
            if (!currentUser) throw new Error('No hay usuario logueado');

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .update({ depositado })
                .eq('id', ventaId)
                .select()
                .single();

            if (supabaseError) {
                throw new Error(`Error al actualizar depositado: ${supabaseError.message}`);
            }

            setVentas(prev =>
                prev.map(venta =>
                    venta.id === ventaId ? { ...venta, depositado } : venta
                )
            );

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const actualizarConfirmacionDepositado = async (ventaId, confirmacionDepositado) => {
        try {
            setError(null);

            const currentUser = getCurrentUser();
            if (!currentUser) throw new Error('No hay usuario logueado');

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .update({ confirmacion_depositado: confirmacionDepositado })
                .eq('id', ventaId)
                .select()
                .single();

            if (supabaseError) {
                throw new Error(`Error al actualizar confirmación: ${supabaseError.message}`);
            }

            setVentas(prev =>
                prev.map(venta =>
                    venta.id === ventaId ? { ...venta, confirmacion_depositado: confirmacionDepositado } : venta
                )
            );

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const obtenerVentaPorId = async (ventaId) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .select(`
                    *,
                    productos:producto_id (*),
                    promotor:promotor_id (*),
                    usuario_anulacion (*)
                `)
                .eq('id', ventaId)
                .single();

            if (supabaseError) {
                throw new Error(`Error al obtener venta: ${supabaseError.message}`);
            }

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // ─────────────────────────────────────────────
    // FILTROS EN CLIENTE (sobre el array del rango cargado)
    // ─────────────────────────────────────────────
    const obtenerProductosParaVenta = () => {
        return productos.filter(producto => producto.activo && producto.stock_actual > 0);
    };

    const filtrarVentasPorCategoria = (ventasArray, categoria) => {
        if (!categoria) return ventasArray;
        return ventasArray.filter(venta => venta.categoria_nombre === categoria);
    };

    const filtrarVentasPorUsuarios = (ventasArray, usuario) => {
        if (!usuario) return ventasArray;
        return ventasArray.filter(venta => venta.usuario_nombre === usuario);
    };

    const filtrarVentasActivas = (ventasArray, estado) => {
        if (!estado) return ventasArray;
        return ventasArray.filter(venta => venta.estado === 'activa');
    };

    const filtrarVentasPorBusqueda = (ventasArray, terminoBusqueda) => {
        if (!terminoBusqueda || typeof terminoBusqueda !== 'string' || terminoBusqueda.trim() === '') {
            return ventasArray;
        }
        const termino = terminoBusqueda.toLowerCase().trim();
        return ventasArray.filter(venta =>
            venta.producto_codigo?.toLowerCase().includes(termino) ||
            venta.producto_nombre?.toLowerCase().includes(termino) ||
            venta.total_precio_venta?.toString().includes(termino) ||
            venta.observaciones?.toLowerCase().includes(termino)
        );
    };

    const filtrarVentasPorDepositado = (depositado) => {
        return ventas.filter(venta => venta.depositado === depositado);
    };

    const filtrarVentasPorConfirmacionDepositado = (confirmacionDepositado) => {
        return ventas.filter(venta => venta.confirmacion_depositado === confirmacionDepositado);
    };

    const filtrarVentasPorProducto = (productoId) => {
        return ventas.filter(venta => venta.producto_id === productoId);
    };

    const obtenerVentasDelUsuarioActual = () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return [];
        return ventas.filter(venta => venta.promotor_id === currentUser.id);
    };

    const obtenerEstadisticas = useCallback(() => {
        const currentUser = getCurrentUser();
        const esAdmin = puedeConfirmarDepositos();
        const ventasActuales = ventas;

        const ventasFiltradas = currentUser && !esAdmin
            ? ventasActuales.filter(v => v.promotor_id === currentUser.id)
            : ventasActuales;

        const totalVentas = ventasFiltradas.length;
        const ventasActivas = ventasFiltradas.filter(v => v.estado === 'activa').length;
        const ventasAnuladas = ventasFiltradas.filter(v => v.estado === 'anulada').length;
        const totalPrecioVentas = ventasFiltradas
            .filter(v => v.estado === 'activa')
            .reduce((sum, v) => sum + parseFloat(v.total_precio_venta || 0), 0);

        const pendientesDeposito = ventasFiltradas.filter(v =>
            v.depositado === false && v.estado === 'activa'
        ).length;

        let pendientesConfirmacion;
        if (esAdmin) {
            pendientesConfirmacion = ventasActuales.filter(v =>
                v.confirmacion_depositado === false && v.estado === 'activa'
            ).length;
        } else {
            pendientesConfirmacion = ventasFiltradas.filter(v =>
                v.confirmacion_depositado === false && v.estado === 'activa'
            ).length;
        }

        return {
            totalVentas,
            ventasActivas,
            ventasAnuladas,
            totalPrecioVentas,
            pendientesDeposito,
            pendientesConfirmacion,
            esAdmin
        };
    }, [ventas]);

    const haySucursalSeleccionada = () => !!getCurrentSucursal();

    // ─────────────────────────────────────────────
    // EFECTOS
    // ─────────────────────────────────────────────
    useEffect(() => {
        const currentSucursal = getCurrentSucursal();
        if (currentSucursal) {
            setSucursalCargada(true);
            obtenerMisVentas();   // mes actual por defecto
            obtenerProductos();
        } else {
            setSucursalCargada(false);
            setVentas([]);
            setProductos([]);
            setRangoActual(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localStorageValues.sucursalSeleccionada]);

    return {
        ventas,
        productos: obtenerProductosParaVenta(),
        loading,
        error,
        currentUser: getCurrentUser(),
        currentSucursal: getCurrentSucursal(),
        sucursalCargada: haySucursalSeleccionada(),
        rangoActual,

        puedeConfirmarDepositos: puedeConfirmarDepositos(),
        puedeMarcarDepositado: puedeMarcarDepositado(),
        rolNombre: getRolNombre(),

        obtenerMisVentas,
        obtenerVentasParaExportar,
        crearVenta,
        crearMultiplesVentas,
        anularVenta,

        actualizarDepositado,
        actualizarConfirmacionDepositado,

        obtenerVendedores,

        obtenerVentaPorId,
        filtrarVentasPorCategoria,
        filtrarVentasPorUsuarios,
        filtrarVentasPorBusqueda,
        filtrarVentasPorDepositado,
        filtrarVentasPorConfirmacionDepositado,
        filtrarVentasPorProducto,
        filtrarVentasActivas,
        obtenerVentasDelUsuarioActual,
        obtenerEstadisticas,
        refetch: () => obtenerMisVentas()
    };
};