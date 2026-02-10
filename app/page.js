import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trophy, Gamepad2, Users, History, Swords, UserPlus } from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: "Ranking Semanal",
      description: "Consulta la tabla de posiciones actualizada en tiempo real",
      icon: Trophy,
      href: "/ranking",
      color: "text-yellow-500"
    },
    {
      title: "Registrar Partida",
      description: "Carga los resultados de una nueva partida",
      icon: Gamepad2,
      href: "/match/new",
      color: "text-green-500"
    },
    {
      title: "Seleccionar Personaje",
      description: "Elige tu main de la semana (no se repite)",
      icon: Swords,
      href: "/characters",
      color: "text-purple-500"
    },
    {
      title: "Jugadores",
      description: "Ver y gestionar la lista de jugadores",
      icon: Users,
      href: "/players",
      color: "text-blue-500"
    },
    {
      title: "Historial",
      description: "Revisa los campeones de semanas anteriores",
      icon: History,
      href: "/history",
      color: "text-red-500"
    },
    {
      title: "Nuevo Jugador",
      description: "Registra un nuevo competidor en la liga",
      icon: UserPlus,
      href: "/players?new=true",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Liga Smash Bros Ultimate
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Competencia semanal con puntos acumulativos. 
          Juega de lunes a viernes y conviértete en el campeón.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Sistema de Puntos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Puntos dinámicos según participantes. Con 7 jugadores: 1° = 7pts, último = 1pt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-purple-500" />
              Un Personaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Elige tu main semanal. Sin repeticiones - el primero que lo toma se lo queda.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Semana Competitiva
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              De lunes a viernes. Los puntos se resetean cada semana.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="transition-all hover:shadow-lg hover:scale-105 cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* CTA Section */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-2xl">¿Listo para competir?</CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Selecciona tu personaje y comienza a sumar puntos esta semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild variant="secondary">
              <Link href="/characters">Elegir Personaje</Link>
            </Button>
            <Button asChild variant="outline" className="bg-transparent border-primary-foreground/20 hover:bg-primary-foreground/10">
              <Link href="/ranking">Ver Ranking</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
