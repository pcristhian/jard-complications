// hooks/useGrupoRevision.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export const useGrupoRevision = (ventas, obtenerMisVentas) => {
    const [selectedVentas, setSelectedVentas] = useState(new Set());
    const [loadingGroup, setLoadingGroup] = useState(false);
    const [gruposExistentes, setGruposExistentes] = useState([]);

    const saveNoteTimeoutRef = useRef({});

    const [longPressTimer, setLongPressTimer] = useState(null);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [currentPressVenta, setCurrentPressVenta] = useState(null);
    const [zPressed, setZPressed] = useState(false);

    const coloresGrupo = [
        { nombre: 'Rojo', hex: '#FF6B6B' },
        { nombre: 'Verde', hex: '#4CAF50' },
        { nombre: 'Azul', hex: '#2196F3' },
        { nombre: 'Amarillo', hex: '#FFC107' },
        { nombre: 'Morado', hex: '#9C27B0' },
        { nombre: 'Naranja', hex: '#FF9800' },
        { nombre: 'Rosa', hex: '#E91E63' },
        { nombre: 'Celeste', hex: '#00BCD4' }
    ];

    const getColorForGroup = useCallback((groupId) => {
        const index = (groupId % coloresGrupo.length);
        return coloresGrupo[index].hex;
    }, []);

    const cargarGrupos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('grupos_revision')
                .select('*')
                .eq('activo', true)
                .order('id', { ascending: false });

            if (error) throw error;
            setGruposExistentes(data || []);
        } catch (error) {
            console.error('Error cargando grupos:', error);
        }
    }, []);

    const calcularTotalSeleccionado = useCallback((ventasIds) => {
        const ventasArray = Array.isArray(ventas) ? ventas : [];
        return ventasArray
            .filter(v => ventasIds.has(v.id))
            .reduce((sum, v) => sum + parseFloat(v.total_precio_venta || 0), 0);
    }, [ventas]);

    const obtenerVentasPorGrupo = useCallback((grupoId) => {
        const ventasArray = Array.isArray(ventas) ? ventas : [];
        return ventasArray.filter(v => v.grupo_revision_id === grupoId && v.estado === 'activa');
    }, [ventas]);

    // 🔥 ACTUALIZAR TOTAL DE UN GRUPO
    const actualizarTotalGrupo = useCallback(async (grupoId) => {
        if (!grupoId) return 0;

        try {
            const ventasArray = Array.isArray(ventas) ? ventas : [];
            const ventasDelGrupo = ventasArray.filter(v =>
                v.grupo_revision_id === grupoId && v.estado === 'activa'
            );

            const nuevoTotal = ventasDelGrupo.reduce((sum, v) =>
                sum + parseFloat(v.total_precio_venta || 0), 0
            );

            const { error } = await supabase
                .from('grupos_revision')
                .update({ total: nuevoTotal })
                .eq('id', grupoId);

            if (error) throw error;

            setGruposExistentes(prev => prev.map(g =>
                g.id === grupoId ? { ...g, total: nuevoTotal } : g
            ));

            return nuevoTotal;
        } catch (error) {
            console.error('Error actualizando total del grupo:', error);
            return 0;
        }
    }, [ventas]);

    // 🔥 RECALCULAR TODOS LOS GRUPOS (útil después de cambios)
    const recalcularTodosGrupos = useCallback(async () => {
        try {
            const gruposActivos = gruposExistentes.filter(g => g.activo === true);

            for (const grupo of gruposActivos) {
                const ventasArray = Array.isArray(ventas) ? ventas : [];
                const ventasDelGrupo = ventasArray.filter(v =>
                    v.grupo_revision_id === grupo.id && v.estado === 'activa'
                );

                if (ventasDelGrupo.length === 0) {
                    // Si no quedan ventas, desactivar el grupo
                    await supabase
                        .from('grupos_revision')
                        .update({ activo: false })
                        .eq('id', grupo.id);
                } else {
                    const nuevoTotal = ventasDelGrupo.reduce((sum, v) =>
                        sum + parseFloat(v.total_precio_venta || 0), 0
                    );

                    await supabase
                        .from('grupos_revision')
                        .update({ total: nuevoTotal })
                        .eq('id', grupo.id);
                }
            }

            await cargarGrupos();
            await obtenerMisVentas();
            toast.success('Totales de grupos actualizados');
        } catch (error) {
            console.error('Error recalculando grupos:', error);
        }
    }, [gruposExistentes, ventas, cargarGrupos, obtenerMisVentas]);

    // 🔥 NOTAS INDIVIDUALES
    const guardarNotaIndividual = useCallback(async (ventaId, nota) => {
        try {
            const { error } = await supabase
                .from('ventas')
                .update({ nota_individual: nota })
                .eq('id', ventaId);
            if (error) throw error;
        } catch (error) {
            console.error('Error guardando nota individual:', error);
        }
    }, []);

    const handleNoteChange = useCallback((ventaId, value) => {
        if (saveNoteTimeoutRef.current[ventaId]) {
            clearTimeout(saveNoteTimeoutRef.current[ventaId]);
        }
        saveNoteTimeoutRef.current[ventaId] = setTimeout(() => {
            guardarNotaIndividual(ventaId, value);
        }, 800);
    }, [guardarNotaIndividual]);

    const getVentaNote = useCallback((venta) => {
        return venta?.nota_individual || '';
    }, []);

    const desagruparVenta = useCallback(async (venta) => {
        if (!venta.grupo_revision_id) {
            toast('Esta venta no pertenece a ningún grupo', { icon: 'ℹ️' });
            return false;
        }

        if (venta.estado === 'anulada') {
            toast.error('No se puede desagrupar una venta anulada');
            return false;
        }

        const grupoId = venta.grupo_revision_id;

        try {
            // 1. Quitar la venta seleccionada del grupo
            const { error } = await supabase
                .from('ventas')
                .update({ grupo_revision_id: null })
                .eq('id', venta.id);

            if (error) throw error;

            // 2. Recargar datos para tener la información actualizada
            await obtenerMisVentas();

            // 3. Verificar cuántas ventas quedan en el grupo
            const { data: ventasRestantes, error: queryError } = await supabase
                .from('ventas')
                .select('id, total_precio_venta, estado')
                .eq('grupo_revision_id', grupoId)
                .eq('estado', 'activa');

            if (queryError) throw queryError;

            const cantidadRestante = ventasRestantes?.length || 0;

            if (cantidadRestante === 0) {
                // Si no quedan ventas, desactivar el grupo
                await supabase
                    .from('grupos_revision')
                    .update({ activo: false })
                    .eq('id', grupoId);
                toast.success('Grupo eliminado por estar vacío');
            }
            else if (cantidadRestante === 1) {
                // 🔥 Si queda UNA sola venta, también la desagrupamos (no tiene sentido un grupo de 1)
                const ventaSolaId = ventasRestantes[0].id;

                await supabase
                    .from('ventas')
                    .update({ grupo_revision_id: null })
                    .eq('id', ventaSolaId);

                // Desactivar el grupo
                await supabase
                    .from('grupos_revision')
                    .update({ activo: false })
                    .eq('id', grupoId);

                toast.success('Grupo disuelto - solo quedaba una venta');
            }
            else {
                // Si quedan 2 o más ventas, solo actualizar el total
                const nuevoTotal = ventasRestantes.reduce((sum, v) =>
                    sum + parseFloat(v.total_precio_venta || 0), 0
                );

                await supabase
                    .from('grupos_revision')
                    .update({ total: nuevoTotal })
                    .eq('id', grupoId);

                toast.success(`Venta removida - Grupo actualizado: Bs. ${nuevoTotal.toFixed(2)}`);
            }

            // Recargar todo para asegurar consistencia
            await cargarGrupos();
            await obtenerMisVentas();

            return true;

        } catch (error) {
            console.error('Error al desagrupar:', error);
            toast.error('Error al desagrupar la venta');
            return false;
        }
    }, [obtenerMisVentas, cargarGrupos]);
    // Manejador de tecla Z
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'KeyZ' && isLongPressing && currentPressVenta) {
                e.preventDefault();
                setZPressed(true);
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'KeyZ') {
                if (isLongPressing && currentPressVenta && zPressed) {
                    desagruparVenta(currentPressVenta);
                }
                setZPressed(false);
                setIsLongPressing(false);
                setCurrentPressVenta(null);
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (longPressTimer) {
                clearTimeout(longPressTimer);
            }
        };
    }, [isLongPressing, currentPressVenta, zPressed, longPressTimer, desagruparVenta]);

    // 🔥 LIMPIAR GRUPOS HUÉRFANOS (para ejecutar ocasionalmente)
    const limpiarGruposHuerfanos = useCallback(async () => {
        try {
            // Obtener todos los grupos activos
            const { data: gruposActivos, error: gruposError } = await supabase
                .from('grupos_revision')
                .select('id')
                .eq('activo', true);

            if (gruposError) throw gruposError;

            let limpiados = 0;

            for (const grupo of gruposActivos) {
                // Contar ventas activas en este grupo
                const { count, error: countError } = await supabase
                    .from('ventas')
                    .select('id', { count: 'exact', head: true })
                    .eq('grupo_revision_id', grupo.id)
                    .eq('estado', 'activa');

                if (countError) throw countError;

                // Si tiene 0 o 1 venta, desactivar el grupo
                if (count === 0 || count === 1) {
                    if (count === 1) {
                        // La venta solitaria también pierde el grupo
                        const { data: ventaSola } = await supabase
                            .from('ventas')
                            .select('id')
                            .eq('grupo_revision_id', grupo.id)
                            .eq('estado', 'activa')
                            .single();

                        if (ventaSola) {
                            await supabase
                                .from('ventas')
                                .update({ grupo_revision_id: null })
                                .eq('id', ventaSola.id);
                        }
                    }

                    await supabase
                        .from('grupos_revision')
                        .update({ activo: false })
                        .eq('id', grupo.id);

                    limpiados++;
                }
            }

            if (limpiados > 0) {
                toast.success(`Se limpiaron ${limpiados} grupos con ventas solitarias`);
                await cargarGrupos();
                await obtenerMisVentas();
            } else {
                toast.success('No se encontraron grupos huérfanos');
            }
        } catch (error) {
            console.error('Error limpiando grupos huérfanos:', error);
            toast.error('Error al limpiar grupos');
        }
    }, [cargarGrupos, obtenerMisVentas]);

    const handleMouseDown = useCallback((e, venta) => {
        if (!venta.grupo_revision_id) return;
        if (venta.estado === 'anulada') return;

        e.preventDefault();

        const timer = setTimeout(() => {
            setIsLongPressing(true);
            setCurrentPressVenta(venta);
            toast(
                <div className="flex items-center gap-2">
                    <span className="text-lg">⌨️</span>
                    <span>Mantén presionada <kbd className="px-2 py-0.5 bg-gray-200 rounded font-mono">Z</kbd> para desagrupar</span>
                </div>,
                { duration: 2000, icon: '💡' }
            );
        }, 500);

        setLongPressTimer(timer);
    }, []);

    const handleMouseUp = useCallback(() => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        if (!zPressed) {
            setIsLongPressing(false);
            setCurrentPressVenta(null);
        }
    }, [longPressTimer, zPressed]);

    const handleDragStart = useCallback((e, index, ventaId) => {
        e.dataTransfer.setData('text/plain', ventaId);
        e.dataTransfer.effectAllowed = 'copy';
        e.target.style.opacity = '0.5';
    }, []);

    const handleDragEnd = useCallback((e) => {
        if (e.target) e.target.style.opacity = '';
    }, []);

    const handleDrop = useCallback(async (e, targetVentaId, targetIndex) => {
        e.preventDefault();

        const sourceVentaId = e.dataTransfer.getData('text/plain');
        if (!sourceVentaId || sourceVentaId === targetVentaId) return;

        const ventasArray = Array.isArray(ventas) ? ventas : [];
        const sourceIdx = ventasArray.findIndex(v => v.id.toString() === sourceVentaId);
        const targetIdx = ventasArray.findIndex(v => v.id.toString() === targetVentaId.toString());

        if (sourceIdx === -1 || targetIdx === -1) return;

        const start = Math.min(sourceIdx, targetIdx);
        const end = Math.max(sourceIdx, targetIdx);
        const ventasSeleccionadas = ventasArray.slice(start, end + 1);

        const hasAnuladas = ventasSeleccionadas.some(v => v.estado === 'anulada');
        if (hasAnuladas) {
            toast.error('No se pueden agrupar ventas anuladas');
            return;
        }

        setLoadingGroup(true);

        try {
            const ventasIds = ventasSeleccionadas.map(v => v.id);
            const total = calcularTotalSeleccionado(new Set(ventasIds));

            // Guardar grupos afectados antes de modificarlos
            const gruposAfectados = [...new Set(ventasSeleccionadas
                .filter(v => v.grupo_revision_id)
                .map(v => v.grupo_revision_id))];

            // Quitar grupos existentes de estas ventas
            if (gruposAfectados.length > 0) {
                await supabase
                    .from('ventas')
                    .update({ grupo_revision_id: null })
                    .in('id', ventasSeleccionadas.filter(v => v.grupo_revision_id).map(v => v.id));
            }

            // Crear nuevo grupo
            const { data: grupo, error: grupoError } = await supabase
                .from('grupos_revision')
                .insert({
                    color_hex: getColorForGroup(Date.now()),
                    nota: '',
                    total: total
                })
                .select()
                .single();

            if (grupoError) throw grupoError;

            // Asignar ventas al nuevo grupo
            const { error: updateError } = await supabase
                .from('ventas')
                .update({ grupo_revision_id: grupo.id })
                .in('id', ventasIds);

            if (updateError) throw updateError;

            // Actualizar los grupos que perdieron ventas
            for (const grupoId of gruposAfectados) {
                await actualizarTotalGrupo(grupoId);
            }

            await obtenerMisVentas();
            await cargarGrupos();

            toast.success(`✅ ${ventasIds.length} ventas agrupadas | Total: Bs. ${total.toFixed(2)}`);

        } catch (error) {
            console.error('Error creando grupo:', error);
            toast.error('Error al crear el grupo: ' + error.message);
        } finally {
            setLoadingGroup(false);
            setSelectedVentas(new Set());
        }

        if (e.target) e.target.style.opacity = '';
    }, [ventas, calcularTotalSeleccionado, getColorForGroup, obtenerMisVentas, cargarGrupos, actualizarTotalGrupo]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const getVentaGroupColor = useCallback((venta) => {
        if (!venta.grupo_revision_id) return null;
        const grupo = gruposExistentes.find(g => g.id === venta.grupo_revision_id);
        return grupo?.color_hex || null;
    }, [gruposExistentes]);

    const getVentaGroupNote = useCallback((venta) => {
        if (!venta.grupo_revision_id) return '';
        const grupo = gruposExistentes.find(g => g.id === venta.grupo_revision_id);
        return grupo?.nota || '';
    }, [gruposExistentes]);

    useEffect(() => {
        cargarGrupos();
    }, [cargarGrupos]);

    useEffect(() => {
        return () => {
            Object.values(saveNoteTimeoutRef.current).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
            });
        };
    }, []);

    return {
        selectedVentas,
        loadingGroup,
        coloresGrupo,
        gruposExistentes,
        handleDragStart,
        handleDragEnd,
        handleDrop,
        handleDragOver,
        handleMouseDown,
        handleMouseUp,
        handleNoteChange,
        getVentaNote,
        getVentaGroupColor,
        getVentaGroupNote,
        cargarGrupos,
        recalcularTodosGrupos,
        actualizarTotalGrupo,
        limpiarGruposHuerfanos
    };
};