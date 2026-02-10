'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Crown, Calendar } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Campeones</h1>
        <p className="text-muted-foreground">
          Revisa todos los ganadores de semanas anteriores
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Semanas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history?.totalWeeks || 0}</div>
            <p className="text-xs text-muted-foreground">Semanas completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campeones Únicos</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history?.championRanking?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Jugadores diferentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Máximo de Títulos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {history?.championRanking?.[0]?.championships || 0}
            </div>
            <p className="text-xs text-muted-foreground">
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
                {history.championRanking.map((champion, index) => (
                  <TableRow key={champion.playerId}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        {index === 1 && <Crown className="h-4 w-4 text-gray-400" />}
                        {index === 2 && <Crown className="h-4 w-4 text-orange-600" />}
                        <span>#{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{champion.playerName}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {champion.championships}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Weekly History */}
      {history?.weeks && history.weeks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial por Semana
            </CardTitle>
            <CardDescription>
              Ganadores de cada semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semana</TableHead>
                  <TableHead>Campeón</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Fecha Fin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.weeks.map((week) => (
                  <TableRow key={week.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">Semana {week.weekNumber}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      {week.winner.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(week.startDate).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(week.endDate).toLocaleDateString('es-AR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
