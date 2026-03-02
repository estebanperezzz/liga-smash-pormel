import Google from 'next-auth/providers/google'

/**
 * Edge-safe config — sin Prisma ni Node.js APIs.
 * Usado por middleware.js para verificar sesiones en el Edge runtime.
 * El session callback debe estar aquí para que el middleware
 * pueda leer los campos custom (role, playerId) del JWT.
 */
export default {
  providers: [Google],
  pages: {
    signIn: '/api/auth/signin',
  },
  callbacks: {
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub
      if (token?.role) session.user.role = token.role
      if (token?.playerId !== undefined) session.user.playerId = token.playerId
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAdmin = auth?.user?.role === 'admin'

      if (nextUrl.pathname.startsWith('/admin')) {
        if (!isAdmin) return Response.redirect(new URL('/', nextUrl))
        return true
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL('/?authRequired=1', nextUrl))
      }
      return true
    },
  },
}
