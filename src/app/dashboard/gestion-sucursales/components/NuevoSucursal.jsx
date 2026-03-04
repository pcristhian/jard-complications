'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    BuildingOfficeIcon,
    MapPinIcon,
    PhoneIcon,
    PowerIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';

export default function NuevoSucursal({ onCancelar, onSucursalCreada, createSucursal }) {
    const [formData, setFormData] = useState({
        nombre: '',
        direccion: '',
        telefono: '',
        activo: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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

        if (!formData.nombre.trim()) {
            setError('El nombre de la sucursal es obligatorio');
            setLoading(false);
            return;
        }

        try {
            const result = await createSucursal(formData);
            if (result.success) {
                setSuccess('Sucursal creada exitosamente');
                // Reset form
                setFormData({
                    nombre: '',
                    direccion: '',
                    telefono: '',
                    activo: true
                });
                setTimeout(() => {
                    onSucursalCreada();
                }, 1500);
            } else {
                throw new Error(result.error || 'Error creando sucursal');
            }
        } catch (err) {
            setError(err.message);
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

    const formVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key="nueva-sucursal"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6"
            >
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        variants={cardVariants}
                        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                    className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl"
                                >
                                    <PlusCircleIcon className="h-8 w-8 text-white" />
                                </motion.div>
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-2xl font-bold text-gray-900"
                                    >
                                        Nueva Sucursal
                                    </motion.h1>
                                    <p className="text-gray-600 mt-1">
                                        Complete los datos de la sucursal
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCancelar}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-gray-500" />
                            </motion.button>
                        </div>
                    </motion.div>

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
                        <motion.form
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                            onSubmit={handleSubmit}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Nombre */}
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Nombre *
                                    </label>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 placeholder:text-gray-500"
                                        placeholder="Ej: Sucursal Centro"
                                    />
                                </motion.div>

                                {/* Dirección */}
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Dirección
                                    </label>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 placeholder:text-gray-500"
                                        placeholder="Ej: Calle Principal #123"
                                    />
                                </motion.div>

                                {/* Teléfono */}
                                <motion.div variants={itemVariants} className="lg:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Teléfono
                                    </label>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        name="telefono"
                                        value={formData.telefono}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 transition-all duration-200 placeholder:text-gray-500"
                                        placeholder="Ej: +52 33 1234 5678"
                                    />
                                </motion.div>

                                {/* Estado */}
                                <motion.div
                                    variants={itemVariants}
                                    className="lg:col-span-2"
                                >
                                    <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
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
                                                className={`flex items-center cursor-pointer ${formData.activo ? 'text-purple-600' : 'text-gray-400'
                                                    }`}
                                            >
                                                <div className={`w-12 h-6 rounded-full p-1 mr-3 transition-all duration-200 ${formData.activo ? 'bg-purple-500' : 'bg-gray-300'
                                                    }`}>
                                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formData.activo ? 'translate-x-6' : 'translate-x-0'
                                                        }`} />
                                                </div>
                                                <div className="flex items-center">
                                                    <PowerIcon className="h-4 w-4 mr-2" />
                                                    <span className="text-sm font-medium">
                                                        Sucursal activa
                                                    </span>
                                                </div>
                                            </label>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Botones */}
                            <motion.div
                                variants={itemVariants}
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
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                                            />
                                            Creando...
                                        </div>
                                    ) : (
                                        'Crear Sucursal'
                                    )}
                                </motion.button>
                            </motion.div>
                        </motion.form>
                    </motion.div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}   