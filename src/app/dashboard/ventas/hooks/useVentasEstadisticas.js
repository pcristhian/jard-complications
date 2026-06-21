// src/app/dashboard/ventas/hooks/useVentasEstadisticas.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener';

export const useVentasEstadisticas = () => {
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date());
    const [productosExcluidos, setProductosExcluidos] = useState(0);

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

    const obtenerFechasDelMes = (fecha) => {
        const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
        inicio.setHours(0, 0, 0, 0);

        const fin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);
        fin.setHours(23, 59, 59, 999);

        return { inicio, fin };
    };

    const calcularComision = (reglasComision, cantidadProductos, comisionesVariables = []) => {
        if (!reglasComision) return 0;

        try {
            const reglas = typeof reglasComision === 'string'
                ? JSON.parse(reglasComision)
                : reglasComision;

            if (reglas.comision_variable === true) {
                return comisionesVariables.reduce((sum, comision) => sum + comision, 0);
            }

            if (reglas.tipo === 'simple' || !reglas.comision_limite) {
                return cantidadProductos * (reglas.comision_base || 0);
            }

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
            setProductosExcluidos(0);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const fechaReferencia = fechaPersonalizada || mesSeleccionado;
            const { inicio: fechaInicio, fin: fechaFin } = obtenerFechasDelMes(fechaReferencia);

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

            // Separar ventas por depositado
            const ventasNoDepositadas = (ventasData || []).filter(v => v.depositado === false);
            const ventasDepositadas = (ventasData || []).filter(v => v.depositado === true);

            // Calcular productos excluidos (depositados) - SOLO para el badge
            const totalProductosExcluidos = ventasDepositadas.reduce((sum, v) => sum + (v.cantidad || 0), 0);
            setProductosExcluidos(totalProductosExcluidos);

            // --- ESTRUCTURA PARA TODAS LAS VENTAS (incluyendo depositadas) ---
            // Esta estructura guardará TODAS las cantidades (depositadas + no depositadas)
            const ventasAgrupadasTotales = {};

            // --- ESTRUCTURA PARA COMISIONES (solo no depositadas) ---
            const comisionesVariablesMap = {};

            // PRIMERO: Procesar TODAS las ventas para contar cantidades
            (ventasData || []).forEach(venta => {
                const usuarioId = venta.promotor_id;
                const usuarioNombre = venta.usuarios?.nombre || `Usuario ${usuarioId}`;
                const usuarioCaja = venta.usuarios?.caja || ``;
                const usuarioRol = venta.usuarios?.roles?.nombre || 'no info';
                const categoriaId = venta.productos?.categoria_id;
                const categoriaNombre = venta.productos?.categorias?.nombre || `Categoría ${categoriaId}`;
                const cantidadEnVenta = venta.cantidad || 1;

                // Inicializar usuario si no existe
                if (!ventasAgrupadasTotales[usuarioId]) {
                    ventasAgrupadasTotales[usuarioId] = {
                        usuario_id: usuarioId,
                        usuario_nombre: usuarioNombre,
                        usuario_caja: usuarioCaja,
                        usuario_rol: usuarioRol,
                        total_productos: 0,      // ← TODAS las ventas
                        total_comision: 0,        // ← SOLO no depositadas
                        total_ventas: 0,
                        categorias: {}
                    };
                    comisionesVariablesMap[usuarioId] = {};
                }

                // Inicializar categoría si no existe
                if (!ventasAgrupadasTotales[usuarioId].categorias[categoriaId]) {
                    ventasAgrupadasTotales[usuarioId].categorias[categoriaId] = {
                        categoria_id: categoriaId,
                        categoria_nombre: categoriaNombre,
                        reglas_comision: venta.productos?.categorias?.reglas_comision,
                        cantidad: 0,           // ← TODAS las ventas
                        comision: 0,            // ← SOLO no depositadas
                        total_ventas: 0
                    };
                    comisionesVariablesMap[usuarioId][categoriaId] = [];
                }

                // SUMAR CANTIDADES (siempre, sin importar depositado)
                ventasAgrupadasTotales[usuarioId].total_productos += cantidadEnVenta;
                ventasAgrupadasTotales[usuarioId].total_ventas += parseFloat(venta.total_precio_venta || 0);
                ventasAgrupadasTotales[usuarioId].categorias[categoriaId].cantidad += cantidadEnVenta;
                ventasAgrupadasTotales[usuarioId].categorias[categoriaId].total_ventas += parseFloat(venta.total_precio_venta || 0);

                // SOLO si NO está depositado, guardamos comisiones variables
                if (venta.depositado === false) {
                    const comisionVariableProducto = venta.productos?.comision_variable || 0;
                    if (comisionVariableProducto > 0) {
                        for (let i = 0; i < cantidadEnVenta; i++) {
                            comisionesVariablesMap[usuarioId][categoriaId].push(comisionVariableProducto);
                        }
                    }
                }
            });

            // SEGUNDO: Calcular comisiones SOLO para ventas no depositadas
            // Pero usando las cantidades totales (porque la comisión se calcula sobre el total de productos vendidos,
            // pero solo se paga por los no depositados)
            // Para esto, necesitamos las cantidades de ventas NO depositadas por categoría
            const ventasNoDepositadasPorUsuario = {};

            ventasNoDepositadas.forEach(venta => {
                const usuarioId = venta.promotor_id;
                const categoriaId = venta.productos?.categoria_id;
                const cantidadEnVenta = venta.cantidad || 1;

                if (!ventasNoDepositadasPorUsuario[usuarioId]) {
                    ventasNoDepositadasPorUsuario[usuarioId] = {};
                }
                if (!ventasNoDepositadasPorUsuario[usuarioId][categoriaId]) {
                    ventasNoDepositadasPorUsuario[usuarioId][categoriaId] = 0;
                }
                ventasNoDepositadasPorUsuario[usuarioId][categoriaId] += cantidadEnVenta;
            });

            // Calcular comisiones solo para las cantidades NO depositadas
            Object.keys(ventasAgrupadasTotales).forEach(usuarioId => {
                const usuario = ventasAgrupadasTotales[usuarioId];
                const comisionesVariablesUsuario = comisionesVariablesMap[usuarioId] || {};

                Object.keys(usuario.categorias).forEach(categoriaId => {
                    const categoria = usuario.categorias[categoriaId];

                    // Obtener la cantidad NO depositada para esta categoría
                    const cantidadNoDepositada = ventasNoDepositadasPorUsuario[usuarioId]?.[categoriaId] || 0;
                    const comisionesVariablesCategoria = comisionesVariablesUsuario[categoriaId] || [];

                    // Calcular comisión SOLO sobre la cantidad no depositada
                    const comisionCalculada = calcularComision(
                        categoria.reglas_comision,
                        cantidadNoDepositada,  // ← SOLO no depositadas
                        comisionesVariablesCategoria
                    );

                    categoria.comision = comisionCalculada;
                    usuario.total_comision += comisionCalculada;
                });
            });

            const resultado = Object.values(ventasAgrupadasTotales).map(usuario => ({
                ...usuario,
                categorias: Object.values(usuario.categorias)
            }));

            resultado.sort((a, b) => b.total_productos - a.total_productos);

            setVentas(resultado);
            setError(null);

        } catch (err) {
            console.error('Error en obtenerMisVentas:', err);
            setError(err.message);
            setVentas([]);
            setProductosExcluidos(0);
        } finally {
            setLoading(false);
        }
    };

    const cambiarMes = async (nuevaFecha) => {
        setMesSeleccionado(nuevaFecha);
        await obtenerMisVentas(nuevaFecha);
    };

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
            setProductosExcluidos(0);
        }
    }, [localStorageValues.sucursalSeleccionada]);

    return {
        loading,
        error,
        ventas,
        currentSucursal: getCurrentSucursal(),
        mesSeleccionado,
        productosExcluidos,
        obtenerMisVentas,
        calcularComision,
        cambiarMes,
        obtenerMesesDisponibles,
        obtenerFechasDelMes,
        haySucursalSeleccionada
    };
};