"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

const SucursalContext = createContext(undefined);

export function SucursalProvider({ children }) {
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState(null);
    const [sucursales, setSucursales] = useState([]);
    const [loading, setLoading] = useState(true);

    // ================================
    // INIT: cargar sucursal seleccionada + fetch sucursales
    // ================================
    useEffect(() => {
        const savedSucursal = localStorage.getItem("sucursalSeleccionada");
        if (savedSucursal) {
            try {
                setSucursalSeleccionada(JSON.parse(savedSucursal));
            } catch {
                localStorage.removeItem("sucursalSeleccionada");
            }
        }

        fetchSucursales();
    }, []);

    // ================================
    // 🔵 GET - Obtener todas las sucursales
    // ================================
    const fetchSucursales = async () => {
        try {
            setLoading(true);

            const { data, error } = await supabase
                .from("sucursales")
                .select("id, nombre, direccion, telefono, activo, created_at, updated_at")
                // .eq("activo", true)    // Si querés solo las activas
                .order("nombre", { ascending: true });

            if (error) throw error;

            setSucursales(data);
            localStorage.setItem("sucursales", JSON.stringify(data));
        } catch (error) {
            console.error("Error fetching sucursales:", error);

            // fallback local
            const saved = localStorage.getItem("sucursales");
            if (saved) {
                try {
                    setSucursales(JSON.parse(saved));
                } catch { }
            }
        } finally {
            setLoading(false);
        }
    };

    // ================================
    // 🟢 CREATE - Crear sucursal
    // ================================
    const createSucursal = async ({ nombre, direccion = null, telefono = null, usuarioId }) => {
        try {
            const { data, error } = await supabase
                .from("sucursales")
                .insert([
                    {
                        nombre,
                        direccion,
                        telefono,
                        activo: true,
                        usuario_creacion: usuarioId ?? null,
                        created_at: new Date(),
                    },
                ])
                .select();

            if (error) throw error;

            await fetchSucursales();
            return { success: true, data };
        } catch (error) {
            console.error("Error creating sucursal:", error);
            return { success: false, error };
        }
    };

    // ================================
    // 🟡 UPDATE - Editar sucursal
    // ================================
    const updateSucursal = async (id, { nombre, direccion, telefono, activo, usuarioId }) => {
        try {
            const { data, error } = await supabase
                .from("sucursales")
                .update({
                    nombre,
                    direccion,
                    telefono,
                    updated_at: new Date(),
                    activo,
                    usuario_ultima_modificacion: usuarioId ?? null,
                })
                .eq("id", id)
                .select();

            if (error) throw error;

            await fetchSucursales();
            return { success: true, data };
        } catch (error) {
            console.error("Error updating sucursal:", error);
            return { success: false, error };
        }
    };

    // ================================
    // 🔴 DELETE - Eliminación lógica (activo = false)
    // ================================
    const deleteSucursal = async (id, usuarioId) => {
        try {
            const { data, error } = await supabase
                .from("sucursales")
                .update({
                    activo: false,
                    updated_at: new Date(),
                    usuario_ultima_modificacion: usuarioId ?? null,
                })
                .eq("id", id)
                .select();

            if (error) throw error;

            await fetchSucursales();

            // Si borraste la misma sucursal que estaba seleccionada → limpiar
            if (sucursalSeleccionada?.id === id) {
                setSucursalSeleccionada(null);
                localStorage.removeItem("sucursalSeleccionada");
            }

            return { success: true, data };
        } catch (error) {
            console.error("Error deleting sucursal:", error);
            return { success: false, error };
        }
    };

    // ================================
    // Seleccionar sucursal
    // ================================
    const selectSucursal = (id, nombre) => {
        const data = { id, nombre };
        setSucursalSeleccionada(data);
        localStorage.setItem("sucursalSeleccionada", JSON.stringify(data));
        window.dispatchEvent(new Event("localStorageChange"));
    };

    const value = {
        sucursalSeleccionada,
        sucursales,
        loading,

        fetchSucursales,
        selectSucursal,

        createSucursal,
        updateSucursal,
        deleteSucursal,
    };

    return (
        <SucursalContext.Provider value={value}>
            {children}
        </SucursalContext.Provider>
    );
}

export const useSucursal = () => {
    const context = useContext(SucursalContext);
    if (!context) throw new Error("useSucursal must be used within SucursalProvider");
    return context;
};
