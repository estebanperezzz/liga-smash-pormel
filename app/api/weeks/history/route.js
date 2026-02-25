import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/history - Obtener historial de campeones
export async function GET() {
  try {
    const now = new Date();

    // Obtener todas las semanas completadas
    const completedWeeks = await prisma.week.findMany({
      where: {
        endDate: { lt: now },
      },
      include: {
        winner: true,
        weeklyCharacters: {
          include: { character: true },
        },
        characterChanges: {
          include: { oldCharacter: true },
        },
        matches: {
          include: {
            results: {
              include: { player: true },
            },
          },
        },
      },
      orderBy: { endDate: 'desc' },
    });

    // Determinar campeón para cada semana
    const weeksWithChampions = completedWeeks
      .map((week) => {
        let winner = week.winner;

        // Calcular siempre los puntos desde partidas (para stats y desempate)
        const playerPoints = {};
        week.matches.forEach((match) => {
          match.results.forEach((result) => {
            if (!playerPoints[result.playerId]) {
              playerPoints[result.playerId] = {
                player: result.player,
                totalPoints: 0,
                matchesPlayed: 0,
              };
            }
            playerPoints[result.playerId].totalPoints += result.points;
            playerPoints[result.playerId].matchesPlayed += 1;
          });
        });

        if (!winner && week.matches.length > 0) {
          const rankings = Object.values(playerPoints).sort(
            (a, b) => b.totalPoints - a.totalPoints
          );
          winner = rankings[0]?.player || null;
        }

        if (!winner) return null;

        const winnerStats = playerPoints[winner.id];
        const winnerCharacterRecord = week.weeklyCharacters.find(
          (wc) => wc.playerId === winner.id
        );
        const winnerChange = week.characterChanges.find(
          (cc) => cc.playerId === winner.id
        );

        const winnerCharacters = [];
        if (winnerChange) {
          winnerCharacters.push(winnerChange.oldCharacter);
        }
        if (winnerCharacterRecord?.character) {
          winnerCharacters.push(winnerCharacterRecord.character);
        }

        return {
          id: week.id,
          weekNumber: week.weekNumber,
          startDate: week.startDate,
          endDate: week.endDate,
          championImage: week.championImage ?? null,
          winner,
          winnerCharacters,
          winnerPoints: winnerStats?.totalPoints ?? null,
          winnerMatchesPlayed: winnerStats?.matchesPlayed ?? null,
        };
      })
      .filter(Boolean);

    // Obtener la semana actual (activa) para incluir sus puntos en el ranking histórico
    const currentWeek = await prisma.week.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        matches: {
          include: {
            results: {
              include: { player: true },
            },
          },
        },
      },
    });

    // Calcular ranking histórico de puntos (semanas completadas + semana actual)
    const allWeeksForPoints = currentWeek
      ? [...completedWeeks, currentWeek]
      : completedWeeks;

    const historicalPoints = {};
    allWeeksForPoints.forEach((week) => {
      week.matches.forEach((match) => {
        match.results.forEach((result) => {
          if (!historicalPoints[result.playerId]) {
            historicalPoints[result.playerId] = {
              playerId: result.playerId,
              playerName: result.player.name,
              totalPoints: 0,
              matchesPlayed: 0,
            };
          }
          historicalPoints[result.playerId].totalPoints += result.points;
          historicalPoints[result.playerId].matchesPlayed += 1;
        });
      });
    });

    const historicalPointsRanking = Object.values(historicalPoints).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    // Calcular estadísticas de campeones
    const championStats = {};

    weeksWithChampions.forEach((week) => {
      const playerId = week.winner.id;
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
      weeks: weeksWithChampions,
      championRanking,
      historicalPointsRanking,
      totalWeeks: weeksWithChampions.length,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      { error: 'Error al obtener historial' },
      { status: 500 }
    );
  }
}
