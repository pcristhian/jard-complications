// src/app/dashboard/ventas/hooks/useVentasEstadisticas.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener';

export const useVentasEstadisticas = () => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());

    // Listener para localStorage
    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser',
        'sucursalSeleccionada'
    ]);

    const getCurrentUser = () => {
        return localStorageValues.currentUser || null;
    };

    const getCurrentSucursal = () => {
        return localStorageValues.sucursalSeleccionada || null;
    };

    // Función para obtener las fechas del mes
    const obtenerFechasDelMes = (fecha) => {
        const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);

        const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);

        return { inicio, fin };
    };

    // Función para calcular comisión según reglas
    const calcularComision = (reglasComision, cantidadProductos, comisionesVariables = []) => {
        if (!reglasComision) return 0;

        try {
            // Parsear reglas de comisión
            const reglas = typeof reglasComision === 'string'
                ? JSON.parse(reglasComision)
                : reglasComision;

            // Si comisión variable es true, sumar todas las comisiones variables
            if (reglas.comision_variable === true) {
                return comisionesVariables.reduce((sum, comision) => sum + comision, 0);
            }

            // Comisión simple (solo comisión_base)
            if (reglas.tipo === 'simple' || !reglas.comision_limite) {
                return cantidadProductos * (reglas.comision_base || 0);
            }

            // Comisión con límite
            const comisionBase = reglas.comision_base || 0;
            const limite = reglas.comision_limite || 0;
            const comisionPostLimite = reglas.comision_post_limite || 0;

            if (cantidadProductos <= limite) {
                return cantidadProductos * comisionBase;
            } else {
                const comisionHastaLimite = limite * comisionBase;
                const productosPostLimite = cantidadProductos - limite;
                const comisionDespuesLimite = productosPostLimite * comisionPostLimite;
                return comisionHastaLimite + comisionDespuesLimite;
            }
        } catch (error) {
            console.error('Error calculando comisión:', error);
            return 0;
        }
    };

    const obtenerMisVentas = async (fechaPersonalizada = null) => {
        const currentUser = getCurrentUser();
        const currentSucursal = getCurrentSucursal();

        if (!currentUser || !currentSucursal) {
            setVentas([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Usar fecha personalizada o la del mes seleccionado
            const fechaReferencia = fechaPersonalizada || mesSeleccionado;
            const { inicio: fechaInicio, fin: fechaFin } = obtenerFechasDelMes(fechaReferencia);

            console.log(`Consultando ventas desde ${fechaInicio.toLocaleDateString()} hasta ${fechaFin.toLocaleDateString()}`);

            const { data: ventasData, error: supabaseError } = await supabase
                .from('ventas')
                .select(`
                    *,
                    productos:producto_id (
                        id,
                        nombre,
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
                        nombre,
                        caja,
                        rol_id,
                        roles:rol_id (
                            id,
                            nombre
                        )
                    )
                `)
                .eq('sucursal_id', currentSucursal.id)
                .eq('estado', 'activa')
                .gte('fecha_venta', fechaInicio.toISOString())
                .lte('fecha_venta', fechaFin.toISOString())
                .order('fecha_venta', { ascending: false });

            if (supabaseError) {
                throw new Error(`Error al obtener ventas: ${supabaseError.message}`);
            }

            console.log("Datos crudos de ventas:", ventasData);

            // Estructura para almacenar datos agrupados
            const ventasAgrupadas = {};
            const comisionesVariablesMap = {};

            (ventasData || []).forEach(venta => {
                const usuarioId = venta.promotor_id;
                const usuarioNombre = venta.usuarios?.nombre || `Usuario ${usuarioId}`;
                const usuarioCaja = venta.usuarios?.caja || ``;
                const usuarioRol = venta.usuarios?.roles?.nombre || 'no info';
                const categoriaId = venta.productos?.categoria_id;
                const categoriaNombre = venta.productos?.categorias?.nombre || `Categoría ${categoriaId}`;
                const reglasComision = venta.productos?.categorias?.reglas_comision;
                const comisionVariableProducto = venta.productos?.comision_variable || 0;
                const cantidadEnVenta = venta.cantidad || 1;

                // Inicializar estructuras si no existen
                if (!ventasAgrupadas[usuarioId]) {
                    ventasAgrupadas[usuarioId] = {
                        usuario_id: usuarioId,
                        usuario_nombre: usuarioNombre,
                        usuario_caja: usuarioCaja,
                        usuario_rol: usuarioRol,
                        total_productos: 0,
                        total_comision: 0,
                        total_ventas: 0,
                        categorias: {}
                    };
                    comisionesVariablesMap[usuarioId] = {};
                }

                if (!ventasAgrupadas[usuarioId].categorias[categoriaId]) {
                    ventasAgrupadas[usuarioId].categorias[categoriaId] = {
                        categoria_id: categoriaId,
                        categoria_nombre: categoriaNombre,
                        reglas_comision: reglasComision,
                        cantidad: 0,
                        comision: 0,
                        total_ventas: 0
                    };
                    comisionesVariablesMap[usuarioId][categoriaId] = [];
                }

                // Sumar cantidad de productos vendidos
                ventasAgrupadas[usuarioId].total_productos += cantidadEnVenta;
                ventasAgrupadas[usuarioId].total_ventas += parseFloat(venta.total_precio_venta || 0);
                ventasAgrupadas[usuarioId].categorias[categoriaId].cantidad += cantidadEnVenta;
                ventasAgrupadas[usuarioId].categorias[categoriaId].total_ventas += parseFloat(venta.total_precio_venta || 0);

                // Guardar comisión variable por cada unidad vendida
                if (comisionVariableProducto > 0) {
                    for (let i = 0; i < cantidadEnVenta; i++) {
                        comisionesVariablesMap[usuarioId][categoriaId].push(comisionVariableProducto);
                    }
                }
            });

            // Calcular comisiones después de agrupar todas las ventas
            Object.keys(ventasAgrupadas).forEach(usuarioId => {
                const usuario = ventasAgrupadas[usuarioId];
                const comisionesVariablesUsuario = comisionesVariablesMap[usuarioId] || {};

                Object.keys(usuario.categorias).forEach(categoriaId => {
                    const categoria = usuario.categorias[categoriaId];
                    const cantidadProductos = categoria.cantidad;
                    const comisionesVariablesCategoria = comisionesVariablesUsuario[categoriaId] || [];

                    const comisionCalculada = calcularComision(
                        categoria.reglas_comision,
                        cantidadProductos,
                        comisionesVariablesCategoria
                    );

                    categoria.comision = comisionCalculada;
                    usuario.total_comision += comisionCalculada;
                });
            });

            // Convertir a un array formateado
            const resultado = Object.values(ventasAgrupadas).map(usuario => ({
                ...usuario,
                categorias: Object.values(usuario.categorias)
            }));

            // Ordenar por total de productos (descendente)
            resultado.sort((a, b) => b.total_productos - a.total_productos);

            console.log("Resultado final:", resultado);
            setVentas(resultado);
            setError(null);

        } catch (err) {
            console.error('Error en obtenerMisVentas:', err);
            setError(err.message);
            setVentas([]);
        } finally {
            setLoading(false);
        }
    };

    // Función para cambiar mes y recargar datos
    const cambiarMes = async (nuevaFecha) => {
        setMesSeleccionado(nuevaFecha);
        await obtenerMisVentas(nuevaFecha);
    };

    // Función para obtener meses disponibles (últimos 12 meses)
    const obtenerMesesDisponibles = () => {
        const meses = [];
        const hoy = new Date();

        for (let i = 0; i < 12; i++) {
            const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
            meses.push({
                fecha,
                nombre: fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
                valor: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
            });
        }

        return meses;
    };

    const haySucursalSeleccionada = () => {
        return !!getCurrentSucursal();
    };

    useEffect(() => {
        const currentSucursal = getCurrentSucursal();
        if (currentSucursal) {
            obtenerMisVentas();
        } else {
            setVentas([]);
        }
    }, [localStorageValues.sucursalSeleccionada]);

    return {
        // Estado
        loading,
        error,
        ventas,
        currentSucursal: getCurrentSucursal(),
        mesSeleccionado,

        // Funciones principales
        obtenerMisVentas,
        calcularComision,
        cambiarMes,
        obtenerMesesDisponibles,
        obtenerFechasDelMes,
        haySucursalSeleccionada
    };
};