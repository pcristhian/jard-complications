import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client'; // Ajusta la ruta según tu configuración

export const useProductos = (sucursalId) => {
    const [productos, setProductos] = useState([]);
    const sucursal_id = sucursalId; // Renombrar para consistencia
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarProductos();
        cargarCategorias();
    }, [sucursalId]); // 🔹 Recargar cuando cambie la sucursal

    const cargarProductos = async () => {
        if (!sucursal_id) {
            return;
        }

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
  ),
  sucursales (
    id,
    nombre
  )
`)
                .order('codigo', { ascending: true });

            // 🔹 Filtrar por sucursal si está definida
            if (sucursal_id) {
                query = query.eq('sucursal_id', sucursal_id);
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
        // Convertir a número si es string
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

    // Crear nuevo producto
    // Crear nuevo producto
    const crearProducto = async (productoData) => {
        setLoading(true);
        setError(null);

        // Validación estándar
        const validacion = validarProducto(productoData);
        if (!validacion.isValid) {
            const errorMsg = 'Errores de validación: ' + JSON.stringify(validacion.errors);
            setError(errorMsg);
            setLoading(false);
            return { success: false, errors: validacion.errors, error: errorMsg };
        }

        try {
            // Preparar datos para enviar
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
                stock_actual: parseInt(productoData.stock_inicial) || 0, // Inicialmente igual a stock_inicial
                activo: productoData.activo !== undefined ? productoData.activo : true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                sucursal_id: sucursalId || null // ← Este es el sucursal_id que debe usarse
            };

            // 🔥 CORREGIDO: VALIDACIÓN DE CÓDIGO ÚNICO POR SUCURSAL
            // Importante: filtrar por sucursal_id además del código
            const { data: productoExistente } = await supabase
                .from("productos")
                .select("id, sucursal_id, codigo, nombre")
                .eq("codigo", datosParaEnviar.codigo.trim())
                .eq("sucursal_id", datosParaEnviar.sucursal_id) // ← ¡FILTRAR POR SUCURSAL!
                .maybeSingle();

            if (productoExistente) {
                const msg = `El código "${datosParaEnviar.codigo}" ya existe en esta sucursal. Use un código diferente.`;
                setError(msg);
                setLoading(false);
                return {
                    success: false,
                    errors: { codigo: msg }
                };
            }

            // Crear el producto
            const { data, error } = await supabase
                .from('productos')
                .insert([datosParaEnviar])
                .select(`
                *,
                categorias (
                    id,
                    nombre,
                    reglas_comision
                ),
                sucursales (
                    id,
                    nombre
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

    // Actualizar producto existente
    // Actualizar producto existente
    const actualizarProducto = async (id, productoData) => {
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
            // Preparar datos para enviar
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
                updated_at: new Date().toISOString(),
                sucursal_id: sucursalId || null // Asegurar que tenga sucursal_id
            };

            // 🔥 CORREGIDO: Validar código único excluyendo el producto actual
            const { data: productoExistente } = await supabase
                .from("productos")
                .select("id, sucursal_id, codigo")
                .eq("codigo", datosParaEnviar.codigo.trim())
                .eq("sucursal_id", datosParaEnviar.sucursal_id)
                .neq("id", id) // ← Excluir el producto actual
                .maybeSingle();

            if (productoExistente) {
                const msg = `El código "${datosParaEnviar.codigo}" ya existe en esta sucursal. Use un código diferente.`;
                setError(msg);
                setLoading(false);
                return {
                    success: false,
                    errors: { codigo: msg }
                };
            }

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
                ),
                sucursales (
                    id,
                    nombre
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
        categoriaPermiteComisionVariable,
        validarProducto,
        recargarProductos: cargarProductos
    };
};