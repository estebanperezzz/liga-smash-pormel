'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Medal, Award, User } from 'lucide-react';

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekInfo, setWeekInfo] = useState(null);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const weekRes = await axios.get('/api/weeks/current');
      setWeekInfo(weekRes.data);

      const rankingRes = await axios.get(`/api/weeks/ranking?weekId=${weekRes.data.id}`);
      setRanking(rankingRes.data.ranking);
    } catch (error) {
      console.error('Error fetching ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return null;
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ranking Semanal</h1>
        <p className="text-muted-foreground">
          Clasificación actualizada en tiempo real
        </p>
      </div>

      {/* Week Info */}
      {weekInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Semana {weekInfo.weekNumber}</CardTitle>
            <CardDescription>
              {new Date(weekInfo.startDate).toLocaleDateString('es-AR')} - {new Date(weekInfo.endDate).toLocaleDateString('es-AR')}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla de Posiciones</CardTitle>
          <CardDescription>
            {ranking.length} {ranking.length === 1 ? 'jugador' : 'jugadores'} en competencia
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
                  <TableHead className="w-[80px]">Posición</TableHead>
                  <TableHead className="w-[180px]">Jugador</TableHead>
                  <TableHead className="w-[100px]">Personaje</TableHead>
                  <TableHead className="text-center">Partidas</TableHead>
                  <TableHead className="text-right">Puntos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((player, index) => (
                  <TableRow key={player.playerId} className={index < 3 ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRankIcon(index)}
                        <span>{index + 1}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-semibold text-lg">{player.playerName}</p>
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
                    
                    <TableCell>
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gradient-to-br from-muted to-background border-2">
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
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">{player.matchesPlayed}</TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {player.totalPoints}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top 3 Podium */}
      {ranking.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {/* 2nd Place */}
          <Card className="mt-8">
            <CardHeader className="text-center pb-2">
              <Medal className="h-8 w-8 text-gray-400 mx-auto" />
              <CardTitle className="text-lg">2° Lugar</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="font-bold">{ranking[1]?.playerName}</p>
              <p className="text-2xl font-bold text-primary">{ranking[1]?.totalPoints} pts</p>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="border-yellow-500 border-2">
            <CardHeader className="text-center pb-2">
              <Trophy className="h-10 w-10 text-yellow-500 mx-auto" />
              <CardTitle>1° Lugar</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="font-bold text-lg">{ranking[0]?.playerName}</p>
              <p className="text-3xl font-bold text-primary">{ranking[0]?.totalPoints} pts</p>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="mt-8">
            <CardHeader className="text-center pb-2">
              <Award className="h-8 w-8 text-orange-600 mx-auto" />
              <CardTitle className="text-lg">3° Lugar</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="font-bold">{ranking[2]?.playerName}</p>
              <p className="text-2xl font-bold text-primary">{ranking[2]?.totalPoints} pts</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}