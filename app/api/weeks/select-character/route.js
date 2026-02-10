import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/weeks/select-character - Seleccionar personaje para la semana
export async function POST(request) {
  try {
    const body = await request.json();
    const { playerId, characterId, weekId } = body;

    if (!playerId || !characterId || !weekId) {
      return NextResponse.json(
        { error: 'playerId, characterId y weekId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el jugador ya seleccionó un personaje esta semana
    const existingSelection = await prisma.weeklyCharacter.findUnique({
      where: {
        playerId_weekId: {
          playerId: parseInt(playerId),
          weekId: parseInt(weekId),
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
          characterId: parseInt(characterId),
          weekId: parseInt(weekId),
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
        playerId: parseInt(playerId),
        characterId: parseInt(characterId),
        weekId: parseInt(weekId),
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
