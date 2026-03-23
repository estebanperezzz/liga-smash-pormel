import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/history - Obtener historial de campeones
export async function GET() {
  try {
    const now = new Date();

    // Obtener todas las semanas completadas:
    // - endDate ya pasó, O
    // - tiene campeón registrado (auto-cerrada durante el gap del mismo viernes)
    const completedWeeks = await prisma.week.findMany({
      where: {
        OR: [
          { endDate: { lt: now } },
          { winnerId: { not: null } },
        ],
      },
      include: {
        winner: { include: { user: { select: { name: true, image: true } } } },
        season: { select: { id: true, number: true, name: true } },
        weeklyCharacters: {
          include: { character: true },
        },
        characterChanges: {
          include: { oldCharacter: true },
        },
        matches: {
          include: {
            results: {
              include: { player: { include: { user: { select: { name: true, image: true } } } } },
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
          seasonId: week.seasonId ?? null,
          season: week.season ?? null,
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

    // Obtener la semana activa (si existe) para incluir sus puntos en el ranking histórico
    // Solo aplica fuera del gap; durante el gap no hay semana activa
    const currentWeek = await prisma.week.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now },
        winnerId: null, // si ya tiene campeón, está en completedWeeks
      },
      include: {
        matches: {
          include: {
            results: {
              include: { player: { include: { user: { select: { name: true, image: true } } } } },
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
              userImage: result.player.user?.image ?? null,
              userName: result.player.user?.name ?? null,
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
          userImage: week.winner.user?.image ?? null,
          userName: week.winner.user?.name ?? null,
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

    // Agrupar semanas por temporada y computar rankings por temporada
    const seasonMap = {};
    weeksWithChampions.forEach((week) => {
      const key = week.seasonId ?? 'unknown';
      if (!seasonMap[key]) {
        seasonMap[key] = {
          seasonId: week.seasonId,
          seasonNumber: week.season?.number ?? null,
          seasonName: week.season?.name ?? null,
          weeks: [],
        };
      }
      seasonMap[key].weeks.push(week);
    });

    // Para cada temporada: puntos y campeonatos usando los datos brutos de completedWeeks
    Object.values(seasonMap).forEach((season) => {
      const seasonWeekIds = new Set(season.weeks.map((w) => w.id));
      const fullSeasonWeeks = completedWeeks.filter((w) => seasonWeekIds.has(w.id));

      // Points ranking de la temporada
      const seasonPoints = {};
      fullSeasonWeeks.forEach((week) => {
        week.matches.forEach((match) => {
          match.results.forEach((result) => {
            if (!seasonPoints[result.playerId]) {
              seasonPoints[result.playerId] = {
                playerId: result.playerId,
                playerName: result.player.name,
                userImage: result.player.user?.image ?? null,
                userName: result.player.user?.name ?? null,
                totalPoints: 0,
                matchesPlayed: 0,
              };
            }
            seasonPoints[result.playerId].totalPoints += result.points;
            seasonPoints[result.playerId].matchesPlayed += 1;
          });
        });
      });
      season.pointsRanking = Object.values(seasonPoints).sort(
        (a, b) => b.totalPoints - a.totalPoints
      );

      // Champion ranking de la temporada (victorias semanales)
      const seasonChampions = {};
      season.weeks.forEach((week) => {
        if (!week.winner) return;
        const id = week.winner.id;
        if (!seasonChampions[id]) {
          seasonChampions[id] = {
            playerId: week.winner.id,
            playerName: week.winner.name,
            userImage: week.winner.user?.image ?? null,
            userName: week.winner.user?.name ?? null,
            championships: 0,
          };
        }
        seasonChampions[id].championships++;
      });
      season.championRanking = Object.values(seasonChampions).sort(
        (a, b) => b.championships - a.championships
      );
    });

    const seasons = Object.values(seasonMap).sort(
      (a, b) => (b.seasonNumber ?? 0) - (a.seasonNumber ?? 0)
    );

    return NextResponse.json({
      weeks: weeksWithChampions,
      seasons,
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
