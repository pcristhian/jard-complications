'use client';

import { useState, useEffect } from 'react';

// Variable global simple
let globalModalOpen = false;
let globalListeners = [];

export function useGlobalModal() {
    const [isOpen, setIsOpen] = useState(globalModalOpen);

    useEffect(() => {
        // Función para actualizar estado local
        const updateState = () => {
            setIsOpen(globalModalOpen);
        };

        // Suscribirse
        globalListeners.push(updateState);

        return () => {
            // Desuscribirse
            globalListeners = globalListeners.filter(l => l !== updateState);
        };
    }, []);

    return {
        isModalOpen: isOpen,
        openModal: () => {
            globalModalOpen = true;
            globalListeners.forEach(listener => listener());
        },
        closeModal: () => {
            globalModalOpen = false;
            globalListeners.forEach(listener => listener());
        },
    };
}