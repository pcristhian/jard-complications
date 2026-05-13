// components/PlanesWifi/ModalNuevoPlanWifi.jsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";
import { supabase } from '@/lib/supabase/client';

export default function ModalNuevoPlanWifi({ abierto, onCerrar, onCrearPlan, loading, planesExistentes }) {
    const { values } = useMultiLocalStorageListener(["currentUser"]);
    const { currentUser } = values;

    const [usuarios, setUsuarios] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [formData, setFormData] = useState({
        nombre_plan: '',
        codigo_cliente: '',
        nombre_cliente: '',
        celular_cliente: '',
        costo: '',
        usuario_id: '', // Vendedor
        observacion: '',
        fecha: new Date().toISOString().split('T')[0] // Fecha actual por defecto
    });

    const [errors, setErrors] = useState({});

    // Cargar usuarios activos
    useEffect(() => {
        if (abierto) {
            cargarUsuarios();
        }
    }, [abierto]);

    const cargarUsuarios = async () => {
        setCargandoUsuarios(true);
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, nombre, rol_id, roles(nombre)')
                .eq('activo', true)
                .order('nombre', { ascending: true });

            if (error) throw error;
            setUsuarios(data || []);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        } finally {
            setCargandoUsuarios(false);
        }
    };

    useEffect(() => {
        if (!abierto) {
            setFormData({
                nombre_plan: '',
                codigo_cliente: '',
                nombre_cliente: '',
                celular_cliente: '',
                costo: '',
                usuario_id: '',
                observacion: '',
                fecha: new Date().toISOString().split('T')[0]
            });
            setErrors({});
        }
    }, [abierto]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.nombre_plan.trim()) {
            nuevosErrores.nombre_plan = 'El nombre del plan es requerido';
        }
        if (!formData.codigo_cliente.trim()) {
            nuevosErrores.codigo_cliente = 'El código del cliente es requerido';
        }
        if (!formData.nombre_cliente.trim()) {
            nuevosErrores.nombre_cliente = 'El nombre del cliente es requerido';
        }
        if (!formData.celular_cliente.trim()) {
            nuevosErrores.celular_cliente = 'El celular es requerido';
        }
        if (!formData.costo || formData.costo <= 0) {
            nuevosErrores.costo = 'El costo debe ser mayor a 0';
        }
        if (!formData.fecha) {
            nuevosErrores.fecha = 'La fecha es requerida';
        }

        // Validación: si no se selecciona usuario, la observación es obligatoria
        if (!formData.usuario_id) {
            if (!formData.observacion.trim()) {
                nuevosErrores.observacion = 'Debes seleccionar un vendedor o escribir el nombre del vendedor en observaciones';
            }
        }

        // Validar código único
        if (planesExistentes?.some(p => p.codigo_cliente === formData.codigo_cliente.trim())) {
            nuevosErrores.codigo_cliente = 'Este código de cliente ya existe';
        }

        setErrors(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        // Construir observación final
        let observacionFinal = formData.observacion || '';

        const resultado = await onCrearPlan({
            nombre_plan: formData.nombre_plan,
            codigo_cliente: formData.codigo_cliente,
            nombre_cliente: formData.nombre_cliente,
            celular_cliente: formData.celular_cliente,
            costo: parseFloat(formData.costo),
            usuario_id: formData.usuario_id || null,
            observacion: observacionFinal,
            fecha: formData.fecha // Enviar la fecha seleccionada
        });

        if (resultado.success) {
            onCerrar();
        }
    };

    return (
        <AnimatePresence>
            {abierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50"
                        onClick={onCerrar}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 z-10 max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Nuevo Plan WiFi
                            </h2>
                            <button
                                onClick={onCerrar}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Fecha del Plan - Nuevo campo */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha del Plan *
                                    </label>
                                    <input
                                        type="date"
                                        name="fecha"
                                        value={formData.fecha}
                                        onChange={handleChange}
                                        max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.fecha && (
                                        <p className="text-red-500 text-xs mt-1">{errors.fecha}</p>
                                    )}
                                    <p className="text-gray-400 text-xs mt-1">
                                        Selecciona la fecha cuando se realizó el plan
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre del Plan *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre_plan"
                                        value={formData.nombre_plan}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: Plan Básico 10MB"
                                    />
                                    {errors.nombre_plan && (
                                        <p className="text-red-500 text-xs mt-1">{errors.nombre_plan}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        name="codigo_cliente"
                                        value={formData.codigo_cliente}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: CLI-001"
                                    />
                                    {errors.codigo_cliente && (
                                        <p className="text-red-500 text-xs mt-1">{errors.codigo_cliente}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre Cliente *
                                    </label>
                                    <input
                                        type="text"
                                        name="nombre_cliente"
                                        value={formData.nombre_cliente}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nombre completo"
                                    />
                                    {errors.nombre_cliente && (
                                        <p className="text-red-500 text-xs mt-1">{errors.nombre_cliente}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Celular *
                                    </label>
                                    <input
                                        type="tel"
                                        name="celular_cliente"
                                        value={formData.celular_cliente}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: 70012345"
                                    />
                                    {errors.celular_cliente && (
                                        <p className="text-red-500 text-xs mt-1">{errors.celular_cliente}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Costo (Bs) *
                                    </label>
                                    <input
                                        type="text"
                                        name="costo"
                                        value={formData.costo}
                                        onChange={handleChange}
                                        onInput={(e) => {
                                            e.target.value = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                        }}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="0.00"
                                    />
                                    {errors.costo && (
                                        <p className="text-red-500 text-xs mt-1">{errors.costo}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Promotor (Opcional)
                                    </label>
                                    <select
                                        name="usuario_id"
                                        value={formData.usuario_id}
                                        onChange={handleChange}
                                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Seleccionar vendedor...</option>
                                        {usuarios.map(usuario => (
                                            <option key={usuario.id} value={usuario.id}>
                                                {usuario.nombre} {usuario.roles?.nombre && `(${usuario.roles.nombre})`}
                                            </option>
                                        ))}
                                    </select>
                                    {cargandoUsuarios && (
                                        <p className="text-gray-500 text-xs mt-1">Cargando vendedores...</p>
                                    )}
                                    <p className="text-amber-500 text-xs mt-1">
                                        Si no seleccionas un vendedor, debes escribir el nombre en observaciones
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Observación {!formData.usuario_id && '*'}
                                    </label>
                                    <textarea
                                        name="observacion"
                                        value={formData.observacion}
                                        onChange={handleChange}
                                        rows="3"
                                        className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.observacion ? 'border-red-500' : ''
                                            }`}
                                        placeholder={!formData.usuario_id
                                            ? "Obligatorio: Escribe el nombre del vendedor aquí..."
                                            : "Información adicional (opcional)..."
                                        }
                                    />
                                    {errors.observacion && (
                                        <p className="text-red-500 text-xs mt-1">{errors.observacion}</p>
                                    )}
                                    {!formData.usuario_id && !errors.observacion && (
                                        <p className="text-red-500 text-xs mt-1">
                                            ⚠️ Campo obligatorio porque no seleccionaste un vendedor
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={onCerrar}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? 'Guardando...' : 'Guardar Plan'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}