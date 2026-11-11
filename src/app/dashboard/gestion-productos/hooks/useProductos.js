import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener';

export const useProductos = (sucursalId) => {
    const [productos, setProductos] = useState([]);
    const sucursal_id = sucursalId;
    const [categorias, setCategorias] = useState([]);
    const [catalogoGlobal, setCatalogoGlobal] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
        cargarCatalogoGlobal();
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
                .order('producto(codigo)', { ascending: true });

            if (error) throw error;

            const { data: sucursalData, error: errorSucursal } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('id', sucursal_id)
                .maybeSingle();

            const productosFormateados = data
                .filter(item => item.producto !== null)
                .map(item => ({
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

    // 🔹 Catálogo global: TODOS los productos (sin importar stock en sucursal)
    // Se usa para validar códigos únicos globalmente
    const cargarCatalogoGlobal = async () => {
        try {
            const { data, error } = await supabase
                .from('productos')
                .select('id, codigo, nombre, activo')
                .order('codigo', { ascending: true });

            if (error) throw error;
            setCatalogoGlobal(data || []);
        } catch (error) {
            console.error('Error cargando catálogo global:', error);
        }
    };

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

    // Crear nuevo producto (global + stock en todas las sucursales)
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
            const stockMinimo = parseInt(productoData.stock_minimo) || 0;
            const codigoNormalizado = productoData.codigo.trim();

            // 1. Verificar si el código ya existe en el catálogo GLOBAL
            const { data: catalogoExistente, error: errorBusquedaCatalogo } = await supabase
                .from('productos')
                .select('id, codigo, nombre')
                .eq('codigo', codigoNormalizado)
                .maybeSingle();

            if (errorBusquedaCatalogo && errorBusquedaCatalogo.code !== 'PGRST116') {
                throw errorBusquedaCatalogo;
            }

            if (catalogoExistente) {
                const msg = `El código "${codigoNormalizado}" ya existe en el catálogo (producto: "${catalogoExistente.nombre}"). Los códigos son únicos globalmente para todas las sucursales.`;
                setError(msg);
                setLoading(false);
                return { success: false, error: msg, errors: { codigo: msg } };
            }

            // 2. Crear producto en catálogo global
            const { data: nuevoCatalogo, error: errorCatalogo } = await supabase
                .from('productos')
                .insert({
                    codigo: codigoNormalizado,
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
            const productoId = nuevoCatalogo.id;

            // 3. Obtener TODAS las sucursales activas
            const { data: sucursalesActivas, error: errorSucursales } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('activo', true);

            if (errorSucursales) throw errorSucursales;
            if (!sucursalesActivas || sucursalesActivas.length === 0) {
                // Rollback del producto recién creado
                await supabase.from('productos').delete().eq('id', productoId);
                throw new Error('No hay sucursales activas para asignar stock');
            }

            // 4. Crear fila de stock en TODAS las sucursales
            //    Stock inicial/mínimo solo en la sucursal actual; el resto en 0
            const stocksAInsertar = sucursalesActivas.map(s => ({
                producto_id: productoId,
                sucursal_id: s.id,
                stock_actual: s.id === sucursal_id ? stockInicial : 0,
                stock_inicial: s.id === sucursal_id ? stockInicial : 0,
                stock_minimo: s.id === sucursal_id ? stockMinimo : 0
            }));

            const { data: stocksCreados, error: errorStock } = await supabase
                .from('productos_stock')
                .insert(stocksAInsertar)
                .select(`
                    *,
                    producto:producto_id (
                        *,
                        categorias (*)
                    )
                `);

            if (errorStock) {
                // Rollback manual: borrar el producto recién creado
                await supabase.from('productos').delete().eq('id', productoId);
                throw errorStock;
            }

            // 5. Formatear el producto de la sucursal actual para el state local
            const stockActual = stocksCreados.find(s => s.sucursal_id === sucursal_id);
            const sucursalInfo = sucursalesActivas.find(s => s.id === sucursal_id);

            const productoCompleto = {
                id: nuevoCatalogo.id,
                codigo: nuevoCatalogo.codigo,
                nombre: nuevoCatalogo.nombre,
                descripcion: nuevoCatalogo.descripcion,
                precio: nuevoCatalogo.precio,
                costo: nuevoCatalogo.costo,
                comision_variable: nuevoCatalogo.comision_variable,
                stock_actual: stockActual?.stock_actual ?? 0,
                stock_inicial: stockActual?.stock_inicial ?? 0,
                stock_minimo: stockActual?.stock_minimo ?? 0,
                activo: nuevoCatalogo.activo,
                created_at: nuevoCatalogo.created_at,
                updated_at: nuevoCatalogo.updated_at,
                categoria_id: nuevoCatalogo.categoria_id,
                sucursal_id: sucursal_id,
                categorias: stockActual?.producto?.categorias ?? null,
                sucursales: sucursalInfo ? { id: sucursalInfo.id, nombre: sucursalInfo.nombre } : null,
                stock_id: stockActual?.id,
                stock_created_at: stockActual?.created_at,
                stock_updated_at: stockActual?.updated_at
            };

            setProductos(prev => [productoCompleto, ...prev]);

            // 🔹 Actualizar catálogo global en memoria para que la próxima validación lo vea
            setCatalogoGlobal(prev => [
                ...prev,
                {
                    id: nuevoCatalogo.id,
                    codigo: nuevoCatalogo.codigo,
                    nombre: nuevoCatalogo.nombre,
                    activo: nuevoCatalogo.activo
                }
            ]);

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
            const codigoNormalizado = productoData.codigo.trim();

            // 🔹 Validar código duplicado globalmente (excluyendo el producto actual)
            const { data: codigoExistente, error: errorCodigo } = await supabase
                .from('productos')
                .select('id, codigo, nombre')
                .eq('codigo', codigoNormalizado)
                .neq('id', id)
                .maybeSingle();

            if (errorCodigo && errorCodigo.code !== 'PGRST116') {
                throw errorCodigo;
            }

            if (codigoExistente) {
                const msg = `El código "${codigoNormalizado}" ya existe en el catálogo (producto: "${codigoExistente.nombre}"). Los códigos son únicos globalmente.`;
                setError(msg);
                setLoading(false);
                return { success: false, error: msg, errors: { codigo: msg } };
            }

            // 1. Actualizar en catálogo
            const { data: catalogoActualizado, error: errorCatalogo } = await supabase
                .from('productos')
                .update({
                    codigo: codigoNormalizado,
                    nombre: productoData.nombre.trim(),
                    descripcion: productoData.descripcion?.trim() || null,
                    categoria_id: parseInt(productoData.categoria_id),
                    precio: parseFloat(productoData.precio),
                    costo: productoData.costo ? parseFloat(productoData.costo) : null,
                    comision_variable: categoriaPermiteComisionVariable(productoData.categoria_id) && productoData.comision_variable
                        ? parseFloat(productoData.comision_variable)
                        : null,
                    activo: productoData.activo,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select(`
                *,
                categorias (*)
            `)
                .single();

            if (errorCatalogo) throw errorCatalogo;

            // 2. Actualizar stock_minimo en productos_stock (solo sucursal actual)
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

            // 🔹 Sincronizar catálogo global en memoria
            setCatalogoGlobal(prev => prev.map(cat =>
                cat.id === id
                    ? { ...cat, codigo: catalogoActualizado.codigo, nombre: catalogoActualizado.nombre, activo: catalogoActualizado.activo }
                    : cat
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
            setCatalogoGlobal(prev => prev.map(cat =>
                cat.id === id ? { ...cat, activo: false } : cat
            ));

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
        catalogoGlobal,
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
        recargarProductos: () => {
            cargarProductos();
            cargarCatalogoGlobal();
        }
    };
};