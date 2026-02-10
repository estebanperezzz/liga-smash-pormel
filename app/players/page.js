'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Users } from 'lucide-react';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const res = await axios.get('/api/players');
      setPlayers(res.data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e) => {
    e.preventDefault();

    if (!newPlayerName.trim()) {
      alert('Por favor ingresa un nombre');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post('/api/players', {
        name: newPlayerName.trim()
      });

      alert('¡Jugador agregado exitosamente!');
      setNewPlayerName('');
      fetchPlayers();
    } catch (error) {
      console.error('Error adding player:', error);
      alert(error.response?.data?.error || 'Error al agregar jugador');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando jugadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jugadores</h1>
        <p className="text-muted-foreground">
          Gestiona los jugadores de la liga
        </p>
      </div>

      {/* Add Player Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Nuevo Jugador
          </CardTitle>
          <CardDescription>
            Registra un nuevo competidor en la liga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlayer} className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="playerName" className="sr-only">
                Nombre del jugador
              </Label>
              <Input
                id="playerName"
                placeholder="Nombre del jugador"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                disabled={submitting}
              />
            </div>
            <Button type="submit" disabled={submitting}>
              <UserPlus className="h-4 w-4 mr-2" />
              {submitting ? 'Agregando...' : 'Agregar'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Lista de Jugadores
          </CardTitle>
          <CardDescription>
            {players.length} {players.length === 1 ? 'jugador registrado' : 'jugadores registrados'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No hay jugadores registrados</p>
              <p className="text-sm text-muted-foreground mt-2">
                Agrega el primer jugador usando el formulario de arriba
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">#{player.id}</TableCell>
                    <TableCell className="font-semibold">{player.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(player.createdAt).toLocaleDateString('es-AR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">Activo</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
