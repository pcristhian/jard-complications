// app/gestion-planes-wifi/page.jsx
'use client';

import { useState } from 'react';
import HeaderPlanesWifi from './components/HeaderPlanesWifi';
import TablaPlanesWifi from './components/TablaPlanesWifi';
import ModalNuevoPlanWifi from './components/ModalNuevoPlanWifi';
import ModalEditarPlanWifi from './components/ModalEditarPlanWifi';
import { usePlanesWifi } from './hooks/usePlanesWifi';

export default function GestionPlanesWifi() {
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [planEditando, setPlanEditando] = useState(null);

    const {
        planes,
        usuarios,
        loading,
        error,
        crearPlan,
        actualizarPlan,
        actualizarEstadoPlan,
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
        try {
            const resultado = await actualizarEstadoPlan(id, estadoId);
            return resultado;
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    const handleRefresh = () => {
        recargarPlanes();
    };

    return (
        <div className="p-3 space-y-3 text-gray-800">
            <HeaderPlanesWifi
                onNuevoPlan={() => setModalNuevoAbierto(true)}
                onRecargar={handleRefresh}
                loading={loading}
            />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <TablaPlanesWifi
                planes={planes}
                onEditar={setPlanEditando}
                onCambiarEstado={handleCambiarEstado}
                loading={loading}
                onRefresh={handleRefresh}
            />

            <ModalNuevoPlanWifi
                abierto={modalNuevoAbierto}
                onCerrar={() => setModalNuevoAbierto(false)}
                onCrearPlan={handleCrearPlan}
                loading={loading}
                planesExistentes={planes}
                usuarios={usuarios}
            />

            {planEditando && (
                <ModalEditarPlanWifi
                    plan={planEditando}
                    onCerrar={() => setPlanEditando(null)}
                    onActualizarPlan={handleEditarPlan}
                    loading={loading}
                    planesExistentes={planes}
                    usuarios={usuarios}
                />
            )}
        </div>
    );
}