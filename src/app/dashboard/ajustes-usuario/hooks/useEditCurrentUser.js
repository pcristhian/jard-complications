// hooks/useEditCurrentUser.js
import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Ajusta la ruta según tu configuración
import { useMultiLocalStorageListener } from './listener/useLocalStorageListener';

export function useEditCurrentUser() {
    const { values, updateValue } = useMultiLocalStorageListener(['currentUser']);
    const { currentUser } = values;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const updateCurrentUser = async (userData) => {
        if (!currentUser?.id) {
            setError('No hay usuario autenticado');
            return false;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Actualizar en la base de datos
            const { data, error: updateError } = await supabase
                .from('usuarios')
                .update({
                    nombre: userData.nombre,
                    caja: userData.caja,
                    // Solo actualizar la contraseña si se proporciona una nueva
                    ...(userData.nuevaClave && { clave: userData.nuevaClave }),
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id)
                .select(`
                    id,
                    nombre,
                    caja,
                    roles:rol_id (
                        nombre
                    )
                `)
                .single();

            if (updateError) throw updateError;

            // Actualizar en localStorage
            const updatedUser = {
                ...currentUser,
                ...data,
                roles: data.roles
            };

            updateValue('currentUser', updatedUser);

            setSuccess(true);
            return true;

        } catch (err) {
            console.error('Error al actualizar usuario:', err);
            setError(err.message || 'Error al actualizar el usuario');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (newPassword) => {
        return updateCurrentUser({ nuevaClave: newPassword });
    };

    const updateProfile = async (profileData) => {
        return updateCurrentUser(profileData);
    };

    return {
        currentUser,
        updateCurrentUser,
        changePassword,
        updateProfile,
        loading,
        error,
        success,
        resetStates: () => {
            setError(null);
            setSuccess(false);
        }
    };
}