import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/weeks/close - Cerrar una semana y registrar al campeón oficial
export async function POST(request) {
  try {
    const { weekId } = await request.json();

    if (!weekId) {
      return NextResponse.json(
        { error: 'weekId es requerido' },
        { status: 400 }
      );
    }

    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: { winner: true },
    });

    if (!week) {
      return NextResponse.json(
        { error: 'Semana no encontrada' },
        { status: 404 }
      );
    }

    if (week.winner) {
      return NextResponse.json(
        { error: 'La semana ya tiene un campeón registrado', winner: week.winner },
        { status: 400 }
      );
    }

    const now = new Date();
    if (week.endDate > now) {
      return NextResponse.json(
        { error: 'La semana todavía no ha finalizado' },
        { status: 400 }
      );
    }

    // Calcular el ganador desde los resultados de partidas
    const matches = await prisma.match.findMany({
      where: { weekId },
      include: {
        results: {
          include: { player: true },
        },
      },
    });

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'No hay partidas registradas en esta semana' },
        { status: 400 }
      );
    }

    const playerPoints = {};
    matches.forEach((match) => {
      match.results.forEach((result) => {
        if (!playerPoints[result.playerId]) {
          playerPoints[result.playerId] = {
            player: result.player,
            totalPoints: 0,
          };
        }
        playerPoints[result.playerId].totalPoints += result.points;
      });
    });

    const rankings = Object.values(playerPoints).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    const winner = rankings[0].player;

    // Persistir el ganador oficial en la semana
    const updatedWeek = await prisma.week.update({
      where: { id: weekId },
      data: { winnerId: winner.id },
      include: { winner: true },
    });

    return NextResponse.json({
      message: `Semana ${week.weekNumber} cerrada exitosamente`,
      winner: updatedWeek.winner,
      weekNumber: week.weekNumber,
      rankings: rankings.map((r, i) => ({
        position: i + 1,
        playerId: r.player.id,
        playerName: r.player.name,
        totalPoints: r.totalPoints,
      })),
    });
  } catch (error) {
    console.error('Error closing week:', error);
    return NextResponse.json(
      { error: 'Error al cerrar la semana' },
      { status: 500 }
    );
  }
}
