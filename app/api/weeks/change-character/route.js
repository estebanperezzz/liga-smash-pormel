import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/weeks/change-character - Cambiar personaje (solo últimos 3, martes a viernes después 14:00)
export async function POST(request) {
  try {
    const { playerId, weekId, newCharacterId } = await request.json();

    if (!playerId || !weekId || !newCharacterId) {
      return NextResponse.json(
        { error: 'playerId, weekId y newCharacterId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar horario (martes a viernes después 14:00)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    if (!(dayOfWeek >= 2 && dayOfWeek <= 5 && hour >= 14)) {
      return NextResponse.json(
        { error: 'Los cambios solo están disponibles de martes a viernes después de las 14:00' },
        { status: 403 }
      );
    }

    // Obtener ranking para verificar elegibilidad
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

    // Verificar que ya no haya cambiado antes
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

    // Obtener personaje actual
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

    // Verificar que el nuevo personaje no esté tomado
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

    // Realizar el cambio en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Registrar el cambio en CharacterChange
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

      // 2. Actualizar WeeklyCharacter
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