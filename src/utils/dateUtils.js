// utils/dateUtils.js

const TIMEZONE_BOLIVIA = 'America/La_Paz';

/**
 * Formatea una fecha UTC a string en zona horaria de Bolivia
 * @param {string|Date} utcDate - Fecha en UTC
 * @param {string} format - 'datetime' | 'date' | 'time' | 'time_seconds'
 * @returns {string} Fecha formateada en zona Bolivia
 */
export const formatUTCToBolivia = (utcDate, format = 'datetime') => {
    if (!utcDate) return '--/--/---- --:--';

    try {
        const date = new Date(utcDate);
        if (isNaN(date.getTime())) return '--/--/---- --:--';

        const formats = {
            datetime: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            },
            date: {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            },
            time: {
                hour: '2-digit',
                minute: '2-digit'
            },
            time_seconds: {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }
        };

        return date.toLocaleString('es-BO', {
            timeZone: TIMEZONE_BOLIVIA,
            ...formats[format] || formats.datetime
        });
    } catch (error) {
        console.error('Error formateando fecha:', error);
        return '--/--/---- --:--';
    }
};

/**
 * Obtiene la fecha actual en UTC para guardar en BD
 * @returns {string} Fecha actual en formato ISO (UTC)
 */
export const getCurrentUTCTime = () => {
    return new Date().toISOString();
};

/**
 * Convierte una fecha local (string) a rango UTC del día en Bolivia
 * @param {string|Date} fechaStr - Fecha en formato 'YYYY-MM-DD' o Date
 * @returns {Object} { inicio: string, fin: string } en UTC
 */
export const getBoliviaDayRangeUTC = (fechaStr) => {
    if (!fechaStr) return null;

    try {
        // Crear fecha en Bolivia
        const fechaBolivia = new Date(fechaStr);
        if (isNaN(fechaBolivia.getTime())) return null;

        // Inicio del día en Bolivia (00:00:00)
        const inicio = new Date(fechaBolivia);
        inicio.setHours(0, 0, 0, 0);

        // Fin del día en Bolivia (23:59:59.999)
        const fin = new Date(fechaBolivia);
        fin.setHours(23, 59, 59, 999);

        // ⚠️ IMPORTANTE: Convertir a UTC
        // Bolivia es UTC-4, entonces:
        // Hora Bolivia = Hora UTC - 4
        // Hora UTC = Hora Bolivia + 4
        const offsetHours = 4;
        const offsetMs = offsetHours * 60 * 60 * 1000;

        const inicioUTC = new Date(inicio.getTime() + offsetMs);
        const finUTC = new Date(fin.getTime() + offsetMs);

        console.log('🔍 getBoliviaDayRangeUTC:');
        console.log('  Fecha Bolivia:', fechaBolivia);
        console.log('  Inicio Bolivia:', inicio.toISOString());
        console.log('  Fin Bolivia:', fin.toISOString());
        console.log('  Inicio UTC:', inicioUTC.toISOString());
        console.log('  Fin UTC:', finUTC.toISOString());

        return {
            inicio: inicioUTC.toISOString(),
            fin: finUTC.toISOString()
        };
    } catch (error) {
        console.error('Error obteniendo rango UTC:', error);
        return null;
    }
};

/**
 * Obtiene fecha actual en Bolivia para mostrar
 * @param {string} format - 'datetime' | 'date' | 'time'
 * @returns {string} Fecha actual en zona Bolivia
 */
export const getCurrentBoliviaTime = (format = 'datetime') => {
    return formatUTCToBolivia(new Date().toISOString(), format);
};

/**
 * Convierte una fecha UTC a objeto Date en zona Bolivia
 * @param {string|Date} utcDate - Fecha en UTC
 * @returns {Date} Fecha en zona Bolivia
 */
export const utcToBoliviaDate = (utcDate) => {
    if (!utcDate) return null;

    try {
        const date = new Date(utcDate);
        if (isNaN(date.getTime())) return null;

        // Obtener offset de Bolivia (UTC-4)
        const boliviaOffset = -4 * 60;
        const utcOffset = date.getTimezoneOffset();
        const diffMinutes = boliviaOffset - utcOffset;

        return new Date(date.getTime() + diffMinutes * 60 * 1000);
    } catch (error) {
        console.error('Error convirtiendo a fecha Bolivia:', error);
        return null;
    }
};

/**
 * Compara si dos fechas UTC son el mismo día en Bolivia
 * @param {string|Date} fecha1 - Fecha UTC
 * @param {string|Date} fecha2 - Fecha UTC
 * @returns {boolean} true si son el mismo día en Bolivia
 */
export const isSameDayInBolivia = (fecha1, fecha2) => {
    if (!fecha1 || !fecha2) return false;

    try {
        const date1 = new Date(fecha1);
        const date2 = new Date(fecha2);
        if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return false;

        // Convertir a Bolivia y comparar fecha
        const bolivia1 = utcToBoliviaDate(date1);
        const bolivia2 = utcToBoliviaDate(date2);

        return bolivia1.getFullYear() === bolivia2.getFullYear() &&
            bolivia1.getMonth() === bolivia2.getMonth() &&
            bolivia1.getDate() === bolivia2.getDate();
    } catch (error) {
        console.error('Error comparando fechas:', error);
        return false;
    }
};