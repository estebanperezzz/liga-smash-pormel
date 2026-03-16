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

    // Verificar que todos los jugadores hayan seleccionado al menos un personaje
    const playerIds = results.map((r) => r.playerId);
    const weeklyCharacters = await prisma.weeklyCharacter.findMany({
      where: {
        weekId: Number.parseInt(weekId),
        playerId: { in: playerIds },
      },
    });

    const playersWithChars = new Set(weeklyCharacters.map((wc) => wc.playerId));
    if (playerIds.some((id) => !playersWithChars.has(id))) {
      return NextResponse.json(
        { error: 'Todos los jugadores deben seleccionar un personaje antes de jugar' },
        { status: 400 }
      );
    }

    // Calcular puntos para cada jugador
    const totalPlayers = results.length;
    const resultsWithPoints = results.map((r) => ({
      playerId: Number.parseInt(r.playerId),
      position: r.position,
      points: calculatePoints(r.position, totalPlayers),
      ...(r.characterId ? { characterId: Number.parseInt(r.characterId) } : {}),
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

    const parsedWeekId = Number.parseInt(weekId);

    const [matches, week, weeklyCharacters] = await Promise.all([
      prisma.match.findMany({
        where: { weekId: parsedWeekId },
        include: {
          results: {
            include: {
              player: { select: { id: true, name: true } },
              character: { select: { id: true, name: true, image: true, series: true } },
            },
            orderBy: { position: 'asc' },
          },
          teamResults: {
            include: {
              team: {
                include: {
                  members: {
                    include: { player: { select: { id: true, name: true } } },
                  },
                },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
        orderBy: { playedAt: 'desc' },
      }),
      prisma.week.findUnique({
        where: { id: parsedWeekId },
        select: { isTeamWeek: true },
      }),
      // Fallback: mapa playerId → slot1 character para resultados sin characterId guardado
      prisma.weeklyCharacter.findMany({
        where: { weekId: parsedWeekId, slot: 1 },
        include: { character: { select: { id: true, name: true, image: true, series: true } } },
      }),
    ]);

    // Mapa playerId → slot1 character (fallback para registros históricos)
    const charMap = {};
    weeklyCharacters.forEach((wc) => { charMap[wc.playerId] = wc.character; });

    const enriched = matches.map((match) => ({
      ...match,
      isTeamWeek: week?.isTeamWeek ?? false,
      results: match.results.map((r) => ({
        ...r,
        // Usar el character guardado en el resultado; si no hay, fallback al slot1
        character: r.character ?? charMap[r.playerId] ?? null,
      })),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Error al obtener partidas' },
      { status: 500 }
    );
  }
}
