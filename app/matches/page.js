'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Users, Clock, Medal, Award, User, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function getPositionIcon(position) {
  if (position === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (position === 3) return <Award className="h-5 w-5 text-orange-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
}

function getPositionColor(position) {
  if (position === 1) return 'bg-yellow-950/30 border-yellow-500/20';
  if (position === 2) return 'bg-slate-900/30 border-slate-500/20';
  if (position === 3) return 'bg-orange-950/30 border-orange-500/20';
  return '';
}

export default function MatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMatches, setExpandedMatches] = useState(new Set());

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const weekRes = await axios.get('/api/weeks/current');
      const res = await axios.get(`/api/matches?weekId=${weekRes.data.id}`);
      setMatches(res.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMatch = (matchId) => {
    setExpandedMatches(prev => {
      const next = new Set(prev);
      next.has(matchId) ? next.delete(matchId) : next.add(matchId);
      return next;
    });
  };

  const isTeamWeek = matches[0]?.isTeamWeek ?? false;
  const uniqueParticipants = isTeamWeek
    ? new Set(matches.flatMap(m => m.teamResults.flatMap(tr => tr.team.members.map(mb => mb.player.id)))).size
    : new Set(matches.flatMap(m => m.results.map(r => r.playerId))).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando partidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Partidas</h1>
        <p className="text-muted-foreground">Registro completo de todas las partidas jugadas</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partidas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jugadores Únicos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueParticipants}</div>
            <p className="text-xs text-muted-foreground">Han participado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Partida</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matches.length > 0 ? format(new Date(matches[0].playedAt), 'HH:mm', { locale: es }) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {matches.length > 0 ? format(new Date(matches[0].playedAt), 'dd/MM/yyyy', { locale: es }) : 'Sin partidas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No hay partidas registradas</p>
            <p className="text-sm text-muted-foreground mt-2">
              Las partidas aparecerán aquí una vez que se registren
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((match, matchIndex) => {
            const isExpanded = expandedMatches.has(match.id);

            return (
              <Card key={match.id} className="overflow-hidden">
                <CardHeader
                  className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                  onClick={() => toggleMatch(match.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">#{matches.length - matchIndex}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          Partida {matches.length - matchIndex}
                          {match.isTeamWeek && (
                            <Badge variant="outline" className="text-xs border-orange-500/40 text-orange-400">
                              <Users className="h-3 w-3 mr-1" />
                              Equipos
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(match.playedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-sm">
                        {match.isTeamWeek
                          ? `${match.teamResults.length} equipos`
                          : `${match.results.length} jugadores`}
                      </Badge>
                      {isExpanded
                        ? <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-0">
                    {match.isTeamWeek ? (
                      /* ── SEMANA DE EQUIPOS ── */
                      <div className="divide-y">
                        {match.teamResults.map((tr) => (
                          <div
                            key={tr.id}
                            className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${getPositionColor(tr.position)}`}
                          >
                            <div className="flex items-center justify-center w-12 flex-shrink-0">
                              {getPositionIcon(tr.position)}
                            </div>

                            <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted border-2 flex-shrink-0">
                              {tr.team.image ? (
                                <Image src={tr.team.image} alt={tr.team.name} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="h-7 w-7 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-lg">{tr.team.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {tr.team.members.map((mb) => (
                                  <span key={mb.id} className="text-xs px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">
                                    {mb.player.name}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-bold text-primary">{tr.points}</div>
                              <div className="text-xs text-muted-foreground">puntos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* ── SEMANA INDIVIDUAL ── */
                      <div className="divide-y">
                        {match.results.map((result) => (
                          <div
                            key={result.id}
                            className={`flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 ${getPositionColor(result.position)}`}
                          >
                            <div className="flex items-center justify-center w-12 flex-shrink-0">
                              {getPositionIcon(result.position)}
                            </div>

                            <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted border-2 flex-shrink-0">
                              {result.character?.image ? (
                                <Image src={result.character.image} alt={result.character.name} fill className="object-contain p-1" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-lg">{result.player.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {result.character ? (
                                  <>
                                    <Badge variant="secondary" className="text-xs">{result.character.name}</Badge>
                                    {result.character.series && (
                                      <span className="text-xs text-muted-foreground">{result.character.series}</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Sin personaje registrado</span>
                                )}
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-bold text-primary">{result.points}</div>
                              <div className="text-xs text-muted-foreground">puntos</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
