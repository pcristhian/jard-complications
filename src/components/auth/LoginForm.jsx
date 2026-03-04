"use client";

import { useState, useEffect } from "react";
import { useLogin } from "@/hooks/auth/useLogin";
import { LogIn, User, Lock, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ImageSlider from "./ImageSlider";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginForm() {
    const router = useRouter();
    const { isAuthenticated, loading: authLoading, login: authLogin } = useAuth();
    const { login: hookLogin, loading: loginLoading, error, clearError } = useLogin();

    const [nombre, setNombre] = useState("");
    const [password, setPassword] = useState("");
    const [currentSecurityMessage, setCurrentSecurityMessage] = useState(0);

    // Mensajes de seguridad
    const securityMessages = [
        "🔒 Por seguridad, esta computadora no guardará tu contraseña",
        "🔒 Tus credenciales están protegidas con encriptación avanzada",
        "🔐 No compartas tu contraseña única con nadie",
        "📱 Accede solo desde dispositivos seguros",
        "👁️ Verifica siempre la URL antes de ingresar tus datos"
    ];

    // Efectos
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSecurityMessage((prev) =>
                prev === securityMessages.length - 1 ? 0 : prev + 1
            );
        }, 4000);

        return () => clearInterval(interval);
    }, [securityMessages.length]);

    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [nombre, password, error, clearError]);

    useEffect(() => {
        if (!authLoading && isAuthenticated()) {
            router.push('/dashboard');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nombre.trim() || !password.trim()) {
            toast.error("Por favor completa todos los campos");
            return;
        }

        console.log('🔐 Iniciando login...');
        const userData = await hookLogin(nombre, password);

        if (userData) {
            console.log('✅ Login exitoso - Llamando authLogin...');

            // Llamar a authLogin PRIMERO
            authLogin(userData);

            // Pequeña pausa para asegurar que se guarde en storage
            await new Promise(resolve => setTimeout(resolve, 100));

            toast.success(`¡Bienvenid@ ${userData.nombre}! 🎉`);

            setNombre("");
            setPassword("");

            console.log('🔄 Redirigiendo...');

            // Forzar recarga completa para evitar problemas de estado
            window.location.href = '/dashboard';
        } else {
            toast.error(error || "Credenciales incorrectas");
        }
    };

    // Datos del componente
    const empresaImages = [
        "/image/empresa/distribuidora.png",
        "/image/empresa/tecnologia.png",
        "/image/empresa/natural.png",
        "/image/empresa/imedic.png",
    ];

    // Animaciones
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    const securityMessageVariants = {
        enter: {
            y: 20,
            opacity: 0,
            scale: 0.95
        },
        center: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 200,
                damping: 15
            }
        },
        exit: {
            y: -20,
            opacity: 0,
            scale: 1.05,
            transition: {
                duration: 0.3
            }
        }
    };

    // Loading state
    if (authLoading || isAuthenticated()) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <motion.div
                className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <motion.div
                    className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2"
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                >
                    {/* Lado Izquierdo - Formulario */}
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {/* Header */}
                            <motion.div
                                className="text-center mb-8"
                                variants={itemVariants}
                            >
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <Building2 className="w-10 h-10 text-blue-600" />
                                    <h1 className="text-3xl font-bold text-gray-800">
                                        Jard Complications
                                    </h1>
                                </div>
                                <p className="text-gray-600 text-lg">
                                    Sistema de Gestión Integral
                                </p>
                            </motion.div>

                            {/* Formulario */}
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6"
                                autoComplete="off"
                                noValidate
                            >
                                {/* Campo Usuario */}
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-500" />
                                            Usuario
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Ingresa tu nombre de usuario"
                                            value={nombre}
                                            onChange={(e) => setNombre(e.target.value)}
                                            className="w-full px-4 py-3 pl-11 text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                                            disabled={loginLoading}
                                            autoComplete="off"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                            name="username-new"
                                            id="username-field"
                                        />
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    </div>
                                </motion.div>

                                {/* Campo Contraseña */}
                                <motion.div variants={itemVariants}>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        <div className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 text-gray-500" />
                                            Contraseña
                                        </div>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            placeholder="Ingresa tu contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 pl-11 text-gray-900  border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50"
                                            disabled={loginLoading}
                                            autoComplete="new-password"
                                            autoCapitalize="off"
                                            autoCorrect="off"
                                            spellCheck="false"
                                            name="hidden-password"
                                            id="hidden-password-field"
                                            required
                                        />
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    </div>
                                </motion.div>

                                {/* Botón de Login */}
                                <motion.div variants={itemVariants}>
                                    <motion.button
                                        type="submit"
                                        disabled={loginLoading || !nombre.trim() || !password.trim()}
                                        whileHover={{ scale: loginLoading ? 1 : 1.02 }}
                                        whileTap={{ scale: loginLoading ? 1 : 0.98 }}
                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-3"
                                    >
                                        {loginLoading ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                />
                                                Verificando...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn className="w-5 h-5" />
                                                Ingresar al Sistema
                                            </>
                                        )}
                                    </motion.button>
                                </motion.div>
                            </form>

                            {/* Mensaje de Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                                    >
                                        <p className="text-red-700 text-sm text-center font-medium">
                                            ⚠️ {error}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Información de Seguridad */}
                            <motion.div
                                className="mt-8 relative h-16 overflow-hidden"
                                variants={itemVariants}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentSecurityMessage}
                                        variants={securityMessageVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        className="p-4 bg-blue-50 border border-blue-200 rounded-xl absolute inset-0"
                                    >
                                        <p className="text-blue-700 text-sm text-center font-medium">
                                            {securityMessages[currentSecurityMessage]}
                                        </p>
                                    </motion.div>
                                </AnimatePresence>
                            </motion.div>

                            {/* Indicadores de progreso */}
                            <div className="flex justify-center gap-1 mt-4">
                                {securityMessages.map((_, index) => (
                                    <motion.div
                                        key={index}
                                        className={`h-1 rounded-full transition-all duration-300 ${index === currentSecurityMessage
                                            ? 'bg-blue-500 w-4'
                                            : 'bg-blue-200 w-2'
                                            }`}
                                        whileHover={{ scale: 1.2 }}
                                        onClick={() => setCurrentSecurityMessage(index)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Lado Derecho - Carrusel de Imágenes */}
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-500 hidden lg:flex flex-col justify-center items-center p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>

                        <motion.div
                            className="relative z-10 text-center text-white"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-2xl font-bold mb-6">Bienvenido de vuelta</h2>
                            <div className="mb-6">
                                <ImageSlider
                                    images={empresaImages}
                                    interval={4000}
                                    height="h-80"
                                    showDots={true}
                                    showControls={true}
                                    autoPlay={true}
                                    borderRadius="rounded-3xl"
                                />
                            </div>
                            <p className="text-blue-100 text-sm max-w-md">
                                Accede a todas las herramientas de gestión, inventario y reportes de tu empresa
                            </p>
                        </motion.div>

                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/10 to-transparent"></div>
                    </div>
                </motion.div>
            </motion.div>
        </>
    );
}