import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/players - Obtener todos los jugadores
export async function GET() {
  try {
    const now = new Date();

    // Semana activa para mostrar el personaje actual de cada jugador
    const currentWeek = await prisma.week.findFirst({
      where: {
        AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }],
      },
      select: { id: true },
    });

    const players = await prisma.player.findMany({
      orderBy: { name: 'asc' },
      include: {
        user: {
          select: { name: true, image: true },
        },
        matchResults: {
          include: {
            match: {
              select: { weekId: true },
            },
          },
        },
        weeklyCharacters: {
          include: {
            character: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });

    const playersWithStats = players.map(({ matchResults, weeklyCharacters, ...rest }) => {
      const wins = matchResults.filter((r) => r.position === 1).length;
      const avgPosition =
        matchResults.length > 0
          ? (matchResults.reduce((acc, r) => acc + r.position, 0) / matchResults.length).toFixed(1)
          : null;

      // Mapa weekId -> character (misma fuente que usa el detalle del jugador)
      const weekCharMap = {};
      weeklyCharacters.forEach((wc) => {
        weekCharMap[wc.weekId] = wc.character;
      });

      // Acumular matchesPlayed y top1 por personaje (igual que byCharacter en stats)
      const charStats = {};
      matchResults.forEach((result) => {
        const char = weekCharMap[result.match?.weekId];
        if (!char) return;
        if (!charStats[char.id]) {
          charStats[char.id] = { character: char, matchesPlayed: 0, top1: 0 };
        }
        charStats[char.id].matchesPlayed += 1;
        if (result.position === 1) charStats[char.id].top1 += 1;
      });

      // Mismo scoring que getFavoriteCharacter en /players/[id]/page.js:
      // 50% partidas jugadas (normalizado) + 50% victorias (normalizado)
      const charArray = Object.values(charStats);
      let favoriteCharacter = null;
      if (charArray.length > 0) {
        const maxMatches = Math.max(...charArray.map((c) => c.matchesPlayed));
        const maxTop1 = Math.max(...charArray.map((c) => c.top1));
        favoriteCharacter = charArray
          .map((c) => ({
            ...c,
            score:
              (maxMatches > 0 ? c.matchesPlayed / maxMatches : 0) * 0.5 +
              (maxTop1 > 0 ? c.top1 / maxTop1 : 0) * 0.5,
          }))
          .sort((a, b) => b.score - a.score)[0].character;
      }

      const currentCharacter =
        currentWeek
          ? (weeklyCharacters.find((wc) => wc.weekId === currentWeek.id)?.character ?? null)
          : null;

      return { ...rest, wins, avgPosition, favoriteCharacter, currentCharacter, totalMatches: matchResults.length };
    });

    return NextResponse.json(playersWithStats);
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
