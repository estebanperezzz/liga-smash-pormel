'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Gamepad2, Target, TrendingUp, ArrowLeft, User } from 'lucide-react';

export default function PlayerStatsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/players/${id}/stats`)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">Jugador no encontrado</p>
        <Button className="mt-4" onClick={() => router.push('/players')}>Volver</Button>
      </div>
    );
  }

  const { player, general, byCharacter } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/players')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
          <p className="text-muted-foreground">
            Jugador desde {new Date(player.createdAt).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      {/* General Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidas</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{general.totalMatches}</div>
            <p className="text-xs text-muted-foreground mt-1">Jugadas en total</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 1</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">{general.top1}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {general.totalMatches > 0
                ? `${((general.top1 / general.totalMatches) * 100).toFixed(0)}% de victorias`
                : 'Sin partidas'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top 3</CardTitle>
            <Medal className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{general.top3}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {general.totalMatches > 0
                ? `${((general.top3 / general.totalMatches) * 100).toFixed(0)}% de podios`
                : 'Sin partidas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pos. Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{general.avgPosition}</div>
            <p className="text-xs text-muted-foreground mt-1">{general.totalPoints} puntos totales</p>
          </CardContent>
        </Card>
      </div>

      {/* By Character */}
      <Card>
        <CardHeader>
          <CardTitle>Stats por Personaje</CardTitle>
          <CardDescription>
            Rendimiento desglosado por cada personaje utilizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byCharacter.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay datos de personajes aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {byCharacter.map((charStat) => (
                <div
                  key={charStat.characterId || 'none'}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Character Image */}
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-background border-2 flex-shrink-0">
                    {charStat.characterImage ? (
                      <Image
                        src={charStat.characterImage}
                        alt={charStat.characterName}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Character Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{charStat.characterName}</p>
                      {charStat.characterSeries && (
                        <Badge variant="outline" className="text-xs">
                          {charStat.characterSeries}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {charStat.matchesPlayed} {charStat.matchesPlayed === 1 ? 'partida' : 'partidas'} · Pos. promedio: {charStat.avgPosition}
                    </p>
                  </div>

                  {/* Mini Stats */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-bold text-yellow-500">{charStat.top1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Top 1</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Medal className="h-3.5 w-3.5 text-orange-500" />
                        <span className="font-bold text-orange-500">{charStat.top3}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Top 3</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 justify-center">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold text-primary">{charStat.totalPoints}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Puntos</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}