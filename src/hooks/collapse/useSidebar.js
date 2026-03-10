// hooks/useSidebar.js
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export function useSidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const timeoutRef = useRef(null)

    // Detectar tamaño de pantalla
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Timer para colapsar automáticamente
    const startCollapseTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Solo colapsar si no está en móvil
        if (!isMobile) {
            timeoutRef.current = setTimeout(() => {
                if (!isHovered) {
                    setIsCollapsed(true)
                }
            }, 200)
        }
    }, [isHovered, isMobile])

    // Manejar hover del mouse
    const handleMouseEnter = useCallback(() => {
        setIsHovered(true)
        if (!isMobile) {
            setIsCollapsed(false)
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [isMobile])

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false)
        if (!isMobile) {
            startCollapseTimer()
        }
    }, [startCollapseTimer, isMobile])

    // Iniciar timer cuando el componente se monta
    useEffect(() => {
        if (!isMobile) {
            startCollapseTimer()
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [startCollapseTimer, isMobile])

    // Toggle manual
    const toggleSidebar = useCallback(() => {
        setIsCollapsed(prev => !prev)
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    return {
        isCollapsed,
        setIsCollapsed,
        isHovered,
        isMobile,
        handleMouseEnter,
        handleMouseLeave,
        toggleSidebar,
        startCollapseTimer
    }
}