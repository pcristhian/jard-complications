// components/layout/sidebar/SidebarHeader.jsx
"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useSucursal } from '@/contexts/SucursalContext'
import { useMultiLocalStorageListener } from '@/hooks/listener/useLocalStorageListener'
import { useState, useEffect } from 'react'

export default function SidebarHeader({ isCollapsed }) {
    const {
        sucursalSeleccionada,
        sucursales,
        loading,
        selectSucursal
    } = useSucursal()

    const [waveTrigger, setWaveTrigger] = useState(0)
    const [spinningLetters, setSpinningLetters] = useState({})
    const text = "Jard Complications"
    const letters = text.split('')

    // Transiciones optimizadas para performance
    const smoothTransition = {
        duration: 0.8,
        ease: "easeInOut"
    }

    // Animación de slot machine - cada letra gira sobre su propio eje
    const slotMachineAnimation = (index) => ({
        rotateX: [0, 360, 720], // Dos vueltas completas
        scale: [1, 1.1, 1],
        transition: {
            duration: 0.8, // Más lento
            delay: index * 0.05, // Retraso progresivo para efecto cascada
            ease: "easeInOut",
            times: [0, 0.5, 1]
        }
    })

    // Función para iniciar la animación de todas las letras
    const startSlotMachineAnimation = () => {
        const newSpinningState = {}
        letters.forEach((_, index) => {
            newSpinningState[index] = true
        })
        setSpinningLetters(newSpinningState)
        
        // Resetear el estado de spinning después de la animación
        setTimeout(() => {
            setSpinningLetters({})
        }, 1500)
    }

    useEffect(() => {
        let interval
        if (!isCollapsed) {
            // Iniciar la primera animación al montar
            startSlotMachineAnimation()
            
            // Configurar intervalo para repetir cada 4 segundos
            interval = setInterval(() => {
                startSlotMachineAnimation()
                setWaveTrigger(prev => prev + 1)
            }, 7000)
        }
        return () => clearInterval(interval)
    }, [isCollapsed])

    // Componente de letra individual con efecto slot machine
    const SlotLetter = ({ letter, index, isSpinning }) => {
        return (
            <motion.span
                className="inline-block"
                animate={isSpinning ? slotMachineAnimation(index) : {}}
                style={{
                    display: 'inline-block',
                    transformStyle: 'preserve-3d'
                }}
            >
                {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
        )
    }

    const handleSucursalChange = (e) => {
        const selectedId = parseInt(e.target.value)
        const sucursal = sucursales.find(s => s.id === selectedId)
        if (sucursal) {
            selectSucursal(sucursal.id, sucursal.nombre)
        }
    }

    const { values: localStorageValues } = useMultiLocalStorageListener([
        'currentUser',
        'sucursalSeleccionada'
    ]);

    const getCurrentUser = () => {
        return localStorageValues.currentUser || null;
    };

    const currentUser = getCurrentUser();

    return (
        <motion.div
            className={`border-b border-blue-500/30 bg-gradient-to-r from-blue-600 to-blue-700 ${isCollapsed ? 'px-4' : 'px-6'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={smoothTransition}
        >
            <div className={`${isCollapsed ? 'py-3' : 'py-4'}`}>
                <div className="flex items-center gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={smoothTransition}
                        className="bg-white p-2 rounded-xl"
                    >
                        <img
                            src="/image/empresa/icono_logo.png"
                            alt="Logo empresa"
                            className="w-7 h-7"
                        />
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {!isCollapsed && (
                            <motion.div
                                key="header-text"
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -5 }}
                                transition={smoothTransition}
                                className="min-w-0 flex-1"
                            >
                                <motion.h1 
                                    className="text-lg font-bold text-white truncate"
                                    style={{ willChange: 'transform' }}
                                >
                                    {letters.map((letter, index) => (
                                        <SlotLetter
                                            key={`${index}-${waveTrigger}`}
                                            letter={letter}
                                            index={index}
                                            isSpinning={spinningLetters[index]}
                                        />
                                    ))}
                                </motion.h1>
                                <motion.p 
                                    className="text-blue-100/80 text-xs"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ ...smoothTransition, delay: 0.05 }}
                                >
                                    Torre Fuerte
                                </motion.p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <motion.div
                        key="sucursal-selector"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={smoothTransition}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ ...smoothTransition, delay: 0.05 }}
                                className="bg-white/10 backdrop-blur-sm rounded-lg p-3"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-blue-200" />
                                    <label className="text-blue-100 text-sm font-medium">
                                        Sucursal Activa
                                    </label>
                                </div>

                                {loading ? (
                                    <div className="text-center py-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                    </div>
                                ) : (
                                    <select
                                        value={sucursalSeleccionada?.id || ''}
                                        onChange={handleSucursalChange}
                                        className="w-full bg-white/90 border border-white/30 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all"
                                    >
                                        <option value="">Seleccionar sucursal</option>
                                        {sucursales
                                            .filter(sucursal => {
                                                if (!sucursal?.activo) return false;
                                                const userRole = currentUser?.roles?.nombre;
                                                if (!userRole) return false;
                                                if (userRole === 'admin') return true;
                                                const userSucursalId = currentUser?.sucursal_id;
                                                return sucursal.id === userSucursalId;
                                            })
                                            .map((sucursal) => (
                                                <option key={sucursal.id} value={sucursal.id}>
                                                    {sucursal.nombre}
                                                </option>
                                            ))}
                                    </select>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}