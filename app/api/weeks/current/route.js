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

    // Buscar si ya existe la semana actual por rango de fechas
    let currentWeek = await prisma.week.findFirst({
      where: {
        AND: [
          { startDate: { lte: now } },
          { endDate: { gte: now } }
        ]
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
      // Verificar si ya existe una semana con ese weekNumber
      const existingWeek = await prisma.week.findUnique({
        where: { weekNumber }
      });

      if (existingWeek) {
        // Si existe pero no es la actual, usar un weekNumber diferente
        const maxWeek = await prisma.week.findFirst({
          orderBy: { weekNumber: 'desc' }
        });
        const newWeekNumber = maxWeek ? maxWeek.weekNumber + 1 : weekNumber;

        currentWeek = await prisma.week.create({
          data: {
            weekNumber: newWeekNumber,
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
      } else {
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
    }

    return NextResponse.json(currentWeek);
  } catch (error) {
    console.error('Error fetching current week:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { error: 'Error al obtener semana actual', details: error.message },
      { status: 500 }
    );
  }
}
