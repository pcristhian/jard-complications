// hooks/useGrupoRevision.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export const useGrupoRevision = (ventas, obtenerMisVentas) => {
    const [selectedVentas, setSelectedVentas] = useState(new Set());
    const [loadingGroup, setLoadingGroup] = useState(false);
    const [gruposExistentes, setGruposExistentes] = useState([]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [selectedGroupForColor, setSelectedGroupForColor] = useState(null);
    const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });

    const saveNoteTimeoutRef = useRef({});

    const [longPressTimer, setLongPressTimer] = useState(null);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [currentPressVenta, setCurrentPressVenta] = useState(null);
    const [zPressed, setZPressed] = useState(false);

    // En useGrupoRevision.js
    const coloresGrupo = [
        { nombre: 'Rojo', hex: '#FF6B6B' },
        { nombre: 'Naranja', hex: '#FF9800' },
        { nombre: 'Amarillo', hex: '#FFC107' },
        { nombre: 'Lima', hex: '#8BC34A' },
        { nombre: 'Verde', hex: '#4CAF50' },
        { nombre: 'Celeste', hex: '#00BCD4' },
        { nombre: 'Azules', hex: '#2196F3' },
        { nombre: 'Índigo', hex: '#3F51B5' },
        { nombre: 'Morado', hex: '#9C27B0' },
        { nombre: 'Rosa', hex: '#E91E63' },
        { nombre: 'Gris', hex: '#607D8B' },
        { nombre: 'Negro', hex: '#000000' }  // Al final (más oscuro)
    ];

    const getColorForGroup = useCallback((groupId) => {
        const index = (groupId % coloresGrupo.length);
        return coloresGrupo[index].hex;
    }, []);

    // 🔥 NUEVA FUNCIÓN: Cambiar color del grupo
    const cambiarColorGrupo = useCallback(async (grupoId, nuevoColor) => {
        if (!grupoId || !nuevoColor) return false;

        try {
            setLoadingGroup(true);

            const { error } = await supabase
                .from('grupos_revision')
                .update({ color_hex: nuevoColor })
                .eq('id', grupoId);

            if (error) throw error;

            // Actualizar estado local
            setGruposExistentes(prev => prev.map(g =>
                g.id === grupoId ? { ...g, color_hex: nuevoColor } : g
            ));

            setShowColorPicker(false);
            setSelectedGroupForColor(null);

            toast.success('🎨 Color del grupo actualizado');
            await obtenerMisVentas();

            return true;
        } catch (error) {
            console.error('Error cambiando color del grupo:', error);
            toast.error('Error al cambiar el color del grupo');
            return false;
        } finally {
            setLoadingGroup(false);
        }
    }, [obtenerMisVentas]);

    // 🔥 NUEVA FUNCIÓN: Manejar clic derecho en el grupo
    const handleGroupContextMenu = useCallback((e, grupoId) => {
        e.preventDefault();
        e.stopPropagation();

        const grupo = gruposExistentes.find(g => g.id === grupoId);
        if (!grupo) return;

        // Verificar si el grupo tiene ventas activas
        const ventasDelGrupo = (Array.isArray(ventas) ? ventas : [])
            .filter(v => v.grupo_revision_id === grupoId && v.estado === 'activa');

        if (ventasDelGrupo.length === 0) {
            toast.error('Este grupo no tiene ventas activas');
            return;
        }

        // Posicionar el color picker cerca del cursor
        setColorPickerPosition({
            x: e.clientX,
            y: e.clientY
        });

        setSelectedGroupForColor(grupoId);
        setShowColorPicker(true);
    }, [gruposExistentes, ventas]);

    // 🔥 NUEVA FUNCIÓN: Cerrar selector de colores
    const closeColorPicker = useCallback(() => {
        setShowColorPicker(false);
        setSelectedGroupForColor(null);
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

    const recalcularTodosGrupos = useCallback(async () => {
        try {
            const gruposActivos = gruposExistentes.filter(g => g.activo === true);

            for (const grupo of gruposActivos) {
                const ventasArray = Array.isArray(ventas) ? ventas : [];
                const ventasDelGrupo = ventasArray.filter(v =>
                    v.grupo_revision_id === grupo.id && v.estado === 'activa'
                );

                if (ventasDelGrupo.length === 0) {
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
            const { error } = await supabase
                .from('ventas')
                .update({ grupo_revision_id: null })
                .eq('id', venta.id);

            if (error) throw error;

            await obtenerMisVentas();

            const { data: ventasRestantes, error: queryError } = await supabase
                .from('ventas')
                .select('id, total_precio_venta, estado')
                .eq('grupo_revision_id', grupoId)
                .eq('estado', 'activa');

            if (queryError) throw queryError;

            const cantidadRestante = ventasRestantes?.length || 0;

            if (cantidadRestante === 0) {
                await supabase
                    .from('grupos_revision')
                    .update({ activo: false })
                    .eq('id', grupoId);
                toast.success('Grupo eliminado por estar vacío');
            } else if (cantidadRestante === 1) {
                const ventaSolaId = ventasRestantes[0].id;
                await supabase
                    .from('ventas')
                    .update({ grupo_revision_id: null })
                    .eq('id', ventaSolaId);
                await supabase
                    .from('grupos_revision')
                    .update({ activo: false })
                    .eq('id', grupoId);
                toast.success('Grupo disuelto - solo quedaba una venta');
            } else {
                const nuevoTotal = ventasRestantes.reduce((sum, v) =>
                    sum + parseFloat(v.total_precio_venta || 0), 0
                );
                await supabase
                    .from('grupos_revision')
                    .update({ total: nuevoTotal })
                    .eq('id', grupoId);
                toast.success(`Venta removida - Grupo actualizado: Bs. ${nuevoTotal.toFixed(2)}`);
            }

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

    // Cerrar color picker al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showColorPicker) {
                const picker = document.getElementById('color-picker-container');
                if (picker && !picker.contains(e.target)) {
                    closeColorPicker();
                }
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showColorPicker, closeColorPicker]);

    const limpiarGruposHuerfanos = useCallback(async () => {
        try {
            const { data: gruposActivos, error: gruposError } = await supabase
                .from('grupos_revision')
                .select('id')
                .eq('activo', true);

            if (gruposError) throw gruposError;

            let limpiados = 0;

            for (const grupo of gruposActivos) {
                const { count, error: countError } = await supabase
                    .from('ventas')
                    .select('id', { count: 'exact', head: true })
                    .eq('grupo_revision_id', grupo.id)
                    .eq('estado', 'activa');

                if (countError) throw countError;

                if (count === 0 || count === 1) {
                    if (count === 1) {
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
        }, 300);

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

            const gruposAfectados = [...new Set(ventasSeleccionadas
                .filter(v => v.grupo_revision_id)
                .map(v => v.grupo_revision_id))];

            if (gruposAfectados.length > 0) {
                await supabase
                    .from('ventas')
                    .update({ grupo_revision_id: null })
                    .in('id', ventasSeleccionadas.filter(v => v.grupo_revision_id).map(v => v.id));
            }

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

            const { error: updateError } = await supabase
                .from('ventas')
                .update({ grupo_revision_id: grupo.id })
                .in('id', ventasIds);

            if (updateError) throw updateError;

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
        showColorPicker,
        selectedGroupForColor,
        colorPickerPosition,
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
        limpiarGruposHuerfanos,
        cambiarColorGrupo,
        handleGroupContextMenu,
        closeColorPicker
    };
};