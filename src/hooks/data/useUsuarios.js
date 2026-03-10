// hooks/useUsuarios.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

const USUARIOS_SELECT = `
  *,
  roles:rol_id(nombre, descripcion),
  sucursales:sucursal_id(nombre)
`;

export const useUsuarios = (sucursalId = null) => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsuarios = useCallback(async (filtros = {}) => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('usuarios')
                .select(USUARIOS_SELECT);

            // Aplicar filtro por sucursal si está especificada
            if (sucursalId && !filtros.todasSucursales) {
                query = query.eq('sucursal_id', sucursalId);
            }

            // Aplicar otros filtros
            if (filtros.activo !== undefined) {
                query = query.eq('activo', filtros.activo);
            }

            if (filtros.rol_id) {
                query = query.eq('rol_id', filtros.rol_id);
            }

            if (filtros.search) {
                query = query.or(`nombre.ilike.%${filtros.search}%,email.ilike.%${filtros.search}%`);
            }
            query = query.order('rol_id', { ascending: true });
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            setUsuarios(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [sucursalId]);

    const ejecutarOperacion = async (operacion) => {
        try {
            const { data, error } = await operacion;
            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const crearUsuario = async (usuarioData) => {
        try {
            const saltRounds = 12;
            const claveHash = await bcrypt.hash(usuarioData.clave, saltRounds);

            const datosCompletos = {
                ...usuarioData,
                clave: claveHash,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const result = await ejecutarOperacion(
                supabase
                    .from('usuarios')
                    .insert([datosCompletos])
                    .select(USUARIOS_SELECT)
                    .single()
            );

            if (result.success) {
                setUsuarios(prev => [result.data, ...prev]);
            }
            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const actualizarUsuario = async (id, updates) => {
        try {
            const datosActualizados = {
                ...updates,
                updated_at: new Date().toISOString(),
            };

            // Solo hashear si se está actualizando la contraseña
            if (updates.clave && updates.clave !== '') {
                const saltRounds = 12;
                datosActualizados.clave = await bcrypt.hash(updates.clave, saltRounds);
            } else {
                // Remover la clave si está vacía para no actualizarla
                delete datosActualizados.clave;
            }

            const result = await ejecutarOperacion(
                supabase
                    .from('usuarios')
                    .update(datosActualizados)
                    .eq('id', id)
                    .select(USUARIOS_SELECT)
                    .single()
            );

            if (result.success) {
                setUsuarios(prev => prev.map(user =>
                    user.id === id ? result.data : user
                ));
            }
            return result;
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        }
    };

    const eliminarUsuario = async (id) => {
        const result = await ejecutarOperacion(
            supabase
                .from('usuarios')
                .update({
                    activo: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(USUARIOS_SELECT)
                .single()
        );

        if (result.success) {
            setUsuarios(prev => prev.map(user =>
                user.id === id ? result.data : user
            ));
        }

        return result;
    };

    const toggleEstadoUsuario = async (id, activo) => {
        return await actualizarUsuario(id, { activo });
    };

    const verificarClave = async (clavePlana, claveHash) => {
        return await bcrypt.compare(clavePlana, claveHash);
    };

    const obtenerUsuarioPorId = async (id) => {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select(USUARIOS_SELECT)
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const buscarUsuarios = async (termino) => {
        return await fetchUsuarios({ search: termino });
    };

    // Recargar usuarios cuando cambia la sucursalId
    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    return {
        // Estados
        usuarios,
        loading,
        error,

        // Funciones CRUD
        fetchUsuarios,
        crearUsuario,
        actualizarUsuario,
        eliminarUsuario,
        obtenerUsuarioPorId,
        verificarClave,
        buscarUsuarios,

        // Funciones de estado
        inactivarUsuario: (id) => toggleEstadoUsuario(id, false),
        reactivarUsuario: (id) => toggleEstadoUsuario(id, true),

        // Funciones de filtrado
        filtrarPorSucursal: (sucursalId) => fetchUsuarios({ sucursalId }),
        filtrarPorEstado: (activo) => fetchUsuarios({ activo }),
        filtrarPorRol: (rol_id) => fetchUsuarios({ rol_id }),
        mostrarTodos: () => fetchUsuarios({ todasSucursales: true })
    };
};