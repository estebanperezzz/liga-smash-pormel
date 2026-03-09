import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/ranking?weekId=X - Obtener ranking de una semana específica
// Si la semana es de equipos (isTeamWeek=true), devuelve ranking por equipo.
// Si es semana normal, devuelve ranking por jugador (comportamiento original).
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

    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 });
    }

    // ── SEMANA DE EQUIPOS ─────────────────────────────────────────────────────
    if (week.isTeamWeek) {
      const matches = await prisma.match.findMany({
        where: { weekId },
        include: {
          teamResults: {
            include: {
              team: {
                include: {
                  members: { include: { player: { select: { id: true, name: true } } } },
                },
              },
            },
          },
        },
      });

      const teamStats = {};

      matches.forEach((match) => {
        match.teamResults.forEach((result) => {
          if (!teamStats[result.teamId]) {
            teamStats[result.teamId] = {
              teamId: result.teamId,
              teamName: result.team.name,
              totalPoints: 0,
              matchesPlayed: 0,
              wins: 0,
              members: result.team.members.map((m) => ({ id: m.player.id, name: m.player.name })),
            };
          }
          teamStats[result.teamId].totalPoints += result.points;
          teamStats[result.teamId].matchesPlayed += 1;
          if (result.position === 1) teamStats[result.teamId].wins += 1;
        });
      });

      const ranking = Object.values(teamStats).sort((a, b) => b.totalPoints - a.totalPoints);

      return NextResponse.json({
        weekId,
        isTeamWeek: true,
        ranking,
        totalMatches: matches.length,
      });
    }

    // ── SEMANA NORMAL (comportamiento original) ───────────────────────────────
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

    const playerCharacters = {};
    weeklyCharacters.forEach((wc) => {
      playerCharacters[wc.playerId] = {
        name: wc.character.name,
        image: wc.character.image,
        series: wc.character.series,
      };
    });

    const playerStats = {};

    matches.forEach((match) => {
      match.results.forEach((result) => {
        if (!playerStats[result.playerId]) {
          playerStats[result.playerId] = {
            playerId: result.playerId,
            playerName: result.player.name,
            totalPoints: 0,
            matchesPlayed: 0,
            top1: 0,
            top3: 0,
            positions: [],
            character: playerCharacters[result.playerId]?.name || null,
            characterImage: playerCharacters[result.playerId]?.image || null,
            characterSeries: playerCharacters[result.playerId]?.series || null,
          };
        }

        playerStats[result.playerId].totalPoints += result.points;
        playerStats[result.playerId].matchesPlayed += 1;
        playerStats[result.playerId].positions.push(result.position);
        if (result.position === 1) playerStats[result.playerId].top1 += 1;
        if (result.position <= 3) playerStats[result.playerId].top3 += 1;
      });
    });

    const ranking = Object.values(playerStats).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    return NextResponse.json({
      weekId,
      isTeamWeek: false,
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
