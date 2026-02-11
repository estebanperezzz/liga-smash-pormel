import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/weeks/eligible-for-change?weekId=X - Obtener jugadores elegibles para cambiar personaje
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

    // Verificar que sea martes a viernes después de las 14:00
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Domingo, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes
    const hour = now.getHours();

    // Permitir de martes (2) a viernes (5) después de las 14:00
    const isEligibleTime = (dayOfWeek >= 2 && dayOfWeek <= 5) && hour >= 14;

    if (!isEligibleTime) {
      return NextResponse.json({
        eligible: false,
        message: 'Los cambios solo están disponibles de martes a viernes después de las 14:00',
        eligiblePlayers: [],
      });
    }

    // Obtener ranking actual
    const matches = await prisma.match.findMany({
      where: { weekId },
      include: {
        results: {
          include: { player: true },
        },
      },
    });

    // Si no hay partidas aún, nadie es elegible
    if (matches.length === 0) {
      return NextResponse.json({
        eligible: false,
        message: 'Aún no hay partidas jugadas esta semana',
        eligiblePlayers: [],
      });
    }

    // Calcular puntos por jugador
    const playerStats = {};
    matches.forEach((match) => {
      match.results.forEach((result) => {
        if (!playerStats[result.playerId]) {
          playerStats[result.playerId] = {
            playerId: result.playerId,
            playerName: result.player.name,
            totalPoints: 0,
          };
        }
        playerStats[result.playerId].totalPoints += result.points;
      });
    });

    // Ordenar por puntos (menor a mayor)
    const ranking = Object.values(playerStats).sort(
      (a, b) => a.totalPoints - b.totalPoints
    );

    // Obtener últimos 3
    const bottom3 = ranking.slice(0, 3);

    // Verificar quiénes ya han cambiado
    const changes = await prisma.characterChange.findMany({
      where: {
        weekId,
        playerId: { in: bottom3.map(p => p.playerId) },
      },
    });

    const alreadyChanged = new Set(changes.map(c => c.playerId));

    // Filtrar solo los que no han cambiado
    const eligiblePlayers = bottom3
      .filter(p => !alreadyChanged.has(p.playerId))
      .map(p => ({
        playerId: p.playerId,
        playerName: p.playerName,
        currentPoints: p.totalPoints,
      }));

    return NextResponse.json({
      eligible: true,
      eligiblePlayers,
      totalBottom3: bottom3.length,
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return NextResponse.json(
      { error: 'Error al verificar elegibilidad' },
      { status: 500 }
    );
  }
}