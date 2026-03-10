"use client";
import { useEffect, useState, useCallback, useRef } from "react";

export function useMultiLocalStorageListener(keys = []) {
    const [values, setValues] = useState({});
    const keysRef = useRef(keys); // 🔹 mantener referencia estable

    const readAll = useCallback(() => {
        const result = {};
        keysRef.current.forEach((key) => {
            const data = localStorage.getItem(key);
            try {
                result[key] = data ? JSON.parse(data) : null;
            } catch {
                result[key] = data;
            }
        });
        setValues(result);
    }, []);

    const updateValue = useCallback((key, newValue) => {
        const valueToStore =
            typeof newValue === "object" ? JSON.stringify(newValue) : newValue;

        localStorage.setItem(key, valueToStore);
        window.dispatchEvent(new Event("localStorageChange"));
        readAll(); // actualizar inmediatamente
    }, [readAll]);

    useEffect(() => {
        readAll();
        window.addEventListener("storage", readAll);
        window.addEventListener("localStorageChange", readAll);
        return () => {
            window.removeEventListener("storage", readAll);
            window.removeEventListener("localStorageChange", readAll);
        };
    }, [readAll]);

    return { values, updateValue };
}
