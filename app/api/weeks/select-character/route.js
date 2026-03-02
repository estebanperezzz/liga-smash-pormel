import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isInWeekendGap } from '@/lib/utils';
import { auth } from '@/auth';

// POST /api/weeks/select-character - Seleccionar personaje para la semana
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

    if (isInWeekendGap(new Date())) {
      return NextResponse.json(
        { error: 'La selección de personajes está cerrada. Reabre el lunes a las 09:00' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { playerId, characterId, weekId } = body;
    const parsedPlayerId = parseInt(playerId);
    const parsedCharacterId = parseInt(characterId);
    const parsedWeekId = parseInt(weekId);

    if (!parsedPlayerId || !parsedCharacterId || !parsedWeekId) {
      return NextResponse.json(
        { error: 'playerId, characterId y weekId son requeridos' },
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
          { error: 'Solo puedes seleccionar personaje para tu propio jugador' },
          { status: 403 }
        );
      }
    }

    // Verificar si el jugador ya seleccionó un personaje esta semana
    const existingSelection = await prisma.weeklyCharacter.findUnique({
      where: {
        playerId_weekId: {
          playerId: parsedPlayerId,
          weekId: parsedWeekId,
        },
      },
    });

    if (existingSelection) {
      return NextResponse.json(
        { error: 'Ya seleccionaste un personaje esta semana' },
        { status: 409 }
      );
    }

    // Verificar si el personaje ya fue seleccionado por otro jugador
    const characterTaken = await prisma.weeklyCharacter.findUnique({
      where: {
        characterId_weekId: {
          characterId: parsedCharacterId,
          weekId: parsedWeekId,
        },
      },
      include: {
        player: true,
      },
    });

    if (characterTaken) {
      return NextResponse.json(
        {
          error: `Este personaje ya fue seleccionado por ${characterTaken.player.name}`,
        },
        { status: 409 }
      );
    }

    // Crear la selección
    const selection = await prisma.weeklyCharacter.create({
      data: {
        playerId: parsedPlayerId,
        characterId: parsedCharacterId,
        weekId: parsedWeekId,
      },
      include: {
        player: true,
        character: true,
      },
    });

    return NextResponse.json(selection, { status: 201 });
  } catch (error) {
    console.error('Error selecting character:', error);
    return NextResponse.json(
      { error: 'Error al seleccionar personaje' },
      { status: 500 }
    );
  }
}
