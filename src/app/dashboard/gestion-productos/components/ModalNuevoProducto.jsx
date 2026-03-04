import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    PlusCircleIcon,
    TagIcon,
    CubeIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    DocumentTextIcon,
    BuildingOfficeIcon,
    ExclamationCircleIcon,
    CheckCircleIcon,
    HashtagIcon,
    InformationCircleIcon,
    MinusCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function ModalNuevoProducto({
    abierto,
    onCerrar,
    onCrearProducto,
    categorias,
    loading,
    sucursalSeleccionada,
    productosExistentes = [] // Nueva prop: lista de productos existentes
}) {
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        categoria_id: '',
        precio: '',
        costo: '',
        comision_variable: '',
        stock_inicial: 0,
        stock_minimo: 0,
        sucursal_id: ''
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [codigoDuplicado, setCodigoDuplicado] = useState(false);
    const [validandoCodigo, setValidandoCodigo] = useState(false);

    // Función para verificar si el código ya existe en la sucursal
    const verificarCodigoDuplicado = useCallback((codigo) => {
        if (!codigo || !sucursalSeleccionada || !productosExistentes || productosExistentes.length === 0) {
            return false;
        }

        // Normalizar el código (quitar espacios extras y convertir a mayúsculas/minúsculas según tu necesidad)
        const codigoNormalizado = codigo.trim().toUpperCase();

        // Buscar si existe algún producto con el mismo código en la misma sucursal
        return productosExistentes.some(producto =>
            producto.codigo &&
            producto.codigo.trim().toUpperCase() === codigoNormalizado &&
            producto.sucursal_id === sucursalSeleccionada.id
        );
    }, [sucursalSeleccionada, productosExistentes]);

    // Verificar código duplicado en tiempo real con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (formData.codigo && formData.codigo.length > 0) {
                setValidandoCodigo(true);
                const esDuplicado = verificarCodigoDuplicado(formData.codigo);
                setCodigoDuplicado(esDuplicado);

                // Si es duplicado, agregar al objeto de errores
                if (esDuplicado) {
                    setErrors(prev => ({
                        ...prev,
                        codigo: 'Este código ya existe en la sucursal seleccionada'
                    }));
                } else {
                    // Limpiar error de código si ya no es duplicado
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.codigo;
                        return newErrors;
                    });
                }

                setValidandoCodigo(false);
            } else {
                setCodigoDuplicado(false);
                // Limpiar error de código si el campo está vacío
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.codigo;
                    return newErrors;
                });
            }
        }, 500); // Debounce de 500ms

        return () => clearTimeout(timer);
    }, [formData.codigo, verificarCodigoDuplicado]);

    useEffect(() => {
        if (abierto && sucursalSeleccionada) {
            setFormData(prev => ({
                ...prev,
                sucursal_id: sucursalSeleccionada.id
            }));
        }
    }, [abierto, sucursalSeleccionada]);

    useEffect(() => {
        if (!abierto) {
            setFormData({
                codigo: '',
                nombre: '',
                descripcion: '',
                categoria_id: '',
                precio: '',
                costo: '',
                comision_variable: '',
                stock_inicial: 0,
                stock_minimo: 0,
                sucursal_id: ''
            });
            setErrors({});
            setSuccess('');
            setCodigoDuplicado(false);
            setValidandoCodigo(false);
        }
    }, [abierto]);
    // Función inline para validar formato del código
    const validarFormatoCodigo = (codigo) => {
        const codigoTrimmed = codigo.trim();

        if (codigoTrimmed.length === 0) {
            return { valido: false, mensaje: 'El código no puede estar vacío' };
        }

        // Expresión regular simplificada: solo letras, números y guiones
        const regex = /^[A-Za-z0-9-]+$/;

        if (!regex.test(codigoTrimmed)) {
            return {
                valido: false,
                mensaje: 'Solo letras, números y guiones (-). Sin espacios ni caracteres especiales.'
            };
        }

        // Validaciones básicas
        if (codigoTrimmed.startsWith('-') || codigoTrimmed.endsWith('-')) {
            return { valido: false, mensaje: 'No puede empezar ni terminar con guión' };
        }

        if (codigoTrimmed.length < 2) {
            return { valido: false, mensaje: 'Mínimo 2 caracteres' };
        }

        if (codigoTrimmed.length > 20) {
            return { valido: false, mensaje: 'Máximo 20 caracteres' };
        }

        return { valido: true, mensaje: 'Formato válido' };
    };


    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'codigo') {
            // Convertir a mayúsculas y eliminar espacios
            const valorLimpio = value.toUpperCase().replace(/\s+/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: valorLimpio
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccess('');

        // Validar que haya sucursal seleccionada
        if (!sucursalSeleccionada) {
            setErrors({
                general: 'Debe seleccionar una sucursal primero'
            });
            return;
        }
        const validacionCodigo = validarFormatoCodigo(formData.codigo);
        if (!validacionCodigo.valido) {
            setErrors({ codigo: validacionCodigo.mensaje });
            return;
        }

        // Validar campos obligatorios
        const erroresValidacion = {};
        if (!formData.codigo.trim()) erroresValidacion.codigo = 'El código es obligatorio';
        if (!formData.nombre.trim()) erroresValidacion.nombre = 'El nombre es obligatorio';
        if (!formData.categoria_id) erroresValidacion.categoria_id = 'La categoría es obligatoria';
        if (!formData.precio || parseFloat(formData.precio) <= 0) erroresValidacion.precio = 'El precio debe ser mayor a 0';

        if (Object.keys(erroresValidacion).length > 0) {
            setErrors(erroresValidacion);
            return;
        }

        // Usar el estado actual de codigoDuplicado
        if (codigoDuplicado) {
            setErrors({
                codigo: `El código "${formData.codigo}" ya existe en la sucursal "${sucursalSeleccionada.nombre}"`
            });
            return;
        }

        // Si estamos validando, esperar
        if (validandoCodigo) {
            setErrors({
                codigo: 'Validando código, por favor espere...'
            });
            return;
        }

        const resultado = await onCrearProducto({
            ...formData,
            precio: parseFloat(formData.precio) || 0,
            costo: formData.costo ? parseFloat(formData.costo) : null,
            comision_variable: formData.comision_variable ? parseFloat(formData.comision_variable) : null,
            stock_inicial: parseInt(formData.stock_inicial) || 0,
            stock_minimo: parseInt(formData.stock_minimo) || 0,
            activo: true
        });

        if (resultado.errors) {
            setErrors(resultado.errors);
        }

        // Si hay éxito, mostrar mensaje y cerrar después de un tiempo
        if (resultado.success) {
            setSuccess('Producto creado exitosamente');
            toast.success('Producto creado exitosamente');
            setTimeout(() => {
                onCerrar();
            }, 1500);
        }
    };

    const categoriaSeleccionada = categorias.find(cat => cat.id === parseInt(formData.categoria_id));
    const permiteComisionVariable = categoriaSeleccionada?.reglas_comision?.comision_variable === true;

    // Cálculos en tiempo real
    const margenBruto = formData.precio && formData.costo
        ? ((parseFloat(formData.precio) - parseFloat(formData.costo)) / parseFloat(formData.precio) * 100).toFixed(1)
        : null;

    const porcentajeComision = formData.comision_variable && formData.precio
        ? ((parseFloat(formData.comision_variable) / parseFloat(formData.precio)) * 100).toFixed(1)
        : null;

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
                staggerChildren: 0.05,
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

    return (
        <AnimatePresence>
            {abierto && (
                <motion.div
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={onCerrar}
                >
                    <motion.div
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg"
                                    >
                                        <PlusCircleIcon className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Nuevo Producto
                                        </h2>
                                        <div className="flex items-center space-x-3 mt-1">
                                            {sucursalSeleccionada && (
                                                <div className="flex items-center space-x-1">
                                                    <BuildingOfficeIcon className="h-3 w-3 text-blue-500" />
                                                    <span className="text-sm text-gray-600">
                                                        Para Sucursal: <span className="font-semibold text-blue-700">{sucursalSeleccionada.nombre}</span>
                                                    </span>
                                                </div>
                                            )}
                                            {categoriaSeleccionada && (
                                                <div className="flex items-center space-x-1">
                                                    <TagIcon className="h-3 w-3 text-purple-500" />
                                                    <span className="text-sm font-medium text-purple-600">
                                                        {categoriaSeleccionada.nombre}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onCerrar}
                                    className="p-2 hover:bg-white rounded-full transition-colors"
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
                                                    Por favor corrige los siguientes errores:
                                                </p>
                                                <ul className="text-red-600 text-sm list-disc list-inside">
                                                    {Object.entries(errors).map(([field, error], index) => (
                                                        <li key={index}>
                                                            <span className="font-semibold capitalize">{field}:</span> {error}
                                                        </li>
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
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Código */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <HashtagIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Código *
                                        <span className="ml-1 text-xs text-gray-500">
                                            (Solo letras, números y guiones)
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <motion.input
                                            whileFocus="focus"
                                            variants={inputFocusVariants}
                                            type="text"
                                            name="codigo"
                                            value={formData.codigo}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${(errors.codigo || codigoDuplicado)
                                                ? 'border-red-300 bg-red-50 text-red-900'
                                                : validandoCodigo
                                                    ? 'border-yellow-300 bg-yellow-50 text-gray-900'
                                                    : formData.codigo && !errors.codigo && !codigoDuplicado
                                                        ? 'border-green-300 bg-green-50 text-gray-900'
                                                        : 'border-gray-300 bg-gray-50 text-gray-900'
                                                }`}
                                            placeholder="Ej: CEL001, CEL-001, PROD-A1"
                                            title="Solo letras, números y guiones. Sin espacios ni caracteres especiales."
                                        />
                                        {validandoCodigo && (
                                            <div className="absolute right-3 top-3">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-h-[20px]">
                                        {formData.codigo && (
                                            <>
                                                {codigoDuplicado && (
                                                    <motion.span
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-red-500 text-sm flex items-center"
                                                    >
                                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                                        Código duplicado en esta sucursal
                                                    </motion.span>
                                                )}

                                                {!codigoDuplicado && !validandoCodigo && !errors.codigo && (
                                                    <motion.span
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-green-500 text-sm flex items-center"
                                                    >
                                                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                                                        Código disponible
                                                    </motion.span>
                                                )}

                                                {validandoCodigo && (
                                                    <motion.span
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="text-blue-500 text-sm"
                                                    >
                                                        Validando código...
                                                    </motion.span>
                                                )}

                                                {errors.codigo && !codigoDuplicado && (
                                                    <p className="text-red-500 text-sm flex items-center">
                                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                                        {errors.codigo}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Mensaje de error del formulario */}
                                    {errors.codigo && !codigoDuplicado && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            {errors.codigo}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Nombre */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Nombre *
                                    </label>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.nombre
                                            ? 'border-red-300 bg-red-50 text-red-900'
                                            : 'border-gray-300 bg-gray-50 text-gray-900'
                                            }`}
                                        placeholder="Nombre descriptivo del producto"
                                    />
                                    {errors.nombre && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            {errors.nombre}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Categoría */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <CubeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Categoría *
                                    </label>
                                    <motion.select
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        name="categoria_id"
                                        value={formData.categoria_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.categoria_id
                                            ? 'border-red-300 bg-red-50 text-red-900'
                                            : 'border-gray-300 bg-gray-50 text-gray-900'
                                            }`}
                                    >
                                        <option value="" className="text-gray-500">Seleccionar categoría</option>
                                        {categorias.map(categoria => (
                                            <option key={categoria.id} value={categoria.id} className="text-gray-900">
                                                {categoria.nombre}
                                            </option>
                                        ))}
                                    </motion.select>
                                    {errors.categoria_id && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            {errors.categoria_id}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Precio */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Precio *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">Bs.</span>
                                        <motion.input
                                            whileFocus="focus"
                                            variants={inputFocusVariants}
                                            type="text"
                                            inputMode="decimal"
                                            pattern="[0-9]*"
                                            step="0.01"
                                            min="0"
                                            name="precio"
                                            value={formData.precio}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9.]/g, ''); // solo números y punto
                                                handleChange({
                                                    target: {
                                                        name: "precio",
                                                        value
                                                    }
                                                });
                                            }}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${errors.precio
                                                ? "border-red-300 bg-red-50 text-red-900"
                                                : "border-gray-300 bg-gray-50 text-gray-900"
                                                }`}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {errors.precio && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            {errors.precio}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Costo */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Costo
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">Bs.</span>
                                        <motion.input
                                            whileFocus="focus"
                                            variants={inputFocusVariants}
                                            type="text"
                                            inputMode="decimal"   // para teclado numérico con punto en móviles
                                            step="0.01"
                                            min="0"
                                            name="costo"
                                            value={formData.costo}
                                            onChange={(e) => {
                                                let value = e.target.value
                                                    .replace(/[^0-9.]/g, '')      // solo números y punto
                                                    .replace(/(\..*)\./g, '$1');  // evita doble punto

                                                handleChange({
                                                    target: { name: "costo", value }
                                                });
                                            }}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {formData.precio && formData.costo && (
                                        <div className="text-xs text-gray-600 mt-2 flex items-center justify-between">
                                            <div className="flex items-center">
                                                <ChartBarIcon className="h-3 w-3 mr-1" />
                                                <span>Margen bruto:</span>
                                            </div>
                                            <span className={`font-semibold ${margenBruto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {margenBruto >= 0 ? (
                                                    <span className="flex items-center">
                                                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                                                        {margenBruto}%
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center">
                                                        <ArrowTrendingDownIcon className="h-3 w-3 mr-1" />
                                                        {margenBruto}%
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Comisión Variable */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Comisión Variable
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-500">Bs.</span>
                                        <motion.input
                                            whileFocus="focus"
                                            variants={inputFocusVariants}
                                            type="text"
                                            inputMode="decimal"
                                            step="0.01"
                                            min="0"
                                            name="comision_variable"
                                            value={formData.comision_variable}
                                            disabled={!permiteComisionVariable}
                                            onChange={(e) => {
                                                if (!permiteComisionVariable) return;

                                                let value = e.target.value
                                                    .replace(/[^0-9.]/g, '')       // solo números y punto
                                                    .replace(/(\..*)\./g, '$1');   // evita doble punto decimal

                                                handleChange({
                                                    target: { name: "comision_variable", value }
                                                });
                                            }}
                                            className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${!permiteComisionVariable
                                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
                                                : errors.comision_variable
                                                    ? 'border-red-300 bg-red-50 text-red-900'
                                                    : 'border-gray-300 bg-gray-50 text-gray-900'
                                                }`}
                                            placeholder={permiteComisionVariable ? "0.00" : "No permitido"}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-500 mt-1">
                                            {categoriaSeleccionada ? (
                                                <div className="flex items-center">
                                                    <InformationCircleIcon className="h-3 w-3 mr-1" />
                                                    {permiteComisionVariable
                                                        ? <span className='text-green-600'>Comisión variable permitida</span>
                                                        : <span className="text-orange-600">No permitida para esta categoría</span>
                                                    }
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <InformationCircleIcon className="h-3 w-3 mr-1" />
                                                    Selecciona una categoría
                                                </div>
                                            )}
                                        </div>
                                        {formData.comision_variable && formData.precio && (
                                            <div className="text-xs text-blue-600 font-medium">
                                                {porcentajeComision}% del precio
                                            </div>
                                        )}
                                    </div>
                                    {errors.comision_variable && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            {errors.comision_variable}
                                        </p>
                                    )}
                                </motion.div>

                                {/* Stock Inicial */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <PlusCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Stock Inicial
                                    </label>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        inputMode="numeric"
                                        min="0"
                                        name="stock_inicial"
                                        value={formData.stock_inicial}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, ""); // solo números enteros

                                            handleChange({
                                                target: { name: "stock_inicial", value }
                                            });
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                    />
                                </motion.div>
                                {/* Stock Mínimo */}
                                <motion.div variants={itemVariants} className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                        <MinusCircleIcon className="h-4 w-4 mr-2 text-gray-400" />
                                        Stock Mínimo
                                    </label>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        inputMode="numeric"
                                        name="stock_minimo"
                                        value={formData.stock_minimo}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, ""); // solo números

                                            handleChange({
                                                target: { name: "stock_minimo", value }
                                            });
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                    />
                                </motion.div>
                            </div>
                            {/* Descripción */}
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <DocumentTextIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    Descripción
                                </label>
                                <motion.textarea
                                    whileFocus="focus"
                                    variants={inputFocusVariants}
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 resize-none"
                                    placeholder="Describe las características principales del producto, especificaciones técnicas, beneficios, etc..."
                                />
                            </motion.div>

                            {/* Botones */}
                            <motion.div
                                variants={itemVariants}
                                className="flex justify-end space-x-4 pt-6 border-t border-gray-200"
                            >
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.05, x: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={onCerrar}
                                    className="px-5 py-2.5 text-gray-700 bg-white cursor-pointer border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    type="submit"
                                    disabled={loading || codigoDuplicado || validandoCodigo}
                                    whileHover={!(loading || codigoDuplicado || validandoCodigo) ? { scale: 1.05 } : {}}
                                    whileTap={!(loading || codigoDuplicado || validandoCodigo) ? { scale: 0.95 } : {}}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 cursor-pointer to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
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
                                            <span>Crear Producto</span>
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
}