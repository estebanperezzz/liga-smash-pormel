import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculatePoints, validateMatchResults } from '@/lib/utils';

// POST /api/matches - Registrar una nueva partida
export async function POST(request) {
  try {
    const body = await request.json();
    const { weekId, results } = body;
    // results: [{ playerId, position }]

    if (!weekId || !results) {
      return NextResponse.json(
        { error: 'weekId y results son requeridos' },
        { status: 400 }
      );
    }

    // Validar resultados
    const validation = validateMatchResults(results);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Verificar que todos los jugadores hayan seleccionado personaje
    const playerIds = results.map((r) => r.playerId);
    const weeklyCharacters = await prisma.weeklyCharacter.findMany({
      where: {
        weekId: parseInt(weekId),
        playerId: { in: playerIds },
      },
    });

    if (weeklyCharacters.length !== playerIds.length) {
      return NextResponse.json(
        {
          error:
            'Todos los jugadores deben seleccionar un personaje antes de jugar',
        },
        { status: 400 }
      );
    }

    // Calcular puntos para cada jugador
    const totalPlayers = results.length;
    const resultsWithPoints = results.map((r) => ({
      playerId: parseInt(r.playerId),
      position: r.position,
      points: calculatePoints(r.position, totalPlayers),
    }));

    // Crear la partida con sus resultados en una transacción
    const match = await prisma.match.create({
      data: {
        weekId: parseInt(weekId),
        results: {
          create: resultsWithPoints,
        },
      },
      include: {
        results: {
          include: {
            player: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { error: 'Error al registrar partida' },
      { status: 500 }
    );
  }
}

// GET /api/matches?weekId=X - Obtener partidas de una semana
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');

    if (!weekId) {
      return NextResponse.json(
        { error: 'weekId es requerido' },
        { status: 400 }
      );
    }

    const matches = await prisma.match.findMany({
      where: {
        weekId: parseInt(weekId),
      },
      include: {
        results: {
          include: {
            player: true,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
      orderBy: {
        playedAt: 'desc',
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Error al obtener partidas' },
      { status: 500 }
    );
  }
}
