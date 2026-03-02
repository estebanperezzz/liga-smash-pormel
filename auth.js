import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import authConfig from './auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,  // 7 días → auto-logout por inactividad
    updateAge: 60 * 60,         // 1 hora → re-encripta el JWT (refresca playerId)
  },
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
      }

      // Siempre refrescar el playerId desde la BD para reflejar vinculaciones
      // hechas por el admin después del primer login del usuario
      if (token.sub) {
        const player = await prisma.player.findUnique({
          where: { userId: token.sub },
          select: { id: true },
        })
        token.playerId = player?.id ?? null
      }

      return token
    },
  },
})
