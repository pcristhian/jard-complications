// src/app/dashboard/hooks/useMetas.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export const useMetas = (categorias, mesNombre, anio = null) => {
    const [metas, setMetas] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mesesDisponibles, setMesesDisponibles] = useState([]);

    // Convertir nombre de mes a número
    const getMonthNumber = useCallback((monthName) => {
        if (!monthName) return new Date().getMonth() + 1;

        const meses = {
            'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4,
            'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8,
            'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12,
            'Ene': 1, 'Feb': 2, 'Mar': 3, 'Abr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Ago': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dic': 12
        };
        return meses[monthName] || new Date().getMonth() + 1;
    }, []);

    // Obtener número a nombre de mes
    const getMonthName = useCallback((monthNumber) => {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[monthNumber - 1] || '';
    }, []);

    // 🔥 NUEVO: Obtener meses disponibles (incluyendo el actual)
    const obtenerMesesDisponibles = useCallback(async (ano) => {
        try {
            // Obtener meses con datos en la BD
            const { data, error: supabaseError } = await supabase
                .from('metas_categorias')
                .select('mes')
                .eq('anio', ano)
                .order('mes', { ascending: true });

            if (supabaseError) throw supabaseError;

            // Extraer meses únicos
            const mesesConDatos = [...new Set(data?.map(item => item.mes) || [])];

            // 🔥 SIEMPRE incluir el mes actual (aunque no tenga datos)
            const mesActual = new Date().getMonth() + 1;

            // Combinar meses con datos + mes actual (sin duplicados)
            const todosLosMeses = [...new Set([...mesesConDatos, mesActual])].sort((a, b) => a - b);

            setMesesDisponibles(todosLosMeses);
            return todosLosMeses;
        } catch (err) {
            console.error('Error obteniendo meses disponibles:', err);
            return [];
        }
    }, []);

    // Cargar metas para un mes y año específicos
    const cargarMetas = useCallback(async (mes, ano) => {
        if (!categorias || !categorias.length || !mes) return {};

        try {
            const { data, error: supabaseError } = await supabase
                .from('metas_categorias')
                .select('*')
                .eq('mes', mes)
                .eq('anio', ano)
                .in('categoria_id', categorias.map(c => c.id));

            if (supabaseError) throw supabaseError;

            const metasMap = {};
            data?.forEach(meta => {
                metasMap[meta.categoria_id] = {
                    id: meta.id,
                    valor: meta.valor_meta,
                    tipo: meta.tipo_meta,
                    categoria_id: meta.categoria_id
                };
            });

            return metasMap;
        } catch (err) {
            console.error('Error cargando metas:', err);
            setError(err.message);
            return {};
        }
    }, [categorias]);

    // Guardar o actualizar meta
    const guardarMeta = useCallback(async (categoriaId, tipoMeta, valorMeta) => {
        const mesNumero = getMonthNumber(mesNombre);
        const anoActual = anio || new Date().getFullYear();

        try {
            const { data: existing, error: findError } = await supabase
                .from('metas_categorias')
                .select('id')
                .eq('categoria_id', categoriaId)
                .eq('mes', mesNumero)
                .eq('anio', anoActual)
                .maybeSingle();

            let result;
            if (existing) {
                result = await supabase
                    .from('metas_categorias')
                    .update({
                        tipo_meta: tipoMeta,
                        valor_meta: valorMeta,
                        updated_at: new Date()
                    })
                    .eq('id', existing.id);
            } else {
                result = await supabase
                    .from('metas_categorias')
                    .insert({
                        categoria_id: categoriaId,
                        mes: mesNumero,
                        anio: anoActual,
                        tipo_meta: tipoMeta,
                        valor_meta: valorMeta
                    });
            }

            if (result.error) throw result.error;

            // Recargar metas
            const metasActualizadas = await cargarMetas(mesNumero, anoActual);
            setMetas(metasActualizadas);

            // 🔥 Actualizar meses disponibles
            await obtenerMesesDisponibles(anoActual);

            return { success: true };
        } catch (err) {
            console.error('Error guardando meta:', err);
            return { success: false, error: err.message };
        }
    }, [mesNombre, anio, getMonthNumber, cargarMetas, obtenerMesesDisponibles]);

    // Eliminar meta
    const eliminarMeta = useCallback(async (categoriaId) => {
        const mesNumero = getMonthNumber(mesNombre);
        const anoActual = anio || new Date().getFullYear();

        try {
            const { error } = await supabase
                .from('metas_categorias')
                .delete()
                .eq('categoria_id', categoriaId)
                .eq('mes', mesNumero)
                .eq('anio', anoActual);

            if (error) throw error;

            setMetas(prev => {
                const newMetas = { ...prev };
                delete newMetas[categoriaId];
                return newMetas;
            });

            // 🔥 Actualizar meses disponibles
            await obtenerMesesDisponibles(anoActual);

            return { success: true };
        } catch (err) {
            console.error('Error eliminando meta:', err);
            return { success: false, error: err.message };
        }
    }, [mesNombre, anio, getMonthNumber, obtenerMesesDisponibles]);

    // Inicializar: cargar metas
    useEffect(() => {
        const init = async () => {
            if (!categorias || !categorias.length) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const mesNumero = getMonthNumber(mesNombre);
            const anoActual = anio || new Date().getFullYear();

            // 🔥 Cargar meses disponibles
            await obtenerMesesDisponibles(anoActual);

            // Cargar metas del mes seleccionado
            const metasData = await cargarMetas(mesNumero, anoActual);
            setMetas(metasData);
            setLoading(false);
        };

        init();
    }, [categorias, mesNombre, anio, getMonthNumber, cargarMetas, obtenerMesesDisponibles]);

    const getMetaByCategoria = useCallback((categoriaId) => {
        return metas[categoriaId] || null;
    }, [metas]);

    // 🔥 NUEVO: Verificar si un mes tiene metas registradas
    const tieneMetasRegistradas = useCallback((mesNumero) => {
        const mesActual = new Date().getMonth() + 1;
        // Solo verificar si hay metas en la BD para ese mes
        // Como no tenemos esa info directamente, usamos los meses disponibles
        return mesesDisponibles.includes(mesNumero);
    }, [mesesDisponibles]);

    return {
        metas,
        loading,
        error,
        guardarMeta,
        eliminarMeta,
        cargarMetas,
        getMetaByCategoria,
        // 🔥 NUEVOS: Exponer meses disponibles y utilidades
        mesesDisponibles,
        tieneMetasRegistradas,
        getMonthName
    };
};