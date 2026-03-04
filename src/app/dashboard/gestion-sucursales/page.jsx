'use client';

import { useState } from 'react';
import { useSucursal } from '@/contexts/SucursalContext';
import SucursalesTable from './components/SucursalesTable';
import Header from './components/Header';
import NuevoSucursal from './components/NuevoSucursal';
import EditarSucursal from './components/EditarSucursal';

export default function GestionSucursales() {
    const [vistaActual, setVistaActual] = useState('lista');
    const [sucursalEditando, setSucursalEditando] = useState(null);

    const {
        sucursales,
        loading,
        sucursalSeleccionada,
        fetchSucursales,
        createSucursal,
        updateSucursal,
    } = useSucursal();

    const handleNuevaSucursal = () => {
        setVistaActual('nuevo');
        fetchSucursales();
    };

    const handleEditarSucursal = (sucursal) => {
        setSucursalEditando(sucursal);
        setVistaActual('editar');
        fetchSucursales();
    };

    const handleVolverALista = () => {
        setVistaActual('lista');
        setSucursalEditando(null);
        fetchSucursales();
    };

    const renderVista = () => {
        switch (vistaActual) {
            case 'nuevo':
                return (
                    <NuevoSucursal
                        onCancelar={handleVolverALista}
                        onSucursalCreada={handleVolverALista}
                        createSucursal={createSucursal}
                    />
                );
            case 'editar':
                return (
                    <EditarSucursal
                        sucursal={sucursalEditando}
                        onCancelar={handleVolverALista}
                        onSucursalActualizada={handleVolverALista}
                        updateSucursal={updateSucursal}
                    />
                );
            default:
                return (
                    <SucursalesTable
                        sucursales={sucursales}
                        loading={loading}
                        onEditarSucursal={handleEditarSucursal}
                        sucursalSeleccionada={sucursalSeleccionada}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header onNuevaSucursal={handleNuevaSucursal} />
            <div className="container mx-auto p-2">
                {renderVista()}
            </div>
        </div>
    );
}
