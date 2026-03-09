import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { supabaseAdmin, TEAM_IMAGES_BUCKET } from '@/lib/supabase'
import { auth } from '@/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 5

// Verifica si el usuario autenticado puede modificar la imagen del equipo.
// Puede hacerlo si es admin O si es un jugador miembro del equipo.
async function canEditTeam(session, teamId) {
  if (session?.user?.role === 'admin') return true

  if (!session?.user?.id) return false

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      player: {
        include: {
          teamMemberships: { where: { teamId } },
        },
      },
    },
  })

  return (user?.player?.teamMemberships?.length ?? 0) > 0
}

// PATCH /api/teams/[id]/image — sube imagen del equipo a Supabase
export async function PATCH(request, { params }) {
  const session = await auth()
  const { id } = await params
  const teamId = Number.parseInt(id)

  if (!teamId || Number.isNaN(teamId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const allowed = await canEditTeam(session, teamId)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('image')

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ninguna imagen' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Usá JPG, PNG o WebP.' },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `La imagen no puede superar ${MAX_SIZE_MB}MB` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.type.split('/')[1]
    const filename = `team-${teamId}.${ext}`

    // Eliminar imagen anterior si existe
    if (team.image) {
      const oldFilename = team.image.split('/').pop()
      await supabaseAdmin.storage.from(TEAM_IMAGES_BUCKET).remove([oldFilename])
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(TEAM_IMAGES_BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(TEAM_IMAGES_BUCKET)
      .getPublicUrl(filename)

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { image: publicUrl },
    })

    return NextResponse.json({ image: updated.image })
  } catch (error) {
    console.error('Error updating team image:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]/image — elimina la imagen del equipo
export async function DELETE(_request, { params }) {
  const session = await auth()
  const { id } = await params
  const teamId = Number.parseInt(id)

  if (!teamId || Number.isNaN(teamId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const allowed = await canEditTeam(session, teamId)
  if (!allowed) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
    }

    if (team.image) {
      const filename = team.image.split('/').pop()
      await supabaseAdmin.storage.from(TEAM_IMAGES_BUCKET).remove([filename])
    }

    await prisma.team.update({ where: { id: teamId }, data: { image: null } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting team image:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
