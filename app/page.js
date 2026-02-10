import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Gamepad2, Users, History, Swords, UserPlus, Calendar, Target, Award } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <div className="inline-block">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Liga Smash Bros Ultimate
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Competencia semanal con puntos acumulativos. 
          Juega de lunes a viernes y conviértete en el campeón.
        </p>
      </div>

      {/* Quick Actions - Destacadas */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Acciones Rápidas</h2>
          <p className="text-muted-foreground">Elige una opción para comenzar</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Ranking */}
          <Link href="/ranking">
            <Button 
              variant="outline" 
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                  <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Ver Ranking</h3>
                  <p className="text-sm text-muted-foreground">Tabla de posiciones</p>
                </div>
              </div>
            </Button>
          </Link>

          {/* Registrar Partida */}
          <Link href="/match/new">
            <Button 
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                  <Gamepad2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Registrar Partida</h3>
                  <p className="text-sm text-muted-foreground">Cargar resultados</p>
                </div>
              </div>
            </Button>
          </Link>

          {/* Seleccionar Personaje */}
          <Link href="/characters">
            <Button 
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Swords className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Mi Personaje</h3>
                  <p className="text-sm text-muted-foreground">Seleccionar main</p>
                </div>
              </div>
            </Button>
          </Link>

          {/* Jugadores */}
          <Link href="/players">
            <Button 
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Jugadores</h3>
                  <p className="text-sm text-muted-foreground">Ver y gestionar</p>
                </div>
              </div>
            </Button>
          </Link>

          {/* Historial */}
          <Link href="/history">
            <Button 
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900">
                  <History className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Historial</h3>
                  <p className="text-sm text-muted-foreground">Ver campeones</p>
                </div>
              </div>
            </Button>
          </Link>

          {/* Nuevo Jugador */}
          <Link href="/players?new=true">
            <Button 
              variant="outline"
              className="w-full h-auto p-6 flex flex-col items-start gap-3 hover:bg-primary hover:text-primary-foreground transition-all hover:scale-105"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900">
                  <UserPlus className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-lg">Nuevo Jugador</h3>
                  <p className="text-sm text-muted-foreground">Registrarse</p>
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Cards - Claramente informativas */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cómo Funciona</h2>
          <p className="text-muted-foreground">Conoce las reglas de la liga</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-lg">Sistema de Puntos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Puntos dinámicos según participantes. Con 7 jugadores: 1° = 7pts, 2° = 6pts, etc. El último siempre recibe 1 punto.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-4">
                <Swords className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Un Personaje</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Elige tu main semanal. Sin repeticiones - el primero que lo toma se lo queda hasta el próximo lunes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Semana Competitiva</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                De lunes a viernes. Los puntos se acumulan durante la semana y se resetean cada lunes a las 00:00.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Final */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
        <CardHeader className="text-center pb-4">
          <div className="h-16 w-16 rounded-full bg-primary-foreground/10 flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl">¿Listo para competir?</CardTitle>
          <CardDescription className="text-primary-foreground/90 text-lg">
            Selecciona tu personaje y comienza a sumar puntos esta semana
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-4 pb-8">
          <Button asChild size="lg" variant="secondary" className="font-semibold">
            <Link href="/characters">
              <Swords className="h-5 w-5 mr-2" />
              Elegir Personaje
            </Link>
          </Button>
          <Button 
            asChild 
            size="lg" 
            variant="outline" 
            className="bg-transparent border-2 border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground font-semibold"
          >
            <Link href="/ranking">
              <Trophy className="h-5 w-5 mr-2" />
              Ver Ranking
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
