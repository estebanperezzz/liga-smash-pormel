/**
 * Calcula los puntos para una posición según la cantidad total de jugadores
 * @param {number} position - Posición del jugador (1 = primero, 2 = segundo, etc.)
 * @param {number} totalPlayers - Cantidad total de jugadores en la partida
 * @returns {number} - Puntos obtenidos
 */
export function calculatePoints(position, totalPlayers) {
  // Fórmula: totalPlayers - position + 1
  // Ejemplo: 7 jugadores -> 1° = 7pts, 2° = 6pts, ..., 7° = 1pt
  return totalPlayers - position + 1;
}

// Argentina no tiene horario de verano: siempre UTC-3
const AR_OFFSET_MS = -3 * 60 * 60 * 1000;

/**
 * Convierte una fecha UTC al instante equivalente en Argentina (UTC-3).
 * Usar .getUTC*() sobre el resultado para obtener día/hora argentina.
 */
function toAR(date) {
  return new Date(date.getTime() + AR_OFFSET_MS);
}

/**
 * Calcula el número de semana basado en una fecha
 * @param {Date} date - Fecha de referencia
 * @returns {number} - Número de semana del año
 */
export function getWeekNumber(date) {
  const ar = toAR(date);
  const d = new Date(Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Obtiene el lunes de la semana actual
 * @param {Date} date - Fecha de referencia
 * @returns {Date} - Lunes de esa semana a las 09:00 Argentina (12:00 UTC)
 */
export function getMonday(date) {
  const ar = toAR(date);
  const day = ar.getUTCDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(ar);
  monday.setUTCDate(ar.getUTCDate() + diffToMon);
  monday.setUTCHours(12, 0, 0, 0); // 09:00 AR = 12:00 UTC
  return monday;
}

/**
 * Obtiene el viernes de la semana actual
 * @param {Date} date - Fecha de referencia
 * @returns {Date} - Viernes de esa semana a las 14:30 Argentina (17:30 UTC)
 */
export function getFriday(date) {
  const monday = getMonday(date);
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);
  friday.setUTCHours(17, 30, 0, 0); // 14:30 AR = 17:30 UTC
  return friday;
}

/**
 * Determina si el momento actual está en el período de "gap" entre semanas
 * (viernes 14:30 → lunes 09:00 hora Argentina), donde no hay semana activa
 * @param {Date} date - Fecha a evaluar
 * @returns {boolean}
 */
export function isInWeekendGap(date) {
  const ar = toAR(date);
  const day = ar.getUTCDay(); // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sab
  const t = ar.getUTCHours() * 60 + ar.getUTCMinutes();
  if (day === 5 && t >= 14 * 60 + 30) return true; // Viernes desde 14:30 AR
  if (day === 6) return true;                        // Sábado
  if (day === 0) return true;                        // Domingo
  if (day === 1 && t < 9 * 60) return true;          // Lunes antes de 09:00 AR
  return false;
}

/**
 * Valida que una partida tenga resultados válidos
 * @param {Array} results - Array de resultados [{playerId, position}]
 * @returns {Object} - {valid: boolean, error: string}
 */
export function validateMatchResults(results) {
  if (!results || results.length === 0) {
    return { valid: false, error: 'Debe haber al menos un jugador' };
  }

  const positions = results.map(r => r.position);
  const playerIds = results.map(r => r.playerId);

  // Verificar que no haya posiciones duplicadas
  if (new Set(positions).size !== positions.length) {
    return { valid: false, error: 'No puede haber posiciones duplicadas' };
  }

  // Verificar que no haya jugadores duplicados
  if (new Set(playerIds).size !== playerIds.length) {
    return { valid: false, error: 'Un jugador no puede estar dos veces en la misma partida' };
  }

  // Verificar que las posiciones sean consecutivas desde 1
  const sortedPositions = [...positions].sort((a, b) => a - b);
  for (let i = 0; i < sortedPositions.length; i++) {
    if (sortedPositions[i] !== i + 1) {
      return { valid: false, error: 'Las posiciones deben ser consecutivas desde 1' };
    }
  }

  return { valid: true };
}
