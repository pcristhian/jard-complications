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
            // 🔥 CAMBIO 1: Buscar TODOS los usuarios con ese nombre (sin .single())
            console.log('🔍 Buscando usuarios en la base de datos...')
            const { data: usersData, error: userError } = await supabase
                .from('usuarios')
                .select(`
                    *,
                    roles (*),
                    sucursales (*)
                `)
                .eq('nombre', nombre)
                .eq('activo', true)

            console.log('📊 Respuesta de Supabase:', { usersData, userError })

            if (userError) {
                console.log('❌ Error de Supabase:', userError)
                throw new Error('Error al buscar usuario')
            }

            // 🔥 CAMBIO 2: Verificar que haya al menos un usuario
            if (!usersData || usersData.length === 0) {
                console.log('❌ Usuario no encontrado')
                throw new Error('Usuario no encontrado o inactivo')
            }

            console.log(`✅ Encontrados ${usersData.length} usuarios con el nombre "${nombre}"`)

            // 🔥 CAMBIO 3: Probar la contraseña con cada usuario encontrado
            let usuarioValido = null

            for (const user of usersData) {
                console.log(`🔑 Verificando contraseña para usuario ID: ${user.id}`)
                const isPasswordValid = await bcrypt.compare(password, user.clave)

                if (isPasswordValid) {
                    usuarioValido = user
                    console.log(`✅ Contraseña válida para usuario: ${user.nombre} (ID: ${user.id})`)
                    break
                } else {
                    console.log(`❌ Contraseña incorrecta para usuario ID: ${user.id}`)
                }
            }

            if (!usuarioValido) {
                console.log('❌ Contraseña incorrecta para todos los usuarios con ese nombre')
                throw new Error('Contraseña incorrecta')
            }

            console.log('✅ Login exitoso, retornando datos del usuario')

            // Remover la contraseña del objeto usuario por seguridad
            const { clave, ...userWithoutPassword } = usuarioValido

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