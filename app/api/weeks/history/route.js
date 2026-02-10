import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/history - Obtener historial de campeones
export async function GET() {
  try {
    // Obtener todas las semanas con ganador
    const weeks = await prisma.week.findMany({
      where: {
        winnerId: {
          not: null,
        },
      },
      include: {
        winner: true,
      },
      orderBy: {
        endDate: 'desc',
      },
    });

    // Calcular estadísticas de campeones
    const championStats = {};

    weeks.forEach((week) => {
      const playerId = week.winnerId;
      const playerName = week.winner.name;

      if (!championStats[playerId]) {
        championStats[playerId] = {
          playerId,
          playerName,
          championships: 0,
          weeks: [],
        };
      }

      championStats[playerId].championships += 1;
      championStats[playerId].weeks.push({
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
      });
    });

    // Convertir a array y ordenar por cantidad de campeonatos
    const championRanking = Object.values(championStats).sort(
      (a, b) => b.championships - a.championships
    );

    return NextResponse.json({
      weeks,
      championRanking,
      totalWeeks: weeks.length,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
