import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const playerId = parseInt(params.id);

    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });
    }

    // Obtener todos los resultados del jugador
    const results = await prisma.matchResult.findMany({
      where: { playerId },
      include: {
        match: {
          include: { week: true },
        },
      },
    });

    // Obtener todas las selecciones de personaje del jugador (historial completo)
    const weeklyCharacters = await prisma.weeklyCharacter.findMany({
      where: { playerId },
      include: { character: true, week: true },
    });

    // Obtener todos los cambios de personaje del jugador
    const characterChanges = await prisma.characterChange.findMany({
      where: { playerId },
      include: {
        oldCharacter: true,
        newCharacter: true,
        week: true,
      },
    });

    // Construir mapa de semana -> personajes usados (puede haber 2 si hubo cambio)
    // Estructura: weekId -> { before: Character, after: Character | null, changeDate: Date | null }
    const weekCharacterMap = {};

    weeklyCharacters.forEach((wc) => {
      weekCharacterMap[wc.weekId] = {
        currentCharacter: wc.character,
        hasChanged: wc.hasChanged,
        originalCharacter: wc.character, // por defecto es el mismo
        changeDate: null,
      };
    });

    // Si hubo cambio, el personaje original es oldCharacter y el actual es newCharacter
    characterChanges.forEach((change) => {
      if (weekCharacterMap[change.weekId]) {
        weekCharacterMap[change.weekId].originalCharacter = change.oldCharacter;
        weekCharacterMap[change.weekId].changeDate = change.changedAt;
      }
    });

    // Para cada resultado, asignar el personaje correcto según el momento del partido
    const resultsWithCharacters = results.map((result) => {
      const weekInfo = weekCharacterMap[result.match.weekId];

      if (!weekInfo) {
        return { ...result, character: null };
      }

      // Si hubo cambio en esa semana, verificar si el partido fue antes o después del cambio
      if (weekInfo.hasChanged && weekInfo.changeDate) {
        const matchDate = new Date(result.match.playedAt);
        const changeDate = new Date(weekInfo.changeDate);

        if (matchDate < changeDate) {
          // Partido jugado ANTES del cambio → usar personaje original
          return { ...result, character: weekInfo.originalCharacter };
        } else {
          // Partido jugado DESPUÉS del cambio → usar personaje nuevo
          return { ...result, character: weekInfo.currentCharacter };
        }
      }

      // Sin cambio: usar el personaje actual
      return { ...result, character: weekInfo.currentCharacter };
    });

    // Stats generales
    const totalMatches = resultsWithCharacters.length;
    const top1 = resultsWithCharacters.filter(r => r.position === 1).length;
    const top3 = resultsWithCharacters.filter(r => r.position <= 3).length;
    const totalPoints = resultsWithCharacters.reduce((acc, r) => acc + r.points, 0);
    const avgPosition = totalMatches > 0
      ? (resultsWithCharacters.reduce((acc, r) => acc + r.position, 0) / totalMatches).toFixed(1)
      : 0;

    // Stats por personaje
    const characterStats = {};

    // Primero registrar todos los personajes seleccionados (incluso con 0 partidas)
    weeklyCharacters.forEach((wc) => {
      const char = wc.character;
      if (!characterStats[char.id]) {
        characterStats[char.id] = {
          characterId: char.id,
          characterName: char.name,
          characterImage: char.image || null,
          characterSeries: char.series || null,
          matchesPlayed: 0,
          top1: 0,
          top3: 0,
          totalPoints: 0,
          positions: [],
        };
      }

      // Si hubo cambio en esa semana, también registrar el personaje original
      const change = characterChanges.find(c => c.weekId === wc.weekId);
      if (change) {
        const oldChar = change.oldCharacter;
        if (!characterStats[oldChar.id]) {
          characterStats[oldChar.id] = {
            characterId: oldChar.id,
            characterName: oldChar.name,
            characterImage: oldChar.image || null,
            characterSeries: oldChar.series || null,
            matchesPlayed: 0,
            top1: 0,
            top3: 0,
            totalPoints: 0,
            positions: [],
          };
        }
      }
    });

    // Luego acumular stats de los resultados
    resultsWithCharacters.forEach((result) => {
      const charId = result.character?.id;
      if (!charId) return;

      if (!characterStats[charId]) {
        characterStats[charId] = {
          characterId: charId,
          characterName: result.character.name,
          characterImage: result.character.image || null,
          characterSeries: result.character.series || null,
          matchesPlayed: 0,
          top1: 0,
          top3: 0,
          totalPoints: 0,
          positions: [],
        };
      }

      const stat = characterStats[charId];
      stat.matchesPlayed += 1;
      stat.totalPoints += result.points;
      stat.positions.push(result.position);
      if (result.position === 1) stat.top1 += 1;
      if (result.position <= 3) stat.top3 += 1;
    });

    // Calcular avgPosition y ordenar por partidas jugadas
    const characterStatsArray = Object.values(characterStats)
      .map(stat => ({
        ...stat,
        avgPosition: stat.positions.length > 0
          ? (stat.positions.reduce((a, b) => a + b, 0) / stat.positions.length).toFixed(1)
          : '-',
      }))
      .sort((a, b) => b.matchesPlayed - a.matchesPlayed);

    return NextResponse.json({
      player,
      general: {
        totalMatches,
        top1,
        top3,
        totalPoints,
        avgPosition,
      },
      byCharacter: characterStatsArray,
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}