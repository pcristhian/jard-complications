import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export const useInventarioFisico = (sucursalId) => {
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
                .select('id, nombre')
                .order('nombre', { ascending: true });

            if (error) throw error;
            setCategorias(data || []);
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    };

    return {
        productos,
        categorias,
        loading,
        error,
        recargarProductos: cargarProductos
    };
};