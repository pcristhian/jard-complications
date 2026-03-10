// app/page.jsx
'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Redirección rápida (2 segundos)
    const timer = setTimeout(() => {
      router.push('/login')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center overflow-hidden">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        {/* Logo animado con imagen centrada */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            delay: 0.2
          }}
          className="w-50 h-50 bg-white rounded-2xl shadow-2xl flex items-center justify-center mx-auto mb-1 overflow-hidden"
        >
          <div className="relative w-45 h-45">
            <Image
              src="/image/empresa/distribuidora.png"
              alt="Jard Complications"
              fill
              className="object-contain"
              priority
            />
          </div>
        </motion.div>

        {/* Nombre de la empresa */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-3xl font-bold text-white mb-2"
        >
          Jard Complications
        </motion.h1>

        {/* Línea decorativa animada */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="h-0.5 bg-white mx-auto mt-4"
          style={{ maxWidth: "200px" }}
        />

        {/* Texto de carga */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-blue-200 mt-4 text-sm"
        >
          Cargando...
        </motion.p>
      </motion.div>
    </div>
  )
}