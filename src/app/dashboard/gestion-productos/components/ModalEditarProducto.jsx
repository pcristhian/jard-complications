import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    XMarkIcon,
    PencilSquareIcon,
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
    ArrowTrendingDownIcon,
    PowerIcon,
    EyeIcon,
    EyeSlashIcon
} from '@heroicons/react/24/outline';

export default function ModalEditarProducto({
    producto,
    onCerrar,
    onActualizarProducto,
    categorias,
    loading,
    sucursalSeleccionada,
    productosExistentes = []
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
        stock_actual: 0,
        sucursal_id: '',
        activo: true
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');
    const [codigoDuplicado, setCodigoDuplicado] = useState(false); // 👈 Nuevo estado
    const [validandoCodigo, setValidandoCodigo] = useState(false); // 👈 Nuevo estado

    // Función inline para validar formato del código (MISMA que en NuevoProducto)
    const validarFormatoCodigo = (codigo) => {
        const codigoTrimmed = codigo.trim();

        if (codigoTrimmed.length === 0) {
            return { valido: false, mensaje: 'El código no puede estar vacío' };
        }

        // Expresión regular: solo letras, números y guiones
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

    // Función para verificar si el código ya existe en la sucursal (excluyendo el producto actual)
    const verificarCodigoDuplicado = useCallback((codigo) => {
        if (!codigo || !sucursalSeleccionada || !productosExistentes || productosExistentes.length === 0) {
            return false;
        }

        const codigoNormalizado = codigo.trim().toUpperCase();

        return productosExistentes.some(productoItem =>
            productoItem.codigo &&
            productoItem.codigo.trim().toUpperCase() === codigoNormalizado &&
            productoItem.sucursal_id === sucursalSeleccionada.id &&
            productoItem.id !== producto.id // 👈 IMPORTANTE: excluir el producto actual
        );
    }, [sucursalSeleccionada, productosExistentes, producto?.id]); // 👈 Dependencia del ID del producto

    // Verificar código duplicado en tiempo real con debounce
    useEffect(() => {
        // Solo validar si hay un código y no es el mismo que ya tenía
        if (formData.codigo && formData.codigo !== producto?.codigo) {
            const timer = setTimeout(() => {
                setValidandoCodigo(true);

                // Validar formato primero
                const formatoValido = validarFormatoCodigo(formData.codigo);

                // Solo verificar duplicado si el formato es válido
                if (formatoValido.valido) {
                    const esDuplicado = verificarCodigoDuplicado(formData.codigo);
                    setCodigoDuplicado(esDuplicado);

                    if (esDuplicado) {
                        setErrors(prev => ({
                            ...prev,
                            codigo: 'Este código ya existe en esta sucursal'
                        }));
                    } else {
                        setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.codigo;
                            return newErrors;
                        });
                    }
                } else {
                    // Si formato no válido, mostrar error de formato
                    setCodigoDuplicado(false);
                    setErrors(prev => ({
                        ...prev,
                        codigo: formatoValido.mensaje
                    }));
                }

                setValidandoCodigo(false);
            }, 500);

            return () => clearTimeout(timer);
        } else {
            // Si es el mismo código que ya tenía, no es duplicado
            setCodigoDuplicado(false);
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.codigo;
                return newErrors;
            });
        }
    }, [formData.codigo, verificarCodigoDuplicado, producto?.codigo]);




    useEffect(() => {
        if (producto) {
            setFormData({
                codigo: producto.codigo || '',
                nombre: producto.nombre || '',
                descripcion: producto.descripcion || '',
                categoria_id: producto.categoria_id || '',
                precio: producto.precio?.toString() || '',
                costo: producto.costo?.toString() || '',
                comision_variable: producto.comision_variable?.toString() || '',
                stock_inicial: producto.stock_inicial || 0,
                stock_minimo: producto.stock_minimo || 0,
                stock_actual: producto.stock_actual || 0,
                sucursal_id: producto.sucursal_id || '',
                activo: producto.activo ?? true
            });
            setErrors({});
            setSuccess('');
            setCodigoDuplicado(false);
            setValidandoCodigo(false);
        }
    }, [producto]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            // Para el campo código, convertir a mayúsculas automáticamente
            if (name === 'codigo') {
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
        }

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

        // Validar formato del código
        const validacionCodigo = validarFormatoCodigo(formData.codigo);
        if (!validacionCodigo.valido) {
            setErrors({ codigo: validacionCodigo.mensaje });
            return;
        }

        // Validar código duplicado (solo si cambió el código)
        if (formData.codigo !== producto.codigo && codigoDuplicado) {
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

        const datosParaEnviar = {
            ...formData,
            precio: parseFloat(formData.precio) || 0,
            costo: formData.costo ? parseFloat(formData.costo) : null,
            comision_variable: formData.comision_variable ? parseFloat(formData.comision_variable) : null,
            stock_inicial: parseInt(formData.stock_inicial) || 0,
            stock_minimo: parseInt(formData.stock_minimo) || 0,
            stock_actual: parseInt(formData.stock_actual) || 0
        };

        const resultado = await onActualizarProducto(producto.id, datosParaEnviar);

        if (resultado.errors) {
            setErrors(resultado.errors);
        } else if (resultado.success) {
            setSuccess('Producto actualizado exitosamente');
            toast.success('Producto actualizado exitosamente');
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

    const diferenciaStock = parseInt(formData.stock_actual) - parseInt(formData.stock_minimo);

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

    if (!producto) return null;

    return (
        <AnimatePresence>
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
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <motion.div
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.5 }}
                                    className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg"
                                >
                                    <PencilSquareIcon className="h-6 w-6 text-white" />
                                </motion.div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Editar Producto
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <div className="flex items-center space-x-1">
                                            <BuildingOfficeIcon className="h-3 w-3 text-blue-500" />
                                            <span className="text-sm text-gray-600">
                                                Sucursal: <span className="font-semibold text-blue-700">{sucursalSeleccionada?.nombre}</span>
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${formData.activo
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {formData.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onCerrar}
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
                                <motion.input
                                    whileFocus="focus"
                                    variants={inputFocusVariants}
                                    type="text"
                                    name="codigo"
                                    value={formData.codigo}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${(errors.codigo || codigoDuplicado)
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
                                {errors.codigo && (
                                    <p className="text-red-500 text-sm mt-1 flex items-center">
                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                        {errors.codigo}
                                    </p>
                                )}
                                {validandoCodigo && (
                                    <div className="absolute right-3 top-3">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"
                                        />
                                    </div>
                                )}
                                {/* Mensaje de validación */}
                                <div className="min-h-[20px]">
                                    {formData.codigo && formData.codigo !== producto.codigo && (
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
                                                    className="text-amber-500 text-sm"
                                                >
                                                    Validando código...
                                                </motion.span>
                                            )}
                                        </>
                                    )}

                                    {errors.codigo && !codigoDuplicado && (
                                        <p className="text-red-500 text-sm flex items-center">
                                            <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                            {errors.codigo}
                                        </p>
                                    )}

                                    {formData.codigo === producto.codigo && (
                                        <p className="text-amber-600 text-sm flex items-center">
                                            <InformationCircleIcon className="h-3 w-3 mr-1" />
                                            Código original del producto
                                        </p>
                                    )}
                                </div>
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
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${errors.nombre
                                        ? 'border-red-300 bg-red-50 text-red-900'
                                        : 'border-gray-300 bg-gray-50 text-gray-900'
                                        }`}
                                    placeholder="Nombre del producto"
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
                                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${errors.categoria_id
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
                                        name="precio"
                                        value={formData.precio}
                                        onChange={(e) => {
                                            let value = e.target.value
                                                .replace(/[^0-9.]/g, '')       // solo números y punto
                                                .replace(/(\..*)\./g, '$1');   // evita doble punto decimal

                                            handleChange({
                                                target: { name: "precio", value }
                                            });
                                        }}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${errors.precio
                                            ? 'border-red-300 bg-red-50 text-red-900'
                                            : 'border-gray-300 bg-gray-50 text-gray-900'
                                            }`}
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
                                        inputMode="decimal"
                                        name="costo"
                                        value={formData.costo}
                                        onChange={(e) => {
                                            let value = e.target.value
                                                .replace(/[^0-9.]/g, '')       // solo números y punto
                                                .replace(/(\..*)\./g, '$1');   // evita doble punto decimal

                                            handleChange({
                                                target: { name: "costo", value }
                                            });
                                        }}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                                                    {Math.abs(margenBruto)}%
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
                                    <span className="absolute left-3 top-3 text-gray-500">Bs. </span>
                                    <motion.input
                                        whileFocus="focus"
                                        variants={inputFocusVariants}
                                        type="text"
                                        inputMode="decimal"
                                        name="comision_variable"
                                        value={formData.comision_variable}
                                        disabled={!permiteComisionVariable}
                                        onChange={(e) => {
                                            if (!permiteComisionVariable) return;

                                            let value = e.target.value
                                                .replace(/[^0-9.]/g, '')      // solo números y punto
                                                .replace(/(\..*)\./g, '$1');  // evita más de un punto decimal

                                            handleChange({
                                                target: { name: "comision_variable", value }
                                            });
                                        }}
                                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 ${!permiteComisionVariable
                                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300'
                                            : errors.comision_variable
                                                ? 'border-red-300 bg-red-50 text-red-900'
                                                : 'border-gray-300 bg-gray-50 text-gray-900'
                                            }`}
                                        placeholder={permiteComisionVariable ? "0.00" : "  No permitido"}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500 mt-1">
                                        {categoriaSeleccionada ? (
                                            <div className="flex items-center">
                                                <InformationCircleIcon className="h-3 w-3 mr-1" />
                                                {permiteComisionVariable
                                                    ? <span className='text-green-600'>Comisión variable permitida</span>
                                                    : <span className='text-orange-600'>No permitida para esta categoría</span>
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

                            {/* Stock Actual */}
                            <motion.div variants={itemVariants} className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                                    <CubeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                    Stock Actual
                                </label>
                                <motion.input
                                    whileFocus="focus"
                                    variants={inputFocusVariants}
                                    type="text"
                                    inputMode="numeric"
                                    name="stock_actual"
                                    value={formData.stock_actual}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, "");  // solo enteros

                                        handleChange({
                                            target: { name: "stock_actual", value }
                                        });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900"
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
                                        const value = e.target.value.replace(/[^0-9]/g, ""); // solo números enteros

                                        handleChange({
                                            target: { name: "stock_minimo", value }
                                        });
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900"
                                />
                                {diferenciaStock < 0 && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center">
                                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                                        Stock actual está por debajo del mínimo
                                    </p>
                                )}
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
                                className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-900 resize-none"
                                placeholder="Descripción detallada del producto..."
                            />
                        </motion.div>

                        {/* Estado */}
                        <motion.div
                            variants={itemVariants}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
                        >
                            <div className="flex items-center space-x-3">
                                {formData.activo ? (
                                    <EyeIcon className="h-5 w-5 text-green-500" />
                                ) : (
                                    <EyeSlashIcon className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                    <span className="text-sm font-semibold text-gray-900">
                                        Estado del Producto
                                    </span>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        {formData.activo
                                            ? 'El producto está visible y disponible para ventas'
                                            : 'El producto está oculto y no disponible para ventas'
                                        }
                                    </p>
                                </div>
                            </div>
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
                                    className={`flex items-center cursor-pointer ${formData.activo ? 'text-amber-600' : 'text-gray-400'
                                        }`}
                                >
                                    <div className={`w-14 h-7 rounded-full p-1 mr-3 transition-all duration-200 ${formData.activo ? 'bg-amber-500' : 'bg-gray-300'
                                        }`}>
                                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${formData.activo ? 'translate-x-7' : 'translate-x-0'
                                            }`} />
                                    </div>
                                    <div className="flex items-center">
                                        <PowerIcon className="h-4 w-4 mr-2" />
                                        <span className="text-sm font-medium">
                                            Producto activo
                                        </span>
                                    </div>
                                </label>
                            </motion.div>
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
                                disabled={loading}
                                whileHover={!loading ? { scale: 1.05 } : {}}
                                whileTap={!loading ? { scale: 0.95 } : {}}
                                className="px-5 py-2.5 bg-gradient-to-r cursor-pointer from-amber-500 to-orange-600 text-white rounded-xl hover:from-amber-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                        />
                                        <span>Actualizando...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4" />
                                        <span>Actualizar Producto</span>
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </motion.form>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}