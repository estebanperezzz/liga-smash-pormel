'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Check, X, User, AlertCircle, RefreshCw, Clock, Lock } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (weekInfo) {
      if (selectedPlayer) {
        checkEligibility();
        fetchCharacters(weekInfo.id, selectedPlayer);
      } else {
        fetchCharacters(weekInfo.id, null);
      }
    }
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
    if (!selectedPlayer) {
      alert('Por favor selecciona un jugador primero');
      return;
    }

    const character = characters.find(c => c.id === characterId);

    if (character.usedPreviousWeek) return;

    if (!character.available) {
      alert(`Este personaje ya fue seleccionado por ${character.selectedBy}`);
      return;
    }

    const mySelection = weekInfo?.weeklyCharacters?.find(
      wc => wc.playerId === selectedPlayer
    );

    let confirmMessage = '';
    let endpoint = '';
    let payload = {};

    if (mySelection && canChange) {
      confirmMessage = `¿Confirmar CAMBIO de ${mySelection.character.name} a ${character.name}?\n\nEsta es tu única oportunidad de cambio esta semana.`;
      endpoint = '/api/weeks/change-character';
      payload = {
        playerId: selectedPlayer,
        weekId: weekInfo.id,
        newCharacterId: characterId
      };
    } else if (!mySelection) {
      confirmMessage = `¿Confirmar selección de ${character.name} para ${players.find(p => p.id === selectedPlayer)?.name}?`;
      endpoint = '/api/weeks/select-character';
      payload = {
        playerId: selectedPlayer,
        characterId,
        weekId: weekInfo.id
      };
    } else {
      alert('Ya tienes un personaje seleccionado y no puedes cambiarlo');
      return;
    }

    const confirmed = confirm(confirmMessage);
    if (!confirmed) return;

    setSubmitting(true);

    try {
      await axios.post(endpoint, payload);
      alert('¡Personaje actualizado exitosamente!');
      fetchData();
      checkEligibility();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al actualizar personaje');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCharacters = characters.filter(c => {
    if (!c.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (availabilityFilter === 'available') return c.available && !c.usedPreviousWeek;
    if (availabilityFilter === 'unavailable') return !c.available || c.usedPreviousWeek;
    return true;
  });

  const mySelection = weekInfo?.weeklyCharacters?.find(
    wc => wc.playerId === selectedPlayer
  );

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
          Elige tu main para la semana (solo uno por jugador)
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
            Elige quién eres para seleccionar tu personaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlayerSearchInput
            players={players}
            selectedPlayerId={selectedPlayer}
            onSelect={setSelectedPlayer}
          />

          {/* Current Selection */}
          {mySelection && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Tu personaje actual:</span>
                </div>
                <Badge className="text-lg px-3 py-1">
                  {mySelection.character.name}
                </Badge>
              </div>
              {!canChange && (
                <p className="text-sm text-muted-foreground mt-2">
                  Este es tu personaje para esta semana.
                </p>
              )}
            </div>
          )}

          {/* Change Eligibility Info */}
          {canChange && mySelection && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    ¡Puedes cambiar de personaje!
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Estás entre los últimos 3 del ranking. Tienes UNA oportunidad de cambiar tu personaje. Elige sabiamente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Not Eligible Info */}
          {eligibilityInfo && !eligibilityInfo.eligible && selectedPlayer && mySelection && (
            <div className="mt-4 p-4 bg-muted border rounded-lg">
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

      {/* Search + Filters — ocultos en gap */}
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

      {/* Characters Grid — deshabilitado en gap */}
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${weekInfo?.isWeekend ? 'pointer-events-none opacity-40' : ''}`}>
        {filteredCharacters.map((character) => {
          const isMyCharacter = mySelection?.characterId === character.id;
          const canSelect = character.available || isMyCharacter;
          const isRestricted = character.usedPreviousWeek && !isMyCharacter;

          const stateBorderClass = isRestricted
            ? 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-950/20 cursor-not-allowed opacity-70'
            : canSelect
              ? 'border-border hover:border-primary hover:shadow-lg cursor-pointer bg-card hover:scale-105'
              : 'border-muted bg-muted/30 cursor-not-allowed opacity-60';

          const myCharacterClass = isMyCharacter
            ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500'
            : '';

          return (
            <div key={character.id} className="relative group/card">
              <button
                onClick={() => handleSelectCharacter(character.id)}
                disabled={isRestricted || (!canSelect && !canChange) || submitting || (mySelection && !canChange && !isMyCharacter)}
                className={`w-full relative rounded-lg border-2 transition-all overflow-hidden ${stateBorderClass} ${myCharacterClass}`}
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

                  {/* Overlay: tomado por otro jugador esta semana */}
                  {!canSelect && !isRestricted && (
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

                  {/* Indicator: personaje propio seleccionado */}
                  {isMyCharacter && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-green-500 rounded-full p-1">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="p-3 border-t">
                  <p className={`text-sm font-medium text-center line-clamp-2 ${
                    canSelect && !isRestricted ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {character.name}
                  </p>

                  {/* Series */}
                  {character.series && canSelect && !isRestricted && (
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
                </div>

                {/* Badge: tomado por otro jugador */}
                {!canSelect && !isMyCharacter && !isRestricted && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="text-xs">
                      {character.selectedBy}
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
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{characters.length}</p>
              <p className="text-sm text-muted-foreground">Total Personajes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {characters.filter(c => c.available).length}
              </p>
              <p className="text-sm text-muted-foreground">Disponibles</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {characters.filter(c => !c.available).length}
              </p>
              <p className="text-sm text-muted-foreground">Seleccionados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
