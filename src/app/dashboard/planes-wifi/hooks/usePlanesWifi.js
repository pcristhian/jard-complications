// hooks/usePlanesWifi.js
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export const usePlanesWifi = () => {
    const [planes, setPlanes] = useState([]);
    const [estados, setEstados] = useState([]);
    const [usuarios, setUsuarios] = useState([]); // ← Nuevo: lista de usuarios
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarPlanes();
        cargarEstados();
        cargarUsuarios(); // ← Nuevo: cargar usuarios al inicio
    }, []);

    const cargarPlanes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('planes_wifi')
                .select(`
                *,
                estado:estados_plan_wifi(*),
                usuario:usuarios (
                    id,
                    nombre,
                    caja,
                    rol_id,
                    roles (
                        id,
                        nombre
                    )
                )
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

    // ← NUEVA FUNCIÓN: Cargar usuarios con sus roles
    const cargarUsuarios = async () => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select(`
        id, 
        nombre,
        caja,
               roles:rol_id (
            nombre
        )
    `)
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;

            // Transformar los datos para tener una estructura más amigable
            const usuariosConRol = (data || []).map(usuario => ({
                id: usuario.id,
                nombre: usuario.nombre,
                rol_id: usuario.rol_id,
                caja: usuario.caja,
                rol_nombre: usuario.roles?.nombre || 'Sin rol'
            }));

            setUsuarios(usuariosConRol);
            console.log('Usuarios cargados:', usuariosConRol.length || 0);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            setUsuarios([]);
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

    // hooks/usePlanesWifi.js
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
            // Usar la fecha proporcionada o la fecha actual si no viene
            let fechaPlan;
            if (planData.fecha) {
                // Si la fecha viene en formato YYYY-MM-DD, convertir a ISO string manteniendo la fecha
                fechaPlan = new Date(planData.fecha);
                // Ajustar para mantener la fecha local (evitar problemas de zona horaria)
                fechaPlan = new Date(fechaPlan.getTime() - fechaPlan.getTimezoneOffset() * 60000);
            } else {
                fechaPlan = new Date();
            }

            const datosParaEnviar = {
                nombre_plan: planData.nombre_plan.trim(),
                codigo_cliente: planData.codigo_cliente.trim(),
                nombre_cliente: planData.nombre_cliente.trim(),
                celular_cliente: planData.celular_cliente.trim(),
                costo: parseFloat(planData.costo),
                estado_id: 1, // Siempre pendiente al crear
                fecha: fechaPlan.toISOString(), // Usar la fecha seleccionada
                usuario_id: planData.usuario_id || null,
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
                usuario:usuarios(id, nombre, rol_id)
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
                observacion: planData.observacion?.trim() || null,
                updated_at: new Date().toISOString()
            };

            // Solo incluir usuario_id si viene en planData
            if (planData.usuario_id !== undefined) {
                datosParaEnviar.usuario_id = planData.usuario_id === '' ? null : parseInt(planData.usuario_id);
            }

            const { data, error } = await supabase
                .from('planes_wifi')
                .update(datosParaEnviar)
                .eq('id', id)
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre, caja,  rol_id)
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

    const actualizarEstadoPlan = async (id, estadoId) => {
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

            const { data, error } = await supabase
                .from('planes_wifi')
                .update(datosParaEnviar)
                .eq('id', id)
                .select(`
                    *,
                    estado:estados_plan_wifi(*),
                    usuario:usuarios(id, nombre, rol_id)
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
                    usuario:usuarios(id, nombre, rol_id)
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
        usuarios, // ← Exportar usuarios
        loading,
        error,
        crearPlan,
        actualizarPlan,
        actualizarEstadoPlan,
        eliminarPlan,
        obtenerPlan,
        recargarPlanes: cargarPlanes,
        filtrarPorMes,
        getEstadisticas,
        recargarUsuarios: cargarUsuarios // ← Opcional: función para recargar usuarios
    };
};