'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check, X, Swords, User } from 'lucide-react';

export default function CharactersPage() {
  const [characters, setCharacters] = useState([]);
  const [players, setPlayers] = useState([]);
  const [weekInfo, setWeekInfo] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [weekRes, playersRes] = await Promise.all([
        axios.get('/api/weeks/current'),
        axios.get('/api/players')
      ]);

      setWeekInfo(weekRes.data);
      setPlayers(playersRes.data);

      // Fetch characters with availability
      const charactersRes = await axios.get(`/api/characters?weekId=${weekRes.data.id}`);
      setCharacters(charactersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCharacter = async (characterId) => {
    if (!selectedPlayer) {
      alert('Por favor selecciona un jugador primero');
      return;
    }

    const character = characters.find(c => c.id === characterId);
    if (!character.available) {
      alert(`Este personaje ya fue seleccionado por ${character.selectedBy}`);
      return;
    }

    const confirmed = confirm(
      `¿Confirmar selección de ${character.name} para ${players.find(p => p.id === selectedPlayer)?.name}?`
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      await axios.post('/api/weeks/select-character', {
        playerId: selectedPlayer,
        characterId,
        weekId: weekInfo.id
      });

      alert('¡Personaje seleccionado exitosamente!');
      fetchData(); // Reload data
    } catch (error) {
      console.error('Error selecting character:', error);
      alert(error.response?.data?.error || 'Error al seleccionar personaje');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCharacters = characters.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Player Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona tu Jugador</CardTitle>
          <CardDescription>
            Elige quién eres para seleccionar tu personaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPlayer?.toString() || ''}
            onValueChange={(value) => setSelectedPlayer(parseInt(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar jugador" />
            </SelectTrigger>
            <SelectContent>
              {players.map((player) => (
                <SelectItem key={player.id} value={player.id.toString()}>
                  {player.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {mySelection && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Ya seleccionaste:</span>
                </div>
                <Badge className="text-lg px-3 py-1">
                  {mySelection.character.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Este es tu personaje para esta semana. No puedes cambiarlo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar personaje..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredCharacters.map((character) => (
          <button
            key={character.id}
            onClick={() => handleSelectCharacter(character.id)}
            disabled={!character.available || submitting || mySelection}
            className={`
              relative rounded-lg border-2 transition-all overflow-hidden
              ${character.available 
                ? 'border-border hover:border-primary hover:shadow-lg cursor-pointer bg-card hover:scale-105' 
                : 'border-muted bg-muted/30 cursor-not-allowed opacity-60'
              }
              ${mySelection?.characterId === character.id
                ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500'
                : ''
              }
            `}
          >
            {/* Image Container */}
            <div className="aspect-square relative bg-gradient-to-br from-muted to-background">
              {character.image ? (
                <Image
                  src={character.image}
                  alt={character.name}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              
              {/* Overlay for unavailable */}
              {!character.available && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <X className="h-8 w-8 text-destructive" />
                </div>
              )}

              {/* Selected indicator */}
              {mySelection?.characterId === character.id && (
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
                character.available ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {character.name}
              </p>
              
              {/* Series badge */}
              {character.series && character.available && (
                <p className="text-xs text-muted-foreground text-center mt-1 truncate">
                  {character.series}
                </p>
              )}
            </div>

            {/* Taken badge */}
            {!character.available && (
              <div className="absolute top-2 left-2">
                <Badge variant="destructive" className="text-xs">
                  {character.selectedBy}
                </Badge>
              </div>
            )}
          </button>
        ))}
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
