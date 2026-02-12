'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gamepad2, Plus, Trash2, Save, Users } from 'lucide-react';

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkCount, setBulkCount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, weekRes] = await Promise.all([
        axios.get('/api/players'),
        axios.get('/api/weeks/current')
      ]);
      setPlayers(playersRes.data);
      setWeekInfo(weekRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = () => {
    const count = parseInt(bulkCount);
    if (!count || count < 1 || count > players.length) {
      alert(`Ingresa un número entre 1 y ${players.length}`);
      return;
    }
    const slots = Array.from({ length: count }, (_, i) => ({
      playerId: null,
      position: i + 1,
    }));
    setSelectedPlayers(slots);
    setBulkCount('');
  };

  const addPlayer = () => {
    setSelectedPlayers([...selectedPlayers, { playerId: null, position: selectedPlayers.length + 1 }]);
  };

  const removePlayer = (index) => {
    const reordered = selectedPlayers
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, position: i + 1 }));
    setSelectedPlayers(reordered);
  };

  const updatePlayer = (index, playerId) => {
    const newPlayers = [...selectedPlayers];
    newPlayers[index].playerId = parseInt(playerId);
    setSelectedPlayers(newPlayers);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newPlayers = [...selectedPlayers];
    [newPlayers[index], newPlayers[index - 1]] = [newPlayers[index - 1], newPlayers[index]];
    newPlayers[index].position = index + 1;
    newPlayers[index - 1].position = index;
    setSelectedPlayers(newPlayers);
  };

  const moveDown = (index) => {
    if (index === selectedPlayers.length - 1) return;
    const newPlayers = [...selectedPlayers];
    [newPlayers[index], newPlayers[index + 1]] = [newPlayers[index + 1], newPlayers[index]];
    newPlayers[index].position = index + 1;
    newPlayers[index + 1].position = index + 2;
    setSelectedPlayers(newPlayers);
  };

  const handleSubmit = async () => {
    if (selectedPlayers.length < 2) {
      alert('Debe haber al menos 2 jugadores');
      return;
    }
    if (selectedPlayers.some(p => !p.playerId)) {
      alert('Todos los jugadores deben estar seleccionados');
      return;
    }
    const playerIds = selectedPlayers.map(p => p.playerId);
    if (new Set(playerIds).size !== playerIds.length) {
      alert('No puedes seleccionar el mismo jugador dos veces');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/matches', {
        weekId: weekInfo.id,
        results: selectedPlayers.map(p => ({ playerId: p.playerId, position: p.position }))
      });
      alert('¡Partida registrada exitosamente!');
      router.push('/ranking');
    } catch (error) {
      alert(error.response?.data?.error || 'Error al registrar partida');
    } finally {
      setSubmitting(false);
    }
  };

  const getAvailablePlayers = (currentIndex) => {
    const selectedIds = selectedPlayers
      .filter((_, i) => i !== currentIndex)
      .map(p => p.playerId)
      .filter(id => id !== null);
    return players.filter(p => !selectedIds.includes(p.id));
  };

  const getPlayerName = (playerId) => players.find(p => p.id === playerId)?.name || '';

  const getPositionIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}°`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Registrar Partida</h1>
        <p className="text-muted-foreground">
          Ingresa los resultados de la partida en orden de posición
        </p>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Instrucciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Ingresa la cantidad de jugadores para cargar los slots de una sola vez</p>
          <p>2. Selecciona los jugadores en orden de posición (1° primero, último al final)</p>
          <p>3. Puedes reorganizar usando las flechas arriba/abajo</p>
          <p>4. Los puntos se calcularán automáticamente según la cantidad de jugadores</p>
        </CardContent>
      </Card>

      {/* Bulk Add */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cantidad de Jugadores
          </CardTitle>
          <CardDescription>
            Ingresa cuántos jugadores participaron para generar los slots automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="number"
              min="2"
              max={players.length}
              placeholder={`Ej: 7 (máx. ${players.length})`}
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBulkAdd()}
              className="flex-1"
            />
            <Button onClick={handleBulkAdd} disabled={!bulkCount}>
              <Users className="h-4 w-4 mr-2" />
              Generar slots
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Selection */}
      {selectedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Jugadores y Posiciones</CardTitle>
            <CardDescription>
              {selectedPlayers.length} {selectedPlayers.length === 1 ? 'jugador' : 'jugadores'} · Ordénalos de 1° a último
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlayers.map((player, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moveDown(index)}
                    disabled={index === selectedPlayers.length - 1}
                  >
                    ↓
                  </Button>
                </div>

                <Badge variant="outline" className="text-lg px-3 py-1 w-12 justify-center">
                  {getPositionIcon(player.position)}
                </Badge>

                <Select
                  value={player.playerId?.toString() || ''}
                  onValueChange={(value) => updatePlayer(index, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar jugador" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePlayers(index).map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {player.playerId && (
                  <Badge variant="secondary" className="w-16 justify-center">
                    {selectedPlayers.length - index + 1} pts
                  </Badge>
                )}

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removePlayer(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            <Button variant="outline" className="w-full" onClick={addPlayer}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Jugador
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {selectedPlayers.some(p => p.playerId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedPlayers.map((player, index) => (
                player.playerId && (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">
                      {getPositionIcon(player.position)} {getPlayerName(player.playerId)}
                    </span>
                    <Badge>{selectedPlayers.length - index + 1} puntos</Badge>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {selectedPlayers.length > 0 && (
        <div className="flex gap-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={handleSubmit}
            disabled={submitting || selectedPlayers.length < 2}
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Guardando...' : 'Guardar Partida'}
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push('/ranking')}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  );
}