import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/teams?weekId=X — equipos de una semana con sus miembros
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const weekId = Number.parseInt(searchParams.get('weekId'))

    if (!weekId || Number.isNaN(weekId)) {
      return NextResponse.json({ error: 'weekId requerido' }, { status: 400 })
    }

    const teams = await prisma.team.findMany({
      where: { weekId },
      include: {
        members: {
          include: {
            player: { select: { id: true, name: true, userId: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Error al obtener equipos' }, { status: 500 })
  }
}

// POST /api/teams — crear equipo con miembros { name, weekId, playerIds[] }
export async function POST(request) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { name, weekId, playerIds } = await request.json()

    if (!name?.trim() || !weekId || !Array.isArray(playerIds) || playerIds.length === 0) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // Verificar que es una semana de equipos
    const week = await prisma.week.findUnique({ where: { id: weekId } })
    if (!week?.isTeamWeek) {
      return NextResponse.json({ error: 'La semana no es de equipos' }, { status: 400 })
    }

    // Verificar que ningún jugador ya tiene equipo en esta semana
    const existing = await prisma.teamMember.findFirst({
      where: { weekId, playerId: { in: playerIds } },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Uno o más jugadores ya pertenecen a un equipo esta semana' },
        { status: 400 }
      )
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        weekId,
        members: {
          create: playerIds.map((playerId) => ({ playerId, weekId })),
        },
      },
      include: {
        members: {
          include: {
            player: { select: { id: true, name: true, userId: true } },
          },
        },
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 })
  }
}
