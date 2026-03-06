'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Gamepad2, Plus, Trash2, Save, Users, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';

// Combobox con búsqueda en tiempo real para seleccionar jugador
function PlayerSearchInput({ availablePlayers, allPlayers, selectedPlayerId, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const selectedPlayer = allPlayers.find(p => p.id === selectedPlayerId);

  const filtered = availablePlayers
    .filter(p => {
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.currentCharacter?.name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      // Jugadores con personaje asignado primero
      if (a.currentCharacter && !b.currentCharacter) return -1;
      if (!a.currentCharacter && b.currentCharacter) return 1;
      return 0;
    });

  const playerLabel = (p) =>
    p.currentCharacter ? `${p.name} - ${p.currentCharacter.name}` : p.name;

  const displayValue = selectedPlayer ? playerLabel(selectedPlayer) : query;

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (selectedPlayerId) onSelect(null);
    setOpen(true);
  };

  const handleSelect = (player) => {
    onSelect(player.id);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onSelect(null);
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1">
      <div className="relative">
        {selectedPlayer?.currentCharacter?.image ? (
          <img
            src={selectedPlayer.currentCharacter.image}
            alt={selectedPlayer.currentCharacter.name}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 object-contain pointer-events-none"
          />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        )}
        <input
          ref={inputRef}
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar jugador..."
          className="w-full h-10 pl-9 pr-8 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {selectedPlayer && (
          <button
            onMouseDown={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {filtered.map(player => (
            <li key={player.id}>
              <button
                onMouseDown={() => handleSelect(player)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground flex items-center gap-2.5 ${
                  player.id === selectedPlayerId ? 'bg-accent font-semibold' : ''
                }`}
              >
                {/* Imagen del personaje */}
                <div className="h-8 w-8 flex-shrink-0 flex items-center justify-center">
                  {player.currentCharacter?.image ? (
                    <img
                      src={player.currentCharacter.image}
                      alt={player.currentCharacter.name}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted" />
                  )}
                </div>

                {/* Nombre + personaje */}
                <span className="flex-1 truncate">
                  {player.name}
                  {player.currentCharacter && (
                    <span className="text-muted-foreground"> — {player.currentCharacter.name}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Sin resultados */}
      {open && filtered.length === 0 && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground text-center">
          No se encontró &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

export default function NewMatchPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkCount, setBulkCount] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
    const count = Number.parseInt(bulkCount);
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
    newPlayers[index].playerId = playerId; // number | null, ya tipado desde PlayerSearchInput
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
      setSelectedPlayers([]);
      setBulkCount('');
      showToast('¡Resultados cargados correctamente!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Error al registrar partida', 'error');
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
          <CardContent className="space-y-3">
            {selectedPlayers.map((player, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {/* Flechas */}
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

                {/* Posición */}
                <Badge variant="outline" className="text-lg px-3 py-1 w-12 justify-center shrink-0">
                  {getPositionIcon(player.position)}
                </Badge>

                {/* Buscador */}
                <PlayerSearchInput
                  availablePlayers={getAvailablePlayers(index)}
                  allPlayers={players}
                  selectedPlayerId={player.playerId}
                  onSelect={(playerId) => updatePlayer(index, playerId)}
                />

                {/* Puntos preview */}
                {player.playerId && (
                  <Badge variant="secondary" className="w-16 justify-center shrink-0">
                    {selectedPlayers.length - index + 1} pts
                  </Badge>
                )}

                {/* Eliminar slot */}
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border backdrop-blur-md text-sm font-medium text-foreground bg-background/95 ${
              toast.type === 'success'
                ? 'border-green-500/30'
                : 'border-red-500/30'
            }`}
          >
            {toast.type === 'success'
              ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              : <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            }
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
