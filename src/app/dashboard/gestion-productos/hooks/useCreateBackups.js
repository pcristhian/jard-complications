// hooks/useCreateBackups.js

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'


export function useCreateBackups() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [configuracion, setConfiguracion] = useState(null)
    const [snapshots, setSnapshots] = useState([])
    const [documentos, setDocumentos] = useState([])
    const [historial, setHistorial] = useState([])

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // ============================================
    // 1. Obtener el snapshot de stock por período (SOLO LECTURA)
    // ============================================
    const obtenerSnapshotStock = useCallback(async (periodo) => {
        try {
            console.log(`📊 Obteniendo snapshot para período: ${periodo}`)

            // 1. Obtener todos los productos activos
            const { data: productos, error: productosError } = await supabase
                .from('productos')
                .select(`
                    id,
                    codigo,
                    nombre,
                    descripcion,
                    categoria_id,
                    precio,
                    costo,
                    comision_variable,
                    activo,
                    categorias!inner (
                        id,
                        nombre
                    )
                `)
                .eq('activo', true)

            if (productosError) {
                console.error('Error obteniendo productos:', productosError)
                throw productosError
            }

            console.log(`✅ Productos encontrados: ${productos?.length || 0}`)

            // 2. Obtener todas las sucursales activas
            const { data: sucursales, error: sucursalesError } = await supabase
                .from('sucursales')
                .select(`
                    id,
                    nombre,
                    direccion,
                    telefono
                `)
                .eq('activo', true)

            if (sucursalesError) {
                console.error('Error obteniendo sucursales:', sucursalesError)
                throw sucursalesError
            }

            console.log(`✅ Sucursales encontradas: ${sucursales?.length || 0}`)

            // 3. Obtener el stock actual de productos_stock
            const { data: stockData, error: stockError } = await supabase
                .from('productos_stock')
                .select(`
                    producto_id,
                    sucursal_id,
                    stock_actual,
                    stock_inicial,
                    stock_minimo
                `)

            if (stockError) {
                console.error('Error obteniendo stock:', stockError)
                throw stockError
            }

            console.log(`✅ Registros de stock encontrados: ${stockData?.length || 0}`)

            // 4. Construir el mapa de stock
            const stockMap = {}
            stockData.forEach(item => {
                const key = `${item.producto_id}_${item.sucursal_id}`
                stockMap[key] = {
                    stock_actual: item.stock_actual || 0,
                    stock_inicial: item.stock_inicial || 0,
                    stock_minimo: item.stock_minimo || 0
                }
            })

            // 5. Calcular totales y construir resúmenes
            const totalProductos = productos.length
            const totalSucursales = sucursales.length
            let totalItems = 0

            // Resumen por sucursal
            const resumenSucursales = {}
            sucursales.forEach(suc => {
                resumenSucursales[suc.id] = {
                    sucursal_id: suc.id,
                    sucursal_nombre: suc.nombre,
                    direccion: suc.direccion || '',
                    telefono: suc.telefono || '',
                    total_productos: 0,
                    total_items: 0,
                    productos: []
                }
            })

            // Resumen por categoría
            const resumenCategorias = {}
            productos.forEach(p => {
                const categoriaId = p.categoria_id || 'sin_categoria'
                if (!resumenCategorias[categoriaId]) {
                    resumenCategorias[categoriaId] = {
                        categoria_id: categoriaId,
                        categoria_nombre: p.categorias?.nombre || 'Sin categoría',
                        total_productos: 0,
                        total_items: 0,
                        productos: []
                    }
                }
                resumenCategorias[categoriaId].total_productos++
            })

            // 6. Procesar cada producto
            const productosConStock = []

            productos.forEach(producto => {
                const stockPorSucursal = []
                let stockTotalProducto = 0

                // Para cada sucursal, obtener el stock
                sucursales.forEach(sucursal => {
                    const key = `${producto.id}_${sucursal.id}`
                    const stock = stockMap[key] || {
                        stock_actual: 0,
                        stock_inicial: 0,
                        stock_minimo: 0
                    }

                    stockPorSucursal.push({
                        sucursal_id: sucursal.id,
                        sucursal_nombre: sucursal.nombre,
                        stock_actual: stock.stock_actual,
                        stock_inicial: stock.stock_inicial,
                        stock_minimo: stock.stock_minimo
                    })

                    // Actualizar resumen por sucursal
                    if (resumenSucursales[sucursal.id]) {
                        resumenSucursales[sucursal.id].total_productos++
                        resumenSucursales[sucursal.id].total_items += stock.stock_actual
                        resumenSucursales[sucursal.id].productos.push({
                            producto_id: producto.id,
                            codigo: producto.codigo,
                            nombre: producto.nombre,
                            stock_actual: stock.stock_actual,
                            stock_inicial: stock.stock_inicial
                        })
                    }

                    stockTotalProducto += stock.stock_actual
                    totalItems += stock.stock_actual
                })

                // Actualizar resumen por categoría
                const categoriaId = producto.categoria_id || 'sin_categoria'
                if (resumenCategorias[categoriaId]) {
                    resumenCategorias[categoriaId].total_items += stockTotalProducto
                    resumenCategorias[categoriaId].productos.push({
                        producto_id: producto.id,
                        codigo: producto.codigo,
                        nombre: producto.nombre,
                        stock_total: stockTotalProducto
                    })
                }

                // Agregar producto con su stock
                productosConStock.push({
                    id: producto.id,
                    codigo: producto.codigo,
                    nombre: producto.nombre,
                    descripcion: producto.descripcion || '',
                    categoria_id: producto.categoria_id,
                    categoria_nombre: producto.categorias?.nombre || 'Sin categoría',
                    precio: producto.precio || 0,
                    costo: producto.costo || 0,
                    comision_variable: producto.comision_variable || 0,
                    stock_total: stockTotalProducto,
                    stock_por_sucursal: stockPorSucursal
                })
            })

            // 7. Construir el snapshot completo
            const snapshot = {
                periodo,
                fecha_snapshot: new Date().toISOString(),
                total_productos: totalProductos,
                total_sucursales: totalSucursales,
                total_items: totalItems,
                productos: productosConStock,
                resumen_por_sucursal: Object.values(resumenSucursales),
                resumen_por_categoria: Object.values(resumenCategorias),
                metadata: {
                    generado_por: 'sistema_backup',
                    version: '1.0',
                    fecha_generacion: new Date().toISOString(),
                    total_sucursales_con_stock: Object.values(resumenSucursales).filter(s => s.total_productos > 0).length,
                    categorias_con_productos: Object.values(resumenCategorias).filter(c => c.total_productos > 0).length
                }
            }

            console.log(`✅ Snapshot construido: ${totalProductos} productos, ${totalItems} items`)
            return snapshot

        } catch (error) {
            console.error('❌ Error obteniendo snapshot de stock:', error)
            throw error
        }
    }, [supabase])

    // ============================================
    // 2. Guardar snapshot en la base de datos
    // ============================================
    const guardarSnapshot = useCallback(async (snapshot) => {
        try {
            console.log(`💾 Guardando snapshot para período: ${snapshot.periodo}`)

            // Verificar si ya existe un snapshot para este período
            const { data: existing, error: checkError } = await supabase
                .from('stock_snapshots_resumen')
                .select('id, periodo')
                .eq('periodo', snapshot.periodo)
                .single()

            if (checkError && checkError.code !== 'PGRST116') {
                console.error('Error verificando existencia:', checkError)
                throw checkError
            }

            let result
            if (existing) {
                console.log(`📝 Actualizando snapshot existente ID: ${existing.id}`)

                // Actualizar - SOLO el campo datos (que es JSONB)
                const { data, error: updateError } = await supabase
                    .from('stock_snapshots_resumen')
                    .update({
                        datos: snapshot,
                        fecha_snapshot: snapshot.fecha_snapshot
                    })
                    .eq('id', existing.id)
                    .select()

                if (updateError) {
                    console.error('Error actualizando:', updateError)
                    throw updateError
                }
                result = data
                console.log('✅ Snapshot actualizado correctamente')
            } else {
                console.log('📝 Insertando nuevo snapshot')

                // Insertar nuevo
                const { data, error: insertError } = await supabase
                    .from('stock_snapshots_resumen')
                    .insert([{
                        periodo: snapshot.periodo,
                        datos: snapshot,
                        fecha_snapshot: snapshot.fecha_snapshot
                    }])
                    .select()

                if (insertError) {
                    console.error('Error insertando:', insertError)
                    throw insertError
                }
                result = data
                console.log('✅ Snapshot insertado correctamente')
            }

            return result
        } catch (error) {
            console.error('❌ Error guardando snapshot:', error)
            throw error
        }
    }, [supabase])

    // ============================================
    // 3. Anular un backup (marcar en el JSON)
    // ============================================
    const anularBackup = useCallback(async (periodo) => {
        try {
            setLoading(true)
            setError(null)

            console.log(`🚫 Anulando backup período: ${periodo}`)

            const { data: snapshot, error: findError } = await supabase
                .from('stock_snapshots_resumen')
                .select('id, periodo, datos')
                .eq('periodo', periodo)
                .single()

            if (findError) throw findError
            if (!snapshot) throw new Error('Backup no encontrado')

            // Marcar como anulado dentro del JSON
            const datosActualizados = {
                ...snapshot.datos,
                anulado: true,
                fecha_anulacion: new Date().toISOString(),
                motivo_anulacion: 'Anulado por usuario'
            }

            const { error: updateError } = await supabase
                .from('stock_snapshots_resumen')
                .update({
                    datos: datosActualizados
                })
                .eq('id', snapshot.id)

            if (updateError) throw updateError

            await registrarHistorial({
                tipo: 'backup_anulado',
                periodo: periodo,
                fecha_anulacion: new Date().toISOString()
            })

            await cargarSnapshots()
            console.log('✅ Backup anulado correctamente')

            return { success: true, message: 'Backup anulado correctamente' }
        } catch (error) {
            setError(error.message || 'Error anulando backup')
            throw error
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // ============================================
    // 4. Restaurar un backup anulado
    // ============================================
    const restaurarBackup = useCallback(async (periodo) => {
        try {
            setLoading(true)
            setError(null)

            console.log(`🔄 Restaurando backup período: ${periodo}`)

            const { data: snapshot, error: findError } = await supabase
                .from('stock_snapshots_resumen')
                .select('id, periodo, datos')
                .eq('periodo', periodo)
                .single()

            if (findError) throw findError
            if (!snapshot) throw new Error('Backup no encontrado')

            const datosActualizados = {
                ...snapshot.datos,
                anulado: false,
                fecha_restauracion: new Date().toISOString()
            }

            const { error: updateError } = await supabase
                .from('stock_snapshots_resumen')
                .update({
                    datos: datosActualizados
                })
                .eq('id', snapshot.id)

            if (updateError) throw updateError

            await registrarHistorial({
                tipo: 'backup_restaurado',
                periodo: periodo,
                fecha_restauracion: new Date().toISOString()
            })

            await cargarSnapshots()
            console.log('✅ Backup restaurado correctamente')

            return { success: true, message: 'Backup restaurado correctamente' }
        } catch (error) {
            setError(error.message || 'Error restaurando backup')
            throw error
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // ============================================
    // 5. Registrar en historial
    // ============================================
    const registrarHistorial = useCallback(async (data) => {
        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser()
            const userId = user?.id || null

            // Obtener una sucursal válida
            const { data: sucursalData } = await supabase
                .from('sucursales')
                .select('id')
                .eq('activo', true)
                .limit(1)
                .single()

            const sucursalId = sucursalData?.id || null

            const { error: insertError } = await supabase
                .from('movimientos')
                .insert([{
                    usuario_id: userId,
                    sucursal_id: sucursalId,
                    tipo_movimiento: 'ajuste_stock',
                    datos: {
                        ...data,
                        accion: 'backup',
                        timestamp: new Date().toISOString()
                    },
                    estado: 'activo',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])

            if (insertError) {
                console.error('Error insertando en historial:', insertError)
            }
        } catch (error) {
            console.error('Error registrando historial:', error)
        }
    }, [supabase])

    // ============================================
    // 6. Cargar configuración
    // ============================================
    const cargarConfiguracion = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const { data, error: fetchError } = await supabase
                .from('configuracion_backups')
                .select('*')
                .limit(1)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError
            }

            if (data) {
                setConfiguracion(data)
            } else {
                const defaultConfig = {
                    activo: true,
                    frecuencia: 'diario',
                    hora_ejecucion: '00:00:00',
                    dias_semana: [],
                    intervalo_personalizado: 24,
                    ultima_ejecucion: null,
                    proxima_ejecucion: null,
                    usuario_creacion: null
                }
                setConfiguracion(defaultConfig)
                await guardarConfiguracion(defaultConfig)
            }
        } catch (err) {
            setError(err.message || 'Error cargando configuración')
        } finally {
            setLoading(false)
        }
    }, [supabase])

    // ============================================
    // 7. Guardar configuración
    // ============================================
    const guardarConfiguracion = useCallback(async (nuevaConfig) => {
        try {
            setLoading(true)
            setError(null)

            const proxima = calcularProximaEjecucion(nuevaConfig)

            const configToSave = {
                ...nuevaConfig,
                proxima_ejecucion: proxima,
                fecha_actualizacion: new Date().toISOString()
            }

            let result
            if (configuracion?.id) {
                const { data, error: updateError } = await supabase
                    .from('configuracion_backups')
                    .update(configToSave)
                    .eq('id', configuracion.id)
                    .select()

                if (updateError) throw updateError
                result = data
            } else {
                const { data, error: insertError } = await supabase
                    .from('configuracion_backups')
                    .insert([configToSave])
                    .select()

                if (insertError) throw insertError
                result = data
            }

            setConfiguracion(result?.[0] || configToSave)
            return result?.[0] || configToSave
        } catch (err) {
            setError(err.message || 'Error guardando configuración')
            throw err
        } finally {
            setLoading(false)
        }
    }, [configuracion, supabase])

    // ============================================
    // 8. Calcular próxima ejecución
    // ============================================
    const calcularProximaEjecucion = useCallback((config) => {
        if (!config.activo) return null

        const ahora = new Date()
        const ahoraBolivia = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/La_Paz' }))
        let proxima = new Date(ahoraBolivia)

        if (config.hora_ejecucion) {
            const [horas, minutos, segundos] = config.hora_ejecucion.split(':').map(Number)
            proxima.setHours(horas || 0, minutos || 0, segundos || 0, 0)
        }

        if (proxima <= ahoraBolivia) {
            proxima.setDate(proxima.getDate() + 1)
        }

        return proxima.toISOString()
    }, [])

    // ============================================
    // 9. Generar backup
    // ============================================
    const generarBackup = useCallback(async (periodo) => {
        try {
            setLoading(true)
            setError(null)

            console.log(`🔄 Generando backup para período: ${periodo}`)

            // Verificar si ya existe un backup para este período
            const { data: existing } = await supabase
                .from('stock_snapshots_resumen')
                .select('id, periodo, datos')
                .eq('periodo', periodo)
                .single()

            // Si existe y no está anulado, error
            if (existing && !existing.datos?.anulado) {
                throw new Error(`Ya existe un backup para el período ${periodo}. Si deseas sobrescribirlo, anula primero el existente.`)
            }

            // Obtener el snapshot del stock actual
            const snapshot = await obtenerSnapshotStock(periodo)

            // Guardar en la base de datos
            const result = await guardarSnapshot(snapshot)

            // Registrar en el historial
            await registrarHistorial({
                tipo: 'backup_generado',
                periodo: periodo,
                total_productos: snapshot.total_productos,
                total_items: snapshot.total_items,
                total_sucursales: snapshot.total_sucursales
            })

            // Actualizar configuración
            if (configuracion) {
                await actualizarConfiguracion({
                    ultima_ejecucion: new Date().toISOString(),
                    ultimo_periodo: periodo
                })
            }

            // Recargar listas
            await cargarSnapshots()
            await cargarHistorial()

            console.log('✅ Backup generado correctamente')
            return result
        } catch (error) {
            setError(error.message || 'Error generando backup')
            throw error
        } finally {
            setLoading(false)
        }
    }, [configuracion, obtenerSnapshotStock, guardarSnapshot])

    // ============================================
    // 10. Ejecutar backup automático
    // ============================================
    const ejecutarBackup = useCallback(async () => {
        try {
            const ahora = new Date()
            let periodo

            switch (configuracion?.frecuencia) {
                case 'cada_hora':
                    periodo = ahora.toISOString().slice(0, 13).replace('T', '-')
                    break
                case 'cada_6_horas':
                case 'cada_12_horas':
                    periodo = ahora.toISOString().slice(0, 13).replace('T', '-')
                    break
                case 'diario':
                case 'cada_2_dias':
                    periodo = ahora.toISOString().slice(0, 10)
                    break
                case 'cada_7_dias':
                case 'cada_15_dias':
                    const fecha = ahora
                    const inicioSemana = new Date(fecha)
                    inicioSemana.setDate(fecha.getDate() - fecha.getDay())
                    periodo = inicioSemana.toISOString().slice(0, 10)
                    break
                case 'cada_30_dias':
                    periodo = ahora.toISOString().slice(0, 7)
                    break
                default:
                    periodo = ahora.toISOString().slice(0, 10)
            }

            return await generarBackup(periodo)
        } catch (error) {
            console.error('Error ejecutando backup automático:', error)
            throw error
        }
    }, [configuracion, generarBackup])

    // ============================================
    // 11. Cargar snapshots
    // ============================================
    const cargarSnapshots = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('stock_snapshots_resumen')
                .select('*')
                .order('fecha_snapshot', { ascending: false })
                .limit(50)

            if (fetchError) throw fetchError

            // Procesar los datos para agregar el flag de anulado desde el JSON
            const snapshotsConEstado = (data || []).map(item => ({
                ...item,
                anulado: item.datos?.anulado || false,
                fecha_anulacion: item.datos?.fecha_anulacion || null,
                motivo_anulacion: item.datos?.motivo_anulacion || null
            }))

            setSnapshots(snapshotsConEstado)
            return snapshotsConEstado
        } catch (err) {
            setError(err.message || 'Error cargando snapshots')
            return []
        }
    }, [supabase])

    // ============================================
    // 12. Cargar documentos
    // ============================================
    const cargarDocumentos = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('documentos_descargables')
                .select('*')
                .order('fecha_generacion', { ascending: false })
                .limit(50)

            if (fetchError) throw fetchError
            setDocumentos(data || [])
            return data || []
        } catch (err) {
            setError(err.message || 'Error cargando documentos')
            return []
        }
    }, [supabase])

    // ============================================
    // 13. Cargar historial
    // ============================================
    const cargarHistorial = useCallback(async () => {
        try {
            const { data, error: fetchError } = await supabase
                .from('movimientos')
                .select('*')
                .eq('tipo_movimiento', 'ajuste_stock')
                .order('created_at', { ascending: false })
                .limit(20)

            if (fetchError) throw fetchError
            setHistorial(data || [])
            return data || []
        } catch (err) {
            setError(err.message || 'Error cargando historial')
            return []
        }
    }, [supabase])

    // ============================================
    // 14. Generar Excel
    // hooks/useCreateBackups.js - Función generarExcel corregida
    // ============================================
    const generarExcel = useCallback(async (periodo) => {
        try {
            setLoading(true)
            setError(null)

            console.log(`📊 Generando Excel para período: ${periodo}`)

            // Obtener el snapshot
            const { data: snapshot, error: snapshotError } = await supabase
                .from('stock_snapshots_resumen')
                .select('*')
                .eq('periodo', periodo)
                .single()

            if (snapshotError) throw snapshotError
            if (!snapshot) throw new Error('No se encontró snapshot para este período')

            const datos = snapshot.datos

            // Crear workbook
            const wb = XLSX.utils.book_new()

            // Hoja de resumen
            const resumenData = [
                ['RESUMEN GENERAL DE STOCK'],
                ['Período', datos.periodo],
                ['Fecha Snapshot', new Date(datos.fecha_snapshot).toLocaleString('es-BO')],
                ['Total Productos', datos.total_productos],
                ['Total Sucursales', datos.total_sucursales],
                ['Total Items', datos.total_items]
            ]
            const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
            XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

            // Hoja de productos
            const productosData = [
                ['ID', 'Código', 'Nombre', 'Categoría', 'Precio', 'Costo', 'Stock Total', 'Stock por Sucursal']
            ]
            datos.productos?.forEach(p => {
                const stockPorSucursal = p.stock_por_sucursal?.map(s =>
                    `${s.sucursal_nombre}: ${s.stock_actual}`
                ).join(' | ') || 'Sin stock'

                productosData.push([
                    p.id,
                    p.codigo,
                    p.nombre,
                    p.categoria_nombre || 'Sin categoría',
                    p.precio || 0,
                    p.costo || 0,
                    p.stock_total || 0,
                    stockPorSucursal
                ])
            })
            const wsProductos = XLSX.utils.aoa_to_sheet(productosData)
            XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos')

            // Hoja de sucursales
            const sucursalData = [
                ['Sucursal', 'Dirección', 'Teléfono', 'Total Productos', 'Total Items']
            ]
            datos.resumen_por_sucursal?.forEach(s => {
                sucursalData.push([
                    s.sucursal_nombre,
                    s.direccion || '',
                    s.telefono || '',
                    s.total_productos || 0,
                    s.total_items || 0
                ])
            })
            const wsSucursal = XLSX.utils.aoa_to_sheet(sucursalData)
            XLSX.utils.book_append_sheet(wb, wsSucursal, 'Por Sucursal')

            // Generar y descargar
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const blob = new Blob([excelBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `Stock_${periodo}.xlsx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            // Guardar registro en la base de datos
            await registrarHistorial({
                tipo: 'excel_generado',
                periodo: periodo,
                total_productos: datos.total_productos,
                total_items: datos.total_items
            })

            console.log('✅ Excel generado y descargado correctamente')
            return true
        } catch (err) {
            console.error('❌ Error generando Excel:', err)
            setError(err.message || 'Error generando Excel')
            throw err
        } finally {
            setLoading(false)
        }
    }, [supabase])
    // ============================================
    // 15. Descargar Excel
    // ============================================
    // hooks/useCreateBackups.js - Función descargarExcel corregida

    // ============================================
    // 15. Descargar Excel con el archivo real
    // ============================================
    const descargarExcel = useCallback(async (documentoId) => {
        try {
            const doc = documentos.find(d => d.id === documentoId)
            if (!doc) throw new Error('Documento no encontrado')

            console.log(`📥 Descargando documento: ${doc.nombre}`)

            // Incrementar contador de descargas
            await supabase
                .from('documentos_descargables')
                .update({ descargas: (doc.descargas || 0) + 1 })
                .eq('id', documentoId)

            // Si tiene URL, descargar directamente
            if (doc.url && doc.url !== '#') {
                // Crear un enlace temporal y hacer click
                const link = document.createElement('a')
                link.href = doc.url
                link.download = doc.nombre
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)

                console.log('✅ Descarga iniciada desde URL')
            } else {
                // Si no tiene URL, obtener el snapshot y generar el Excel en memoria
                console.log('📊 Generando Excel en memoria para descarga directa')

                const { data: snapshot, error: snapshotError } = await supabase
                    .from('stock_snapshots_resumen')
                    .select('*')
                    .eq('periodo', doc.periodo)
                    .single()

                if (snapshotError) throw snapshotError
                if (!snapshot) throw new Error('No se encontró snapshot para este período')

                const datos = snapshot.datos

                // Crear workbook
                const wb = XLSX.utils.book_new()

                // Hoja de resumen
                const resumenData = [
                    ['RESUMEN GENERAL DE STOCK'],
                    ['Período', datos.periodo],
                    ['Fecha Snapshot', new Date(datos.fecha_snapshot).toLocaleString('es-BO')],
                    ['Total Productos', datos.total_productos],
                    ['Total Sucursales', datos.total_sucursales],
                    ['Total Items', datos.total_items]
                ]
                const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
                XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

                // Hoja de productos
                const productosData = [
                    ['ID', 'Código', 'Nombre', 'Categoría', 'Precio', 'Costo', 'Stock Total', 'Stock por Sucursal']
                ]
                datos.productos?.forEach(p => {
                    const stockPorSucursal = p.stock_por_sucursal?.map(s =>
                        `${s.sucursal_nombre}: ${s.stock_actual}`
                    ).join(' | ') || 'Sin stock'

                    productosData.push([
                        p.id,
                        p.codigo,
                        p.nombre,
                        p.categoria_nombre || 'Sin categoría',
                        p.precio || 0,
                        p.costo || 0,
                        p.stock_total || 0,
                        stockPorSucursal
                    ])
                })
                const wsProductos = XLSX.utils.aoa_to_sheet(productosData)
                XLSX.utils.book_append_sheet(wb, wsProductos, 'Productos')

                // Generar y descargar
                const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
                const blob = new Blob([excelBuffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                })

                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `Stock_${doc.periodo}.xlsx`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)

                console.log('✅ Descarga directa completada')
            }
        } catch (err) {
            console.error('❌ Error descargando:', err)
            setError(err.message || 'Error descargando')
            throw err
        }
    }, [documentos, supabase])
    // ============================================
    // 16. Verificar y ejecutar backups programados
    // ============================================
    const verificarYEjecutar = useCallback(async () => {
        if (!configuracion || !configuracion.activo) return

        const ahora = new Date()
        const proxima = configuracion.proxima_ejecucion ? new Date(configuracion.proxima_ejecucion) : null

        if (proxima && ahora >= proxima) {
            console.log('🔄 Ejecutando backup programado...')
            try {
                await ejecutarBackup()

                const nuevaConfig = {
                    ...configuracion,
                    ultima_ejecucion: new Date().toISOString(),
                    proxima_ejecucion: calcularProximaEjecucion(configuracion)
                }
                await guardarConfiguracion(nuevaConfig)
            } catch (error) {
                console.error('Error en backup programado:', error)
            }
        }
    }, [configuracion, ejecutarBackup, guardarConfiguracion, calcularProximaEjecucion])

    // ============================================
    // 17. Actualizar configuración
    // ============================================
    const actualizarConfiguracion = useCallback(async (updates) => {
        if (!configuracion) return

        try {
            const { error: updateError } = await supabase
                .from('configuracion_backups')
                .update(updates)
                .eq('id', configuracion.id)

            if (updateError) throw updateError

            setConfiguracion(prev => ({ ...prev, ...updates }))
        } catch (error) {
            console.error('Error actualizando configuración:', error)
        }
    }, [configuracion, supabase])

    // ============================================
    // 18. Obtener opciones de frecuencia
    // ============================================
    const getOpcionesFrecuencia = useCallback(() => {
        return [
            { value: 'cada_hora', label: '🕐 Cada hora' },
            { value: 'cada_6_horas', label: '🕕 Cada 6 horas' },
            { value: 'cada_12_horas', label: '🕛 Cada 12 horas' },
            { value: 'diario', label: '📅 Diario' },
            { value: 'cada_2_dias', label: '📅 Cada 2 días' },
            { value: 'cada_7_dias', label: '📅 Semanal' },
            { value: 'cada_15_dias', label: '📅 Cada 15 días' },
            { value: 'cada_30_dias', label: '📅 Cada 30 días' },
            { value: 'personalizado', label: '⚙️ Personalizado' }
        ]
    }, [])

    // ============================================
    // 19. Formatear frecuencia
    // ============================================
    const formatearFrecuencia = useCallback((frecuencia) => {
        const map = {
            'cada_hora': 'Cada hora',
            'cada_6_horas': 'Cada 6 horas',
            'cada_12_horas': 'Cada 12 horas',
            'diario': 'Diario',
            'cada_2_dias': 'Cada 2 días',
            'cada_7_dias': 'Semanal',
            'cada_15_dias': 'Cada 15 días',
            'cada_30_dias': 'Cada 30 días',
            'personalizado': 'Personalizado'
        }
        return map[frecuencia] || frecuencia
    }, [])

    // ============================================
    // 20. Formatear fecha
    // ============================================
    const formatearFecha = useCallback((fecha) => {
        if (!fecha) return 'Nunca'
        return new Date(fecha).toLocaleString('es-BO', {
            timeZone: 'America/La_Paz',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }, [])

    // ============================================
    // INICIALIZAR HOOK
    // ============================================
    useEffect(() => {
        cargarConfiguracion()
        cargarSnapshots()
        cargarDocumentos()
        cargarHistorial()
    }, [])

    // ============================================
    // CHECK PERIÓDICO (cada 5 minutos)
    // ============================================
    useEffect(() => {
        const interval = setInterval(() => {
            verificarYEjecutar()
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [configuracion, verificarYEjecutar])

    // ============================================
    // RETORNO
    // ============================================
    return {
        // Estado
        loading,
        error,
        configuracion,
        snapshots,
        documentos,
        historial,

        // Acciones principales
        cargarConfiguracion,
        guardarConfiguracion,
        ejecutarBackup,
        generarBackup,
        anularBackup,
        restaurarBackup,
        cargarSnapshots,
        cargarDocumentos,
        cargarHistorial,
        generarExcel,
        descargarExcel,
        verificarYEjecutar,
        actualizarConfiguracion,

        // Helpers
        formatearFrecuencia,
        formatearFecha,
        getOpcionesFrecuencia,
        calcularProximaEjecucion,
        obtenerSnapshotStock
    }
}