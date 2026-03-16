import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { isInWeekendGap } from '@/lib/utils';
import { auth } from '@/auth';

// POST /api/weeks/select-character - Seleccionar personaje para la semana
// Body: { playerId, characterId, weekId }
// El slot se asigna automáticamente: 1 si no hay selección, 2 si ya hay una
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
    const parsedPlayerId = Number.parseInt(playerId);
    const parsedCharacterId = Number.parseInt(characterId);
    const parsedWeekId = Number.parseInt(weekId);

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

    // Obtener selecciones actuales del jugador esta semana
    const existingSelections = await prisma.weeklyCharacter.findMany({
      where: { playerId: parsedPlayerId, weekId: parsedWeekId },
    });

    // Verificar que no haya llegado al límite de 2 personajes
    if (existingSelections.length >= 2) {
      return NextResponse.json(
        { error: 'Ya seleccionaste 2 personajes esta semana' },
        { status: 409 }
      );
    }

    // Verificar que el jugador no tenga este personaje en el otro slot
    if (existingSelections.some(s => s.characterId === parsedCharacterId)) {
      return NextResponse.json(
        { error: 'Ya tienes este personaje en otro slot' },
        { status: 409 }
      );
    }

    // Verificar que el personaje no haya sido elegido ya por 2 jugadores
    const charPickCount = await prisma.weeklyCharacter.count({
      where: { characterId: parsedCharacterId, weekId: parsedWeekId },
    });

    if (charPickCount >= 2) {
      return NextResponse.json(
        { error: 'Este personaje ya fue seleccionado por 2 jugadores' },
        { status: 409 }
      );
    }

    // Determinar el slot automáticamente
    const assignedSlot = existingSelections.length === 0 ? 1 : 2;

    // Crear la selección
    const selection = await prisma.weeklyCharacter.create({
      data: {
        playerId: parsedPlayerId,
        characterId: parsedCharacterId,
        weekId: parsedWeekId,
        slot: assignedSlot,
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
