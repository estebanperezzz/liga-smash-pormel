import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
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

export default function RootLayout({ children }) {
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

              <nav className="flex items-center text-sm font-medium flex-1 flex-wrap gap-1">
                {[
                  { href: '/ranking', label: 'Ranking' },
                  { href: '/match/new', label: 'Nueva Partida' },
                  { href: '/matches', label: 'Partidas' },
                  { href: '/characters', label: 'Personajes' },
                  { href: '/players', label: 'Jugadores' },
                  { href: '/history', label: 'Historial' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-1.5 rounded-md transition-all duration-200 hover:text-orange-400 hover:bg-orange-500/10 text-muted-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container py-6">
            {children}
          </main>

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
