// components/PageTitleHandler.jsx
'use client'

import { useEffect, useState } from 'react'

export default function PageTitleHandler() {
    useEffect(() => {
        const originalTitle = document.title

        const handleVisibilityChange = () => {
            if (document.hidden) {
                document.title = '¡Vuelve pronto! 😴'
            } else {
                document.title = '' + originalTitle
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            document.title = originalTitle
        }
    }, [])

    return null
}