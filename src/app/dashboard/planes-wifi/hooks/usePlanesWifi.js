// hooks/usePlanesWifi.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export const usePlanesWifi = () => {
    const [planes, setPlanes] = useState([]);
    const [estados, setEstados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarPlanes();
        cargarEstados();
    }, []);

    const cargarPlanes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('planes_wifi')
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre)
                `)
                .order('fecha', { ascending: false });

            if (error) throw error;
            setPlanes(data || []);
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error cargando planes WiFi:', error);
        } finally {
            setLoading(false);
        }
    };

    const cargarEstados = async () => {
        try {
            const { data, error } = await supabase
                .from('estados_plan_wifi')
                .select('*')
                .order('orden', { ascending: true });

            if (error) throw error;
            setEstados(data || []);
        } catch (error) {
            console.error('Error cargando estados:', error);
        }
    };

    const validarPlan = (planData) => {
        const errors = {};

        if (!planData.nombre_plan?.trim()) {
            errors.nombre_plan = 'Nombre del plan es requerido';
        }
        if (!planData.codigo_cliente?.trim()) {
            errors.codigo_cliente = 'Código de cliente es requerido';
        }
        if (!planData.nombre_cliente?.trim()) {
            errors.nombre_cliente = 'Nombre del cliente es requerido';
        }
        if (!planData.celular_cliente?.trim()) {
            errors.celular_cliente = 'Celular del cliente es requerido';
        }
        if (!planData.costo || planData.costo < 0) {
            errors.costo = 'Costo debe ser mayor o igual a 0';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    const crearPlan = async (planData) => {
        setLoading(true);
        setError(null);

        const validacion = validarPlan(planData);
        if (!validacion.isValid) {
            const errorMsg = 'Errores de validación: ' + JSON.stringify(validacion.errors);
            setError(errorMsg);
            setLoading(false);
            return { success: false, errors: validacion.errors, error: errorMsg };
        }

        try {
            const datosParaEnviar = {
                nombre_plan: planData.nombre_plan.trim(),
                codigo_cliente: planData.codigo_cliente.trim(),
                nombre_cliente: planData.nombre_cliente.trim(),
                celular_cliente: planData.celular_cliente.trim(),
                costo: parseFloat(planData.costo),
                estado_id: 1, // Siempre pendiente al crear
                fecha: new Date().toISOString(),
                usuario_id: planData.usuario_id || null, // Vendedor
                observacion: planData.observacion?.trim() || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('planes_wifi')
                .insert([datosParaEnviar])
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre)
                `)
                .single();

            if (error) throw error;

            setPlanes(prev => [data, ...prev]);
            return { success: true, data };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error creando plan WiFi:', error);
            return {
                success: false,
                error: errorMessage,
                errors: { general: errorMessage }
            };
        } finally {
            setLoading(false);
        }
    };

    const actualizarPlan = async (id, planData) => {
        setLoading(true);
        setError(null);

        const validacion = validarPlan(planData);
        if (!validacion.isValid) {
            const errorMsg = 'Errores de validación: ' + JSON.stringify(validacion.errors);
            setError(errorMsg);
            setLoading(false);
            return { success: false, errors: validacion.errors, error: errorMsg };
        }

        try {
            const datosParaEnviar = {
                nombre_plan: planData.nombre_plan.trim(),
                codigo_cliente: planData.codigo_cliente.trim(),
                nombre_cliente: planData.nombre_cliente.trim(),
                celular_cliente: planData.celular_cliente.trim(),
                costo: parseFloat(planData.costo),
                usuario_id: planData.usuario_id !== undefined ? planData.usuario_id : undefined,
                observacion: planData.observacion?.trim() || null,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('planes_wifi')
                .update(datosParaEnviar)
                .eq('id', id)
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre)
                `)
                .single();

            if (error) throw error;

            setPlanes(prev => prev.map(plan =>
                plan.id === id ? data : plan
            ));
            return { success: true, data };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error actualizando plan WiFi:', error);
            return {
                success: false,
                error: errorMessage,
                errors: { general: errorMessage }
            };
        } finally {
            setLoading(false);
        }
    };

    const actualizarEstadoPlan = async (id, estadoId, motivo = null) => {
        setLoading(true);
        setError(null);

        try {
            const estadoExiste = estados.some(e => e.id === estadoId);
            if (!estadoExiste) {
                throw new Error('Estado no válido');
            }

            const datosParaEnviar = {
                estado_id: parseInt(estadoId),
                updated_at: new Date().toISOString()
            };

            if (motivo) {
                const planActual = planes.find(p => p.id === id);
                const observacionActual = planActual?.observacion || '';
                const estadoNombre = estados.find(e => e.id === estadoId)?.nombre;
                datosParaEnviar.observacion = `${observacionActual}\n[${new Date().toLocaleString()}] Estado cambiado a: ${estadoNombre} - ${motivo}`.trim();
            }

            const { data, error } = await supabase
                .from('planes_wifi')
                .update(datosParaEnviar)
                .eq('id', id)
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre)
                `)
                .single();

            if (error) throw error;

            setPlanes(prev => prev.map(plan =>
                plan.id === id ? data : plan
            ));
            return { success: true, data };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error actualizando estado del plan:', error);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const eliminarPlan = async (id) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('planes_wifi')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setPlanes(prev => prev.filter(plan => plan.id !== id));
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error eliminando plan WiFi:', error);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    const obtenerPlan = async (id) => {
        try {
            const { data, error } = await supabase
                .from('planes_wifi')
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            console.error('Error obteniendo plan:', error);
            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const filtrarPorMes = (planes, mes, anio) => {
        if (!mes && !anio) return planes;

        return planes.filter(plan => {
            const fechaPlan = new Date(plan.fecha);
            const cumpleMes = mes ? fechaPlan.getMonth() + 1 === parseInt(mes) : true;
            const cumpleAnio = anio ? fechaPlan.getFullYear() === parseInt(anio) : true;
            return cumpleMes && cumpleAnio;
        });
    };

    const getEstadisticas = (planesFiltrados) => {
        const total = planesFiltrados.length;
        const pendientes = planesFiltrados.filter(p => p.estado_id === 1).length;
        const completados = planesFiltrados.filter(p => p.estado_id === 2).length;
        const cancelados = planesFiltrados.filter(p => p.estado_id === 3).length;
        const totalIngresos = planesFiltrados
            .filter(p => p.estado_id === 2)
            .reduce((sum, plan) => sum + (plan.costo || 0), 0);

        return {
            total,
            pendientes,
            completados,
            cancelados,
            totalIngresos
        };
    };

    return {
        planes,
        estados,
        loading,
        error,
        crearPlan,
        actualizarPlan,
        actualizarEstadoPlan,
        eliminarPlan,
        obtenerPlan,
        recargarPlanes: cargarPlanes,
        filtrarPorMes,
        getEstadisticas
    };
};