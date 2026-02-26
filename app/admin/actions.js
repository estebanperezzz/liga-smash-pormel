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
