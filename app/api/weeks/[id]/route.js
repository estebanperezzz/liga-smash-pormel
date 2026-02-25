import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/weeks/[id] - Obtener info de una semana específica con su ranking
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const weekId = parseInt(id);

    if (!weekId || isNaN(weekId)) {
      return NextResponse.json({ error: 'ID de semana inválido' }, { status: 400 });
    }

    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { winner: true },
    });

    if (!week) {
      return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 });
    }

    const matches = await prisma.match.findMany({
      where: { weekId },
      include: {
        results: {
          include: { player: true },
        },
      },
    });

    const weeklyCharacters = await prisma.weeklyCharacter.findMany({
      where: { weekId },
      include: { player: true, character: true },
    });

    // Mapa de personaje por jugador
    const playerCharacters = {};
    weeklyCharacters.forEach((wc) => {
      playerCharacters[wc.playerId] = {
        name: wc.character.name,
        image: wc.character.image,
        series: wc.character.series,
      };
    });

    // Calcular stats por jugador
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
            character: playerCharacters[result.playerId]?.name ?? null,
            characterImage: playerCharacters[result.playerId]?.image ?? null,
            characterSeries: playerCharacters[result.playerId]?.series ?? null,
          };
        }
        playerStats[result.playerId].totalPoints += result.points;
        playerStats[result.playerId].matchesPlayed += 1;
        playerStats[result.playerId].positions.push(result.position);
      });
    });

    const ranking = Object.values(playerStats).sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json({
      week,
      ranking,
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error('Error fetching week:', error);
    return NextResponse.json({ error: 'Error al obtener semana' }, { status: 500 });
  }
}
