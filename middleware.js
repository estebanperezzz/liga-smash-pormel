import NextAuth from 'next-auth'
import authConfig from './auth.config'

// Usa solo authConfig (sin Prisma) para ser compatible con Edge runtime
const { auth } = NextAuth(authConfig)

export default auth

export const config = {
  matcher: ['/match/new', '/admin/:path*'],
}
