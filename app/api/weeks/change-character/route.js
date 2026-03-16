import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

function isWithinChangeWindow() {
  const now = new Date();
  const day = now.getDay();
  const timeInMinutes = now.getHours() * 60 + now.getMinutes();

  const tuesday14h = 14 * 60 + 0;
  const friday14h = 14 * 60 + 0; // La semana cierra a las 14:30, corte a las 14:00

  if (day === 2 && timeInMinutes >= tuesday14h) return true;
  if (day === 3 || day === 4) return true;
  if (day === 5 && timeInMinutes < friday14h) return true;

  return false;
}

// POST /api/weeks/change-character
// Body: { playerId, weekId, newCharacterId, slot }
// slot: 1 o 2 — qué personaje cambiar. Si el jugador solo tiene 1 personaje, se asume slot 1.
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }
    const isAdmin = session.user.role === 'admin';

    const { playerId, weekId, newCharacterId, slot } = await request.json();
    const parsedPlayerId = Number.parseInt(playerId);
    const parsedWeekId = Number.parseInt(weekId);
    const parsedNewCharacterId = Number.parseInt(newCharacterId);

    if (!parsedPlayerId || !parsedWeekId || !parsedNewCharacterId) {
      return NextResponse.json(
        { error: 'playerId, weekId y newCharacterId son requeridos' },
        { status: 400 }
      );
    }

    if (!isAdmin) {
      if (!session.user.playerId) {
        return NextResponse.json(
          { error: 'No tienes un jugador asignado' },
          { status: 403 }
        );
      }

      if (session.user.playerId !== parsedPlayerId) {
        return NextResponse.json(
          { error: 'Solo puedes cambiar personaje para tu propio jugador' },
          { status: 403 }
        );
      }
    }

    if (!isWithinChangeWindow()) {
      return NextResponse.json(
        { error: 'Los cambios están disponibles entre el martes 14:00 y el viernes 14:00' },
        { status: 403 }
      );
    }

    // Calcular ranking de la semana para verificar bottom 3
    const matches = await prisma.match.findMany({
      where: { weekId: parsedWeekId },
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

    if (!bottom3Ids.includes(parsedPlayerId)) {
      return NextResponse.json(
        { error: 'No estás entre los últimos 3 del ranking' },
        { status: 403 }
      );
    }

    // Verificar que el jugador no haya cambiado ya esta semana
    const existingChange = await prisma.characterChange.findUnique({
      where: {
        playerId_weekId: {
          playerId: parsedPlayerId,
          weekId: parsedWeekId,
        },
      },
    });

    if (existingChange) {
      return NextResponse.json(
        { error: 'Ya has cambiado de personaje esta semana' },
        { status: 400 }
      );
    }

    // Obtener todas las selecciones del jugador esta semana
    const currentSelections = await prisma.weeklyCharacter.findMany({
      where: { playerId: parsedPlayerId, weekId: parsedWeekId },
    });

    if (currentSelections.length === 0) {
      return NextResponse.json(
        { error: 'No tienes personajes seleccionados esta semana' },
        { status: 400 }
      );
    }

    // Determinar qué slot cambiar
    let targetSlot;
    if (slot) {
      targetSlot = Number.parseInt(slot);
    } else {
      // Si solo tiene 1 personaje, asumir slot 1
      targetSlot = 1;
    }

    const currentSelection = currentSelections.find(s => s.slot === targetSlot);
    if (!currentSelection) {
      return NextResponse.json(
        { error: `No tienes personaje en el slot ${targetSlot}` },
        { status: 400 }
      );
    }

    // Verificar que el nuevo personaje no sea el mismo que ya tiene en el otro slot
    const otherSlotSelection = currentSelections.find(s => s.slot !== targetSlot);
    if (otherSlotSelection?.characterId === parsedNewCharacterId) {
      return NextResponse.json(
        { error: 'Ya tienes ese personaje en el otro slot' },
        { status: 409 }
      );
    }

    // Verificar que el nuevo personaje no haya sido elegido ya por 2 jugadores distintos
    const charPicksByOthers = await prisma.weeklyCharacter.count({
      where: {
        characterId: parsedNewCharacterId,
        weekId: parsedWeekId,
        NOT: { playerId: parsedPlayerId },
      },
    });

    if (charPicksByOthers >= 2) {
      return NextResponse.json(
        { error: 'Este personaje ya fue seleccionado por 2 jugadores' },
        { status: 409 }
      );
    }

    // Transacción: registrar cambio y actualizar WeeklyCharacter
    const result = await prisma.$transaction(async (tx) => {
      const change = await tx.characterChange.create({
        data: {
          playerId: parsedPlayerId,
          weekId: parsedWeekId,
          slot: targetSlot,
          oldCharacterId: currentSelection.characterId,
          newCharacterId: parsedNewCharacterId,
          reason: 'bottom3_rule',
        },
        include: {
          oldCharacter: true,
          newCharacter: true,
        },
      });

      const updated = await tx.weeklyCharacter.update({
        where: {
          playerId_weekId_slot: {
            playerId: parsedPlayerId,
            weekId: parsedWeekId,
            slot: targetSlot,
          },
        },
        data: {
          characterId: parsedNewCharacterId,
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
      slot: targetSlot,
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
