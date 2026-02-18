'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Crown, Calendar, Star } from 'lucide-react';
import WeekChampionCard from './components/WeekChampionCard';

export default function HistoryPage() {
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
    <div className="space-y-8">
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

      {/* Champion Ranking */}
      {history?.championRanking && history.championRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Ranking de Campeones
            </CardTitle>
            <CardDescription>
              Jugadores ordenados por cantidad de campeonatos ganados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Posición</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="text-right">Campeonatos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.championRanking.map((champion, index) => {
                  const rowStyles = [
                    'bg-gradient-to-r from-yellow-500/15 to-transparent border-l-2 border-yellow-500',
                    'bg-gradient-to-r from-gray-400/15 to-transparent border-l-2 border-gray-400',
                    'bg-gradient-to-r from-orange-600/15 to-transparent border-l-2 border-orange-600',
                  ];
                  return (
                    <TableRow
                      key={champion.playerId}
                      className={index < 3 ? rowStyles[index] : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          {index === 1 && <Crown className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Crown className="h-4 w-4 text-orange-600" />}
                          <span className="font-bold">#{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-semibold ${index === 0 ? 'text-yellow-600 dark:text-yellow-400' : ''}`}>
                          {champion.playerName}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={index === 0 ? 'default' : 'secondary'}
                          className={`text-base px-3 py-1 ${index === 0 ? 'bg-yellow-500 hover:bg-yellow-500 text-yellow-950' : ''}`}
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

      {/* Weekly History */}
      {history?.weeks && history.weeks.length > 0 ? (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial por Semana
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Campeones de cada semana · Click para ver el perfil
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.weeks.map((week) => (
              <WeekChampionCard key={week.id} week={week} />
            ))}
          </div>
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
