import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener';

export const useProductos = (sucursalId) => {
    const [productos, setProductos] = useState([]);
    const sucursal_id = sucursalId;
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, [sucursalId]);

    const cargarProductos = async () => {
        if (!sucursal_id) {
            setProductos([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('productos_stock')
                .select(`
                    *,
                    producto:producto_id (
                        id,
                        codigo,
                        nombre,
                        descripcion,
                        precio,
                        costo,
                        comision_variable,
                        activo,
                        created_at,
                        updated_at,
                        categoria_id,
                        categorias (
                            id,
                            nombre,
                            reglas_comision
                        )
                    )
                `)
                .eq('sucursal_id', sucursal_id)
                .eq('producto.activo', true)
                .order('producto(codigo)', { ascending: true });

            if (error) throw error;

            // Obtener datos de la sucursal actual
            const { data: sucursalData, error: errorSucursal } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('id', sucursal_id)
                .maybeSingle();

            // 🔹 Transformar datos manteniendo la estructura original
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
                activo: item.producto.activo,
                created_at: item.producto.created_at,
                updated_at: item.producto.updated_at,
                categoria_id: item.producto.categoria_id,
                sucursal_id: sucursal_id,
                categorias: item.producto.categorias,
                sucursales: sucursalData || { id: sucursal_id, nombre: 'Cargando...' },
                stock_id: item.id,
                stock_created_at: item.created_at,
                stock_updated_at: item.updated_at
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

    // Listener para localStorage
    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser'
    ]);

    const getCurrentUser = () => {
        return localStorageValues.currentUser?.roles?.nombre || null;
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

    const categoriaPermiteComisionVariable = (categoriaId) => {
        const id = parseInt(categoriaId);
        if (isNaN(id)) return false;

        const categoria = categorias.find(cat => cat.id === id);
        if (!categoria || !categoria.reglas_comision) return false;

        return categoria.reglas_comision.comision_variable === true;
    };

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

    // Crear nuevo producto
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
            const stockInicial = parseInt(productoData.stock_inicial) || 0;

            // 1. Verificar si ya existe el código en catálogo
            const { data: catalogoExistente, error: errorBusquedaCatalogo } = await supabase
                .from('productos')
                .select('id, codigo')
                .eq('codigo', productoData.codigo.trim())
                .maybeSingle();

            if (errorBusquedaCatalogo && errorBusquedaCatalogo.code !== 'PGRST116') {
                throw errorBusquedaCatalogo;
            }

            let productoId;

            if (catalogoExistente) {
                productoId = catalogoExistente.id;

                // Verificar si ya tiene stock en esta sucursal
                const { data: stockExistente } = await supabase
                    .from('productos_stock')
                    .select('id')
                    .eq('producto_id', productoId)
                    .eq('sucursal_id', sucursal_id)
                    .maybeSingle();

                if (stockExistente) {
                    return {
                        success: false,
                        error: `El producto con código "${productoData.codigo}" ya existe en esta sucursal`
                    };
                }
            } else {
                // Crear nuevo producto en catálogo
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

            // Obtener datos de la sucursal
            const { data: sucursalInfo } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('id', sucursal_id)
                .single();

            // 2. Crear stock en la sucursal actual
            const { data: nuevoStock, error: errorStock } = await supabase
                .from('productos_stock')
                .insert({
                    producto_id: productoId,
                    sucursal_id: sucursal_id,
                    stock_actual: stockInicial,
                    stock_inicial: stockInicial,
                    stock_minimo: parseInt(productoData.stock_minimo) || 0
                })
                .select(`
                    *,
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
                activo: nuevoStock.producto.activo,
                created_at: nuevoStock.producto.created_at,
                updated_at: nuevoStock.producto.updated_at,
                categoria_id: nuevoStock.producto.categoria_id,
                sucursal_id: sucursal_id,
                categorias: nuevoStock.producto.categorias,
                sucursales: sucursalInfo,
                stock_id: nuevoStock.id,
                stock_created_at: nuevoStock.created_at,
                stock_updated_at: nuevoStock.updated_at
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

    // Actualizar producto existente
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
            // 1. Actualizar en catálogo
            const { data: catalogoActualizado, error: errorCatalogo } = await supabase
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

            // 2. Actualizar stock_minimo en productos_stock
            const { error: errorStock } = await supabase
                .from('productos_stock')
                .update({
                    stock_minimo: parseInt(productoData.stock_minimo) || 0,
                    updated_at: new Date().toISOString()
                })
                .eq('producto_id', id)
                .eq('sucursal_id', sucursal_id);

            if (errorStock) throw errorStock;

            // 3. Obtener stock actualizado
            const { data: stockActualizado, error: errorStockGet } = await supabase
                .from('productos_stock')
                .select('*')
                .eq('producto_id', id)
                .eq('sucursal_id', sucursal_id)
                .single();

            if (errorStockGet && errorStockGet.code !== 'PGRST116') throw errorStockGet;

            // Obtener sucursal
            const { data: sucursalInfo } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('id', sucursal_id)
                .single();

            // Formatear respuesta
            const productoCompleto = {
                ...catalogoActualizado,
                sucursal_id: sucursal_id,
                stock_actual: stockActualizado?.stock_actual || 0,
                stock_inicial: stockActualizado?.stock_inicial || 0,
                stock_minimo: stockActualizado?.stock_minimo || parseInt(productoData.stock_minimo) || 0,
                stock_id: stockActualizado?.id,
                stock_created_at: stockActualizado?.created_at,
                stock_updated_at: stockActualizado?.updated_at,
                sucursales: sucursalInfo
            };

            setProductos(prev => prev.map(prod =>
                prod.id === id ? productoCompleto : prod
            ));

            return { success: true, data: productoCompleto };
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

    const obtenerStock = (productoId) => {
        const producto = productos.find(p => p.id === productoId);
        return producto?.stock_actual || 0;
    };

    const tieneStockSuficiente = (productoId, cantidad) => {
        const stock = obtenerStock(productoId);
        return stock >= cantidad;
    };

    return {
        productos,
        categorias,
        loading,
        error,
        currentUser: getCurrentUser(),
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        categoriaPermiteComisionVariable,
        validarProducto,
        obtenerStock,
        tieneStockSuficiente,
        recargarProductos: cargarProductos
    };
};