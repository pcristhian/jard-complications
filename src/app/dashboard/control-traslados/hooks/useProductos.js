import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMovimientos } from './useMovimientos';

export const useProductos = (sucursalId) => {
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { registrarEntradaStock, registrarTraslado } = useMovimientos();

    useEffect(() => {
        if (sucursalId) {
            cargarProductos();
        }
        cargarCategorias();
    }, [sucursalId]);

    // Cargar productos con stock de la sucursal actual
    const cargarProductos = async () => {
        if (!sucursalId) {
            setProductos([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('productos_stock')
                .select(`
                    id,
                    stock_actual,
                    stock_inicial,
                    stock_minimo,
                    created_at,
                    updated_at,
                    producto:producto_id (
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        precio,
                        costo,
                        comision_variable,
                        activo,
                        categoria_id,
                        categorias (
                            id,
                            nombre,
                            reglas_comision
                        )
                    )
                `)
                .eq('sucursal_id', sucursalId)
                .eq('producto.activo', true);

            if (error) throw error;

            // Transformar datos para mantener la misma estructura que antes
            const productosFormateados = data.map(item => ({
                id: item.producto.id,
                codigo: item.producto.codigo,
                nombre: item.producto.nombre,
                descripcion: item.producto.descripcion,
                precio: item.producto.precio,
                costo: item.producto.costo,
                comision_variable: item.producto.comision_variable,
                stock_actual: item.stock_actual,
                stock_inicial: item.stock_inicial,
                stock_minimo: item.stock_minimo,
                categoria_id: item.producto.categoria_id,
                categorias: item.producto.categorias,
                activo: item.producto.activo,
                sucursal_id: sucursalId,
                stock_id: item.id,
                created_at: item.created_at,
                updated_at: item.updated_at
            }));

            setProductos(productosFormateados);
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Función para añadir stock con registro de movimiento
    const añadirStock = async (productoId, cantidad, observaciones, usuarioId) => {
        if (!sucursalId || !usuarioId) {
            return { success: false, error: 'Sucursal y usuario son requeridos' };
        }

        setLoading(true);
        try {
            // 1. Obtener producto del catálogo
            const { data: productoCatalogo, error: errorProducto } = await supabase
                .from('productos')
                .select('*, categorias(*)')
                .eq('id', productoId)
                .single();

            if (errorProducto) throw errorProducto;

            // 2. Obtener stock actual en la sucursal
            const { data: stockActual, error: errorStock } = await supabase
                .from('productos_stock')
                .select('*')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .single();

            if (errorStock && errorStock.code !== 'PGRST116') throw errorStock;

            let stockActualizado;

            if (stockActual) {
                // Actualizar stock existente
                const nuevoStock = stockActual.stock_actual + cantidad;
                const { data: updated, error: errorUpdate } = await supabase
                    .from('productos_stock')
                    .update({
                        stock_actual: nuevoStock,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', stockActual.id)
                    .select()
                    .single();

                if (errorUpdate) throw errorUpdate;
                stockActualizado = updated;
            } else {
                // Crear nuevo registro de stock
                const { data: newStock, error: errorCreate } = await supabase
                    .from('productos_stock')
                    .insert({
                        producto_id: productoId,
                        sucursal_id: sucursalId,
                        stock_actual: cantidad,
                        stock_inicial: cantidad,
                        stock_minimo: 0
                    })
                    .select()
                    .single();

                if (errorCreate) throw errorCreate;
                stockActualizado = newStock;
            }

            // 3. Registrar movimiento de entrada de stock
            await registrarEntradaStock(productoCatalogo, cantidad, observaciones, usuarioId, sucursalId);

            // 4. Actualizar estado local
            await cargarProductos();

            return {
                success: true,
                data: {
                    ...productoCatalogo,
                    stock_actual: stockActualizado.stock_actual
                }
            };
        } catch (error) {
            const errorMessage = error.message || error.details || JSON.stringify(error);
            setError(errorMessage);
            console.error('Error añadiendo stock:', error);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Función para trasladar productos entre sucursales
    const trasladarProducto = async (productoId, cantidad, sucursalDestinoId, observaciones, usuarioId) => {
        if (!sucursalId || !usuarioId || !sucursalDestinoId) {
            return { success: false, error: 'Sucursal origen, destino y usuario son requeridos' };
        }

        setLoading(true);
        try {
            // 1. Obtener producto del catálogo
            const { data: productoCatalogo, error: errorProducto } = await supabase
                .from('productos')
                .select('*, categorias(*)')
                .eq('id', productoId)
                .single();

            if (errorProducto) throw errorProducto;

            // 2. Obtener stock en sucursal origen
            const { data: stockOrigen, error: errorStockOrigen } = await supabase
                .from('productos_stock')
                .select('*')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalId)
                .single();

            if (errorStockOrigen) throw errorStockOrigen;

            // Verificar stock suficiente
            if (!stockOrigen || stockOrigen.stock_actual < cantidad) {
                return { success: false, error: 'Stock insuficiente para el traslado' };
            }

            // 3. Obtener datos de sucursales
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

            // 4. Actualizar stock en origen (restar)
            const nuevoStockOrigen = stockOrigen.stock_actual - cantidad;
            const { error: errorUpdateOrigen } = await supabase
                .from('productos_stock')
                .update({
                    stock_actual: nuevoStockOrigen,
                    updated_at: new Date().toISOString()
                })
                .eq('id', stockOrigen.id);

            if (errorUpdateOrigen) throw errorUpdateOrigen;

            // 5. Buscar o crear stock en destino
            const { data: stockDestino, error: errorStockDestino } = await supabase
                .from('productos_stock')
                .select('*')
                .eq('producto_id', productoId)
                .eq('sucursal_id', sucursalDestinoId)
                .maybeSingle();

            let stockActualizadoDestino;

            if (stockDestino) {
                // Actualizar stock existente en destino
                const nuevoStockDestino = stockDestino.stock_actual + cantidad;
                const { data: updated, error: errorUpdateDestino } = await supabase
                    .from('productos_stock')
                    .update({
                        stock_actual: nuevoStockDestino,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', stockDestino.id)
                    .select()
                    .single();

                if (errorUpdateDestino) throw errorUpdateDestino;
                stockActualizadoDestino = updated;
            } else {
                // Crear nuevo registro de stock en destino
                const { data: newStock, error: errorCreateDestino } = await supabase
                    .from('productos_stock')
                    .insert({
                        producto_id: productoId,
                        sucursal_id: sucursalDestinoId,
                        stock_actual: cantidad,
                        stock_inicial: cantidad,
                        stock_minimo: 0
                    })
                    .select()
                    .single();

                if (errorCreateDestino) throw errorCreateDestino;
                stockActualizadoDestino = newStock;
            }

            // 6. Registrar movimiento de traslado
            await registrarTraslado(
                productoCatalogo,
                cantidad,
                sucursalOrigen,
                sucursalDestino,
                observaciones,
                usuarioId
            );

            // 7. Recargar productos para ver cambios
            await cargarProductos();

            return {
                success: true,
                data: {
                    productoOrigen: { ...productoCatalogo, stock_actual: nuevoStockOrigen },
                    productoDestino: { ...productoCatalogo, stock_actual: stockActualizadoDestino.stock_actual }
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

    // Crear nuevo producto (en catálogo y stock inicial)
    const crearProducto = async (productoData) => {
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
            // 1. Verificar si ya existe el código en catálogo
            const { data: productoExistente, error: errorBusqueda } = await supabase
                .from('productos')
                .select('id')
                .eq('codigo', productoData.codigo.trim())
                .maybeSingle();

            if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
                throw errorBusqueda;
            }

            let productoId;

            if (productoExistente) {
                // Producto ya existe en catálogo, usar ese ID
                productoId = productoExistente.id;

                // Verificar si ya tiene stock en esta sucursal
                const { data: stockExistente } = await supabase
                    .from('productos_stock')
                    .select('id')
                    .eq('producto_id', productoId)
                    .eq('sucursal_id', sucursalId)
                    .maybeSingle();

                if (stockExistente) {
                    return {
                        success: false,
                        error: 'Ya existe un producto con este código en la sucursal actual'
                    };
                }
            } else {
                // 2. Crear en catálogo
                const { data: nuevoCatalogo, error: errorCatalogo } = await supabase
                    .from('productos')
                    .insert({
                        codigo: productoData.codigo.trim(),
                        nombre: productoData.nombre.trim(),
                        descripcion: productoData.descripcion?.trim() || null,
                        categoria_id: parseInt(productoData.categoria_id),
                        precio: parseFloat(productoData.precio),
                        costo: productoData.costo ? parseFloat(productoData.costo) : null,
                        comision_variable: categoriaPermiteComisionVariable(productoData.categoria_id) && productoData.comision_variable
                            ? parseFloat(productoData.comision_variable)
                            : null,
                        activo: true
                    })
                    .select()
                    .single();

                if (errorCatalogo) throw errorCatalogo;
                productoId = nuevoCatalogo.id;
            }

            // 3. Crear stock en la sucursal actual
            const stockInicial = parseInt(productoData.stock_inicial) || 0;
            const { data: nuevoStock, error: errorStock } = await supabase
                .from('productos_stock')
                .insert({
                    producto_id: productoId,
                    sucursal_id: sucursalId,
                    stock_actual: stockInicial,
                    stock_inicial: stockInicial,
                    stock_minimo: parseInt(productoData.stock_minimo) || 0
                })
                .select(`
                    id,
                    stock_actual,
                    stock_inicial,
                    stock_minimo,
                    producto:producto_id (
                        *,
                        categorias (*)
                    )
                `)
                .single();

            if (errorStock) throw errorStock;

            // Formatear respuesta
            const productoCompleto = {
                id: nuevoStock.producto.id,
                codigo: nuevoStock.producto.codigo,
                nombre: nuevoStock.producto.nombre,
                descripcion: nuevoStock.producto.descripcion,
                precio: nuevoStock.producto.precio,
                costo: nuevoStock.producto.costo,
                comision_variable: nuevoStock.producto.comision_variable,
                stock_actual: nuevoStock.stock_actual,
                stock_inicial: nuevoStock.stock_inicial,
                stock_minimo: nuevoStock.stock_minimo,
                categoria_id: nuevoStock.producto.categoria_id,
                categorias: nuevoStock.producto.categorias,
                activo: nuevoStock.producto.activo,
                sucursal_id: sucursalId,
                stock_id: nuevoStock.id,
                created_at: nuevoStock.created_at,
                updated_at: nuevoStock.updated_at
            };

            setProductos(prev => [productoCompleto, ...prev]);
            return { success: true, data: productoCompleto };
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

    // Actualizar producto existente (solo información del catálogo)
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
            // Actualizar en catálogo
            const { data: productoActualizado, error: errorCatalogo } = await supabase
                .from('productos')
                .update({
                    codigo: productoData.codigo.trim(),
                    nombre: productoData.nombre.trim(),
                    descripcion: productoData.descripcion?.trim() || null,
                    categoria_id: parseInt(productoData.categoria_id),
                    precio: parseFloat(productoData.precio),
                    costo: productoData.costo ? parseFloat(productoData.costo) : null,
                    comision_variable: categoriaPermiteComisionVariable(productoData.categoria_id) && productoData.comision_variable
                        ? parseFloat(productoData.comision_variable)
                        : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                    *,
                    categorias (*)
                `)
                .single();

            if (errorCatalogo) throw errorCatalogo;

            // Actualizar stock_minimo en productos_stock para esta sucursal
            const { error: errorStock } = await supabase
                .from('productos_stock')
                .update({
                    stock_minimo: parseInt(productoData.stock_minimo) || 0,
                    updated_at: new Date().toISOString()
                })
                .eq('producto_id', id)
                .eq('sucursal_id', sucursalId);

            if (errorStock) throw errorStock;

            // Actualizar estado local
            setProductos(prev => prev.map(prod =>
                prod.id === id ? { ...prod, ...productoActualizado, stock_minimo: parseInt(productoData.stock_minimo) || 0 } : prod
            ));

            return { success: true, data: productoActualizado };
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

    // Eliminar producto (soft delete en catálogo)
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
        añadirStock,
        trasladarProducto,
        categoriaPermiteComisionVariable,
        validarProducto,
        recargarProductos: cargarProductos
    };
};