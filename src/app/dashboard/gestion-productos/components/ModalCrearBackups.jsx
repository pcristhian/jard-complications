// components/ModalCrearBackups.jsx

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    FaFileExcel,
    FaDownload,
    FaCalendarAlt,
    FaTimes,
    FaSpinner,
    FaHistory,
    FaDatabase,
    FaStore,
    FaBoxes,
    FaClock,
    FaSave,
    FaInfoCircle,
    FaCalendarCheck,
    FaCog,
    FaBuilding,
    FaTag
} from 'react-icons/fa'
import { useCreateBackups } from '../hooks/useCreateBackups'

export function ModalCrearBackups({ isOpen, onClose }) {
    const {
        loading,
        snapshots,
        documentos,
        generarExcel,
        descargarExcel,
        formatearFecha,
        cargarSnapshots,
        cargarDocumentos,
        configuracion,
        guardarConfiguracion,
        formatearFrecuencia,
        getOpcionesFrecuencia,
        cargarConfiguracion,
        ejecutarBackup
    } = useCreateBackups()

    // Estados para el historial
    const [generando, setGenerando] = useState(false)
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState(null)
    const [ejecutandoBackup, setEjecutandoBackup] = useState(false)

    // Estados para la configuración
    const [formData, setFormData] = useState({
        activo: true,
        frecuencia: 'diario',
        hora_ejecucion: '00:00:00',
        dias_semana: [],
        intervalo_personalizado: 24
    })
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)

    // Estado para controlar qué pestaña se muestra
    const [pestanaActiva, setPestanaActiva] = useState('historial')

    // Estado para controlar si ya se cargaron los datos iniciales
    const [datosCargados, setDatosCargados] = useState(false)

    // Cargar datos al abrir - SOLO UNA VEZ
    useEffect(() => {
        if (isOpen && !datosCargados) {
            const cargarDatos = async () => {
                try {
                    await Promise.all([
                        cargarSnapshots(),
                        cargarDocumentos(),
                        cargarConfiguracion()
                    ])
                    setDatosCargados(true)
                } catch (error) {
                    console.error('Error cargando datos:', error)
                }
            }
            cargarDatos()
        }
    }, [isOpen, datosCargados, cargarSnapshots, cargarDocumentos, cargarConfiguracion])

    // Resetear estado cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setDatosCargados(false)
            setMensaje(null)
            setPestanaActiva('historial')
        }
    }, [isOpen])

    // Actualizar formulario cuando se carga la configuración - SOLO UNA VEZ
    useEffect(() => {
        if (configuracion && datosCargados) {
            setFormData({
                activo: configuracion.activo ?? true,
                frecuencia: configuracion.frecuencia || 'diario',
                hora_ejecucion: configuracion.hora_ejecucion || '00:00:00',
                dias_semana: configuracion.dias_semana || [],
                intervalo_personalizado: configuracion.intervalo_personalizado || 24
            })
        }
    }, [configuracion, datosCargados])

    // Handlers para configuración
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleGuardar = async () => {
        try {
            setGuardando(true)
            setMensaje(null)

            const dataToSave = {
                activo: formData.activo,
                frecuencia: formData.frecuencia,
                hora_ejecucion: formData.hora_ejecucion,
                dias_semana: formData.frecuencia === 'cada_7_dias' ? formData.dias_semana : null,
                intervalo_personalizado: formData.frecuencia === 'personalizado' ? formData.intervalo_personalizado : null,
                usuario_creacion: configuracion?.usuario_creacion || null
            }

            await guardarConfiguracion(dataToSave)
            setMensaje({ tipo: 'success', texto: '✅ Configuración guardada correctamente' })

            setTimeout(() => {
                setMensaje(null)
            }, 3000)
        } catch (error) {
            setMensaje({ tipo: 'error', texto: '❌ Error al guardar: ' + error.message })
        } finally {
            setGuardando(false)
        }
    }

    // Handlers para historial
    const handleGenerarExcel = async (periodo) => {
        try {
            setGenerando(true)
            setPeriodoSeleccionado(periodo)
            await generarExcel(periodo)
            await cargarDocumentos()
            setMensaje({ tipo: 'success', texto: `✅ Excel generado para ${periodo}` })
            setTimeout(() => setMensaje(null), 3000)
        } catch (error) {
            console.error('Error generando Excel:', error)
            setMensaje({ tipo: 'error', texto: '❌ Error al generar Excel: ' + error.message })
            setTimeout(() => setMensaje(null), 3000)
        } finally {
            setGenerando(false)
            setPeriodoSeleccionado(null)
        }
    }

    const handleDescargar = async (docId) => {
        try {
            await descargarExcel(docId)
        } catch (error) {
            console.error('Error descargando:', error)
            setMensaje({ tipo: 'error', texto: '❌ Error al descargar: ' + error.message })
            setTimeout(() => setMensaje(null), 3000)
        }
    }

    const handleEjecutarBackup = async () => {
        try {
            setEjecutandoBackup(true)
            setMensaje(null)

            const result = await ejecutarBackup()

            if (result) {
                setMensaje({ tipo: 'success', texto: '✅ Backup ejecutado correctamente' })
                await cargarSnapshots()
                await cargarDocumentos()
            }

            setTimeout(() => setMensaje(null), 3000)
        } catch (error) {
            console.error('Error ejecutando backup:', error)
            setMensaje({ tipo: 'error', texto: '❌ Error al ejecutar backup: ' + error.message })
            setTimeout(() => setMensaje(null), 3000)
        } finally {
            setEjecutandoBackup(false)
        }
    }
    // Handler para anular backup
    const handleAnularBackup = async (periodo) => {
        if (!confirm(`¿Estás seguro de que deseas anular el backup del período ${periodo}?`)) {
            return
        }

        try {
            await anularBackup(periodo)
            setMensaje({ tipo: 'success', texto: `✅ Backup ${periodo} anulado correctamente` })
            await cargarSnapshots()
            setTimeout(() => setMensaje(null), 3000)
        } catch (error) {
            console.error('Error anulando backup:', error)
            setMensaje({ tipo: 'error', texto: '❌ Error al anular backup: ' + error.message })
            setTimeout(() => setMensaje(null), 3000)
        }
    }

    // Datos procesados con useMemo para evitar recalculos innecesarios
    const documentosPorPeriodo = useMemo(() => {
        return documentos.reduce((acc, doc) => {
            if (!acc[doc.periodo]) {
                acc[doc.periodo] = []
            }
            acc[doc.periodo].push(doc)
            return acc
        }, {})
    }, [documentos])

    const periodos = useMemo(() => {
        return [...new Set([
            ...snapshots.map(s => s.periodo),
            ...documentos.map(d => d.periodo)
        ])].sort().reverse()
    }, [snapshots, documentos])

    const opcionesFrecuencia = useMemo(() => getOpcionesFrecuencia(), [getOpcionesFrecuencia])

    const diasSemana = useMemo(() => [
        { value: 0, label: 'Dom' },
        { value: 1, label: 'Lun' },
        { value: 2, label: 'Mar' },
        { value: 3, label: 'Mié' },
        { value: 4, label: 'Jue' },
        { value: 5, label: 'Vie' },
        { value: 6, label: 'Sáb' }
    ], [])

    const toggleDiaSemana = (dia) => {
        setFormData(prev => {
            const nuevos = prev.dias_semana.includes(dia)
                ? prev.dias_semana.filter(d => d !== dia)
                : [...prev.dias_semana, dia]
            return { ...prev, dias_semana: nuevos }
        })
    }

    // Formatear período para mostrar
    const formatearPeriodo = useCallback((periodo) => {
        if (!periodo) return 'Sin período'

        // Si es formato YYYY-MM-DD-HH (hora)
        if (periodo.match(/^\d{4}-\d{2}-\d{2}-\d{2}$/)) {
            const [year, month, day, hour] = periodo.split('-')
            const fecha = new Date(year, month - 1, day, hour)
            return fecha.toLocaleString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit'
            })
        }

        // Si es formato YYYY-MM-DD (día)
        if (periodo.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const fecha = new Date(periodo + 'T00:00:00')
            return fecha.toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })
        }

        // Si es formato YYYY-MM (mes)
        if (periodo.match(/^\d{4}-\d{2}$/)) {
            const fecha = new Date(periodo + '-01')
            return fecha.toLocaleDateString('es-BO', {
                month: 'long',
                year: 'numeric'
            })
        }

        return periodo
    }, [])

    // Variants de animación
    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    }

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.96,
            y: 30
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 28,
                stiffness: 320
            }
        },
        exit: {
            opacity: 0,
            scale: 0.96,
            y: 30,
            transition: {
                duration: 0.2,
                ease: 'easeOut'
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.25
            }
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                        <motion.div
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                                        <FaHistory className="text-amber-600 text-base" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-800">
                                            Backups
                                        </h2>
                                        <p className="text-xs text-gray-400">
                                            Historial y configuración automática
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <FaTimes className="text-gray-400 text-sm" />
                                </button>
                            </div>

                            {/* Pestañas */}
                            <div className="flex border-b border-gray-100 flex-shrink-0 px-4">
                                <button
                                    onClick={() => setPestanaActiva('historial')}
                                    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${pestanaActiva === 'historial'
                                        ? 'text-amber-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <FaHistory className="text-xs" />
                                        Historial
                                    </span>
                                    {pestanaActiva === 'historial' && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                                        />
                                    )}
                                </button>
                                <button
                                    onClick={() => setPestanaActiva('configuracion')}
                                    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${pestanaActiva === 'configuracion'
                                        ? 'text-amber-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        <FaCog className="text-xs" />
                                        Configuración
                                    </span>
                                    {pestanaActiva === 'configuracion' && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500"
                                        />
                                    )}
                                </button>
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 overflow-y-auto p-4">
                                {pestanaActiva === 'historial' ? (
                                    // CONTENIDO: HISTORIAL
                                    loading && !datosCargados ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <FaSpinner className="animate-spin text-amber-500" />
                                                <span className="text-sm">Cargando...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Botón para ejecutar backup manual */}
                                            <div className="mb-4 flex justify-end">
                                                <button
                                                    onClick={handleEjecutarBackup}
                                                    disabled={ejecutandoBackup}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                                                >
                                                    {ejecutandoBackup ? (
                                                        <>
                                                            <FaSpinner className="animate-spin" />
                                                            Ejecutando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaClock className="text-xs" />
                                                            Ejecutar Backup Ahora
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {periodos.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <div className="text-4xl mb-3">📭</div>
                                                    <p className="text-gray-500 text-sm">No hay copias de seguridad</p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Se generarán automáticamente según la configuración
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {periodos.map((periodo, index) => {
                                                        const docs = documentosPorPeriodo[periodo] || []
                                                        const snapshot = snapshots.find(s => s.periodo === periodo)
                                                        const tieneDocumento = docs.length > 0
                                                        const estaGenerando = generando && periodoSeleccionado === periodo
                                                        const datosSnapshot = snapshot?.datos || {}

                                                        return (
                                                            <motion.div
                                                                key={periodo}
                                                                variants={itemVariants}
                                                                initial="hidden"
                                                                animate="visible"
                                                                transition={{ delay: index * 0.04 }}
                                                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                                                            >
                                                                {/* Izquierda */}
                                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                    <div className="w-10 h-10 bg-white rounded-xl border border-gray-100 flex items-center justify-center flex-shrink-0">
                                                                        <FaCalendarAlt className="text-amber-400 text-sm" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <h3 className="text-sm font-medium text-gray-800 truncate capitalize">
                                                                            {formatearPeriodo(periodo)}
                                                                        </h3>
                                                                        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                                                                            <span className="flex items-center gap-1">
                                                                                <FaDatabase className="text-[10px]" />
                                                                                {datosSnapshot.total_productos || 0} prod.
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <FaBuilding className="text-[10px]" />
                                                                                {datosSnapshot.total_sucursales || 0} suc.
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <FaBoxes className="text-[10px]" />
                                                                                {datosSnapshot.total_items || 0} items
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <FaTag className="text-[10px]" />
                                                                                {Object.keys(datosSnapshot.resumen_por_categoria || {}).length || 0} cat.
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Derecha: Acciones */}
                                                                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                                                                    {snapshot?.anulado ? (
                                                                        // Mostrar que está anulado
                                                                        <span className="text-xs text-red-500 px-2 py-1 bg-red-50 rounded-lg">
                                                                            Anulado
                                                                        </span>
                                                                    ) : (
                                                                        <>
                                                                            {tieneDocumento ? (
                                                                                docs.map(doc => (
                                                                                    <button
                                                                                        key={doc.id}
                                                                                        onClick={() => handleDescargar(doc.id)}
                                                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors text-xs font-medium"
                                                                                    >
                                                                                        <FaDownload className="text-[10px]" />
                                                                                        Descargar
                                                                                    </button>
                                                                                ))
                                                                            ) : (
                                                                                <button
                                                                                    onClick={() => handleGenerarExcel(periodo)}
                                                                                    disabled={estaGenerando}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors text-xs font-medium disabled:opacity-50"
                                                                                >
                                                                                    {estaGenerando ? (
                                                                                        <>
                                                                                            <FaSpinner className="animate-spin text-[10px]" />
                                                                                            Generando
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <FaFileExcel className="text-[10px]" />
                                                                                            Generar
                                                                                        </>
                                                                                    )}
                                                                                </button>
                                                                            )}

                                                                            {/* Botón para anular */}
                                                                            {!snapshot?.anulado && (
                                                                                <button
                                                                                    onClick={() => handleAnularBackup(periodo)}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-medium"
                                                                                >
                                                                                    <FaTimes className="text-[10px]" />
                                                                                    Anular
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>

                                                            </motion.div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )
                                ) : (
                                    // CONTENIDO: CONFIGURACIÓN
                                    loading && !datosCargados ? (
                                        <div className="flex items-center justify-center h-32">
                                            <FaSpinner className="animate-spin text-amber-500 text-xl" />
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Activar/Desactivar */}
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <FaCalendarCheck className="text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Backup automático
                                                    </span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="activo"
                                                        checked={formData.activo}
                                                        onChange={handleChange}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-gray-300 rounded-full peer peer-checked:bg-amber-500 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                                                </label>
                                            </div>

                                            {/* Frecuencia */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                                    Frecuencia
                                                </label>
                                                <select
                                                    name="frecuencia"
                                                    value={formData.frecuencia}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                                                >
                                                    {opcionesFrecuencia.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Hora */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                                    Hora de ejecución (Bolivia)
                                                </label>
                                                <input
                                                    type="time"
                                                    name="hora_ejecucion"
                                                    value={formData.hora_ejecucion?.slice(0, 5)}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            hora_ejecucion: e.target.value + ':00'
                                                        }))
                                                    }}
                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                                                />
                                            </div>

                                            {/* Días de semana (solo si frecuencia es cada_7_dias) */}
                                            {formData.frecuencia === 'cada_7_dias' && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                                        Días de la semana
                                                    </label>
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {diasSemana.map(dia => (
                                                            <button
                                                                key={dia.value}
                                                                onClick={() => toggleDiaSemana(dia.value)}
                                                                className={`px-3 py-1.5 text-xs rounded-xl transition-colors ${formData.dias_semana.includes(dia.value)
                                                                    ? 'bg-amber-500 text-white'
                                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                {dia.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1.5">
                                                        Selecciona los días en los que se ejecutará el backup
                                                    </p>
                                                </div>
                                            )}

                                            {/* Intervalo personalizado */}
                                            {formData.frecuencia === 'personalizado' && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                                        Intervalo (horas)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="intervalo_personalizado"
                                                        value={formData.intervalo_personalizado}
                                                        onChange={handleChange}
                                                        min={1}
                                                        max={168}
                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none transition"
                                                    />
                                                    <p className="text-[10px] text-gray-400 mt-1.5">
                                                        Cada cuántas horas se ejecutará el backup
                                                    </p>
                                                </div>
                                            )}

                                            {/* Info extra */}
                                            <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-2">
                                                <FaInfoCircle className="text-amber-400 text-sm mt-0.5 flex-shrink-0" />
                                                <div className="text-xs text-amber-700">
                                                    <p>
                                                        El backup se ejecutará automáticamente a la hora seleccionada.
                                                        También puedes ejecutarlo manualmente desde el historial.
                                                    </p>
                                                    {configuracion?.ultima_ejecucion && (
                                                        <p className="mt-1 text-amber-600">
                                                            Última ejecución: {formatearFecha(configuracion.ultima_ejecucion)}
                                                        </p>
                                                    )}
                                                    {configuracion?.proxima_ejecucion && (
                                                        <p className="mt-1 text-amber-600">
                                                            Próxima ejecución: {formatearFecha(configuracion.proxima_ejecucion)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mensaje */}
                                            {mensaje && (
                                                <div className={`p-3 rounded-xl text-sm ${mensaje.tipo === 'success'
                                                    ? 'bg-green-50 text-green-700'
                                                    : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {mensaje.texto}
                                                </div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>

                            {/* Footer con acciones según pestaña */}
                            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
                                {pestanaActiva === 'historial' ? (
                                    <>
                                        <span className="text-xs text-gray-400">
                                            {snapshots.length} snapshots · {documentos.length} documentos
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date().toLocaleDateString('es-BO', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setPestanaActiva('historial')}
                                            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            ← Volver al historial
                                        </button>
                                        <button
                                            onClick={handleGuardar}
                                            disabled={guardando || loading}
                                            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {guardando ? (
                                                <>
                                                    <FaSpinner className="animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <FaSave className="text-xs" />
                                                    Guardar configuración
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}