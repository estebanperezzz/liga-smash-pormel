import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { Trophy, Menu } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Liga Smash Bros - Pormel',
  description: 'Liga Semanal de Super Smash Bros Ultimate',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
              <Link href="/" className="flex items-center space-x-2 mr-6">
                <Trophy className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Liga Smash Pormel</span>
              </Link>
              
              <nav className="flex items-center space-x-6 text-sm font-medium flex-1">
                <Link 
                  href="/ranking" 
                  className="transition-colors hover:text-primary text-muted-foreground"
                >
                  Ranking
                </Link>
                <Link 
                  href="/match/new" 
                  className="transition-colors hover:text-primary text-muted-foreground"
                >
                  Nueva Partida
                </Link>
                <Link 
                  href="/matches" 
                  className="transition-colors hover:text-primary text-muted-foreground"
                >
                  Partidas
                </Link>
                <Link 
                  href="/characters" 
                  className="transition-colors hover:text-primary text-muted-foreground"
                >
                  Personajes
                </Link>
                <Link 
                  href="/players" 
                  className="transition-colors hover:text-primary text-muted-foreground"
                >
                  Jugadores
                </Link>
                <Link 
                  href="/history" 
                  className="transition-colors hover:text-primary text-muted-foreground"
                >
                  Historial
                </Link>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 container py-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t py-6 md:py-0">
            <div className="container flex h-14 items-center justify-between text-sm text-muted-foreground">
              <p>Liga Smash Bros Ultimate - Pormel © 2026</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
