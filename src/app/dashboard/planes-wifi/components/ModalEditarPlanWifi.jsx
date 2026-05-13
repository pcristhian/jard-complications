// components/PlanesWifi/ModalEditarPlanWifi.jsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ModalEditarPlanWifi({
    plan,
    onCerrar,
    onActualizarPlan,
    loading,
    planesExistentes,
    usuarios // ← Recibir usuarios como prop
}) {
    const [formData, setFormData] = useState({
        nombre_plan: '',
        codigo_cliente: '',
        nombre_cliente: '',
        celular_cliente: '',
        costo: '',
        observacion: '',
        usuario_id: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (plan) {
            setFormData({
                nombre_plan: plan.nombre_plan || '',
                codigo_cliente: plan.codigo_cliente || '',
                nombre_cliente: plan.nombre_cliente || '',
                celular_cliente: plan.celular_cliente || '',
                costo: plan.costo || '',
                observacion: plan.observacion || '',
                usuario_id: plan.usuario_id || plan.usuario?.id || ''
            });
        }
    }, [plan]);

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

        if (planesExistentes?.some(p => p.codigo_cliente === formData.codigo_cliente.trim() && p.id !== plan?.id)) {
            nuevosErrores.codigo_cliente = 'Este código de cliente ya existe';
        }

        setErrors(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) return;

        const resultado = await onActualizarPlan(plan.id, {
            ...formData,
            costo: parseFloat(formData.costo),
            usuario_id: formData.usuario_id ? parseInt(formData.usuario_id) : null
        });

        if (resultado.success) {
            onCerrar();
        }
    };

    if (!plan) return null;

    return (
        <AnimatePresence>
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
                    className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 z-10 max-h-[90vh] overflow-y-auto"
                >
                    <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Editar Plan WiFi
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del Plan *
                                </label>
                                <input
                                    type="text"
                                    name="nombre_plan"
                                    value={formData.nombre_plan}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.nombre_plan && <p className="text-red-500 text-xs mt-1">{errors.nombre_plan}</p>}
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
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.codigo_cliente && <p className="text-red-500 text-xs mt-1">{errors.codigo_cliente}</p>}
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
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.nombre_cliente && <p className="text-red-500 text-xs mt-1">{errors.nombre_cliente}</p>}
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
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.celular_cliente && <p className="text-red-500 text-xs mt-1">{errors.celular_cliente}</p>}
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
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                                {errors.costo && <p className="text-red-500 text-xs mt-1">{errors.costo}</p>}
                            </div>

                            {/* Select de Vendedor */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Promotor
                                </label>
                                <select
                                    name="usuario_id"
                                    value={formData.usuario_id}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Seleccionar Promotor</option>
                                    {usuarios.map(usuario => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.nombre} - {usuario.caja || usuario.rol_nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observación
                                </label>
                                <textarea
                                    name="observacion"
                                    value={formData.observacion}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                                />
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
                                {loading ? 'Actualizando...' : 'Actualizar Plan'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}