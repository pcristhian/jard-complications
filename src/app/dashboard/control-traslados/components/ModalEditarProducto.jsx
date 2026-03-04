import { useState, useEffect } from 'react';

export default function ModalEditarProducto({
    producto,
    onCerrar,
    onActualizarProducto,
    categorias,
    loading,
    sucursalSeleccionada
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
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
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
        }
    };

    const categoriaSeleccionada = categorias.find(cat => cat.id === parseInt(formData.categoria_id));
    const permiteComisionVariable = categoriaSeleccionada?.reglas_comision?.comision_variable === true;

    if (!producto) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-semibold">Editar Producto</h2>
                    <p className="text-gray-600 text-sm">Editando: {producto.nombre}</p>
                    {sucursalSeleccionada && (
                        <p className="text-sm text-gray-600">
                            De la Sucursal: <span className="font-semibold">{sucursalSeleccionada.nombre}</span>
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Código */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Código *
                            </label>
                            <input
                                type="text"
                                name="codigo"
                                value={formData.codigo}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.codigo ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.codigo && <p className="text-red-500 text-sm mt-1">{errors.codigo}</p>}
                        </div>

                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.nombre ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría *
                            </label>
                            <select
                                name="categoria_id"
                                value={formData.categoria_id}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.categoria_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Seleccionar categoría</option>
                                {categorias.map(categoria => (
                                    <option key={categoria.id} value={categoria.id}>
                                        {categoria.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.categoria_id && <p className="text-red-500 text-sm mt-1">{errors.categoria_id}</p>}
                        </div>

                        {/* Precio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.precio ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.precio && <p className="text-red-500 text-sm mt-1">{errors.precio}</p>}
                        </div>

                        {/* Costo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Costo
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="costo"
                                value={formData.costo}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Comisión Variable */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Comisión Variable
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                name="comision_variable"
                                value={formData.comision_variable}
                                onChange={handleChange}
                                disabled={!permiteComisionVariable}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!permiteComisionVariable
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : errors.comision_variable ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder={permiteComisionVariable ? "0.00" : "No permitido para esta categoría"}
                            />
                            {errors.comision_variable && <p className="text-red-500 text-sm mt-1">{errors.comision_variable}</p>}
                            {categoriaSeleccionada && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {permiteComisionVariable
                                        ? 'Comisión variable permitida'
                                        : 'Comisión variable no permitida para esta categoría'
                                    }
                                </p>
                            )}
                        </div>

                        {/* Stock Actual */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock Actual
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="stock_actual"
                                value={formData.stock_actual}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Stock Mínimo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock Mínimo
                            </label>
                            <input
                                type="number"
                                min="0"
                                name="stock_minimo"
                                value={formData.stock_minimo}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="activo"
                                checked={formData.activo}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Producto activo</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCerrar}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Actualizar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}