'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, User, RefreshCw, Lock, EyeOff, Users } from 'lucide-react';
import PodiumCard from './components/PodiumCard';

function isRankingBlocked() {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Lun, ..., 5=Vie, 6=Sab
  const hour = now.getHours();
  return day >= 1 && day <= 5 && hour === 13;
}

// Standard competition ranking: 1 + number of players with strictly more points
function computeRanks(players) {
  return players.map((player) =>
    1 + players.filter(p => p.totalPoints > player.totalPoints).length
  );
}

export default function RankingPage() {
  const router = useRouter();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekInfo, setWeekInfo] = useState(null);
  const [eligiblePlayers, setEligiblePlayers] = useState([]);

  useEffect(() => {
    if (isRankingBlocked()) {
      setLoading(false);
      return;
    }
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const weekRes = await axios.get('/api/weeks/current');
      setWeekInfo(weekRes.data);

      const rankingRes = await axios.get(`/api/weeks/ranking?weekId=${weekRes.data.id}`);
      setRanking(rankingRes.data.ranking);

      try {
        const eligibleRes = await axios.get(`/api/weeks/eligible-for-change?weekId=${weekRes.data.id}`);
        if (eligibleRes.data.eligible && eligibleRes.data.eligiblePlayers) {
          setEligiblePlayers(eligibleRes.data.eligiblePlayers.map(p => p.playerId));
        }
      } catch (error) {
        console.error('Error fetching eligibility:', error);
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEligibleForChange = (playerId) => eligiblePlayers.includes(playerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando ranking...</p>
        </div>
      </div>
    );
  }

  if (isRankingBlocked()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ranking Semanal</h1>
          <p className="text-muted-foreground">Clasificación actualizada en tiempo real</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
          <div className="rounded-full bg-orange-500/10 p-6 border border-orange-500/20">
            <EyeOff className="h-12 w-12 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Ranking bloqueado</h2>
            <p className="text-muted-foreground mt-2">
              El ranking está oculto durante la jornada de Smash
              <br />
              <span className="text-orange-400 font-medium">13:00 – 14:00 hs</span>, lunes a viernes.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              Volvé a las 14:00 para ver los resultados.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ranking Semanal</h1>
        <p className="text-muted-foreground">
          {weekInfo?.isWeekend ? 'Ranking final de la semana cerrada' : 'Clasificación actualizada en tiempo real'}
        </p>
      </div>

      {/* Banner: semana cerrada durante el gap */}
      {weekInfo?.isWeekend && (
        <div className="flex items-start gap-4 rounded-lg border border-orange-500/40 bg-orange-950/30 p-4">
          <div className="mt-0.5 rounded-full bg-orange-500/20 p-2">
            <Lock className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-orange-300">Semana cerrada</p>
            <p className="mt-1 text-sm text-orange-400/80">
              Estás viendo el ranking final. La nueva semana arranca el lunes a las 09:00.
            </p>
          </div>
        </div>
      )}

      {weekInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Semana {weekInfo.weekNumber}
              {weekInfo.isWeekend && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-medium text-orange-400 border border-orange-500/30">
                  <Lock className="h-3 w-3" />
                  Cerrada
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {new Date(weekInfo.startDate).toLocaleDateString('es-AR')} - {new Date(weekInfo.endDate).toLocaleDateString('es-AR')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* ── MODO EQUIPOS ─────────────────────────────────────────────── */}
      {weekInfo?.isTeamWeek && (
        <>
          {ranking.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No hay partidas de equipos registradas aún</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Podium de equipos (top 3) */}
              {ranking.length >= 2 && (
                <div className="flex items-end gap-3">
                  {/* 2° equipo */}
                  {ranking[1] && (
                    <div className="flex-1 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 pb-0 min-h-[140px] justify-end">
                      <span className="text-2xl">🥈</span>
                      <p className="font-bold text-center text-sm">{ranking[1].teamName}</p>
                      <div className="flex flex-wrap gap-1 justify-center mb-2">
                        {ranking[1].members.map((m) => (
                          <span key={m.id} className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">{m.name}</span>
                        ))}
                      </div>
                      <div className="w-full bg-white/10 rounded-t-lg py-2 text-center">
                        <span className="font-bold text-lg">{ranking[1].totalPoints}</span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>
                  )}
                  {/* 1° equipo */}
                  <div className="flex-1 flex flex-col items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 pb-0 min-h-[180px] justify-end">
                    <span className="text-3xl">🥇</span>
                    <p className="font-bold text-center">{ranking[0].teamName}</p>
                    <div className="flex flex-wrap gap-1 justify-center mb-2">
                      {ranking[0].members.map((m) => (
                        <span key={m.id} className="text-xs px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-300">{m.name}</span>
                      ))}
                    </div>
                    <div className="w-full bg-orange-500/20 rounded-t-lg py-2 text-center">
                      <span className="font-bold text-xl text-orange-400">{ranking[0].totalPoints}</span>
                      <span className="text-xs text-muted-foreground ml-1">pts</span>
                    </div>
                  </div>
                  {/* 3° equipo */}
                  {ranking[2] && (
                    <div className="flex-1 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-4 pb-0 min-h-[120px] justify-end">
                      <span className="text-xl">🥉</span>
                      <p className="font-bold text-center text-sm">{ranking[2].teamName}</p>
                      <div className="flex flex-wrap gap-1 justify-center mb-2">
                        {ranking[2].members.map((m) => (
                          <span key={m.id} className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">{m.name}</span>
                        ))}
                      </div>
                      <div className="w-full bg-white/10 rounded-t-lg py-2 text-center">
                        <span className="font-bold text-lg">{ranking[2].totalPoints}</span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tabla de equipos */}
              <Card>
                <CardHeader>
                  <CardTitle>Tabla de Equipos</CardTitle>
                  <CardDescription>Clasificación de equipos de la semana</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Pos.</TableHead>
                        <TableHead>Equipo</TableHead>
                        <TableHead className="text-center w-[100px]">Partidas</TableHead>
                        <TableHead className="text-center w-[80px]">Victorias</TableHead>
                        <TableHead className="text-right w-[100px]">Puntos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ranking.map((team, index) => (
                        <TableRow key={team.teamId}>
                          <TableCell className="font-medium">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold">{team.teamName}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {team.members.map((m) => (
                                <span key={m.id} className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">{m.name}</span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{team.matchesPlayed}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                              <span className="font-bold text-yellow-500">{team.wins}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg">{team.totalPoints}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
      {/* ─────────────────────────────────────────────────────────────── */}

      {/* Top 3 Podium (solo semana individual) */}
      {!weekInfo?.isTeamWeek && ranking.length >= 3 && (() => {
        // Tie detection: compute the real display position for each of the top 3
        const pts = ranking.map(p => p.totalPoints);
        const pos0 = 1;
        const pos1 = pts[1] === pts[0] ? 1 : 2;
        // Standard competition ranking: if pos0 & pos1 both = 1, next is 3rd (not 2nd)
        const pos2 = pts[2] === pts[1] ? pos1 : 3;
        return (
          <div className="flex items-end gap-3">
            <PodiumCard player={ranking[1]} position={2} displayPosition={pos1} />
            <PodiumCard player={ranking[0]} position={1} displayPosition={pos0} />
            <PodiumCard player={ranking[2]} position={3} displayPosition={pos2} />
          </div>
        );
      })()}

      {/* Ranking Table (solo semana individual) */}
      {!weekInfo?.isTeamWeek && <Card>
        <CardHeader>
          <CardTitle>Tabla de Posiciones</CardTitle>
          <CardDescription>
            {ranking.length > 3 ? `Posiciones 4° en adelante` : 'Sin más jugadores'} · Click en un jugador para ver sus stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No hay partidas registradas aún</p>
              <p className="text-sm text-muted-foreground mt-2">
                Sé el primero en jugar esta semana
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Posición</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="w-[120px] pl-2">Personaje</TableHead>
                  <TableHead className="text-center w-[100px]">Partidas</TableHead>
                  <TableHead className="text-center w-[80px]">Top 1</TableHead>
                  <TableHead className="text-center w-[80px]">Top 3</TableHead>
                  <TableHead className="text-right w-[100px]">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {(() => {
                    const ranks = computeRanks(ranking);
                    return ranking.slice(3).map((player, index) => (
                  <TableRow
                    key={player.playerId}
                    className={`cursor-pointer hover:bg-muted/80 transition-colors`}
                    onClick={() => router.push(`/players/${player.playerId}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{ranks[3 + index]}</span>
                      </div>
                    </TableCell>

                    <TableCell className="pr-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-lg">{player.playerName}</p>
                          {isEligibleForChange(player.playerId) && (
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 border-blue-300 text-blue-700 dark:text-blue-300">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Cambio disponible
                            </Badge>
                          )}
                        </div>
                        {player.character ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {player.character}
                            </Badge>
                            {player.characterSeries && (
                              <span className="text-xs text-muted-foreground">
                                {player.characterSeries}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin personaje</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="pl-2">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-background border-2">
                        {player.characterImage ? (
                          <Image
                            src={player.characterImage}
                            alt={player.character || 'Character'}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-bold text-yellow-500">{player.top1 ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Medal className="h-3.5 w-3.5 text-orange-500" />
                        <span className="font-bold text-orange-500">{player.top3 ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {player.totalPoints}
                    </TableCell>
                  </TableRow>
                    ))
                  })()}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>}
    </div>
  );
}