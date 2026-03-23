'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePauseRedirect } from '@/hooks/usePauseRedirect';
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
        p.currentCharacters?.some(c => c.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (a.currentCharacters?.length && !b.currentCharacters?.length) return -1;
      if (!a.currentCharacters?.length && b.currentCharacters?.length) return 1;
      return 0;
    });

  const playerLabel = (p) => {
    const chars = p.currentCharacters;
    if (chars?.length === 2) return `${p.name} — ${chars[0].name} / ${chars[1].name}`;
    if (chars?.length === 1) return `${p.name} — ${chars[0].name}`;
    return p.name;
  };

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
        {selectedPlayer?.currentCharacters?.length > 0 ? (
          <img
            src={selectedPlayer.currentCharacters[0].image}
            alt={selectedPlayer.currentCharacters[0].name}
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
                {/* Imágenes de personajes (hasta 2) */}
                <div className="flex gap-0.5 flex-shrink-0">
                  {player.currentCharacters?.length > 0 ? (
                    player.currentCharacters.map(c => (
                      <img key={c.id} src={c.image} alt={c.name} className="h-8 w-8 object-contain" />
                    ))
                  ) : (
                    <div className="h-8 w-8 rounded bg-muted" />
                  )}
                </div>

                {/* Nombre + personajes */}
                <span className="flex-1 truncate">
                  {player.name}
                  {player.currentCharacters?.length > 0 && (
                    <span className="text-muted-foreground"> — {player.currentCharacters.map(c => c.name).join(' / ')}</span>
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
  usePauseRedirect();
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkCount, setBulkCount] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // Estado modo equipos
  const [allTeams, setAllTeams] = useState([]);          // todos los equipos de la semana
  const [orderedTeams, setOrderedTeams] = useState([]); // equipos seleccionados para esta partida, con posición

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

      if (weekRes.data?.isTeamWeek && weekRes.data?.id) {
        const teamsRes = await axios.get(`/api/teams?weekId=${weekRes.data.id}`);
        setAllTeams(
          teamsRes.data.map((t) => ({
            teamId: t.id,
            teamName: t.name,
            members: t.members.map((m) => m.player.name),
          }))
        );
      }
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
      characterId: null,
    }));
    setSelectedPlayers(slots);
    setBulkCount('');
  };

  const addPlayer = () => {
    setSelectedPlayers([...selectedPlayers, { playerId: null, position: selectedPlayers.length + 1, characterId: null }]);
  };

  const removePlayer = (index) => {
    const reordered = selectedPlayers
      .filter((_, i) => i !== index)
      .map((p, i) => ({ ...p, position: i + 1 }));
    setSelectedPlayers(reordered);
  };

  const updatePlayer = (index, playerId) => {
    const newPlayers = [...selectedPlayers];
    newPlayers[index].playerId = playerId;
    // Auto-seleccionar personaje si el jugador solo tiene 1
    const player = players.find(p => p.id === playerId);
    if (player?.currentCharacters?.length === 1) {
      newPlayers[index].characterId = player.currentCharacters[0].id;
    } else {
      newPlayers[index].characterId = null;
    }
    setSelectedPlayers(newPlayers);
  };

  const updateCharacter = (index, characterId) => {
    const newPlayers = [...selectedPlayers];
    newPlayers[index].characterId = characterId;
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
    if (selectedPlayers.some(p => !p.characterId)) {
      alert('Todos los jugadores deben tener un personaje seleccionado');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/matches', {
        weekId: weekInfo.id,
        results: selectedPlayers.map(p => ({ playerId: p.playerId, position: p.position, characterId: p.characterId }))
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

  // ── Handlers modo equipos ─────────────────────────────────────────────────

  const MAX_PLAYERS_PER_MATCH = 8;

  const toggleTeam = (team) => {
    const isSelected = orderedTeams.some((t) => t.teamId === team.teamId);
    if (isSelected) {
      setOrderedTeams((prev) =>
        prev.filter((t) => t.teamId !== team.teamId).map((t, i) => ({ ...t, position: i + 1 }))
      );
    } else {
      const currentPlayers = orderedTeams.reduce((sum, t) => sum + t.members.length, 0);
      if (currentPlayers + team.members.length > MAX_PLAYERS_PER_MATCH) return;
      setOrderedTeams((prev) => [...prev, { ...team, position: prev.length + 1 }]);
    }
  };

  const moveTeamUp = (index) => {
    if (index === 0) return;
    const next = [...orderedTeams];
    [next[index], next[index - 1]] = [next[index - 1], next[index]];
    next[index].position = index + 1;
    next[index - 1].position = index;
    setOrderedTeams(next);
  };

  const moveTeamDown = (index) => {
    if (index === orderedTeams.length - 1) return;
    const next = [...orderedTeams];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    next[index].position = index + 1;
    next[index + 1].position = index + 2;
    setOrderedTeams(next);
  };

  const handleTeamSubmit = async () => {
    if (orderedTeams.length < 2) {
      showToast('Debe haber al menos 2 equipos', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post('/api/team-matches', {
        weekId: weekInfo.id,
        teamResults: orderedTeams.map((t) => ({ teamId: t.teamId, position: t.position })),
      });
      setOrderedTeams([]);
      showToast('¡Partida de equipos registrada!', 'success');
    } catch (error) {
      showToast(error.response?.data?.error || 'Error al registrar partida', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

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

  // ── Modo equipos ─────────────────────────────────────────────────────────
  if (!loading && weekInfo?.isTeamWeek) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrar Partida</h1>
          <p className="text-muted-foreground">Semana de equipos — ordená de 1° a último</p>
        </div>

        {allTeams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No hay equipos armados esta semana</p>
              <p className="text-sm text-muted-foreground mt-1">
                El admin debe armar los equipos en{' '}
                <button onClick={() => router.push('/equipos')} className="text-orange-400 hover:underline">
                  /equipos
                </button>{' '}
                antes de registrar partidas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Selección de equipos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Seleccionar equipos
                </CardTitle>
                <CardDescription>
                  Elegí los equipos que jugaron esta partida (máx. {MAX_PLAYERS_PER_MATCH} jugadores en total ·{' '}
                  {orderedTeams.reduce((s, t) => s + t.members.length, 0)}/{MAX_PLAYERS_PER_MATCH} seleccionados)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {allTeams.map((team) => {
                  const isSelected = orderedTeams.some((t) => t.teamId === team.teamId);
                  const currentPlayers = orderedTeams.reduce((s, t) => s + t.members.length, 0);
                  const wouldExceed = !isSelected && currentPlayers + team.members.length > MAX_PLAYERS_PER_MATCH;
                  return (
                    <button
                      key={team.teamId}
                      type="button"
                      onClick={() => !wouldExceed && toggleTeam(team)}
                      disabled={wouldExceed}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : wouldExceed
                          ? 'border-border bg-muted/30 opacity-40 cursor-not-allowed'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {isSelected && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{team.teamName}</p>
                        <p className="text-xs text-muted-foreground truncate">{team.members.join(', ')}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {team.members.length} {team.members.length === 1 ? 'jugador' : 'jugadores'}
                      </Badge>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Ordenamiento — solo cuando hay ≥2 equipos seleccionados */}
            {orderedTeams.length >= 2 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Orden de equipos
                    </CardTitle>
                    <CardDescription>
                      Usá las flechas para ordenar los equipos de mejor a peor posición
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {orderedTeams.map((team, index) => (
                      <div key={team.teamId} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                        <div className="flex flex-col gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveTeamUp(index)} disabled={index === 0}>↑</Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveTeamDown(index)} disabled={index === orderedTeams.length - 1}>↓</Button>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1 w-12 justify-center shrink-0">
                          {getPositionIcon(team.position)}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{team.teamName}</p>
                          <p className="text-xs text-muted-foreground truncate">{team.members.join(', ')}</p>
                        </div>
                        <Badge variant="secondary" className="w-16 justify-center shrink-0">
                          {orderedTeams.length - index + 1} pts
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Resumen */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {orderedTeams.map((team, index) => (
                        <div key={team.teamId} className="flex justify-between items-center">
                          <span className="text-sm">
                            {getPositionIcon(team.position)} {team.teamName}
                            <span className="text-muted-foreground text-xs ml-2">({team.members.join(', ')})</span>
                          </span>
                          <Badge>{orderedTeams.length - index + 1} puntos</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Submit */}
                <div className="flex gap-3">
                  <Button className="flex-1" size="lg" onClick={handleTeamSubmit} disabled={submitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {submitting ? 'Guardando...' : 'Guardar Partida'}
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => router.push('/ranking')}>
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </>
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
                toast.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'
              }`}
            >
              {toast.type === 'success'
                ? <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                : <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              }
              <span>{toast.message}</span>
              <button onClick={() => setToast(null)} className="ml-2 text-muted-foreground hover:text-foreground transition-colors">✕</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  // ─────────────────────────────────────────────────────────────────────────

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
            {selectedPlayers.map((player, index) => {
              const selectedPlayer = players.find(p => p.id === player.playerId);
              const chars = selectedPlayer?.currentCharacters ?? [];
              const needsCharPick = chars.length > 1;
              return (
                <div key={index} className="flex flex-col gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {/* Flechas */}
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveUp(index)} disabled={index === 0}>↑</Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveDown(index)} disabled={index === selectedPlayers.length - 1}>↓</Button>
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
                    <Button size="icon" variant="ghost" onClick={() => removePlayer(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {/* Selector de personaje — solo si el jugador tiene 2 personajes */}
                  {needsCharPick && (
                    <div className="flex items-center gap-2 pl-[calc(1.5rem+3rem+0.75rem)]">
                      <span className="text-xs text-muted-foreground shrink-0">¿Con cuál jugó?</span>
                      <div className="flex gap-2">
                        {chars.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => updateCharacter(index, c.id)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-colors ${
                              player.characterId === c.id
                                ? 'border-primary bg-primary/20 text-primary'
                                : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {c.image && <img src={c.image} alt={c.name} className="h-6 w-6 object-contain" />}
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

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
              {selectedPlayers.map((player, index) => {
                if (!player.playerId) return null;
                const selectedPlayer = players.find(p => p.id === player.playerId);
                const char = selectedPlayer?.currentCharacters?.find(c => c.id === player.characterId);
                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-1.5">
                      {getPositionIcon(player.position)} {getPlayerName(player.playerId)}
                      {char && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <span>·</span>
                          {char.image && <img src={char.image} alt={char.name} className="h-4 w-4 object-contain" />}
                          {char.name}
                        </span>
                      )}
                    </span>
                    <Badge>{selectedPlayers.length - index + 1} puntos</Badge>
                  </div>
                );
              })}
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
