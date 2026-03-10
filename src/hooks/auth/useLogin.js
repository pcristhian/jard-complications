import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import bcrypt from 'bcryptjs'

export const useLogin = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const login = async (nombre, password) => {
        console.log('🔐 Iniciando login con:', { nombre })
        setLoading(true)
        setError(null)

        try {
            // Buscar usuario por nombre
            console.log('🔍 Buscando usuario en la base de datos...')
            const { data: userData, error: userError } = await supabase
                .from('usuarios')
                .select(`
          *,
          roles (*),
          sucursales (*)
        `)
                .eq('nombre', nombre)
                .eq('activo', true)
                .single()

            console.log('📊 Respuesta de Supabase:', { userData, userError })

            if (userError) {
                console.log('❌ Error de Supabase:', userError)
                throw new Error('Error al buscar usuario')
            }

            if (!userData) {
                console.log('❌ Usuario no encontrado')
                throw new Error('Usuario no encontrado o inactivo')
            }

            console.log('✅ Usuario encontrado:', userData.nombre)

            // Verificar contraseña con bcrypt
            console.log('🔑 Verificando contraseña con bcrypt...')
            const isPasswordValid = await bcrypt.compare(password, userData.clave)

            console.log('🔑 Resultado de comparación:', isPasswordValid)

            if (!isPasswordValid) {
                console.log('❌ Contraseña incorrecta')
                throw new Error('Contraseña incorrecta')
            }

            console.log('✅ Login exitoso, retornando datos del usuario')

            // Remover la contraseña del objeto usuario por seguridad
            const { clave, ...userWithoutPassword } = userData

            return userWithoutPassword

        } catch (err) {
            const errorMessage = err.message || 'Error al iniciar sesión'
            console.log('💥 Error en login:', err)
            setError(errorMessage)
            return null
        } finally {
            setLoading(false)
        }
    }

    const clearError = () => setError(null)

    return {
        login,
        loading,
        error,
        clearError
    }
}