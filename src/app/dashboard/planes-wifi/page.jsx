// app/gestion-planes-wifi/page.jsx
'use client';

import { useState, useEffect } from 'react';
import HeaderPlanesWifi from './components/HeaderPlanesWifi';
import FiltroPlanesWifi from './components/FiltroPlanesWifi';
import TablaPlanesWifi from './components/TablaPlanesWifi';
import ModalNuevoPlanWifi from './components/ModalNuevoPlanWifi';
import ModalEditarPlanWifi from './components/ModalEditarPlanWifi';
import { usePlanesWifi } from './hooks/usePlanesWifi';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";

export default function GestionPlanesWifi() {
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [planEditando, setPlanEditando] = useState(null);
    const [filtroMes, setFiltroMes] = useState('');
    const [filtroAnio, setFiltroAnio] = useState(new Date().getFullYear());

    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada"]);
    const { sucursalSeleccionada } = values;

    const {
        planes,
        estados,
        loading,
        error,
        crearPlan,
        actualizarPlan,
        actualizarEstadoPlan,
        eliminarPlan,
        recargarPlanes
    } = usePlanesWifi();

    const handleCrearPlan = async (datosPlan) => {
        const resultado = await crearPlan(datosPlan);
        if (resultado.success) {
            setModalNuevoAbierto(false);
        }
        return resultado;
    };

    const handleEditarPlan = async (id, datosPlan) => {
        const resultado = await actualizarPlan(id, datosPlan);
        if (resultado.success) {
            setPlanEditando(null);
        }
        return resultado;
    };

    const handleCambiarEstado = async (id, estadoId) => {
        const motivo = prompt('¿Motivo del cambio de estado? (Opcional)');
        await actualizarEstadoPlan(id, estadoId, motivo);
    };

    return (
        <div className="p-3 space-y-3 text-gray-800">
            <HeaderPlanesWifi
                onNuevoPlan={() => setModalNuevoAbierto(true)}
                onRecargar={recargarPlanes}
                loading={loading}
            />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <FiltroPlanesWifi
                onMesChange={setFiltroMes}
                onAnioChange={setFiltroAnio}
                mesSeleccionado={filtroMes}
                anioSeleccionado={filtroAnio}
            />

            <TablaPlanesWifi
                planes={planes}
                onEditar={setPlanEditando}
                onCambiarEstado={handleCambiarEstado}
                loading={loading}
                filtroMes={filtroMes}
                filtroAnio={filtroAnio}
            />

            <ModalNuevoPlanWifi
                abierto={modalNuevoAbierto}
                onCerrar={() => setModalNuevoAbierto(false)}
                onCrearPlan={handleCrearPlan}
                loading={loading}
                planesExistentes={planes}
            />

            {planEditando && (
                <ModalEditarPlanWifi
                    plan={planEditando}
                    onCerrar={() => setPlanEditando(null)}
                    onActualizarPlan={handleEditarPlan}
                    loading={loading}
                    planesExistentes={planes}
                />
            )}
        </div>
    );
}