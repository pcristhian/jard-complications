// src/app/dashboard/gestion-usuarios/components/EditarUsuario.jsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    UserCircleIcon,
    KeyIcon,
    ShieldCheckIcon,
    BuildingOfficeIcon,
    CubeIcon,
    PowerIcon
} from '@heroicons/react/24/outline';

export default function EditarUsuario({
    usuario,
    onCancelar,
    onUsuarioActualizado,
    actualizarUsuario
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [roles, setRoles] = useState([]);
    const [sucursales, setSucursales] = useState([]);

    const [formData, setFormData] = useState({
        nombre: '',
        clave: '',
        confirmarClave: '',
        rol_id: '',
        sucursal_id: '',
        caja: '',
        activo: true
    });

    // Cargar datos iniciales y opciones
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                // Cargar roles
                const { data: rolesData, error: rolesError } = await supabase
                    .from('roles')
                    .select('id, nombre')
                    .order('nombre');

                if (rolesError) throw rolesError;
                setRoles(rolesData || []);

                // Cargar sucursales
                const { data: sucursalesData, error: sucursalesError } = await supabase
                    .from('sucursales')
                    .select('id, nombre')
                    .order('nombre');

                if (sucursalesError) throw sucursalesError;
                setSucursales(sucursalesData || []);

                // Establecer datos del usuario
                if (usuario) {
                    setFormData({
                        nombre: usuario.nombre || '',
                        clave: '',
                        confirmarClave: '',
                        rol_id: usuario.rol_id?.toString() || '',
                        sucursal_id: usuario.sucursal_id?.toString() || '',
                        caja: usuario.caja || '',
                        activo: usuario.activo !== undefined ? usuario.activo : true,
                    });
                }

            } catch (err) {
                console.error('Error cargando datos:', err);
                setError('Error al cargar datos necesarios');
            }
        };

        cargarDatos();
    }, [usuario]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validaciones
        if (formData.clave && formData.clave !== formData.confirmarClave) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (formData.clave && formData.clave.length < 4) {
            setError('La contraseña debe tener al menos 4 caracteres');
            setLoading(false);
            return;
        }

        if (!formData.rol_id) {
            setError('Debe seleccionar un rol');
            setLoading(false);
            return;
        }

        try {
            // Preparar datos para actualizar
            const updates = {
                nombre: formData.nombre.trim(),
                rol_id: parseInt(formData.rol_id),
                activo: formData.activo,
                updated_at: new Date().toISOString()
            };

            // Solo agregar sucursal_id si se seleccionó y no es admin
            if (formData.sucursal_id && formData.rol_id !== '1') {
                updates.sucursal_id = parseInt(formData.sucursal_id);
            } else {
                updates.sucursal_id = null;
            }

            // Solo agregar caja si el rol es cajero (rol_id = 3)
            if (formData.rol_id === '3' && formData.caja) {
                updates.caja = formData.caja.trim();
            } else {
                updates.caja = null;
            }

            // Solo actualizar contraseña si se proporcionó una nueva
            if (formData.clave) {
                updates.clave = formData.clave;
            }

            // Llamar al hook para actualizar
            const result = await actualizarUsuario(usuario.id, updates);

            if (result.success) {
                setSuccess('Usuario actualizado correctamente');
                setTimeout(() => {
                    onUsuarioActualizado();
                }, 1500);
            } else {
                throw new Error(result.error || 'Error al actualizar usuario');
            }

        } catch (err) {
            console.error('Error actualizando usuario:', err);
            setError(err.message || 'Error al actualizar usuario');
        } finally {
            setLoading(false);
        }
    };

    // Animaciones
    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            y: -20,
            transition: {
                duration: 0.2
            }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    const inputFocusVariants = {
        focus: {
            scale: 1.02,
            transition: { duration: 0.2 }
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="editar-usuario"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-2"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header */}

                    {/* Alertas */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-6"
                            >
                                <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl shadow-sm">
                                    <div className="flex items-center">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-6"
                            >
                                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl shadow-sm">
                                    <div className="flex items-center">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                                        <p className="text-green-700 text-sm font-medium">{success}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formulario */}
                    <motion.div
                        variants={cardVariants}
                        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                    >
                        <form onSubmit={handleSubmit} className="space-y-2">
                            {/* Primera fila: Usuario a la izquierda, Rol a la derecha */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Columna izquierda - Credenciales */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                            <UserCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            Nombre de Usuario *
                                        </label>
                                        <motion.input
                                            whileFocus="focus"
                                            variants={inputFocusVariants}
                                            type="text"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            readOnly
                                            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed opacity-75 transition-all duration-200 appearance-none"
                                            placeholder="Ingrese el nombre de usuario"
                                        />
                                    </div>

                                    {/* Contraseñas (opcional en edición) */}
                                    <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-center mb-3">
                                            <KeyIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="text-sm font-semibold text-gray-700">
                                                Cambiar Contraseña (Opcional)
                                            </span>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-2">
                                                Nueva Contraseña
                                            </label>
                                            <motion.input
                                                whileFocus="focus"
                                                variants={inputFocusVariants}
                                                type="password"
                                                name="clave"
                                                value={formData.clave}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 placeholder:text-gray-500"
                                                placeholder="Dejar en blanco para no cambiar"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 mb-2">
                                                Confirmar Contraseña
                                            </label>
                                            <motion.input
                                                whileFocus="focus"
                                                variants={inputFocusVariants}
                                                type="password"
                                                name="confirmarClave"
                                                value={formData.confirmarClave}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 placeholder:text-gray-500"
                                                placeholder="Repita la contraseña"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Columna derecha - Permisos */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                            <ShieldCheckIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            Rol *
                                        </label>
                                        <motion.div whileFocus="focus" variants={inputFocusVariants}>
                                            <select
                                                name="rol_id"
                                                value={formData.rol_id}
                                                onChange={handleChange}
                                                required
                                                disabled
                                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed opacity-75 transition-all duration-200 appearance-none"
                                            >
                                                <option value="" className="text-gray-500">Seleccione un rol</option>
                                                {roles.map((rol) => (
                                                    <option key={rol.id} value={rol.id} className="text-gray-900">
                                                        {rol.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        </motion.div>
                                    </div>

                                    {/* Sucursal (no mostrar para admin) */}
                                    {formData.rol_id && formData.rol_id !== '1' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                Sucursal
                                            </label>
                                            <motion.div whileFocus="focus" variants={inputFocusVariants}>
                                                <select
                                                    name="sucursal_id"
                                                    value={formData.sucursal_id}
                                                    onChange={handleChange}
                                                    required
                                                    disabled
                                                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed opacity-75 transition-all duration-200 appearance-none"
                                                >
                                                    <option value="" className="text-gray-500">Seleccione una sucursal</option>
                                                    {sucursales.map((sucursal) => (
                                                        <option key={sucursal.id} value={sucursal.id} className="text-gray-900">
                                                            {sucursal.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {/* Caja (solo para cajeros) */}
                                    {formData.rol_id === '3' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                                <CubeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                                Caja
                                            </label>
                                            <motion.input
                                                whileFocus="focus"
                                                variants={inputFocusVariants}
                                                type="text"
                                                name="caja"
                                                value={formData.caja}
                                                onChange={handleChange}
                                                readOnly
                                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed opacity-75 transition-all duration-200 appearance-none"
                                                placeholder="Número o nombre de caja"
                                            />
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Estado
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.95 }}
                                    className="relative"
                                >
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        name="activo"
                                        checked={formData.activo}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="activo"
                                        className={`flex items-center cursor-pointer ${formData.activo ? 'text-blue-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <div className={`w-12 h-6 rounded-full p-1 mr-3 transition-all duration-200 ${formData.activo ? 'bg-blue-500' : 'bg-gray-300'
                                            }`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formData.activo ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </div>
                                        <div className="flex items-center">
                                            <PowerIcon className="h-4 w-4 mr-2" />
                                            <span className="text-sm font-medium">
                                                Usuario activo
                                            </span>
                                        </div>
                                    </label>
                                </motion.div>
                            </motion.div> */}

                            {/* Botones */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="flex justify-end space-x-4 pt-8 border-t border-gray-200"
                            >
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05, x: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onCancelar}
                                    className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={!loading ? { scale: 1.05 } : {}}
                                    whileTap={!loading ? { scale: 0.95 } : {}}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                            />
                                            Actualizando...
                                        </div>
                                    ) : (
                                        'Actualizar Usuario'
                                    )}
                                </motion.button>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}