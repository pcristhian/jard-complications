// src/app/dashboard/gestion-categorias/components/ModalNuevaCategoria.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    PlusCircleIcon,
    TagIcon,
    PowerIcon,
    CurrencyDollarIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';

const ModalNuevaCategoria = ({ isOpen, onClose, onGuardar, loading }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        activo: true
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    const resetForm = () => {
        setFormData({
            nombre: '',
            activo: true
        });
        setErrors({});
        setSuccess('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Limpiar error del campo
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre de la categoría es requerido';
        } else if (formData.nombre.trim().length < 2) {
            newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Preparar datos para enviar (sin reglas_comision)
        const categoriaData = {
            nombre: formData.nombre.trim(),
            activo: formData.activo
        };

        const result = await onGuardar(categoriaData);

        // Validar que result existe antes de usarlo
        if (result && result.success) {
            setSuccess('Categoría creada exitosamente');
            setTimeout(() => {
                resetForm();
                onClose();
            }, 1500);
        } else if (result && result.errors) {
            setErrors(result.errors);
        } else {
            // Manejar caso donde result es undefined o no tiene la estructura esperada
            console.error('Error: onGuardar no devolvió un resultado válido', result);
            setErrors({ general: 'Error al procesar la solicitud' });
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Animaciones
    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 20
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 20,
            transition: {
                duration: 0.2
            }
        }
    };

    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.3
            }
        },
        exit: {
            opacity: 0,
            transition: {
                duration: 0.2
            }
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

    const inputFocusVariants = {
        focus: {
            scale: 1.02,
            transition: { duration: 0.2 }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={handleClose}
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-emerald-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg"
                                    >
                                        <PlusCircleIcon className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Nueva Categoría
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Crea una nueva categoría para organizar productos
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={handleClose}
                                    className="p-2 hover:bg-white cursor-pointer rounded-full transition-colors"
                                >
                                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                                </motion.button>
                            </div>
                        </div>

                        {/* Alertas */}
                        <AnimatePresence>
                            {Object.keys(errors).length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mx-6 mt-6"
                                >
                                    <div className="p-3 bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 rounded-xl">
                                        <div className="flex items-center">
                                            <ExclamationCircleIcon className="h-4 w-4 text-red-500 mr-2" />
                                            <div>
                                                <p className="text-red-700 text-sm font-medium mb-1">
                                                    Errores en el formulario:
                                                </p>
                                                <ul className="text-red-600 text-sm list-disc list-inside">
                                                    {Object.values(errors).map((error, index) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mx-6 mt-6"
                                >
                                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl">
                                        <div className="flex items-center">
                                            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                                            <p className="text-green-700 text-sm font-medium">{success}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Formulario */}
                        <motion.form
                            variants={formVariants}
                            initial="hidden"
                            animate="visible"
                            onSubmit={handleSubmit}
                            className="p-6 space-y-6"
                        >
                            {/* Nombre */}
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    Nombre de la Categoría *
                                </label>
                                <motion.input
                                    whileFocus="focus"
                                    variants={inputFocusVariants}
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ${errors.nombre
                                        ? 'border-red-300 bg-red-50 text-red-900'
                                        : 'border-gray-300 bg-gray-50 text-gray-900'
                                        }`}
                                    placeholder="Ej: Accesorios, Natural, Celulares..."
                                />
                                {errors.nombre && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                        {errors.nombre}
                                    </p>
                                )}
                            </motion.div>

                            {/* Estado */}
                            <motion.div
                                variants={itemVariants}
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
                                        className={`flex items-center cursor-pointer ${formData.activo ? 'text-green-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <div className={`w-12 h-6 rounded-full p-1 mr-3 transition-all duration-200 ${formData.activo ? 'bg-green-500' : 'bg-gray-300'
                                            }`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formData.activo ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </div>
                                        <div className="flex items-center">
                                            <PowerIcon className="h-4 w-4 mr-2" />
                                            <span className="text-sm font-medium">
                                                Categoría activa
                                            </span>
                                        </div>
                                    </label>
                                </motion.div>
                            </motion.div>

                            {/* Información sobre Comisiones */}
                            <motion.div
                                variants={itemVariants}
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
                            >
                                <div className="flex items-start space-x-3">
                                    <CurrencyDollarIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-blue-800 mb-2">
                                            Configuración de Comisiones
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-xs text-blue-700">
                                                <InformationCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <p>
                                                    Las reglas de comisión se podrán configurar después de crear la categoría.
                                                </p>
                                            </div>
                                            <div className="flex items-center text-xs text-blue-600">
                                                <InformationCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                                                <p>
                                                    Usa el botón "Reglas" en la tabla de categorías para configurar.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Botones */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-end space-x-3 pt-6 border-t border-gray-200"
                            >
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05, x: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleClose}
                                    className="px-5 py-2.5 text-gray-700 bg-white cursor-pointer border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={!loading ? { scale: 1.05 } : {}}
                                    whileTap={!loading ? { scale: 0.95 } : {}}
                                    className="px-5 py-2.5 bg-gradient-to-r cursor-pointer from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
                                >
                                    {loading ? (
                                        <>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                            />
                                            <span>Creando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircleIcon className="h-4 w-4" />
                                            <span>Crear Categoría</span>
                                        </>
                                    )}
                                </motion.button>
                            </motion.div>
                        </motion.form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModalNuevaCategoria;