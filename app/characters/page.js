'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Check, X, Swords } from 'lucide-react';

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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredCharacters.map((character) => (
          <button
            key={character.id}
            onClick={() => handleSelectCharacter(character.id)}
            disabled={!character.available || submitting || mySelection}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${character.available 
                ? 'border-border hover:border-primary hover:shadow-lg cursor-pointer bg-card' 
                : 'border-muted bg-muted/50 cursor-not-allowed opacity-60'
              }
              ${mySelection?.characterId === character.id
                ? 'border-green-500 bg-green-50 dark:bg-green-950'
                : ''
              }
            `}
          >
            <div className="aspect-square flex items-center justify-center text-4xl mb-2">
              {character.available ? '✓' : '✗'}
            </div>
            <p className={`text-xs font-medium text-center line-clamp-2 ${
              character.available ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {character.name}
            </p>
            {!character.available && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 text-[10px] px-1.5">
                {character.selectedBy}
              </Badge>
            )}
            {mySelection?.characterId === character.id && (
              <Check className="absolute -top-2 -right-2 h-6 w-6 text-green-600 bg-white dark:bg-gray-900 rounded-full" />
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
