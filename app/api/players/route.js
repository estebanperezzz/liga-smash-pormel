import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

// GET /api/players - Obtener todos los jugadores
export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    return NextResponse.json(
      { error: 'Error al obtener jugadores' },
      { status: 500 }
    );
  }
}

// POST /api/players - Crear un nuevo jugador
export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del jugador es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el jugador ya existe
    const existingPlayer = await prisma.player.findUnique({
      where: { name: name.trim() },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Ya existe un jugador con ese nombre' },
        { status: 409 }
      );
    }

    const player = await prisma.player.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Error al crear jugador' },
      { status: 500 }
    );
  }
}
