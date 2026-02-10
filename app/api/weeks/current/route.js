import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getWeekNumber, getMonday, getFriday } from '@/lib/utils';

// GET /api/weeks/current - Obtener la semana actual (o crearla si no existe)
export async function GET() {
  try {
    const now = new Date();
    const monday = getMonday(now);
    const friday = getFriday(now);
    const weekNumber = getWeekNumber(now);

    // Buscar si ya existe la semana actual
    let currentWeek = await prisma.week.findFirst({
      where: {
        startDate: monday,
        endDate: friday,
      },
      include: {
        winner: true,
        weeklyCharacters: {
          include: {
            player: true,
            character: true,
          },
        },
      },
    });

    // Si no existe, crearla
    if (!currentWeek) {
      currentWeek = await prisma.week.create({
        data: {
          weekNumber,
          startDate: monday,
          endDate: friday,
        },
        include: {
          winner: true,
          weeklyCharacters: {
            include: {
              player: true,
              character: true,
            },
          },
        },
      });
    }

    return NextResponse.json(currentWeek);
  } catch (error) {
    console.error('Error fetching current week:', error);
    return NextResponse.json(
      { error: 'Error al obtener semana actual' },
      { status: 500 }
    );
  }
}
