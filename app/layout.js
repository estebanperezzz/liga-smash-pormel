import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { auth, signIn, signOut } from '@/auth'
import prisma from '@/lib/prisma'
import Providers from './providers'
import AuthToast from '@/components/AuthToast'
import NavLinks from '@/components/NavLinks'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Liga Smash Bros - Pormel',
  description: 'Liga Semanal de Super Smash Bros Ultimate',
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
}

const NAV_ITEMS = [
  { href: '/ranking',    label: 'Ranking' },
  { href: '/match/new', label: 'Nueva Partida' },
  { href: '/matches',   label: 'Partidas' },
  { href: '/characters',label: 'Personajes' },
  { href: '/players',   label: 'Jugadores' },
  { href: '/history',   label: 'Historial' },
]

export default async function RootLayout({ children }) {
  const [session, activeSeason] = await Promise.all([
    auth(),
    prisma.season.findFirst({ where: { isActive: true } }),
  ])
  const isPaused = !activeSeason

  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
            <div className="container flex h-16 items-center">
              <Link href="/" className="flex items-center mr-6 group">
                <Image
                  src="/logo.svg"
                  alt="Liga Smash Pormel"
                  width={120}
                  height={90}
                  className="h-12 w-auto transition-opacity group-hover:opacity-80"
                  priority
                />
              </Link>

              <NavLinks
                isPaused={isPaused}
                isAdmin={session?.user?.role === 'admin'}
                items={NAV_ITEMS}
              />

              {/* Auth */}
              <div className="flex items-center gap-3 ml-4">
                {session?.user ? (
                  <>
                    {session.user.image && (
                      <Image
                        src={session.user.image}
                        alt={session.user.name ?? 'Usuario'}
                        width={32}
                        height={32}
                        className="rounded-full ring-2 ring-orange-500/40"
                      />
                    )}
                    <form
                      action={async () => {
                        'use server'
                        await signOut({ redirectTo: '/' })
                      }}
                    >
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 hover:text-orange-400 hover:bg-orange-500/10 text-muted-foreground"
                      >
                        Salir
                      </button>
                    </form>
                  </>
                ) : (
                  <form
                    action={async () => {
                      'use server'
                      await signIn('google')
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 text-orange-400 hover:bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60"
                    >
                      Entrar
                    </button>
                  </form>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container py-6">
            <Providers>{children}</Providers>
          </main>

          <Suspense>
            <AuthToast />
          </Suspense>

          {/* Footer */}
          <footer className="border-t border-white/5 py-6 md:py-0">
            <div className="container flex h-14 items-center justify-between text-sm text-muted-foreground">
              <p>Liga Smash Bros Ultimate - Pormel © 2026</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
