import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function isWithinChangeWindow() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const timeInMinutes = hour * 60 + minutes;

  const tuesday14h = 14 * 60 + 0;
  const friday18h = 18 * 60 + 0;

  if (day === 2 && timeInMinutes >= tuesday14h) return true;
  if (day === 3 || day === 4) return true;
  if (day === 5 && timeInMinutes < friday18h) return true;

  return false;
}

export async function POST(request) {
  try {
    const { playerId, weekId, newCharacterId } = await request.json();

    if (!playerId || !weekId || !newCharacterId) {
      return NextResponse.json(
        { error: 'playerId, weekId y newCharacterId son requeridos' },
        { status: 400 }
      );
    }

    if (!isWithinChangeWindow()) {
      return NextResponse.json(
        { error: 'Los cambios están disponibles entre el martes 14:00 y el viernes 18:00' },
        { status: 403 }
      );
    }

    const matches = await prisma.match.findMany({
      where: { weekId },
      include: {
        results: {
          include: { player: true },
        },
      },
    });

    const playerStats = {};
    matches.forEach((match) => {
      match.results.forEach((result) => {
        if (!playerStats[result.playerId]) {
          playerStats[result.playerId] = {
            playerId: result.playerId,
            totalPoints: 0,
          };
        }
        playerStats[result.playerId].totalPoints += result.points;
      });
    });

    const ranking = Object.values(playerStats).sort(
      (a, b) => a.totalPoints - b.totalPoints
    );

    const bottom3Ids = ranking.slice(0, 3).map(p => p.playerId);

    if (!bottom3Ids.includes(playerId)) {
      return NextResponse.json(
        { error: 'No estás entre los últimos 3 del ranking' },
        { status: 403 }
      );
    }

    const existingChange = await prisma.characterChange.findUnique({
      where: {
        playerId_weekId: {
          playerId,
          weekId,
        },
      },
    });

    if (existingChange) {
      return NextResponse.json(
        { error: 'Ya has cambiado de personaje esta semana' },
        { status: 400 }
      );
    }

    const currentSelection = await prisma.weeklyCharacter.findUnique({
      where: {
        playerId_weekId: {
          playerId,
          weekId,
        },
      },
    });

    if (!currentSelection) {
      return NextResponse.json(
        { error: 'No tienes un personaje seleccionado' },
        { status: 400 }
      );
    }

    const characterTaken = await prisma.weeklyCharacter.findUnique({
      where: {
        characterId_weekId: {
          characterId: newCharacterId,
          weekId,
        },
      },
    });

    if (characterTaken && characterTaken.playerId !== playerId) {
      return NextResponse.json(
        { error: 'Este personaje ya está siendo usado por otro jugador' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const change = await tx.characterChange.create({
        data: {
          playerId,
          weekId,
          oldCharacterId: currentSelection.characterId,
          newCharacterId,
          reason: 'bottom3_rule',
        },
        include: {
          oldCharacter: true,
          newCharacter: true,
        },
      });

      const updated = await tx.weeklyCharacter.update({
        where: {
          playerId_weekId: {
            playerId,
            weekId,
          },
        },
        data: {
          characterId: newCharacterId,
          hasChanged: true,
        },
        include: {
          character: true,
          player: true,
        },
      });

      return { change, updated };
    });

    return NextResponse.json({
      success: true,
      message: 'Personaje cambiado exitosamente',
      oldCharacter: result.change.oldCharacter.name,
      newCharacter: result.change.newCharacter.name,
      change: result.change,
    });
  } catch (error) {
    console.error('Error changing character:', error);
    return NextResponse.json(
      { error: 'Error al cambiar personaje', details: error.message },
      { status: 500 }
    );
  }
}