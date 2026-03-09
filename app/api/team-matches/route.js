import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculatePoints } from '@/lib/utils'

// POST /api/team-matches — Registrar una partida de semana de equipos
// Body: { weekId, teamResults: [{ teamId, position }] }
export async function POST(request) {
  try {
    const { weekId, teamResults } = await request.json()

    if (!weekId || !Array.isArray(teamResults) || teamResults.length < 2) {
      return NextResponse.json(
        { error: 'weekId y al menos 2 equipos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que la semana sea de equipos
    const week = await prisma.week.findUnique({ where: { id: Number.parseInt(weekId) } })
    if (!week?.isTeamWeek) {
      return NextResponse.json({ error: 'La semana no es de equipos' }, { status: 400 })
    }

    // Validar posiciones: consecutivas desde 1, sin duplicados de equipo
    const positions = teamResults.map((r) => r.position)
    const teamIds = teamResults.map((r) => r.teamId)

    if (new Set(positions).size !== positions.length) {
      return NextResponse.json({ error: 'No puede haber posiciones duplicadas' }, { status: 400 })
    }
    if (new Set(teamIds).size !== teamIds.length) {
      return NextResponse.json({ error: 'Un equipo no puede aparecer dos veces' }, { status: 400 })
    }

    const sortedPositions = [...positions].sort((a, b) => a - b)
    for (let i = 0; i < sortedPositions.length; i++) {
      if (sortedPositions[i] !== i + 1) {
        return NextResponse.json(
          { error: 'Las posiciones deben ser consecutivas desde 1' },
          { status: 400 }
        )
      }
    }

    // Calcular puntos por equipo (misma fórmula: n equipos → 1° = n pts, último = 1 pt)
    const totalTeams = teamResults.length
    const resultsWithPoints = teamResults.map((r) => ({
      teamId: r.teamId,
      position: r.position,
      points: calculatePoints(r.position, totalTeams),
    }))

    // Crear la partida con resultados de equipos en una transacción
    const match = await prisma.match.create({
      data: {
        weekId: Number.parseInt(weekId),
        teamResults: {
          create: resultsWithPoints,
        },
      },
      include: {
        teamResults: {
          include: {
            team: {
              include: {
                members: { include: { player: { select: { id: true, name: true } } } },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    })

    return NextResponse.json(match, { status: 201 })
  } catch (error) {
    console.error('Error creating team match:', error)
    return NextResponse.json({ error: 'Error al registrar partida de equipos' }, { status: 500 })
  }
}
