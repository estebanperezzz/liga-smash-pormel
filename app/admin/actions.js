'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'admin') throw new Error('No autorizado')
  return session
}

export async function linkPlayerToUser(formData) {
  await requireAdmin()
  const userId = formData.get('userId')
  const playerId = formData.get('playerId')
  if (!userId || !playerId || playerId === '') return

  // Liberar el player si ya estaba vinculado a otro usuario
  await prisma.player.updateMany({
    where: { userId },
    data: { userId: null },
  })

  await prisma.player.update({
    where: { id: parseInt(playerId) },
    data: { userId },
  })

  revalidatePath('/admin')
}

export async function unlinkPlayer(formData) {
  await requireAdmin()
  const playerId = formData.get('playerId')

  await prisma.player.update({
    where: { id: parseInt(playerId) },
    data: { userId: null },
  })

  revalidatePath('/admin')
}

export async function setUserRole(formData) {
  await requireAdmin()
  const userId = formData.get('userId')
  const role = formData.get('role')
  if (!userId || !['user', 'admin'].includes(role)) return

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/admin')
}

export async function setBlockPreviousWeekChars(formData) {
  await requireAdmin()
  const weekId = Number.parseInt(formData.get('weekId'))
  const blockPreviousWeekChars = formData.get('blockPreviousWeekChars') === 'true'
  if (!weekId) return

  await prisma.week.update({
    where: { id: weekId },
    data: { blockPreviousWeekChars },
  })

  revalidatePath('/admin')
  revalidatePath('/characters')
}

export async function setTeamWeek(formData) {
  await requireAdmin()
  const weekId = Number.parseInt(formData.get('weekId'))
  const isTeamWeek = formData.get('isTeamWeek') === 'true'
  if (!weekId) return

  await prisma.week.update({
    where: { id: weekId },
    data: { isTeamWeek },
  })

  revalidatePath('/admin')
  revalidatePath('/equipos')
}

export async function activateSeason(formData) {
  await requireAdmin()
  const seasonNumber = Number.parseInt(formData.get('seasonNumber'))
  if (!seasonNumber || seasonNumber < 1) return

  await prisma.$transaction([
    // Desactivar todas las temporadas existentes
    prisma.season.updateMany({ data: { isActive: false } }),
    // Upsert de la temporada objetivo
    prisma.season.upsert({
      where: { number: seasonNumber },
      update: { isActive: true, endDate: null },
      create: {
        number: seasonNumber,
        name: `Temporada ${seasonNumber}`,
        isActive: true,
        startDate: new Date(),
      },
    }),
  ])

  revalidatePath('/admin')
  revalidatePath('/ranking')
  revalidatePath('/history')
}

export async function deactivateSeason(formData) {
  await requireAdmin()
  const seasonId = Number.parseInt(formData.get('seasonId'))
  if (!seasonId) return

  await prisma.season.update({
    where: { id: seasonId },
    data: { isActive: false, endDate: new Date() },
  })

  revalidatePath('/admin')
  revalidatePath('/ranking')
  revalidatePath('/history')
}
