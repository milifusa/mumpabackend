/**
 * 🌍 HELPER DE ZONAS HORARIAS
 * 
 * Maneja la conversión entre UTC (servidor) y timezone del usuario
 * para evitar problemas con "hoy", "ayer", etc.
 */

// Importar funciones de date-fns-tz correctamente
const dateFnsTz = require('date-fns-tz');
const { startOfDay, endOfDay } = require('date-fns');

// Extraer funciones de date-fns-tz
const zonedTimeToUtc = dateFnsTz.zonedTimeToUtc;
const utcToZonedTime = dateFnsTz.utcToZonedTime;
const format = dateFnsTz.format;

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
    // Obtener fecha/hora actual en la timezone del usuario
    const now = new Date();
    const nowInUserTZ = utcToZonedTime(now, userTimezone);
    
    // Inicio del día en timezone del usuario
    const startOfDayInUserTZ = startOfDay(nowInUserTZ);
    
    // Fin del día en timezone del usuario
    const endOfDayInUserTZ = endOfDay(nowInUserTZ);
    
    // Convertir a UTC (para queries de Firestore)
    const startOfDayUTC = zonedTimeToUtc(startOfDayInUserTZ, userTimezone);
    const endOfDayUTC = zonedTimeToUtc(endOfDayInUserTZ, userTimezone);
    
    console.log(`📅 [TIMEZONE] "Hoy" en ${userTimezone}:`);
    console.log(`   - Hora local: ${format(nowInUserTZ, 'yyyy-MM-dd HH:mm:ss', { timeZone: userTimezone })}`);
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
    return utcToZonedTime(utcDate, userTimezone);
  }

  /**
   * Convertir hora local del usuario a UTC
   */
  static userTimeToUtc(localDate, userTimezone = 'UTC') {
    return zonedTimeToUtc(localDate, userTimezone);
  }

  /**
   * Obtener hora actual del usuario (no UTC)
   */
  static getNowInUserTimezone(userTimezone = 'UTC') {
    const now = new Date();
    return utcToZonedTime(now, userTimezone);
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
    return format(userDate, formatString, { timeZone: userTimezone });
  }

  /**
   * Obtener diferencia de horas entre UTC y timezone del usuario
   */
  static getTimezoneOffset(userTimezone = 'UTC') {
    const now = new Date();
    const utcTime = now.getTime();
    const userTime = utcToZonedTime(now, userTimezone).getTime();
    const offsetHours = (userTime - utcTime) / (1000 * 60 * 60);
    
    console.log(`⏰ [TIMEZONE] Offset de ${userTimezone}: ${offsetHours} horas vs UTC`);
    return offsetHours;
  }
}

module.exports = TimezoneHelper;

