// src/app/dashboard/gestion-categorias/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useCategorias } from './hooks/useCategorias';
import Header from './components/Header';
import Tabla from './components/Tabla';
import ModalNuevaCategoria from './components/ModalNuevaCategoria';
import ModalEditarCategoria from './components/ModalEditarCategoria';
import ModalReglasComision from './components/ModalReglasComision';

const GestionCategorias = () => {
    const {
        categorias,
        loading,
        error,
        categoriaSeleccionada,
        mostrarModalReglas,
        obtenerCategorias,
        crearCategoria,
        actualizarCategoria,
        actualizarReglasComision,
        eliminarCategoria,
        reactivarCategoria,
        seleccionarCategoria,
        limpiarSeleccion,
        abrirModalReglas,
        cerrarModalReglas,
    } = useCategorias();

    const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);

    useEffect(() => {
        obtenerCategorias();
    }, []);

    const handleCrearCategoria = async (categoriaData) => {
        try {
            await crearCategoria(categoriaData);
            setMostrarModalNueva(false);

            return {
                success: true
            };
        } catch (error) {
            console.error('Error al crear categoría:', error);

            // Si el error viene del servidor con una estructura específica
            if (error.response?.data?.errors) {
                return {
                    success: false,
                    errors: error.response.data.errors
                };
            }

            // Error general
            return {
                success: false,
                errors: {
                    general: error.message || 'Error al crear la categoría'
                }
            };
        }
    };

    const handleEditarCategoria = async (id, categoriaData) => {
        try {
            await actualizarCategoria(id, categoriaData);
            setMostrarModalEditar(false);
            limpiarSeleccion();
        } catch (error) {
            console.error('Error al editar categoría:', error);
        }
    };

    const handleActualizarReglas = async (reglasComision) => {
        try {
            await actualizarReglasComision(categoriaSeleccionada.id, reglasComision);
            cerrarModalReglas();
        } catch (error) {
            console.error('Error al actualizar reglas:', error);
        }
    };

    const handleEliminarCategoria = async (categoria) => {
        const motivo = prompt('Ingrese el motivo de la desactivación:');
        if (motivo) {
            try {
                await eliminarCategoria(categoria.id, motivo);
            } catch (error) {
                console.error('Error al eliminar categoría:', error);
            }
        }
    };

    const handleReactivarCategoria = async (categoria) => {
        try {
            await reactivarCategoria(categoria.id);
        } catch (error) {
            console.error('Error al reactivar categoría:', error);
        }
    };

    const abrirModalEditar = (categoria) => {
        seleccionarCategoria(categoria);
        setMostrarModalEditar(true);
    };

    if (loading && categorias.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-4 text-green-600">
            <Header onNuevaCategoria={() => setMostrarModalNueva(true)} />

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <Tabla
                categorias={categorias}
                onEditar={abrirModalEditar}
                onEliminar={handleEliminarCategoria}
                onReactivar={handleReactivarCategoria}
                onReglasComision={abrirModalReglas}
            />

            {/* Modales */}
            <ModalNuevaCategoria
                isOpen={mostrarModalNueva}
                onClose={() => setMostrarModalNueva(false)}
                onGuardar={handleCrearCategoria}
                loading={loading}
            />

            <ModalEditarCategoria
                isOpen={mostrarModalEditar}
                onClose={() => {
                    setMostrarModalEditar(false);
                    limpiarSeleccion();
                }}
                categoria={categoriaSeleccionada}
                onGuardar={handleEditarCategoria}
                loading={loading}
            />

            <ModalReglasComision
                isOpen={mostrarModalReglas}
                onClose={cerrarModalReglas}
                categoria={categoriaSeleccionada}
                onGuardar={handleActualizarReglas}
                loading={loading}
            />
        </div>
    );
};

export default GestionCategorias;