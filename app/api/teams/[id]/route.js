import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { auth } from '@/auth'

// DELETE /api/teams/[id] — eliminar equipo y sus miembros
export async function DELETE(request, { params }) {
  try {
    const session = await auth()
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = await params
    const teamId = Number.parseInt(id)

    if (!teamId || Number.isNaN(teamId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Eliminar miembros primero (no tienen onDelete: Cascade en el schema)
    await prisma.teamMember.deleteMany({ where: { teamId } })
    await prisma.team.delete({ where: { id: teamId } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Error al eliminar equipo' }, { status: 500 })
  }
}
