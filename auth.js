import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user) {
        // Solo se ejecuta en el primer sign in — user tiene los datos de la BD
        let role = user.role ?? 'user'

        // Auto-promover admin si el email coincide con ADMIN_EMAIL
        if (user.email === process.env.ADMIN_EMAIL && role !== 'admin') {
          await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } })
          role = 'admin'
        }

        token.role = role

        // Incluir el playerId vinculado si existe
        const player = await prisma.player.findUnique({
          where: { userId: user.id },
          select: { id: true },
        })
        token.playerId = player?.id ?? null
      }
      return token
    },
  },
})
