import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/ranking?weekId=X - Obtener ranking de una semana
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');

    if (!weekId) {
      return NextResponse.json(
        { error: 'weekId es requerido' },
        { status: 400 }
      );
    }

    // Obtener todas las partidas de la semana con sus resultados
    const matches = await prisma.match.findMany({
      where: {
        weekId: parseInt(weekId),
      },
      include: {
        results: {
          include: {
            player: true,
          },
        },
      },
      orderBy: {
        playedAt: 'asc',
      },
    });

    // Obtener personajes seleccionados
    const weeklyCharacters = await prisma.weeklyCharacter.findMany({
      where: {
        weekId: parseInt(weekId),
      },
      include: {
        character: true,
        player: true,
      },
    });

    // Calcular puntos totales por jugador
    const playerStats = {};

    matches.forEach((match) => {
      match.results.forEach((result) => {
        const playerId = result.playerId;
        const playerName = result.player.name;

        if (!playerStats[playerId]) {
          playerStats[playerId] = {
            playerId,
            playerName,
            totalPoints: 0,
            matchesPlayed: 0,
            positions: [],
            character: null,
          };
        }

        playerStats[playerId].totalPoints += result.points;
        playerStats[playerId].matchesPlayed += 1;
        playerStats[playerId].positions.push({
          matchId: match.id,
          position: result.position,
          points: result.points,
          playedAt: match.playedAt,
        });
      });
    });

    // Agregar información de personajes
    weeklyCharacters.forEach((wc) => {
      if (playerStats[wc.playerId]) {
        playerStats[wc.playerId].character = wc.character.name;
      }
    });

    // Convertir a array y ordenar por puntos
    const ranking = Object.values(playerStats).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    return NextResponse.json({
      weekId: parseInt(weekId),
      ranking,
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return NextResponse.json(
      { error: 'Error al obtener ranking' },
      { status: 500 }
    );
  }
}
