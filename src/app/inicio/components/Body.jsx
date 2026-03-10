'use client';

export default function Body() {
    return (
        <main className="pt-16 min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Bienvenido a Inicio
                </h1>
                <p className="text-gray-600">
                    Este es el contenido principal de la página.
                </p>

                {/* Grid de ejemplo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="bg-white p-6 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold mb-2">Card {item}</h3>
                            <p className="text-gray-600">
                                Contenido de ejemplo para la card número {item}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}