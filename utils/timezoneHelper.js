/**
 * 🌍 HELPER DE ZONAS HORARIAS
 * 
 * Maneja la conversión entre UTC (servidor) y timezone del usuario
 * para evitar problemas con "hoy", "ayer", etc.
 * 
 * NOTA: Usa cálculo manual de offsets en lugar de date-fns-tz
 * para mejor compatibilidad con Vercel
 */

const { startOfDay, endOfDay, format } = require('date-fns');

// Mapa de offsets comunes (en horas)
const TIMEZONE_OFFSETS = {
  // México
  'America/Mexico_City': -6,
  'America/Cancun': -5,
  'America/Tijuana': -8,
  'America/Hermosillo': -7,
  // USA
  'America/New_York': -5,
  'America/Chicago': -6,
  'America/Los_Angeles': -8,
  'America/Denver': -7,
  'US/Pacific': -8,
  // Europa
  'Europe/Madrid': 1,
  'Europe/London': 0,
  'Europe/Berlin': 1,
  'Europe/Paris': 1,
  // América Latina
  'America/Argentina/Buenos_Aires': -3,
  'America/Sao_Paulo': -3,
  'America/Bogota': -5,
  'America/Guayaquil': -5,
  'America/Lima': -5,
  // Asia
  'Asia/Tokyo': 9,
  'Asia/Shanghai': 8,
  'Asia/Dubai': 4,
  // Oceanía
  'Australia/Sydney': 10,
  // UTC
  'UTC': 0
};

class TimezoneHelper {
  /**
   * Obtener timezone del usuario desde headers o default
   */
  static getUserTimezone(req) {
    // Intentar obtener de diferentes fuentes
    const timezone = 
      req.headers['x-timezone'] || 
      req.headers['timezone'] ||
      req.body?.timezone ||
      req.query?.timezone ||
      'UTC'; // ⚠️ Default UTC si no se especifica

    console.log(`🌍 [TIMEZONE] Usuario timezone: ${timezone}`);
    
    if (timezone === 'UTC') {
      console.log(`⚠️ [TIMEZONE] Usando UTC por defecto. Recomendado: enviar timezone del usuario para predicciones más precisas`);
    }
    
    return timezone;
  }

  /**
   * Obtener "hoy" según la timezone del usuario
   * @param {string} userTimezone - Timezone del usuario (ej: "America/New_York", "Europe/Madrid")
   * @returns {Object} { start: Date, end: Date } - Inicio y fin del día en UTC
   */
  static getTodayInUserTimezone(userTimezone = 'UTC') {
    const now = new Date();
    const offset = this.getTimezoneOffsetHours(userTimezone);
    
    // Obtener fecha/hora actual en la timezone del usuario
    const nowInUserTZ = new Date(now.getTime() + offset * 60 * 60 * 1000);
    
    // Inicio del día en timezone del usuario (medianoche)
    const startOfDayInUserTZ = new Date(nowInUserTZ);
    startOfDayInUserTZ.setHours(0, 0, 0, 0);
    
    // Fin del día en timezone del usuario (23:59:59)
    const endOfDayInUserTZ = new Date(nowInUserTZ);
    endOfDayInUserTZ.setHours(23, 59, 59, 999);
    
    // Convertir de vuelta a UTC (restar el offset)
    const startOfDayUTC = new Date(startOfDayInUserTZ.getTime() - offset * 60 * 60 * 1000);
    const endOfDayUTC = new Date(endOfDayInUserTZ.getTime() - offset * 60 * 60 * 1000);
    
    console.log(`📅 [TIMEZONE] "Hoy" en ${userTimezone} (offset: ${offset}h):`);
    console.log(`   - Hora local: ${format(nowInUserTZ, 'yyyy-MM-dd HH:mm:ss')}`);
    console.log(`   - Inicio del día (UTC): ${startOfDayUTC.toISOString()}`);
    console.log(`   - Fin del día (UTC): ${endOfDayUTC.toISOString()}`);
    
    return {
      start: startOfDayUTC,
      end: endOfDayUTC,
      userLocalTime: nowInUserTZ
    };
  }

  /**
   * Convertir fecha UTC a hora local del usuario
   */
  static utcToUserTime(utcDate, userTimezone = 'UTC') {
    const offset = this.getTimezoneOffsetHours(userTimezone);
    return new Date(utcDate.getTime() + offset * 60 * 60 * 1000);
  }

  /**
   * Convertir hora local del usuario a UTC
   */
  static userTimeToUtc(localDate, userTimezone = 'UTC') {
    const offset = this.getTimezoneOffsetHours(userTimezone);
    return new Date(localDate.getTime() - offset * 60 * 60 * 1000);
  }

  /**
   * Obtener hora actual del usuario (no UTC)
   */
  static getNowInUserTimezone(userTimezone = 'UTC') {
    const now = new Date();
    const offset = this.getTimezoneOffsetHours(userTimezone);
    return new Date(now.getTime() + offset * 60 * 60 * 1000);
  }

  /**
   * Verificar si una fecha UTC es "hoy" para el usuario
   */
  static isToday(utcDate, userTimezone = 'UTC') {
    const today = this.getTodayInUserTimezone(userTimezone);
    return utcDate >= today.start && utcDate <= today.end;
  }

  /**
   * Formatear fecha en timezone del usuario
   */
  static formatInUserTimezone(utcDate, userTimezone = 'UTC', formatString = 'yyyy-MM-dd HH:mm:ss') {
    const userDate = this.utcToUserTime(utcDate, userTimezone);
    return format(userDate, formatString);
  }

  /**
   * Obtener diferencia de horas entre UTC y timezone del usuario
   */
  static getTimezoneOffset(userTimezone = 'UTC') {
    const offsetHours = this.getTimezoneOffsetHours(userTimezone);
    console.log(`⏰ [TIMEZONE] Offset de ${userTimezone}: ${offsetHours} horas vs UTC`);
    return offsetHours;
  }
  
  /**
   * Obtener offset en horas para una timezone
   * @private
   */
  static getTimezoneOffsetHours(userTimezone) {
    // Buscar en el mapa de offsets
    const offset = TIMEZONE_OFFSETS[userTimezone];
    
    if (offset !== undefined) {
      return offset;
    }
    
    // Si no está en el mapa, intentar extraer el offset del nombre
    // Ejemplo: "UTC-6" -> -6, "UTC+1" -> 1
    const utcMatch = userTimezone.match(/UTC([+-]\d+)/);
    if (utcMatch) {
      return parseInt(utcMatch[1]);
    }
    
    // Por defecto, usar 0 (UTC)
    console.warn(`⚠️ [TIMEZONE] Timezone "${userTimezone}" no encontrada en mapa. Usando UTC (0)`);
    return 0;
  }
}

module.exports = TimezoneHelper;

