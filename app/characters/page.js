'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePauseRedirect } from '@/hooks/usePauseRedirect';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Check, X, User, AlertCircle, RefreshCw, Clock, Lock, Plus } from 'lucide-react';

function PlayerSearchInput({ players, selectedPlayerId, onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const displayValue = selectedPlayer ? selectedPlayer.name : query;

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
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Buscar jugador..."
          className="w-full h-10 pl-9 pr-8 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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

      {open && filtered.length > 0 && (
        <ul className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(player => (
            <li key={player.id}>
              <button
                onMouseDown={() => handleSelect(player)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                  player.id === selectedPlayerId ? 'bg-accent font-semibold' : ''
                }`}
              >
                {player.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && filtered.length === 0 && query.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg px-3 py-2 text-sm text-muted-foreground text-center">
          No se encontró &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}

export default function CharactersPage() {
  usePauseRedirect();
  const { data: session } = useSession();
  const [characters, setCharacters] = useState([]);
  const [players, setPlayers] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibilityInfo, setEligibilityInfo] = useState(null);
  const [canChange, setCanChange] = useState(false);
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  // null = no estamos en modo cambio; 1 o 2 = slot a reemplazar
  const [changingSlot, setChangingSlot] = useState(null);

  const sessionPlayerId = session?.user?.playerId ?? null;
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (sessionPlayerId && !isAdmin) {
      setSelectedPlayer(sessionPlayerId);
    }
  }, [sessionPlayerId, isAdmin]);

  useEffect(() => {
    if (weekInfo) {
      if (selectedPlayer) {
        checkEligibility();
        fetchCharacters(weekInfo.id, selectedPlayer);
      } else {
        fetchCharacters(weekInfo.id, null);
      }
    }
    // Salir del modo cambio al cambiar de jugador
    setChangingSlot(null);
  }, [selectedPlayer, weekInfo]);

  const fetchCharacters = async (weekId, playerId = null) => {
    try {
      const params = new URLSearchParams({ weekId });
      if (playerId) params.set('playerId', String(playerId));
      const res = await axios.get(`/api/characters?${params}`);
      setCharacters(res.data);
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const fetchData = async () => {
    try {
      const [weekRes, playersRes] = await Promise.all([
        axios.get('/api/weeks/current'),
        axios.get('/api/players')
      ]);

      setWeekInfo(weekRes.data);
      setPlayers(playersRes.data);

      const charactersRes = await axios.get(`/api/characters?weekId=${weekRes.data.id}`);
      setCharacters(charactersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const res = await axios.get(`/api/weeks/eligible-for-change?weekId=${weekInfo.id}`);
      setEligibilityInfo(res.data);

      const isEligible = res.data.eligiblePlayers?.some(
        p => p.playerId === selectedPlayer
      );
      setCanChange(res.data.eligible && isEligible);
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setCanChange(false);
    }
  };

  const handleSelectCharacter = async (characterId) => {
    if (!sessionPlayerId && !isAdmin) {
      alert('Tu cuenta no tiene jugador asignado. Contacta a un administrador.');
      return;
    }

    if (!isAdmin && selectedPlayer !== sessionPlayerId) {
      setSelectedPlayer(sessionPlayerId);
      alert('Solo puedes seleccionar personaje para tu propio jugador.');
      return;
    }

    if (!selectedPlayer) {
      alert('Por favor selecciona un jugador primero');
      return;
    }

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    if (character.usedPreviousWeek) return;

    // Selecciones actuales del jugador (de weekInfo)
    const mySelections = (weekInfo?.weeklyCharacters ?? [])
      .filter(wc => wc.playerId === selectedPlayer)
      .sort((a, b) => a.slot - b.slot);

    // ── Modo cambio activo ──────────────────────────────────────────────────
    if (changingSlot !== null) {
      // No se puede cambiar al mismo personaje que ya tiene en el otro slot
      const otherSlot = mySelections.find(s => s.slot !== changingSlot);
      if (otherSlot?.characterId === characterId) {
        alert('Ya tienes ese personaje en el otro slot.');
        return;
      }

      if (!character.available && !character.selectedBy?.includes(players.find(p => p.id === selectedPlayer)?.name)) {
        // Verificar que no esté full (2 picks por otros)
        const pickedByOthers = (character.selectedBy ?? []).filter(
          name => name !== players.find(p => p.id === selectedPlayer)?.name
        );
        if (pickedByOthers.length >= 2) {
          alert('Este personaje ya fue seleccionado por 2 jugadores.');
          return;
        }
      }

      const currentSlotChar = mySelections.find(s => s.slot === changingSlot);
      const confirmed = confirm(
        `¿Cambiar ${currentSlotChar?.character?.name ?? `Slot ${changingSlot}`} → ${character.name}?\n\nEsta es tu única oportunidad de cambio esta semana.`
      );
      if (!confirmed) return;

      setSubmitting(true);
      try {
        await axios.post('/api/weeks/change-character', {
          playerId: selectedPlayer,
          weekId: weekInfo.id,
          newCharacterId: characterId,
          slot: changingSlot,
        });
        alert('¡Personaje cambiado exitosamente!');
        setChangingSlot(null);
        fetchData();
        checkEligibility();
      } catch (error) {
        console.error('Error:', error);
        alert(error.response?.data?.error || 'Error al cambiar personaje');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // ── Selección normal (agregar nuevo slot) ──────────────────────────────
    if (mySelections.length >= 2) {
      if (canChange) {
        alert('Ya tienes 2 personajes. Usa el botón "Cambiar" sobre el personaje que quieras reemplazar.');
      } else {
        alert('Ya tienes 2 personajes esta semana.');
      }
      return;
    }

    if (!character.available) {
      alert('Este personaje ya fue seleccionado por 2 jugadores.');
      return;
    }

    const playerName = players.find(p => p.id === selectedPlayer)?.name;
    const slotNum = mySelections.length === 0 ? 1 : 2;
    const confirmed = confirm(
      `¿Confirmar selección de ${character.name} como Personaje ${slotNum} para ${playerName}?`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      await axios.post('/api/weeks/select-character', {
        playerId: selectedPlayer,
        characterId,
        weekId: weekInfo.id,
      });
      alert('¡Personaje seleccionado exitosamente!');
      fetchData();
      checkEligibility();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al seleccionar personaje');
    } finally {
      setSubmitting(false);
    }
  };

  // Determinar si un personaje está tomado por el jugador actual
  const getMySlotForCharacter = (characterId) => {
    const mySelections = (weekInfo?.weeklyCharacters ?? []).filter(
      wc => wc.playerId === selectedPlayer
    );
    return mySelections.find(s => s.characterId === characterId)?.slot ?? null;
  };

  const filteredCharacters = characters.filter(c => {
    if (!c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (availabilityFilter === 'available') return c.available && !c.usedPreviousWeek;
    if (availabilityFilter === 'unavailable') return !c.available || c.usedPreviousWeek;
    return true;
  });

  const mySelections = (weekInfo?.weeklyCharacters ?? [])
    .filter(wc => wc.playerId === selectedPlayer)
    .sort((a, b) => a.slot - b.slot);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando personajes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Selección de Personajes</h1>
        <p className="text-muted-foreground">
          Elige hasta 2 personajes para la semana
        </p>
      </div>

      {/* Banner: semana cerrada durante el gap */}
      {weekInfo?.isWeekend && (
        <div className="flex items-start gap-4 rounded-lg border border-orange-500/40 bg-orange-950/30 p-4">
          <div className="mt-0.5 rounded-full bg-orange-500/20 p-2">
            <Lock className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-orange-300">Selección de personajes cerrada</p>
            <p className="mt-1 text-sm text-orange-400/80">
              La semana terminó el viernes a las 14:30. La selección para la nueva semana abre el lunes a las 09:00.
            </p>
          </div>
        </div>
      )}

      {/* Player Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona tu Jugador</CardTitle>
          <CardDescription>
            Elige quién eres para seleccionar tus personajes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isAdmin ? (
            <PlayerSearchInput
              players={players}
              selectedPlayerId={selectedPlayer}
              onSelect={setSelectedPlayer}
            />
          ) : sessionPlayerId ? (
            <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm">
              {players.find(p => p.id === sessionPlayerId)?.name ?? `Jugador ID ${sessionPlayerId}`}
            </div>
          ) : (
            <p className="text-sm text-destructive">
              Tu cuenta no tiene jugador asignado. Contacta a un administrador.
            </p>
          )}

          {/* Current Selections — 2 slots */}
          {selectedPlayer && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Personajes esta semana ({mySelections.length}/2):
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((slotNum) => {
                  const slotSelection = mySelections.find(s => s.slot === slotNum);
                  const isChangingThis = changingSlot === slotNum;

                  return (
                    <div
                      key={slotNum}
                      className={`rounded-lg border-2 p-3 transition-all ${
                        isChangingThis
                          ? 'border-blue-500 bg-blue-950/30'
                          : slotSelection
                            ? 'border-green-500/50 bg-green-950/20'
                            : 'border-dashed border-muted-foreground/30 bg-muted/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Slot {slotNum}
                        </span>
                        {slotSelection && (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>

                      {slotSelection ? (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold leading-tight">
                            {slotSelection.character?.name ?? '—'}
                          </p>
                          {/* Botón cambiar: solo si canChange y no se ha cambiado ya */}
                          {canChange && !isChangingThis && (
                            <button
                              onClick={() => setChangingSlot(slotNum)}
                              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <RefreshCw className="h-3 w-3" />
                              Cambiar
                            </button>
                          )}
                          {isChangingThis && (
                            <button
                              onClick={() => setChangingSlot(null)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Sin selección
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Banner modo cambio activo */}
          {changingSlot !== null && (
            <div className="p-4 bg-blue-950/40 border border-blue-500/40 rounded-lg">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-blue-400 mt-0.5 animate-spin" />
                <div>
                  <p className="font-medium text-blue-200">
                    Modo cambio activado — Slot {changingSlot}
                  </p>
                  <p className="text-sm text-blue-400 mt-1">
                    Elige el nuevo personaje para reemplazar {mySelections.find(s => s.slot === changingSlot)?.character?.name}. Esta es tu única oportunidad de cambio esta semana.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info elegibilidad */}
          {canChange && changingSlot === null && mySelections.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    ¡Puedes cambiar un personaje!
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Estás entre los últimos 3 del ranking. Presiona &quot;Cambiar&quot; sobre el personaje que quieras reemplazar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No elegible */}
          {eligibilityInfo && !eligibilityInfo.eligible && selectedPlayer && mySelections.length > 0 && (
            <div className="p-4 bg-muted border rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Cambio de personaje no disponible</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {eligibilityInfo.message}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search + Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 ${weekInfo?.isWeekend ? 'pointer-events-none opacity-40' : ''}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar personaje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'available', label: 'Puedo elegir' },
            { value: 'unavailable', label: 'No disponibles' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setAvailabilityFilter(value)}
              className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors whitespace-nowrap ${
                availabilityFilter === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Characters Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${weekInfo?.isWeekend ? 'pointer-events-none opacity-40' : ''}`}>
        {filteredCharacters.map((character) => {
          const mySlot = getMySlotForCharacter(character.id);
          const isMyCharacter = mySlot !== null;
          const pickCount = character.pickCount ?? 0;
          const isFull = pickCount >= 2;
          const isHalfTaken = pickCount === 1 && !isMyCharacter;
          const isRestricted = character.usedPreviousWeek && !isMyCharacter;

          // En modo cambio: no mostrar el personaje que ya está en el slot que NO estamos cambiando
          const otherSlotChar = changingSlot !== null
            ? mySelections.find(s => s.slot !== changingSlot)
            : null;
          const isOtherSlotChar = otherSlotChar?.characterId === character.id;

          // El personaje que estamos reemplazando
          const isChangingThisChar = changingSlot !== null && mySlot === changingSlot;

          // ¿El jugador ya completó sus 2 slots y NO estamos en modo cambio?
          const allSlotsFull = mySelections.length >= 2 && changingSlot === null;

          // Determinar si el botón está deshabilitado
          const isDisabled =
            submitting ||
            isRestricted ||
            isOtherSlotChar ||
            (isFull && !isChangingThisChar && !isMyCharacter) ||
            (allSlotsFull && !isMyCharacter);

          // Clases visuales del borde
          let cardClass = '';
          if (isChangingThisChar) {
            cardClass = 'border-blue-400 bg-blue-950/20 ring-2 ring-blue-500 cursor-pointer';
          } else if (isMyCharacter) {
            cardClass = 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500';
          } else if (isRestricted || isOtherSlotChar) {
            cardClass = 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 cursor-not-allowed opacity-70';
          } else if (isFull) {
            cardClass = 'border-muted bg-muted/30 cursor-not-allowed opacity-60';
          } else if (isHalfTaken) {
            cardClass = 'border-orange-400/60 hover:border-orange-400 hover:shadow-lg cursor-pointer bg-card hover:scale-105';
          } else if (!isDisabled) {
            cardClass = 'border-border hover:border-primary hover:shadow-lg cursor-pointer bg-card hover:scale-105';
          } else {
            cardClass = 'border-muted bg-muted/30 cursor-not-allowed opacity-60';
          }

          return (
            <div key={character.id} className="relative group/card">
              <button
                onClick={() => handleSelectCharacter(character.id)}
                disabled={isDisabled}
                className={`w-full relative rounded-lg border-2 transition-all overflow-hidden ${cardClass}`}
              >
                {/* Image Container */}
                <div className="aspect-square relative bg-gradient-to-br from-muted to-background">
                  {character.image ? (
                    <Image
                      src={character.image}
                      alt={character.name}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Overlay: lleno (2/2) */}
                  {isFull && !isMyCharacter && !isChangingThisChar && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <X className="h-8 w-8 text-destructive" />
                    </div>
                  )}

                  {/* Overlay: usado la semana anterior */}
                  {isRestricted && (
                    <div className="absolute inset-0 bg-amber-950/35 flex items-center justify-center">
                      <div className="bg-amber-500/90 rounded-full p-2 shadow-lg">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Indicador: personaje propio */}
                  {isMyCharacter && !isChangingThisChar && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Indicador: slot siendo reemplazado */}
                  {isChangingThisChar && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-blue-500 rounded-full p-1">
                        <RefreshCw className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Badge disponibilidad: 1/2 tomado */}
                  {isHalfTaken && !isRestricted && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-orange-500/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        1/2
                      </span>
                    </div>
                  )}

                  {/* Badge: 2/2 lleno (solo sobre chars de otros) */}
                  {isFull && !isMyCharacter && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-destructive/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        2/2
                      </span>
                    </div>
                  )}

                  {/* Indicador slot propio */}
                  {isMyCharacter && (
                    <div className="absolute bottom-2 left-2">
                      <span className="bg-green-600/90 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                        S{mySlot}
                      </span>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="p-3 border-t">
                  <p className={`text-sm font-medium text-center line-clamp-2 ${
                    !isDisabled && !isRestricted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {character.name}
                  </p>

                  {/* Series */}
                  {character.series && !isRestricted && !isFull && (
                    <p className="text-xs text-muted-foreground text-center mt-1 truncate">
                      {character.series}
                    </p>
                  )}

                  {/* Etiqueta semana anterior */}
                  {isRestricted && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-1 font-medium truncate">
                      Semana anterior
                    </p>
                  )}

                  {/* Quién lo tiene (1/2) */}
                  {isHalfTaken && !isRestricted && (
                    <p className="text-xs text-orange-500 dark:text-orange-400 text-center mt-1 truncate">
                      {character.selectedBy?.[0]}
                    </p>
                  )}
                </div>

                {/* Badge: tomado por ambos (2/2) */}
                {isFull && !isMyCharacter && !isRestricted && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="text-xs">
                      Lleno
                    </Badge>
                  </div>
                )}
              </button>

              {/* Tooltip semana anterior */}
              {isRestricted && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/card:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150 shadow-xl">
                  Personaje ya utilizado la semana anterior
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                </div>
              )}

              {/* Tooltip 1/2 tomado */}
              {isHalfTaken && !isRestricted && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/card:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150 shadow-xl">
                  Tomado por {character.selectedBy?.[0]} — queda 1 cupo
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                </div>
              )}

              {/* Tooltip 2/2 lleno */}
              {isFull && !isMyCharacter && !isRestricted && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/card:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity duration-150 shadow-xl">
                  {character.selectedBy?.join(' y ')} — sin cupos
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{characters.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {characters.filter(c => c.available).length}
              </p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">
                {characters.filter(c => (c.pickCount ?? 0) === 1).length}
              </p>
              <p className="text-sm text-muted-foreground">1 cupo libre</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {characters.filter(c => (c.pickCount ?? 0) >= 2).length}
              </p>
              <p className="text-sm text-muted-foreground">Llenos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
