'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, User, Gamepad2, ChevronLeft, Calendar, Users, Swords, Crown, Star } from 'lucide-react';
import PodiumCard from '@/app/ranking/components/PodiumCard';

const positionConfig = {
  1: {
    icon: Trophy,
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/15',
    ring: 'ring-1 ring-yellow-400/40',
    row: 'bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/15',
  },
  2: {
    icon: Medal,
    color: 'text-slate-300',
    bg: 'bg-slate-300/15',
    ring: 'ring-1 ring-slate-300/40',
    row: 'bg-gradient-to-r from-slate-400/10 to-transparent hover:from-slate-400/15',
  },
  3: {
    icon: Award,
    color: 'text-orange-400',
    bg: 'bg-orange-400/15',
    ring: 'ring-1 ring-orange-400/40',
    row: 'bg-gradient-to-r from-orange-500/10 to-transparent hover:from-orange-500/15',
  },
};

export default function WeekDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/weeks/${params.id}`);
        setData(res.data);
      } catch (error) {
        console.error('Error fetching week data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando semana...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">Semana no encontrada</p>
      </div>
    );
  }

  const { week, ranking, totalMatches } = data;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push('/history')}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Volver al historial
      </button>

      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-border/50">
        {/* Gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 via-purple-500/10 to-blue-600/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        {/* Decorative orbs */}
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative px-6 py-8 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/15 text-violet-400 border border-violet-500/25 mb-3">
                <Calendar className="h-3 w-3" />
                Historial
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
                Semana{' '}
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  {week.weekNumber}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm capitalize">
                {formatDate(week.startDate)} – {formatDate(week.endDate)}
              </p>
            </div>

            {/* Champion badge */}
            {week.winner && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/25 backdrop-blur-sm self-start">
                <div className="p-2 rounded-full bg-yellow-400/20">
                  <Crown className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400/70">
                    Campeón
                  </p>
                  <p className="font-bold text-yellow-300 text-lg leading-tight">{week.winner.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-blue-500/10 blur-xl" />
          <CardContent className="pt-4 pb-4 relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/15 shrink-0">
                <Swords className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-black">{totalMatches}</p>
                <p className="text-xs text-muted-foreground">Partidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-emerald-500/10 blur-xl" />
          <CardContent className="pt-4 pb-4 relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/15 shrink-0">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-black">{ranking.length}</p>
                <p className="text-xs text-muted-foreground">Jugadores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20 overflow-hidden relative">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-yellow-500/10 blur-xl" />
          <CardContent className="pt-4 pb-4 relative">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-500/15 shrink-0">
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-black truncate leading-tight">{ranking[0]?.totalPoints ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pts líder</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Podium Top 3 */}
      {ranking.length >= 3 && (
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            Top 3
          </h2>
          <div className="flex items-end gap-3">
            <PodiumCard player={ranking[1]} position={2} />
            <PodiumCard
              player={{ ...ranking[0], characterImage: week.championImage ?? ranking[0].characterImage }}
              position={1}
              imageFit={week.championImage ? 'object-cover' : 'object-contain object-bottom'}
            />
            <PodiumCard player={ranking[2]} position={3} />
          </div>
        </div>
      )}

      {/* Full Ranking Table */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            Tabla de Posiciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {ranking.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No hay partidas registradas esta semana</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead className="w-[72px] pl-4">Pos.</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-[80px]">PJ</TableHead>
                  <TableHead className="text-center w-[100px]">Partidas</TableHead>
                  <TableHead className="text-right w-[110px] pr-4">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((player, index) => {
                  const pos = index + 1;
                  const config = positionConfig[pos];

                  return (
                    <TableRow
                      key={player.playerId}
                      className={`cursor-pointer transition-colors border-b border-border/30 ${
                        config ? config.row : 'hover:bg-muted/60'
                      }`}
                      onClick={() => router.push(`/players/${player.playerId}`)}
                    >
                      {/* Position */}
                      <TableCell className="pl-4">
                        {config ? (
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bg} ${config.ring}`}>
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                        ) : (
                          <span className="text-muted-foreground font-bold text-sm pl-2">{pos}</span>
                        )}
                      </TableCell>

                      {/* Player name & character */}
                      <TableCell>
                        <p className={`font-semibold text-base ${pos === 1 ? 'text-yellow-300' : ''}`}>
                          {player.playerName}
                        </p>
                        {player.character && (
                          <p className="text-xs text-muted-foreground mt-0.5">{player.character}</p>
                        )}
                      </TableCell>

                      {/* Character image */}
                      <TableCell>
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-background border border-border/50">
                          {player.characterImage ? (
                            <Image
                              src={player.characterImage}
                              alt={player.character || 'Character'}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Matches played */}
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted/60 text-xs">
                          <Gamepad2 className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{player.matchesPlayed}</span>
                        </div>
                      </TableCell>

                      {/* Points */}
                      <TableCell className="text-right pr-4">
                        <span className={`font-black text-xl ${pos === 1 ? 'text-yellow-400' : pos === 2 ? 'text-slate-300' : pos === 3 ? 'text-orange-400' : ''}`}>
                          {player.totalPoints}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
