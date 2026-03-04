// src/app/dashboard/gestion-usuarios/page.jsx
'use client';

import { useState } from 'react';
import { useUsuarios } from '@/hooks/data/useUsuarios';
import UsuariosTable from './components/UsuariosTable';
import Header from './components/Header';
import NuevoUsuarioVista from './components/NuevoUsuario';
import EditarUsuario from './components/EditarUsuario';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionUsuarios() {
    const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'nuevo', 'editar'
    const [usuarioEditando, setUsuarioEditando] = useState(null);

    // AÑADE fetchUsuarios en la desestructuración
    const { usuarios, loading, fetchUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } = useUsuarios();

    const { values } = useMultiLocalStorageListener([
        "sucursalSeleccionada",
    ]);

    const { sucursalSeleccionada } = values;
    const sucursalSeleccionadaId = sucursalSeleccionada?.id;

    const handleNuevoUsuario = () => {
        setVistaActual('nuevo');
        fetchUsuarios();
    };

    const handleEditarUsuario = (usuario) => {
        setUsuarioEditando(usuario);
        setVistaActual('editar');
        fetchUsuarios();
    };

    const handleVolverALista = () => {
        setVistaActual('lista');
        setUsuarioEditando(null);
        fetchUsuarios(); // ✅ Ahora fetchUsuarios está definido
    };

    const renderVista = () => {
        switch (vistaActual) {
            case 'nuevo':
                return (
                    <NuevoUsuarioVista
                        onCancelar={handleVolverALista}
                        onUsuarioCreado={handleVolverALista}
                        crearUsuario={crearUsuario}
                    />
                );
            case 'editar':
                return (
                    <EditarUsuario
                        usuario={usuarioEditando}
                        onCancelar={handleVolverALista}
                        onUsuarioActualizado={handleVolverALista}
                        actualizarUsuario={actualizarUsuario}
                    />
                );
            default:
                return (
                    <UsuariosTable
                        usuarios={usuarios}
                        loading={loading}
                        onEditarUsuario={handleEditarUsuario}
                        sucursalSeleccionada={sucursalSeleccionada}
                        sucursalSeleccionadaId={sucursalSeleccionadaId}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-3">
            <Header onNuevoUsuario={handleNuevoUsuario} />

            <div className="container mx-auto">
                {renderVista()}
            </div>
        </div>
    );
}