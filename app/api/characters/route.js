import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/characters - Obtener todos los personajes
// Query params:
//   weekId   (opcional) - para obtener personajes disponibles en una semana
//   playerId (opcional) - para marcar personajes usados la semana anterior por ese jugador
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');
    const playerId = searchParams.get('playerId');

    if (weekId) {
      const weekIdInt = Number.parseInt(weekId);

      // Obtener todas las selecciones de esta semana
      const selectedCharacters = await prisma.weeklyCharacter.findMany({
        where: { weekId: weekIdInt },
        include: { character: true, player: true },
      });

      // Obtener todos los personajes
      const allCharacters = await prisma.character.findMany({
        orderBy: { name: 'asc' },
      });

      // Buscar todos los personajes que usó el jugador la semana anterior (ambos slots).
      // Un jugador puede haber usado hasta 4 personajes entre slots y cambios:
      //   - Los personajes finales de ambos slots (WeeklyCharacter)
      //   - El personaje original de cualquier slot que haya cambiado (CharacterChange)
      const previousWeekCharacterIds = new Set();
      if (playerId) {
        const playerIdInt = Number.parseInt(playerId);
        const currentWeek = await prisma.week.findUnique({
          where: { id: weekIdInt },
        });

        if (currentWeek) {
          const previousWeek = await prisma.week.findFirst({
            where: { endDate: { lt: currentWeek.startDate } },
            orderBy: { endDate: 'desc' },
          });

          if (previousWeek) {
            const [prevSelections, prevChanges] = await Promise.all([
              prisma.weeklyCharacter.findMany({
                where: { weekId: previousWeek.id, playerId: playerIdInt },
              }),
              prisma.characterChange.findMany({
                where: { weekId: previousWeek.id, playerId: playerIdInt },
              }),
            ]);

            // Personajes con los que terminó la semana (ambos slots)
            prevSelections.forEach(s => previousWeekCharacterIds.add(s.characterId));
            // Personajes originales antes de cualquier cambio
            prevChanges.forEach(c => previousWeekCharacterIds.add(c.oldCharacterId));
          }
        }
      }

      // Construir mapa: characterId → lista de jugadores que lo tienen esta semana
      const charPicksMap = {};
      selectedCharacters.forEach((sel) => {
        if (!charPicksMap[sel.characterId]) {
          charPicksMap[sel.characterId] = [];
        }
        charPicksMap[sel.characterId].push(sel.player.name);
      });

      // Marcar disponibilidad: un personaje es seleccionable si < 2 jugadores lo tienen
      const charactersWithAvailability = allCharacters.map((char) => {
        const pickedBy = charPicksMap[char.id] ?? [];
        return {
          ...char,
          available: pickedBy.length < 2,
          pickCount: pickedBy.length,       // 0, 1 o 2
          selectedBy: pickedBy,             // array de nombres
          usedPreviousWeek: previousWeekCharacterIds.has(char.id),
        };
      });

      return NextResponse.json(charactersWithAvailability);
    }

    // Si no hay weekId, devolver todos los personajes
    const characters = await prisma.character.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Error al obtener personajes' },
      { status: 500 }
    );
  }
}
