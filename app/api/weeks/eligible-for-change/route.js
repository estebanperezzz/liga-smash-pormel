import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function isWithinChangeWindow() {
  const now = new Date();
  const day = now.getDay();  // 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hour * 60 + minutes;

  const tuesday14h = 2 * 60 + 0;   // Martes 14:00 en minutos del día
  const friday18h = 18 * 60 + 0;   // Viernes 18:00 en minutos del día

  // Martes después de las 14:00
  if (day === 2 && timeInMinutes >= tuesday14h) return true;
  // Miércoles y jueves todo el día
  if (day === 3 || day === 4) return true;
  // Viernes hasta las 18:00
  if (day === 5 && timeInMinutes < friday18h) return true;

  return false;
}

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

    if (!isWithinChangeWindow()) {
      return NextResponse.json({
        eligible: false,
        message: 'Los cambios están disponibles entre el martes 14:00 y el viernes 18:00',
        eligiblePlayers: [],
      });
    }

    const matches = await prisma.match.findMany({
      where: { weekId },
      include: {
        results: {
          include: { player: true },
        },
      },
    });

    if (matches.length === 0) {
      return NextResponse.json({
        eligible: false,
        message: 'Aún no hay partidas jugadas esta semana',
        eligiblePlayers: [],
      });
    }

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

    const ranking = Object.values(playerStats).sort(
      (a, b) => a.totalPoints - b.totalPoints
    );

    const bottom3 = ranking.slice(0, 3);

    const changes = await prisma.characterChange.findMany({
      where: {
        weekId,
        playerId: { in: bottom3.map(p => p.playerId) },
      },
    });

    const alreadyChanged = new Set(changes.map(c => c.playerId));

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