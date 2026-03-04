import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMovimientos } from './useMovimientos';

export const useProductos = (sucursalId) => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🔹 Solo importamos las funciones de movimientos que necesitamos
    const { registrarEntradaStock, registrarTraslado } = useMovimientos();

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, [sucursalId]);

    const cargarProductos = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('productos')
                .select(`
          *,
          categorias (
            id,
            nombre,
            reglas_comision
          )
        `)
                .order('created_at', { ascending: false });

            if (sucursalId) {
                query = query.eq('sucursal_id', sucursalId);
            }

            const { data, error } = await query;

            if (error) throw error;
            setProductos(data || []);
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Función para añadir stock con registro de movimiento
    const añadirStock = async (productoId, cantidad, observaciones, usuarioId) => {
        if (!sucursalId || !usuarioId) {
            return { success: false, error: 'Sucursal y usuario son requeridos' };
        }

        setLoading(true);
        try {
            // 1. Obtener producto actual
            const { data: producto, error: errorProducto } = await supabase
                .from('productos')
                .select('*')
                .eq('id', productoId)
                .single();

            if (errorProducto) throw errorProducto;

            // 2. Actualizar stock
            const nuevoStock = producto.stock_actual + cantidad;
            const { data: productoActualizado, error: errorUpdate } = await supabase
                .from('productos')
                .update({
                    stock_actual: nuevoStock,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productoId)
                .select()
                .single();

            if (errorUpdate) throw errorUpdate;

            // 3. Registrar movimiento de entrada de stock
            await registrarEntradaStock(producto, cantidad, observaciones, usuarioId, sucursalId);

            // 4. Actualizar estado local
            setProductos(prev => prev.map(prod =>
                prod.id === productoId ? productoActualizado : prod
            ));

            return { success: true, data: productoActualizado };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Nueva función para trasladar productos entre sucursales
    // 🔹 Función para trasladar productos entre sucursales (CORREGIDA - mismo código)
    const trasladarProducto = async (productoId, cantidad, sucursalDestinoId, observaciones, usuarioId) => {
        if (!sucursalId || !usuarioId || !sucursalDestinoId) {
            return { success: false, error: 'Sucursal origen, destino y usuario son requeridos' };
        }

        setLoading(true);
        try {
            // 1. Obtener producto actual y datos de sucursales
            const { data: producto, error: errorProducto } = await supabase
                .from('productos')
                .select('*')
                .eq('id', productoId)
                .single();

            if (errorProducto) throw errorProducto;

            // Verificar que hay suficiente stock
            if (producto.stock_actual < cantidad) {
                return { success: false, error: 'Stock insuficiente para el traslado' };
            }

            // 2. Obtener datos de sucursales
            const { data: sucursalOrigen } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('id', sucursalId)
                .single();

            const { data: sucursalDestino } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('id', sucursalDestinoId)
                .single();

            // 3. Actualizar stock en sucursal origen (restar)
            const nuevoStockOrigen = producto.stock_actual - cantidad;
            const { error: errorUpdateOrigen } = await supabase
                .from('productos')
                .update({
                    stock_actual: nuevoStockOrigen,
                    updated_at: new Date().toISOString()
                })
                .eq('id', productoId);

            if (errorUpdateOrigen) throw errorUpdateOrigen;

            // 4. 🔹 BUSCAR producto en sucursal destino (CON MISMO CÓDIGO)
            const { data: productoExistente, error: errorBusqueda } = await supabase
                .from('productos')
                .select('*')
                .eq('codigo', producto.codigo)
                .eq('sucursal_id', sucursalDestinoId)
                .maybeSingle();

            let productoActualizadoDestino;

            if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
                throw errorBusqueda;
            }

            if (productoExistente) {
                // 🔹 PRODUCTO EXISTE: actualizar stock
                const nuevoStockDestino = productoExistente.stock_actual + cantidad;
                const { data: productoActualizado, error: errorUpdateDestino } = await supabase
                    .from('productos')
                    .update({
                        stock_actual: nuevoStockDestino,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', productoExistente.id)
                    .select()
                    .single();

                if (errorUpdateDestino) throw errorUpdateDestino;
                productoActualizadoDestino = productoActualizado;
            } else {
                // 🔹 PRODUCTO NO EXISTE: crear con el MISMO código
                const { data: nuevoProducto, error: errorCrear } = await supabase
                    .from('productos')
                    .insert([{
                        codigo: producto.codigo, // 🔹 MISMO CÓDIGO
                        nombre: producto.nombre,
                        descripcion: producto.descripcion,
                        categoria_id: producto.categoria_id,
                        precio: producto.precio,
                        costo: producto.costo,
                        comision_variable: producto.comision_variable,
                        stock_inicial: cantidad,
                        stock_actual: cantidad,
                        stock_minimo: producto.stock_minimo,
                        activo: producto.activo,
                        sucursal_id: sucursalDestinoId, // 🔹 DIFERENTE SUCURSAL
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (errorCrear) {
                    console.error('Error creando producto en destino:', errorCrear);
                    throw errorCrear;
                }
                productoActualizadoDestino = nuevoProducto;
            }

            // 5. Registrar movimiento de traslado
            await registrarTraslado(
                producto,
                cantidad,
                sucursalOrigen,
                sucursalDestino,
                observaciones,
                usuarioId
            );

            // 6. Actualizar estado local
            await cargarProductos(); // Recargar para ver cambios

            return {
                success: true,
                data: {
                    productoOrigen: { ...producto, stock_actual: nuevoStockOrigen },
                    productoDestino: productoActualizadoDestino
                }
            };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error en traslado:', error);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const cargarCategorias = async () => {
        try {
            const { data, error } = await supabase
                .from('categorias')
                .select('id, nombre, reglas_comision')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            setCategorias(data || []);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    // Validar si una categoría permite comisión variable
    const categoriaPermiteComisionVariable = (categoriaId) => {
        const id = parseInt(categoriaId);
        if (isNaN(id)) return false;

        const categoria = categorias.find(cat => cat.id === id);
        if (!categoria || !categoria.reglas_comision) return false;

        return categoria.reglas_comision.comision_variable === true;
    };

    // Validar datos del producto antes de enviar
    const validarProducto = (productoData) => {
        const errors = {};

        // Validación básica de campos requeridos
        if (!productoData.codigo?.trim()) {
            errors.codigo = 'Código es requerido';
        }
        if (!productoData.nombre?.trim()) {
            errors.nombre = 'Nombre es requerido';
        }
        if (!productoData.categoria_id) {
            errors.categoria_id = 'Categoría es requerida';
        }
        if (!productoData.precio || productoData.precio < 0) {
            errors.precio = 'Precio debe ser mayor o igual a 0';
        }

        // Validación específica de comisión variable
        if (productoData.comision_variable !== null && productoData.comision_variable !== undefined && productoData.comision_variable !== '') {
            const comisionValor = parseFloat(productoData.comision_variable);

            if (isNaN(comisionValor) || comisionValor < 0) {
                errors.comision_variable = 'Comisión variable debe ser un número mayor o igual a 0';
            } else if (!categoriaPermiteComisionVariable(productoData.categoria_id)) {
                errors.comision_variable = 'La categoría seleccionada no permite comisión variable';
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    // Crear nuevo producto (sin registro de movimiento)
    // En la función crearProducto, agregar validación de código único por sucursal
    const crearProducto = async (productoData) => {
        setLoading(true);
        setError(null);

        // Validar antes de enviar
        const validacion = validarProducto(productoData);
        if (!validacion.isValid) {
            const errorMsg = 'Errores de validación: ' + JSON.stringify(validacion.errors);
            setError(errorMsg);
            setLoading(false);
            return { success: false, errors: validacion.errors, error: errorMsg };
        }

        try {
            // 🔹 Verificar si ya existe un producto con el mismo código en la misma sucursal
            const { data: productoExistente, error: errorBusqueda } = await supabase
                .from('productos')
                .select('id')
                .eq('codigo', productoData.codigo.trim())
                .eq('sucursal_id', sucursalId)
                .maybeSingle();

            if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
                throw errorBusqueda;
            }

            if (productoExistente) {
                return {
                    success: false,
                    error: 'Ya existe un producto con este código en la sucursal actual'
                };
            }

            // Preparar datos para enviar...
            const datosParaEnviar = {
                codigo: productoData.codigo.trim(),
                nombre: productoData.nombre.trim(),
                descripcion: productoData.descripcion?.trim() || null,
                categoria_id: parseInt(productoData.categoria_id),
                precio: parseFloat(productoData.precio),
                costo: productoData.costo ? parseFloat(productoData.costo) : null,
                comision_variable: categoriaPermiteComisionVariable(productoData.categoria_id) && productoData.comision_variable
                    ? parseFloat(productoData.comision_variable)
                    : null,
                stock_inicial: parseInt(productoData.stock_inicial) || 0,
                stock_minimo: parseInt(productoData.stock_minimo) || 0,
                stock_actual: parseInt(productoData.stock_inicial) || 0,
                activo: productoData.activo !== undefined ? productoData.activo : true,
                sucursal_id: sucursalId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('productos')
                .insert([datosParaEnviar])
                .select(`
          *,
          categorias (
            id,
            nombre,
            reglas_comision
          )
        `)
                .single();

            if (error) throw error;

            setProductos(prev => [data, ...prev]);
            return { success: true, data };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error creando producto:', error);
            return {
                success: false,
                error: errorMessage,
                errors: { general: errorMessage }
            };
        } finally {
            setLoading(false);
        }
    };

    // Actualizar producto existente (sin registro de movimiento)
    const actualizarProducto = async (id, productoData) => {
        setLoading(true);
        setError(null);

        const validacion = validarProducto(productoData);
        if (!validacion.isValid) {
            const errorMsg = 'Errores de validación: ' + JSON.stringify(validacion.errors);
            setError(errorMsg);
            setLoading(false);
            return { success: false, errors: validacion.errors, error: errorMsg };
        }

        try {
            const datosParaEnviar = {
                codigo: productoData.codigo.trim(),
                nombre: productoData.nombre.trim(),
                descripcion: productoData.descripcion?.trim() || null,
                categoria_id: parseInt(productoData.categoria_id),
                precio: parseFloat(productoData.precio),
                costo: productoData.costo ? parseFloat(productoData.costo) : null,
                comision_variable: categoriaPermiteComisionVariable(productoData.categoria_id) && productoData.comision_variable
                    ? parseFloat(productoData.comision_variable)
                    : null,
                stock_inicial: parseInt(productoData.stock_inicial) || 0,
                stock_minimo: parseInt(productoData.stock_minimo) || 0,
                stock_actual: parseInt(productoData.stock_actual) || 0,
                activo: productoData.activo !== undefined ? productoData.activo : true,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('productos')
                .update(datosParaEnviar)
                .eq('id', id)
                .select(`
          *,
          categorias (
            id,
            nombre,
            reglas_comision
          )
        `)
                .single();

            if (error) throw error;

            setProductos(prev => prev.map(prod =>
                prod.id === id ? data : prod
            ));
            return { success: true, data };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error actualizando producto:', error);
            return {
                success: false,
                error: errorMessage,
                errors: { general: errorMessage }
            };
        } finally {
            setLoading(false);
        }
    };

    // Eliminar producto (soft delete)
    const eliminarProducto = async (id) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('productos')
                .update({
                    activo: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            setProductos(prev => prev.filter(prod => prod.id !== id));
            return { success: true };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error eliminando producto:', error);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    };

    return {
        productos,
        categorias,
        loading,
        error,
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        añadirStock, // 🔹 Exportar función de añadir stock
        trasladarProducto, // 🔹 Exportar función de traslado
        categoriaPermiteComisionVariable,
        validarProducto,
        recargarProductos: cargarProductos
    };
};