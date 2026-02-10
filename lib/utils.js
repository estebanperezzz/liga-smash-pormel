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

/**
 * Calcula el número de semana basado en una fecha
 * @param {Date} date - Fecha para calcular
 * @returns {number} - Número de semana del año
 */
export function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Obtiene el lunes de la semana actual
 * @param {Date} date - Fecha de referencia
 * @returns {Date} - Lunes de esa semana a las 00:00
 */
export function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Obtiene el viernes de la semana actual
 * @param {Date} date - Fecha de referencia
 * @returns {Date} - Viernes de esa semana a las 23:59
 */
export function getFriday(date) {
  const monday = getMonday(date);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  friday.setHours(23, 59, 59, 999);
  return friday;
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
