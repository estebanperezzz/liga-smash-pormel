import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/characters - Obtener todos los personajes
// Query params:
//   weekId  (opcional) - para obtener personajes disponibles en una semana
//   playerId (opcional) - para marcar el personaje usado la semana anterior por ese jugador
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');
    const playerId = searchParams.get('playerId');

    if (weekId) {
      const weekIdInt = Number.parseInt(weekId);

      // Obtener personajes ya seleccionados en esta semana
      const selectedCharacters = await prisma.weeklyCharacter.findMany({
        where: { weekId: weekIdInt },
        include: { character: true, player: true },
      });

      // Obtener todos los personajes
      const allCharacters = await prisma.character.findMany({
        orderBy: { name: 'asc' },
      });

      // Buscar todos los personajes que usó el jugador la semana anterior.
      // Un jugador puede haber usado hasta 2 personajes en una semana:
      //   - El personaje final (WeeklyCharacter.characterId)
      //   - El personaje original si realizó un cambio (CharacterChange.oldCharacterId)
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
            const [prevSelection, prevChange] = await Promise.all([
              prisma.weeklyCharacter.findFirst({
                where: { weekId: previousWeek.id, playerId: playerIdInt },
              }),
              prisma.characterChange.findFirst({
                where: { weekId: previousWeek.id, playerId: playerIdInt },
              }),
            ]);

            // Personaje con el que terminó la semana
            if (prevSelection) {
              previousWeekCharacterIds.add(prevSelection.characterId);
            }
            // Personaje original antes del cambio (si hubo cambio)
            if (prevChange) {
              previousWeekCharacterIds.add(prevChange.oldCharacterId);
            }
          }
        }
      }

      // Marcar cuáles están disponibles y cuáles fueron usados la semana anterior
      const charactersWithAvailability = allCharacters.map((char) => {
        const selection = selectedCharacters.find(
          (sel) => sel.characterId === char.id
        );
        return {
          ...char,
          available: !selection,
          selectedBy: selection ? selection.player.name : null,
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
