// src/app/dashboard/gestion-categorias/components/ModalReglasComision.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    XMarkIcon,
    CurrencyDollarIcon,
    TagIcon,
    ChartBarIcon,
    CalculatorIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    InformationCircleIcon,
    ArrowsRightLeftIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    TrashIcon
} from '@heroicons/react/24/outline';

const ModalReglasComision = ({
    isOpen,
    onClose,
    categoria,
    onGuardar,
    loading
}) => {
    const [formData, setFormData] = useState({
        tipo: '',
        comision_base: '',
        comision_limite: '',
        comision_variable: false,
        comision_post_limite: ''
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (categoria?.reglas_comision) {
            const reglas = categoria.reglas_comision;
            setFormData({
                tipo: reglas.tipo || '',
                comision_base: reglas.comision_base || '',
                comision_limite: reglas.comision_limite || '',
                comision_variable: reglas.comision_variable || false,
                comision_post_limite: reglas.comision_post_limite || ''
            });
        } else {
            setFormData({
                tipo: '',
                comision_base: '',
                comision_limite: '',
                comision_variable: false,
                comision_post_limite: ''
            });
        }
        setErrors({});
        setSuccess('');
    }, [categoria, isOpen]);

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

        if (!formData.tipo.trim()) {
            newErrors.tipo = 'El tipo de comisión es requerido';
        }

        if (!formData.comision_variable) {
            if (formData.comision_base === '') {
                newErrors.comision_base = 'La comisión base es requerida';
            } else if (parseFloat(formData.comision_base) < 0) {
                newErrors.comision_base = 'La comisión base debe ser mayor o igual a 0';
            }

            // Validar comisión escalonada
            if (formData.comision_limite && !formData.comision_post_limite) {
                newErrors.comision_post_limite = 'La comisión post límite es requerida cuando hay límite';
            }

            if (formData.comision_post_limite && parseFloat(formData.comision_post_limite) < 0) {
                newErrors.comision_post_limite = 'La comisión post límite debe ser mayor o igual a 0';
            }

            if (formData.comision_limite && parseInt(formData.comision_limite) <= 0) {
                newErrors.comision_limite = 'El límite debe ser mayor a 0';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const reglasComision = {
                tipo: formData.tipo.trim(),
                comision_variable: formData.comision_variable
            };

            if (!formData.comision_variable) {
                reglasComision.comision_base = parseFloat(formData.comision_base);

                if (formData.comision_limite) {
                    reglasComision.comision_limite = parseInt(formData.comision_limite);
                    reglasComision.comision_post_limite = parseFloat(formData.comision_post_limite);
                } else {
                    // Si no hay límite, limpiar campos de comisión escalonada
                    reglasComision.comision_limite = null;
                    reglasComision.comision_post_limite = null;
                }
            } else {
                // Para comisión variable, limpiar todos los campos numéricos
                reglasComision.comision_base = null;
                reglasComision.comision_limite = null;
                reglasComision.comision_post_limite = null;
            }

            const result = await onGuardar(reglasComision);

            // SOLUCIÓN: Verificar de forma segura si result existe y tiene success
            if (result && result.success === true) {
                setSuccess('Reglas de comisión guardadas exitosamente');
                toast.success('Reglas de comisión guardadas exitosamente');
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
            // Si result es undefined, null, o no tiene success, asume éxito
            else if (result === undefined || result === null || result.success === undefined) {
                setSuccess('Reglas de comisión guardadas exitosamente');
                toast.success('Reglas de comisión guardadas exitosamente');
                setTimeout(() => {
                    onClose();
                }, 1500);
            }
            // Si result tiene un error explícito
            else if (result.error) {
                setErrors(result.error);
            }

        } catch (error) {
            console.error('Error en handleSubmit:', error);
            setErrors(error.message || 'Error al guardar las reglas de comisión');
        }
    };

    const limpiarReglas = () => {
        setFormData({
            tipo: '',
            comision_base: '',
            comision_limite: '',
            comision_variable: false,
            comision_post_limite: ''
        });
        setErrors({});
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

    const calcularEjemploComision = () => {
        if (!formData.comision_base || !formData.comision_limite || !formData.comision_post_limite) {
            return null;
        }

        const base = parseFloat(formData.comision_base);
        const limite = parseInt(formData.comision_limite);
        const post = parseFloat(formData.comision_post_limite);

        const ejemplo1 = base * limite;
        const ejemplo2 = base * limite + post * 2;

        return {
            hastaLimite: ejemplo1.toFixed(2),
            masDosUnidades: ejemplo2.toFixed(2),
            diferenciaPorUnidad: (post - base).toFixed(2)
        };
    };

    const ejemplo = calcularEjemploComision();

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
                    onClick={onClose}
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-y-auto max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg"
                                    >
                                        <ChartBarIcon className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Reglas de Comisión
                                        </h2>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <div className="flex items-center space-x-1">
                                                <TagIcon className="h-3 w-3 text-purple-500" />
                                                <span className="text-sm text-gray-600">
                                                    Categoría: <span className="font-semibold">{categoria?.nombre}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
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
                            {/* Tipo de Comisión */}
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    Tipo de Comisión *
                                </label>
                                <motion.input
                                    whileFocus="focus"
                                    variants={inputFocusVariants}
                                    type="text"
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${errors.tipo
                                        ? 'border-red-300 bg-red-50 text-red-900'
                                        : 'border-gray-300 bg-gray-50 text-gray-900'
                                        }`}
                                    placeholder="Ej: Comisión Celulares, Comisión Electrónicos, Comisión Ropa..."
                                />
                                {errors.tipo && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                        {errors.tipo}
                                    </p>
                                )}
                            </motion.div>

                            {/* Comisión Variable */}
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
                                        id="comision_variable"
                                        name="comision_variable"
                                        checked={formData.comision_variable}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <label
                                        htmlFor="comision_variable"
                                        className={`flex items-center cursor-pointer ${formData.comision_variable ? 'text-purple-600' : 'text-gray-400'
                                            }`}
                                    >
                                        <div className={`w-12 h-6 rounded-full p-1 mr-3 transition-all duration-200 ${formData.comision_variable ? 'bg-purple-500' : 'bg-gray-300'
                                            }`}>
                                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${formData.comision_variable ? 'translate-x-6' : 'translate-x-0'
                                                }`} />
                                        </div>
                                        <div className="flex items-center">
                                            <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                                            <span className="text-sm font-medium">
                                                Comisión Variable por Producto
                                            </span>
                                        </div>
                                    </label>
                                </motion.div>
                            </motion.div>

                            {!formData.comision_variable ? (
                                <>
                                    {/* Comisión Base */}
                                    <motion.div variants={itemVariants} className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                            <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                            Comisión Base (Bs.) *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3 text-gray-500">Bs</span>
                                            <motion.input
                                                whileFocus="focus"
                                                variants={inputFocusVariants}
                                                type="text"
                                                inputMode="decimal"
                                                name="comision_base"
                                                value={formData.comision_base}
                                                onChange={(e) => {
                                                    // Permitir números, punto decimal y comas
                                                    let value = e.target.value;

                                                    // Reemplazar comas por puntos para aceptar ambos formatos
                                                    value = value.replace(/,/g, '.');

                                                    // Permitir solo números y un punto decimal
                                                    // Regex: permite números, un punto decimal (opcional), y hasta 2 decimales
                                                    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                        // Eliminar ceros a la izquierda no deseados (excepto "0." o "0.xx")
                                                        if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                                                            value = value.replace(/^0+/, '');
                                                        }

                                                        handleChange({
                                                            target: {
                                                                name: e.target.name,
                                                                value: value
                                                            }
                                                        });
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    // Formatear al perder el foco
                                                    const value = e.target.value;

                                                    if (value === '' || value === '.') {
                                                        handleChange({
                                                            target: {
                                                                name: e.target.name,
                                                                value: '0.00'
                                                            }
                                                        });
                                                    } else if (value.includes('.')) {
                                                        // Asegurar 2 decimales
                                                        const parts = value.split('.');
                                                        const integer = parts[0] || '0';
                                                        let decimals = parts[1] || '';

                                                        if (decimals.length === 1) decimals += '0';
                                                        if (decimals.length > 2) decimals = decimals.substring(0, 2);

                                                        handleChange({
                                                            target: {
                                                                name: e.target.name,
                                                                value: `${integer}.${decimals.padEnd(2, '0')}`
                                                            }
                                                        });
                                                    } else {
                                                        // Si no tiene decimales, agregar .00
                                                        handleChange({
                                                            target: {
                                                                name: e.target.name,
                                                                value: `${value}.00`
                                                            }
                                                        });
                                                    }
                                                }}
                                                placeholder="0.00"
                                                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${errors.comision_base
                                                    ? 'border-red-300 bg-red-50 text-red-900'
                                                    : 'border-gray-300 bg-gray-50 text-gray-900'
                                                    }`}
                                            />
                                        </div>
                                        {errors.comision_base && (
                                            <p className="text-red-500 text-sm mt-1 flex items-center">
                                                <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                                {errors.comision_base}
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* Comisión Escalonada */}
                                    <motion.div variants={itemVariants} className="border-t border-gray-200 pt-6">
                                        <div className="flex items-center space-x-2 mb-4">
                                            <ArrowTrendingUpIcon className="h-5 w-5 text-purple-500" />
                                            <h3 className="text-sm font-semibold text-gray-700">
                                                Comisión Escalonada (Opcional)
                                            </h3>
                                        </div>

                                        {/* Límite para comisión escalonada */}
                                        <div className="space-y-2 mb-4">
                                            <label className="block text-sm font-medium text-gray-600">
                                                Límite de unidades para cambio
                                            </label>
                                            <motion.input
                                                whileFocus="focus"
                                                variants={inputFocusVariants}
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                name="comision_limite"
                                                value={formData.comision_limite}
                                                onChange={(e) => {
                                                    let numericValue = e.target.value.replace(/[^0-9]/g, '');

                                                    // Eliminar ceros a la izquierda (excepto si es "0")
                                                    if (numericValue.length > 1 && numericValue.startsWith('0')) {
                                                        numericValue = numericValue.replace(/^0+/, '');
                                                    }

                                                    handleChange({
                                                        target: {
                                                            name: e.target.name,
                                                            value: numericValue
                                                        }
                                                    });
                                                }}
                                                onBlur={(e) => {
                                                    // Validar que sea mínimo 1
                                                    const value = parseInt(e.target.value) || 0;
                                                    if (value < 1 && e.target.value !== '') {
                                                        handleChange({
                                                            target: {
                                                                name: e.target.name,
                                                                value: '1'
                                                            }
                                                        });
                                                    }
                                                }}
                                                placeholder="Ej: 5"
                                                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${errors.comision_limite
                                                    ? 'border-red-300 bg-red-50 text-red-900'
                                                    : 'border-gray-300 bg-gray-50 text-gray-900'
                                                    }`}
                                            />
                                            {errors.comision_limite && (
                                                <p className="text-red-500 text-sm mt-1 flex items-center">
                                                    <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                                    {errors.comision_limite}
                                                </p>
                                            )}
                                        </div>

                                        {/* Comisión Post Límite */}
                                        {formData.comision_limite && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="space-y-2"
                                            >
                                                <label className="block text-sm font-medium text-gray-600">
                                                    Comisión después del límite (Bs.) *
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-3 text-gray-500">Bs</span>
                                                    <motion.input
                                                        whileFocus="focus"
                                                        variants={inputFocusVariants}
                                                        type="text"
                                                        inputMode="decimal"
                                                        name="comision_post_limite"
                                                        value={formData.comision_post_limite}
                                                        onChange={(e) => {
                                                            let value = e.target.value;

                                                            // Reemplazar comas por puntos para aceptar ambos formatos
                                                            value = value.replace(/,/g, '.');

                                                            // Permitir solo números y máximo un punto decimal con hasta 2 decimales
                                                            // También permite cadena vacía para borrar
                                                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                                                // Evitar múltiples puntos decimales
                                                                if ((value.match(/\./g) || []).length > 1) {
                                                                    return;
                                                                }

                                                                handleChange({
                                                                    target: {
                                                                        name: e.target.name,
                                                                        value: value
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        onBlur={(e) => {
                                                            // Formatear al perder el foco
                                                            let value = e.target.value;

                                                            if (value === '' || value === '.') {
                                                                handleChange({
                                                                    target: {
                                                                        name: e.target.name,
                                                                        value: '0.00'
                                                                    }
                                                                });
                                                            } else if (value.includes('.')) {
                                                                // Asegurar 2 decimales
                                                                const parts = value.split('.');
                                                                const integer = parts[0] || '0';
                                                                let decimals = parts[1] || '';

                                                                if (decimals.length === 1) decimals += '0';
                                                                if (decimals.length > 2) decimals = decimals.substring(0, 2);

                                                                handleChange({
                                                                    target: {
                                                                        name: e.target.name,
                                                                        value: `${integer}.${decimals.padEnd(2, '0')}`
                                                                    }
                                                                });
                                                            } else {
                                                                // Si no tiene decimales, agregar .00
                                                                handleChange({
                                                                    target: {
                                                                        name: e.target.name,
                                                                        value: `${value}.00`
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        placeholder="0.00"
                                                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${errors.comision_post_limite
                                                            ? 'border-red-300 bg-red-50 text-red-900'
                                                            : 'border-gray-300 bg-gray-50 text-gray-900'
                                                            }`}
                                                    />
                                                </div>
                                                {errors.comision_post_limite && (
                                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                                        {errors.comision_post_limite}
                                                    </p>
                                                )}

                                                {/* Ejemplo de cálculo */}
                                                {ejemplo && (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl"
                                                    >
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <CalculatorIcon className="h-4 w-4 text-blue-600" />
                                                            <span className="text-sm font-medium text-blue-800">
                                                                Ejemplo de cálculo:
                                                            </span>
                                                        </div>
                                                        <div className="space-y-1 text-xs text-blue-700">
                                                            <p>• Hasta {formData.comision_limite} unidades: Bs {formData.comision_base} cada una</p>
                                                            <p>• Comisión total por {formData.comision_limite} unidades: Bs {ejemplo.hastaLimite}</p>
                                                            <p>• Desde la unidad {parseInt(formData.comision_limite) + 1}: Bs {formData.comision_post_limite} cada una</p>
                                                            <p>• Comisión por {parseInt(formData.comision_limite) + 2} unidades: Bs {ejemplo.masDosUnidades}</p>
                                                            <div className={`flex items-center mt-1 ${parseFloat(ejemplo.diferenciaPorUnidad) >= 0
                                                                ? 'text-green-600'
                                                                : 'text-red-600'
                                                                }`}>
                                                                {parseFloat(ejemplo.diferenciaPorUnidad) >= 0 ? (
                                                                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                                                ) : (
                                                                    <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                                                )}
                                                                <span className="font-medium">
                                                                    Diferencia por unidad: Bs {ejemplo.diferenciaPorUnidad}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div
                                    variants={itemVariants}
                                    className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4"
                                >
                                    <div className="flex items-start space-x-3">
                                        <InformationCircleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-amber-800 mb-1">
                                                Comisión Variable Configurada
                                            </h4>
                                            <p className="text-sm text-amber-700">
                                                Los productos de esta categoría tendrán comisiones individuales definidas en cada producto.
                                                La comisión se especificará al crear o editar cada producto específico.
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Botones */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-center pt-6 border-t border-gray-200"
                            >
                                <div className="flex space-x-3">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.05, x: -5 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        className="px-5 py-2.5 bg-gradient-to-r cursor-pointer from-rose-50 to-pink-50 text-rose-600 border border-rose-300 rounded-xl hover:from-rose-100 hover:to-pink-100 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center space-x-2"
                                    >
                                        Cancelar
                                    </motion.button>
                                    <motion.button
                                        type="submit"
                                        disabled={loading}
                                        whileHover={!loading ? { scale: 1.05 } : {}}
                                        whileTap={!loading ? { scale: 0.95 } : {}}
                                        className="px-5 py-2.5 bg-gradient-to-r cursor-pointer from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
                                    >
                                        {loading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                                />
                                                <span>Guardando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircleIcon className="h-4 w-4" />
                                                <span>Guardar Reglas</span>
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </motion.form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ModalReglasComision;