import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getWeekNumber, getMonday, getFriday, isInWeekendGap } from '@/lib/utils';

// GET /api/weeks/current - Obtener la semana actual (o crearla si no existe)
// Durante el gap (Vie 14:30 → Lun 09:00) devuelve la última semana con isWeekend: true
// y auto-cierra la semana si todavía no tiene campeón registrado.
export async function GET() {
  try {
    const now = new Date();

    // ── CHEQUEO DE TEMPORADA ACTIVA ───────────────────────────────────────────
    // Si no hay temporada activa, la liga está en pausa y no se crean semanas
    const activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
    if (!activeSeason) {
      return NextResponse.json({ isPaused: true });
    }

    // ── PERÍODO DE GAP (Vie 14:30 → Lun 09:00) ──────────────────────────────
    if (isInWeekendGap(now)) {
      let lastWeek = await prisma.week.findFirst({
        where: { startDate: { lte: now } },
        orderBy: { startDate: 'desc' },
        include: {
          winner: true,
          weeklyCharacters: {
            include: { player: true, character: true },
          },
        },
      });

      if (!lastWeek) {
        return NextResponse.json({ isWeekend: true, weeklyCharacters: [] });
      }

      const updateData = {};

      // Corregir endDate si fue creada con el código viejo (endDate > now)
      const correctEndDate = getFriday(new Date(lastWeek.startDate));
      if (lastWeek.endDate > now && correctEndDate <= now) {
        updateData.endDate = correctEndDate;
      }

      // Auto-cerrar: calcular campeón si no está registrado
      if (!lastWeek.winner) {
        const matches = await prisma.match.findMany({
          where: { weekId: lastWeek.id },
          include: { results: true },
        });

        if (matches.length > 0) {
          const playerPoints = {};
          matches.forEach((match) => {
            match.results.forEach((result) => {
              if (!playerPoints[result.playerId]) {
                playerPoints[result.playerId] = { totalPoints: 0 };
              }
              playerPoints[result.playerId].totalPoints += result.points;
            });
          });

          const sorted = Object.entries(playerPoints).sort(
            ([, a], [, b]) => b.totalPoints - a.totalPoints
          );

          if (sorted.length > 0) {
            updateData.winnerId = parseInt(sorted[0][0]);
          }
        }
      }

      // Aplicar cambios si hay algo que actualizar
      if (Object.keys(updateData).length > 0) {
        lastWeek = await prisma.week.update({
          where: { id: lastWeek.id },
          data: updateData,
          include: {
            winner: true,
            weeklyCharacters: {
              include: { player: true, character: true },
            },
          },
        });
      }

      return NextResponse.json({ ...lastWeek, isWeekend: true });
    }

    // ── PERÍODO ACTIVO (Lun 09:00 → Vie 14:30) ───────────────────────────────
    const monday = getMonday(now);
    const friday = getFriday(now);
    const weekNumber = getWeekNumber(now);

    // Buscar si ya existe la semana actual por rango de fechas
    let currentWeek = await prisma.week.findFirst({
      where: {
        AND: [
          { startDate: { lte: now } },
          { endDate: { gte: now } },
        ],
      },
      include: {
        winner: true,
        weeklyCharacters: {
          include: { player: true, character: true },
        },
      },
    });

    // Si no existe por rango de fechas, buscar por número de semana.
    // Puede ocurrir que la semana exista con fechas desfasadas por zona horaria
    // (ej: semana creada en UTC y ahora ejecutando en Argentina UTC-3).
    // En ese caso la reutilizamos y corregimos sus fechas en lugar de crear una nueva.
    if (!currentWeek) {
      const existingWeek = await prisma.week.findFirst({
        where: { weekNumber, seasonId: activeSeason.id },
        include: {
          winner: true,
          weeklyCharacters: {
            include: { player: true, character: true },
          },
        },
      });

      if (existingWeek) {
        // Semana de esta semana encontrada por weekNumber: corregir fechas y reutilizar
        currentWeek = await prisma.week.update({
          where: { id: existingWeek.id },
          data: { startDate: monday, endDate: friday },
          include: {
            winner: true,
            weeklyCharacters: {
              include: { player: true, character: true },
            },
          },
        });
      } else {
        currentWeek = await prisma.week.create({
          data: {
            weekNumber,
            startDate: monday,
            endDate: friday,
            seasonId: activeSeason.id,
          },
          include: {
            winner: true,
            weeklyCharacters: {
              include: { player: true, character: true },
            },
          },
        });
      }
    }

    return NextResponse.json({ ...currentWeek, isWeekend: false });
  } catch (error) {
    console.error('Error fetching current week:', error);
    return NextResponse.json(
      { error: 'Error al obtener semana actual', details: error.message },
      { status: 500 }
    );
  }
}
