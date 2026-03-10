'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentPrize, setCurrentPrize] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animationComplete) {
      router.push('/inicio');
    }
  }, [animationComplete, router]);

  // Carrusel de premios para la animación
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrize((prev) => (prev + 1) % prizes.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const prizes = [
    { icon: '☕', name: 'Café', points: 100 },
    { icon: '🍔', name: 'Hamburguesa', points: 500 },
    { icon: '🎮', name: 'Videojuego', points: 2000 },
    { icon: '📱', name: 'Celular', points: 10000 },
    { icon: '💻', name: 'Laptop', points: 50000 },
  ];

  // Variantes de animación
  const containerVariants = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2
      }
    },
    exit: { opacity: 0 }
  };

  const logoVariants = {
    initial: { scale: 0, rotate: -180 },
    animate: {
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 10,
        stiffness: 100
      }
    }
  };

  const progressVariants = {
    initial: { width: "0%" },
    animate: {
      width: "100%",
      transition: {
        duration: 3,
        ease: "easeInOut"
      }
    }
  };

  const prizeVariants = {
    initial: { scale: 0.8, opacity: 0, y: 20 },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12
      }
    },
    exit: {
      scale: 0.8,
      opacity: 0,
      y: -20
    }
  };

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-amber-800 via-yellow-800 to-orange-800" />
    );
  }

  return (
    <AnimatePresence>
      {!animationComplete && (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-amber-900 via-yellow-900 to-orange-900"
        >
          {/* Fondo con partículas de puntos */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-yellow-300 text-2xl"
                initial={{
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%',
                  rotate: Math.random() * 360
                }}
                animate={{
                  y: [null, '-30px', '30px', '-30px'],
                  rotate: [null, '180deg', '360deg']
                }}
                transition={{
                  duration: 10 + Math.random() * 10,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                ⭐
              </motion.div>
            ))}
          </div>

          {/* Contenido principal */}
          <div className="relative z-10 text-center px-4 w-full max-w-4xl mx-auto">
            {/* Logo animado */}
            <motion.div variants={logoVariants} className="mb-6 md:mb-8">
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-28 h-28 md:w-40 md:h-40 mx-auto bg-gradient-to-br from-amber-500 to-yellow-500 rounded-3xl shadow-2xl flex items-center justify-center"
              >
                <span className="text-5xl md:text-7xl">🏆</span>
              </motion.div>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              variants={containerVariants}
              className="text-4xl md:text-6xl font-bold text-white mb-2"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-300">
                TorrePuntos
              </span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              variants={containerVariants}
              className="text-lg md:text-2xl text-white/80 mb-6 md:mb-8"
            >
              Acumula con cada compra en Torre Fuerte
            </motion.p>

            {/* Carrusel de premios - Responsive */}
            <motion.div
              variants={containerVariants}
              className="relative h-24 md:h-32 mb-6 md:mb-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPrize}
                  variants={prizeVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="text-5xl md:text-7xl mb-2">{prizes[currentPrize].icon}</div>
                  <div className="text-white text-xl md:text-2xl font-bold">
                    {prizes[currentPrize].name}
                  </div>
                  <div className="text-amber-300 text-base md:text-lg">
                    {prizes[currentPrize].points.toLocaleString()} puntos
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Barra de progreso */}
            <motion.div variants={containerVariants} className="w-64 md:w-96 mx-auto">
              <div className="relative h-3 md:h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  variants={progressVariants}
                  className="absolute h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
                />
              </div>

              {/* Contador de puntos */}
              <motion.div
                variants={containerVariants}
                className="mt-4 flex items-center justify-center gap-2 text-white/80"
              >
                <span className="text-yellow-300">⭐</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="font-bold text-lg md:text-xl"
                >
                  15,234
                </motion.span>
                <span className="text-sm md:text-base">puntos acumulados hoy</span>
              </motion.div>
            </motion.div>

            {/* Grid de mini premios - Mobile/Desktop */}
            <motion.div
              variants={containerVariants}
              className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-4 mt-8 md:mt-12 max-w-2xl mx-auto"
            >
              {prizes.map((prize, index) => (
                <motion.div
                  key={prize.name}
                  whileHover={{ scale: 1.1 }}
                  className={`text-center p-2 rounded-xl transition-all ${index === currentPrize
                    ? 'bg-white/20 scale-110'
                    : 'bg-white/5'
                    }`}
                >
                  <div className="text-2xl md:text-3xl mb-1">{prize.icon}</div>
                  <div className="text-white text-xs md:text-sm truncate">{prize.name}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Texto inferior */}
          <motion.p
            variants={containerVariants}
            className="absolute bottom-4 md:bottom-8 text-white/30 text-xs md:text-sm"
          >
            Torre Fuerte • Cada compra suma puntos
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}