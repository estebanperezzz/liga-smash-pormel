'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Crown, Calendar, Star, Swords, Shield } from 'lucide-react';
import WeekChampionCard from './components/WeekChampionCard';

function PlayerAvatar({ userImage, userName, playerName, size = 'sm' }) {
  const display = userName ?? playerName;
  const cls = size === 'lg'
    ? 'h-14 w-14 text-lg'
    : 'h-7 w-7 text-xs';
  return userImage ? (
    <img
      src={userImage}
      alt={display}
      className={`${cls} rounded-full object-cover border border-border flex-shrink-0`}
    />
  ) : (
    <div className={`${cls} rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary flex-shrink-0`}>
      {display?.charAt(0).toUpperCase() ?? '?'}
    </div>
  );
}

// Standard competition ranking: 1, 1, 3 para dos empatados en primer lugar
function computeRanks(arr, getValue) {
  return arr.map((item) => 1 + arr.filter((x) => getValue(x) > getValue(item)).length);
}

function formatDateShort(date) {
  return new Date(date).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
}

function SeasonSection({ season, router }) {
  // Campeón de temporada = top 1 en puntos totales de esa temporada
  const seasonChampion = season.pointsRanking?.[0] ?? null;
  const uniqueChampions = new Set(season.weeks.map((w) => w.winner?.id).filter(Boolean)).size;
  const title = season.seasonName ?? `Temporada ${season.seasonNumber}`;
  const dateRange = season.weeks.length > 0
    ? `${formatDateShort(season.weeks[season.weeks.length - 1].startDate)} – ${formatDateShort(season.weeks[0].endDate)}`
    : null;

  const champRanks = season.championRanking
    ? computeRanks(season.championRanking, (x) => x.championships)
    : [];
  const pointsRanks = season.pointsRanking
    ? computeRanks(season.pointsRanking, (x) => x.totalPoints)
    : [];

  const rowStyles = [
    'bg-gradient-to-r from-yellow-500/15 to-transparent border-l-2 border-yellow-500',
    'bg-gradient-to-r from-gray-400/15 to-transparent border-l-2 border-gray-400',
    'bg-gradient-to-r from-orange-600/15 to-transparent border-l-2 border-orange-600',
  ];

  return (
    <div className="space-y-6">
      {/* ── Season header ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="flex items-center gap-3 bg-background pr-4">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25 shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold gradient-text leading-none">{title}</h2>
              {dateRange && (
                <p className="text-xs text-muted-foreground mt-0.5">{dateRange}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-background pl-1 pr-4">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground whitespace-nowrap">
              {season.weeks.length} {season.weeks.length === 1 ? 'semana' : 'semanas'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground whitespace-nowrap">
              {uniqueChampions} {uniqueChampions === 1 ? 'campeón único' : 'campeones únicos'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Campeón de Temporada ── */}
      {seasonChampion && (
        <div
          className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-gradient-to-r from-yellow-950/40 via-amber-950/20 to-transparent cursor-pointer hover:border-yellow-400/50 transition-colors"
          onClick={() => router.push(`/players/${seasonChampion.playerId}`)}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-yellow-500/60 via-amber-400/30 to-transparent" />
          <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="relative shrink-0">
                <PlayerAvatar
                  userImage={seasonChampion.userImage}
                  userName={seasonChampion.userName}
                  playerName={seasonChampion.playerName}
                  size="lg"
                />
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-0.5 shadow">
                  <Crown className="h-3 w-3 text-yellow-950" />
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-yellow-400/80 mb-0.5">
                  Campeón de Temporada
                </p>
                <p className="text-xl font-extrabold text-white truncate leading-tight">
                  {seasonChampion.playerName}
                </p>
                <p className="text-xs text-white/50 mt-0.5">
                  {seasonChampion.matchesPlayed} partidas jugadas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-yellow-300 leading-none tabular-nums">
                  {seasonChampion.totalPoints}
                </p>
                <p className="text-[10px] text-yellow-400/70 uppercase tracking-wide mt-0.5">
                  puntos
                </p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-extrabold text-white/80 leading-none tabular-nums">
                  {season.championRanking?.find((c) => c.playerId === seasonChampion.playerId)?.championships ?? 0}
                </p>
                <p className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">
                  victorias
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Semanas ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {season.weeks.map((week) => (
          <WeekChampionCard key={week.id} week={week} />
        ))}
      </div>

      {/* ── Rankings de temporada ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ranking de campeones de la temporada */}
        {season.championRanking?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Victorias por semana
              </CardTitle>
              <CardDescription className="text-xs">
                Cantidad de semanas ganadas en {title}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Pos.</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-right">Victorias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {season.championRanking.map((champion, index) => {
                    const rank = champRanks[index];
                    return (
                      <TableRow
                        key={champion.playerId}
                        className={`cursor-pointer hover:opacity-80 transition-opacity ${rank <= 3 ? rowStyles[rank - 1] : ''}`}
                        onClick={() => router.push(`/players/${champion.playerId}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            {rank === 1 && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                            {rank === 2 && <Crown className="h-3.5 w-3.5 text-gray-400" />}
                            {rank === 3 && <Crown className="h-3.5 w-3.5 text-orange-600" />}
                            <span className="font-bold text-sm">#{rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PlayerAvatar userImage={champion.userImage} userName={champion.userName} playerName={champion.playerName} />
                            <span className={`font-medium text-sm ${rank === 1 ? 'text-yellow-400' : ''}`}>
                              {champion.playerName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={rank === 1 ? 'default' : 'secondary'}
                            className={`text-sm px-2.5 py-0.5 ${rank === 1 ? 'bg-yellow-500 hover:bg-yellow-500 text-yellow-950' : ''}`}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {champion.championships}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Ranking histórico de puntos de la temporada */}
        {season.pointsRanking?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="h-4 w-4 text-blue-500" />
                Puntos acumulados
              </CardTitle>
              <CardDescription className="text-xs">
                Total de puntos en todas las partidas de {title}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Pos.</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">Partidas</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {season.pointsRanking.map((player, index) => {
                    const rank = pointsRanks[index];
                    return (
                      <TableRow
                        key={player.playerId}
                        className={`cursor-pointer hover:opacity-80 transition-opacity ${rank <= 3 ? rowStyles[rank - 1] : ''}`}
                        onClick={() => router.push(`/players/${player.playerId}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            {rank === 1 && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                            {rank === 2 && <Crown className="h-3.5 w-3.5 text-gray-400" />}
                            {rank === 3 && <Crown className="h-3.5 w-3.5 text-orange-600" />}
                            <span className="font-bold text-sm">#{rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PlayerAvatar userImage={player.userImage} userName={player.userName} playerName={player.playerName} />
                            <span className={`font-medium text-sm ${rank === 1 ? 'text-yellow-400' : ''}`}>
                              {player.playerName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {player.matchesPlayed}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={rank === 1 ? 'default' : 'secondary'}
                            className={`text-sm px-2.5 py-0.5 ${rank === 1 ? 'bg-yellow-500 hover:bg-yellow-500 text-yellow-950' : ''}`}
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {player.totalPoints}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/weeks/history');
      setHistory(res.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Campeones</h1>
        <p className="text-muted-foreground">
          Revisa todos los ganadores de semanas anteriores
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Semanas</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history?.totalWeeks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Semanas completadas</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campeones Únicos</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{history?.championRanking?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Jugadores diferentes</p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Máximo de Títulos</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {history?.championRanking?.[0]?.championships || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {history?.championRanking?.[0]?.playerName || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Temporadas */}
      {history?.seasons && history.seasons.length > 0 ? (
        <div className="space-y-14">
          {history.seasons.map((season) => (
            <SeasonSection key={season.seasonId ?? 'unknown'} season={season} router={router} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No hay historial aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              El historial se mostrará una vez que finalice la primera semana
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
