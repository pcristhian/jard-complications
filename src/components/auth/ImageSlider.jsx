"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ImageSlider({
    images = [],
    interval = 3000,
    height = "h-64",
    showDots = true,
    showControls = true,
    autoPlay = true,
    borderRadius = "rounded-2xl"
}) {
    const [current, setCurrent] = useState(0);

    // Navegación
    const next = () => setCurrent((prev) => (prev + 1) % images.length);
    const prev = () => setCurrent((prev) => (prev - 1 + images.length) % images.length);
    const goTo = (index) => setCurrent(index);

    // Auto-play
    useEffect(() => {
        if (!autoPlay) return;

        const timer = setInterval(() => {
            next();
        }, interval);

        return () => clearInterval(timer);
    }, [autoPlay, interval, images.length]);

    // Si no hay imágenes, mostrar placeholder
    if (images.length === 0) {
        return (
            <div className={`w-full ${height} ${borderRadius} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden`}>
                <div className="text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-2xl">🖼️</span>
                    </div>
                    <p className="text-sm">No hay imágenes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Contenedor de la Imagen */}
            <div className={`relative w-full ${height} ${borderRadius} overflow-hidden group`}>
                {/* Imagen Principal */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current}
                        className="w-full h-full relative"
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                            duration: 0.6,
                            ease: "easeInOut"
                        }}
                    >
                        <img
                            src={images[current]}
                            alt={`Imagen ${current + 1} de ${images.length}`}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay sutil */}
                        <div className="absolute inset-0 bg-black/5"></div>
                    </motion.div>
                </AnimatePresence>

                {/* Controles de Navegación */}
                {showControls && images.length > 1 && (
                    <>
                        {/* Botón Anterior */}
                        <motion.button
                            whileHover={{ scale: 1.1, x: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={prev}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </motion.button>

                        {/* Botón Siguiente */}
                        <motion.button
                            whileHover={{ scale: 1.1, x: 2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={next}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </motion.button>
                    </>
                )}
            </div>

            {/* Dots simples y centrados debajo */}
            {showDots && images.length > 1 && (
                <div className="flex justify-center mt-4">
                    <div className="flex gap-2">
                        {images.map((_, index) => (
                            <motion.button
                                key={index}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => goTo(index)}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${current === index
                                    ? 'bg-blue-600 scale-125'
                                    : 'bg-gray-300 hover:bg-gray-400'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}