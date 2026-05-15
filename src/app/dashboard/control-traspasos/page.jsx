// app/dashboard/control-traspasos/page.jsx
'use client';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import TablaMovimientos from './components/TablaMovimientos';
import ModalTraspaso from './components/ModalTraspaso';
import ModalAgregarStock from './components/ModalAgregarStock';
import { useTraspasos } from './hooks/useTraspasos';
import { useMultiLocalStorageListener } from "@/hooks/listener/useLocalStorageListener";
import { supabase } from '@/lib/supabase/client';

export default function ControlTraspasos() {
    const [modalTraspasoAbierto, setModalTraspasoAbierto] = useState(false);
    const [modalStockAbierto, setModalStockAbierto] = useState(false);
    const [refreshTable, setRefreshTable] = useState(0);
    const [sucursales, setSucursales] = useState([]);

    const { values } = useMultiLocalStorageListener(["sucursalSeleccionada", "currentUser"]);
    const { sucursalSeleccionada, currentUser } = values;

    const {
        aumentarStock,
        traspasarStock,
        loading
    } = useTraspasos();

    // Cargar lista de sucursales para el traspaso
    useEffect(() => {
        const cargarSucursales = async () => {
            const { data, error } = await supabase
                .from('sucursales')
                .select('id, nombre')
                .eq('activo', true);

            if (!error && data) {
                setSucursales(data);
            }
        };

        cargarSucursales();
    }, []);

    const handleRecargar = () => {
        setRefreshTable(prev => prev + 1);
    };

    const handleAgregarStock = async (datosStock) => {
        const resultado = await aumentarStock({
            ...datosStock,
            usuarioId: currentUser?.id,
            sucursalId: sucursalSeleccionada?.id
        });

        if (resultado.success) {
            setModalStockAbierto(false);
            handleRecargar();
        }
        return resultado;
    };

    const handleTraspaso = async (datosTraspaso) => {
        const resultado = await traspasarStock({
            ...datosTraspaso,
            usuarioId: currentUser?.id,
            sucursalOrigenId: sucursalSeleccionada?.id
        });

        if (resultado.success) {
            setModalTraspasoAbierto(false);
            handleRecargar();
        }
        return resultado;
    };

    return (
        <div className="p-3 space-y-3 text-gray-800">
            <Header
                onRealizarTraspaso={() => setModalTraspasoAbierto(true)}
                onAgregarStock={() => setModalStockAbierto(true)}
                onRecargar={handleRecargar}
                loading={loading}
                sucursalSeleccionada={sucursalSeleccionada}
            />

            <TablaMovimientos
                sucursalSeleccionada={sucursalSeleccionada}
                refreshTrigger={refreshTable}
            />

            {modalStockAbierto && (
                <ModalAgregarStock
                    abierto={modalStockAbierto}
                    onCerrar={() => setModalStockAbierto(false)}
                    onAgregarStock={handleAgregarStock}
                    sucursalActual={sucursalSeleccionada}
                    loading={loading}
                />
            )}

            {modalTraspasoAbierto && (
                <ModalTraspaso
                    abierto={modalTraspasoAbierto}
                    onCerrar={() => setModalTraspasoAbierto(false)}
                    onTraspaso={handleTraspaso}
                    sucursalActual={sucursalSeleccionada}
                    sucursales={sucursales}
                    loading={loading}
                />
            )}
        </div>
    );
}