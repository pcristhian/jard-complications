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
        traspasarMultiplesStocks,
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

    const handleTraspaso = async ({ producto, cantidad, sucursalDestinoId, observaciones }) => {
        if (!currentUser?.id) {
            return { success: false, error: 'No hay usuario logueado' };
        }

        if (!sucursalSeleccionada?.id) {
            return { success: false, error: 'No hay sucursal seleccionada' };
        }

        const result = await traspasarStock({
            usuarioId: currentUser.id,
            sucursalOrigenId: sucursalSeleccionada.id,
            sucursalDestinoId,
            producto,
            cantidad,
            observaciones
        });
        return result;
    };

    const handleTraspasosMultiples = async (items) => {
        if (!currentUser?.id) {
            return { success: false, error: 'No hay usuario logueado' };
        }

        if (!sucursalSeleccionada?.id) {
            return { success: false, error: 'No hay sucursal seleccionada' };
        }

        const result = await traspasarMultiplesStocks({
            usuarioId: currentUser.id,
            sucursalOrigenId: sucursalSeleccionada.id,
            items
        });
        return result;
    };

    return (
        <div className="h-screen flex flex-col p-3 space-y-3 text-gray-800 overflow-hidden">
            {/* ✅ Header fijo */}
            <div className="flex-shrink-0">
                <Header
                    onRealizarTraspaso={() => setModalTraspasoAbierto(true)}
                    onAgregarStock={() => setModalStockAbierto(true)}
                    onRecargar={handleRecargar}
                    loading={loading}
                    sucursalSeleccionada={sucursalSeleccionada}
                />
            </div>

            {/* ✅ Tabla con scroll */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <TablaMovimientos
                    sucursalSeleccionada={sucursalSeleccionada}
                    refreshTrigger={refreshTable}
                />
            </div>

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
                    onTraspasosMultiples={handleTraspasosMultiples}
                    sucursalActual={sucursalSeleccionada}
                    sucursales={sucursales}
                    loading={loading}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}