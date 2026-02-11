import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/ranking?weekId=X - Obtener ranking de una semana específica
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekId = parseInt(searchParams.get('weekId'));

    if (!weekId) {
      return NextResponse.json(
        { error: 'weekId es requerido' },
        { status: 400 }
      );
    }

    // Obtener todos los resultados de partidas de la semana
    const matches = await prisma.match.findMany({
      where: {
        weekId,
      },
      include: {
        results: {
          include: {
            player: true,
          },
        },
      },
    });

    // Obtener personajes seleccionados en esta semana
    const weeklyCharacters = await prisma.weeklyCharacter.findMany({
      where: {
        weekId,
      },
      include: {
        player: true,
        character: true,
      },
    });

    // Crear mapa de personajes por jugador
    const playerCharacters = {};
    weeklyCharacters.forEach((wc) => {
      playerCharacters[wc.playerId] = {
        name: wc.character.name,
        image: wc.character.image,
        series: wc.character.series,
      };
    });

    // Calcular puntos totales por jugador
    const playerStats = {};

    matches.forEach((match) => {
      match.results.forEach((result) => {
        if (!playerStats[result.playerId]) {
          playerStats[result.playerId] = {
            playerId: result.playerId,
            playerName: result.player.name,
            totalPoints: 0,
            matchesPlayed: 0,
            positions: [],
            character: playerCharacters[result.playerId]?.name || null,
            characterImage: playerCharacters[result.playerId]?.image || null,
            characterSeries: playerCharacters[result.playerId]?.series || null,
          };
        }

        playerStats[result.playerId].totalPoints += result.points;
        playerStats[result.playerId].matchesPlayed += 1;
        playerStats[result.playerId].positions.push(result.position);
      });
    });

    // Convertir a array y ordenar por puntos
    const ranking = Object.values(playerStats).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    return NextResponse.json({
      weekId,
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