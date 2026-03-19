'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { name: 'Inicio', href: '/inicio' },
        { name: 'Productos', href: '/inicio/productos' },
        { name: 'Contacto', href: '/inicio/contacto' }
    ];

    return (
        <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/inicio" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xl">🏠</span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">MiApp</span>
                    </Link>

                    {/* Menú Desktop */}
                    <nav className="hidden md:flex items-center space-x-6">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`text-gray-600 hover:text-blue-600 transition-colors ${pathname === item.href ? 'text-blue-600 font-medium' : ''
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Botón Hamburguesa */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
                    >
                        <div className="w-6 h-5 relative flex flex-col justify-between">
                            <span className={`w-full h-0.5 bg-gray-600 transform transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''
                                }`} />
                            <span className={`w-full h-0.5 bg-gray-600 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'
                                }`} />
                            <span className={`w-full h-0.5 bg-gray-600 transform transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                                }`} />
                        </div>
                    </button>
                </div>

                {/* Menú Mobile */}
                <div className={`md:hidden overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-48' : 'max-h-0'
                    }`}>
                    <nav className="py-4 space-y-2">
                        {menuItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`block px-4 py-2 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-600 font-medium' : ''
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;