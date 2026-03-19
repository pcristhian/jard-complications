// src/app/dashboard/ventas/hooks/useVentas.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener';

export const useVentas = () => {
    const [ventas, setVentas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sucursalCargada, setSucursalCargada] = useState(false);


    // Listener para localStorage
    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser',
        'sucursalSeleccionada'
    ]);
    // Obtener usuario actual desde localStorage
    const getCurrentUser = () => {
        return localStorageValues.currentUser || null;
    };
    // Obtener sucursal seleccionada desde localStorage
    const getCurrentSucursal = () => {
        return localStorageValues.sucursalSeleccionada || null;
    };

    // Verificar si el usuario puede confirmar depósitos (solo rol 1 - admin)
    const puedeConfirmarDepositos = () => {
        const currentUser = getCurrentUser();
        return currentUser && currentUser.rol_id === 1; // Solo admin (rol_id: 1)
    };
    // Obtener el nombre del rol para mostrar
    const getRolNombre = () => {
        const currentUser = getCurrentUser();
        return currentUser?.roles?.nombre || `Rol ${currentUser?.rol_id}`;
    };

    // Verificar si el usuario puede marcar como depositado (todos los roles)
    const puedeMarcarDepositado = () => {
        const currentUser = getCurrentUser();
        return currentUser && currentUser.rol_id !== 1; // Todos excepto admin
    };

    // Obtener todos los productos para las ventas
    const obtenerProductos = async () => {
        try {
            const currentSucursal = getCurrentSucursal();
            if (!currentSucursal) {
                console.log('No hay sucursal seleccionada, esperando...');
                return;
            }

            setLoading(true);

            const { data, error: supabaseError } = await supabase
                .from('productos')
                .select(`*,
                    categorias: categoria_id(
                    id,
                    nombre
                )
               `)
                .eq('sucursal_id', currentSucursal.id)
                .eq('activo', true)
                .order('nombre');

            if (supabaseError) {
                throw new Error(`Error al obtener productos: ${supabaseError.message}`);
            }

            setProductos(data || []);
        } catch (err) {
            console.error('Error obteniendo productos:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Consultar ventas del usuario actual
    const obtenerMisVentas = async () => {
        const currentUser = getCurrentUser();
        const currentSucursal = getCurrentSucursal();
        if (!currentUser || !currentSucursal) return;

        try {
            setLoading(true);

            const { data: ventasData, error: supabaseError } = await supabase
                .from('ventas')
                .select(`
        *,
        productos:producto_id (
            id,
            nombre,
            codigo,
            precio,
            categoria_id,
            comision_variable,
            categorias:categoria_id (
                id,
                nombre,
                reglas_comision             
            )
        ),
        usuarios:promotor_id (
            id,
            nombre
        )
                `)
                .eq('sucursal_id', currentSucursal.id)
                .eq('promotor_id', currentUser.id)
                .order('fecha_venta', { ascending: false });

            if (supabaseError) {
                throw new Error(`Error al obtener ventas: ${supabaseError.message}`);
            }

            // Enriquecer datos
            const ventasEnriquecidas = (ventasData || []).map(venta => ({
                ...venta,
                producto_nombre: venta.productos?.nombre || `Producto ${venta.producto_id}`,
                comision_variable: venta.productos?.comision_variable || 'no var',
                producto_precio: venta.productos?.precio || `Precio ${venta.productos?.precio}`,
                producto_codigo: venta.productos?.codigo || `COD-${venta.producto_id}`,
                categoria_nombre: venta.productos?.categorias?.nombre || `Categoría ${venta.productos?.categoria_id}`

            }));

            setVentas(ventasEnriquecidas);
            setError(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const obtenerVendedores = async () => {
        try {
            const currentSucursal = getCurrentSucursal();
            if (!currentSucursal) {
                console.log('No hay sucursal seleccionada');
                return []; // ⚠️ SIEMPRE retorna un array
            }

            const { data, error: supabaseError } = await supabase
                .from('usuarios')
                .select('id, nombre')
                .eq('sucursal_id', currentSucursal.id)
                .order('nombre');

            if (supabaseError) {
                throw new Error(`Error al obtener vendedores: ${supabaseError.message}`);
            }

            return data || []; // ⚠️ SIEMPRE retorna un array
        } catch (err) {
            console.error('Error obteniendo vendedores:', err);
            return []; // ⚠️ SIEMPRE retorna un array, incluso en error
        }
    };

    // Crear nueva venta
    const crearVenta = async (ventaData) => {
        try {
            setLoading(true);
            setError(null);

            const currentUser = getCurrentUser();
            const currentSucursal = getCurrentSucursal();

            if (!currentUser) {
                throw new Error('No hay usuario logueado');
            }
            if (!currentSucursal) {
                throw new Error('No hay sucursal seleccionada');
            }
            if (!ventaData.producto_id) {
                throw new Error('Debe seleccionar un producto');
            }
            if (!ventaData.promotor_id) { // <-- VALIDAR QUE SE RECIBA EL PROMOTOR
                throw new Error('Debe seleccionar un vendedor');
            }

            const ventaCompleta = {
                ...ventaData,
                // Usar el promotor_id recibido en lugar de currentUser.id
                promotor_id: ventaData.promotor_id, // <-- USAR EL PROMOTOR SELECCIONADO
                sucursal_id: currentSucursal.id,
                fecha_venta: new Date().toISOString(),
                estado: 'activa',
                depositado: false,
                confirmacion_depositado: false,
                cantidad: ventaData.cantidad || 1
            };

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .insert([ventaCompleta])
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
        )
      `)
                .single();

            if (supabaseError) {
                throw new Error(`Error al crear venta: ${supabaseError.message}`);
            }

            // Enriquecer datos
            const ventaEnriquecida = {
                ...data,
                producto_nombre: data.productos?.nombre || `Producto ${data.producto_id}`,
                promotor_nombre: data.promotor?.nombre || `Usuario ${data.promotor_id}`
            };

            setVentas(prev => [ventaEnriquecida, ...prev]);
            await obtenerMisVentas();

            // Actualizar stock del producto - ahora usando la cantidad
            await actualizarStockProducto(data.producto_id, -(ventaData.cantidad || 1));

            return ventaEnriquecida;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Función auxiliar para actualizar stock
    const actualizarStockProducto = async (productoId, cantidad) => {
        try {
            // Primero obtener el stock actual
            const { data: producto, error: errorProducto } = await supabase
                .from('productos')
                .select('stock_actual')
                .eq('id', productoId)
                .single();

            if (errorProducto) {
                throw new Error(`Error al obtener producto: ${errorProducto.message}`);
            }

            const nuevoStock = producto.stock_actual + cantidad;
            if (nuevoStock < 0) {
                throw new Error('Stock insuficiente');
            }

            // Actualizar stock
            const { error: errorUpdate } = await supabase
                .from('productos')
                .update({
                    stock_actual: nuevoStock,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productoId);

            if (errorUpdate) {
                throw new Error(`Error al actualizar stock: ${errorUpdate.message}`);
            }

            // Registrar movimiento de stock - CORRECCIÓN: pasar cantidad real
            await registrarMovimientoStock(productoId, Math.abs(cantidad)); // ← Usar Math.abs aquí

        } catch (err) {
            console.error('Error actualizando stock:', err);
            throw err;
        }
    };

    // En la función actualizarStockProducto, ajusta el movimiento:
    const registrarMovimientoStock = async (productoId, cantidad) => {
        try {
            const currentUser = getCurrentUser();
            const currentSucursal = getCurrentSucursal();

            const movimiento = {
                usuario_id: currentUser.id,
                tipo_movimiento: 'salida_stock',
                datos: {
                    producto_id: productoId,
                    cantidad: cantidad, // ← Usar la cantidad real
                    motivo: 'Venta realizada'
                },
                sucursal_id: currentSucursal.id
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

    // Anular venta
    const anularVenta = async (ventaId, motivoAnulacion) => {
        try {
            setLoading(true);
            setError(null);

            const currentUser = getCurrentUser();
            if (!currentUser) {
                throw new Error('No hay usuario logueado');
            }

            // Primero obtener la venta para restaurar stock
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

            // Actualizar venta
            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .update({
                    estado: 'anulada',
                    motivo_anulacion: motivoAnulacion,
                    usuario_anulacion: currentUser.id,
                    fecha_anulacion: new Date().toISOString()
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
            await actualizarStockProducto(venta.producto_id, venta.cantidad);
            // Enriquecer datos
            const ventaEnriquecida = {
                ...data,
                producto_nombre: data.productos?.nombre || `Producto ${data.producto_id}`,
                promotor_nombre: data.promotor?.nombre || `Usuario ${data.promotor_id}`,
                usuario_anulacion_nombre: data.usuario_anulacion?.nombre || `Usuario ${data.usuario_anulacion}`
            };

            setVentas(prev =>
                prev.map(venta =>
                    venta.id === ventaId ? ventaEnriquecida : venta
                )
            );

            return ventaEnriquecida;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };


    // Actualizar estado de depositado
    const actualizarDepositado = async (ventaId, depositado) => {
        try {
            setError(null);

            const currentUser = getCurrentUser();
            if (!currentUser) {
                throw new Error('No hay usuario logueado');
            }

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .update({
                    depositado // ← Solo actualizar depositado, sin updated_at
                })
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

    // Actualizar confirmación de depositado (para auditor)
    const actualizarConfirmacionDepositado = async (ventaId, confirmacionDepositado) => {
        try {
            setError(null);

            const currentUser = getCurrentUser();
            if (!currentUser) {
                throw new Error('No hay usuario logueado');
            }

            const { data, error: supabaseError } = await supabase
                .from('ventas')
                .update({
                    confirmacion_depositado: confirmacionDepositado // ← Solo actualizar confirmacion_depositado
                })
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

    // Obtener venta por ID
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

    // Obtener productos disponibles para venta
    const obtenerProductosParaVenta = () => {
        return productos.filter(producto =>
            producto.activo &&
            producto.stock_actual > 0
        );
    };

    // Filtrar ventas por categoria
    const filtrarVentasPorCategoria = (ventasArray, categoria) => {
        if (!categoria) return ventasArray;
        return ventasArray.filter(venta => venta.categoria_nombre === categoria);
    };
    const filtrarVentasActivas = (ventasArray, estado) => {
        if (!estado) return ventasArray;
        return ventasArray.filter(venta => venta.estado === 'activa');
    }
    // En useVentas.js - CORREGIR
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
    // Función para filtrar ventas por fecha
    const filtrarVentasFecha = (ventas, filtroFecha) => {
        if (!filtroFecha || !filtroFecha.inicio || !filtroFecha.fin) {
            return ventas;
        }

        const fechaInicio = new Date(filtroFecha.inicio);
        const fechaFin = new Date(filtroFecha.fin);

        // Ajustar fechaFin para incluir todo el día
        fechaFin.setHours(23, 59, 59, 999);

        return ventas.filter(venta => {
            const fechaVenta = new Date(venta.fecha_venta);
            return fechaVenta >= fechaInicio && fechaVenta <= fechaFin;
        });
    };


    // Filtrar ventas por depositado
    const filtrarVentasPorDepositado = (depositado) => {
        return ventas.filter(venta => venta.depositado === depositado);
    };

    // Filtrar ventas por confirmación de depositado
    const filtrarVentasPorConfirmacionDepositado = (confirmacionDepositado) => {
        return ventas.filter(venta => venta.confirmacion_depositado === confirmacionDepositado);
    };

    // Filtrar ventas por producto
    const filtrarVentasPorProducto = (productoId) => {
        return ventas.filter(venta => venta.producto_id === productoId);
    };

    // Obtener ventas del usuario actual
    const obtenerVentasDelUsuarioActual = () => {
        const currentUser = getCurrentUser();
        if (!currentUser) return [];

        return ventas.filter(venta => venta.promotor_id === currentUser.id);
    };

    // En el hook useVentas.js, modifica obtenerEstadisticas:
    const obtenerEstadisticas = useCallback(() => {
        const currentUser = getCurrentUser();
        const esAdmin = puedeConfirmarDepositos();

        const ventasActuales = ventas;

        const ventasFiltradas = currentUser && !esAdmin ?
            ventasActuales.filter(v => v.promotor_id === currentUser.id) :
            ventasActuales;

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
    }, [ventas]); // ← Solo depende de ventas

    // Verificar si hay sucursal seleccionada
    const haySucursalSeleccionada = () => {
        return !!getCurrentSucursal();
    };

    // Cargar datos cuando haya sucursal seleccionada
    useEffect(() => {
        const currentSucursal = getCurrentSucursal();
        if (currentSucursal) {
            setSucursalCargada(true);
            obtenerMisVentas();
            obtenerProductos();
        } else {
            setSucursalCargada(false);
            setVentas([]);
            setProductos([]);
        }
    }, [localStorageValues.sucursalSeleccionada]);

    return {
        // Estado
        ventas,
        productos: obtenerProductosParaVenta(),
        loading,
        error,
        currentUser: getCurrentUser(),
        currentSucursal: getCurrentSucursal(),
        sucursalCargada: haySucursalSeleccionada(),

        // Permisos - Exportar los valores, no las funciones
        puedeConfirmarDepositos: puedeConfirmarDepositos(), // ← Ejecutar la función
        puedeMarcarDepositado: puedeMarcarDepositado(),     // ← Ejecutar la función  
        rolNombre: getRolNombre(),

        // Acciones principales
        obtenerMisVentas,
        crearVenta,
        anularVenta,
        // Acciones de depósito
        actualizarDepositado,
        actualizarConfirmacionDepositado,

        // Consultas
        obtenerVentaPorId,
        filtrarVentasPorCategoria,
        filtrarVentasFecha,
        filtrarVentasPorBusqueda,
        filtrarVentasPorDepositado,
        filtrarVentasPorConfirmacionDepositado,
        filtrarVentasPorProducto,
        filtrarVentasActivas,
        obtenerVentasDelUsuarioActual,
        obtenerEstadisticas,
        obtenerVendedores,

        // Utilidades
        refetch: obtenerMisVentas
    };
};