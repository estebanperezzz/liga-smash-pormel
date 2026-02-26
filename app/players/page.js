'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Users, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

function UserTooltip({ name, children }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);

  const show = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top });
    }
  };

  return (
    <div ref={ref} className="w-fit" onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      {children}
      {pos && (
        <div
          style={{ position: 'fixed', left: pos.x, top: pos.y - 8, transform: 'translate(-50%, -100%)' }}
          className="px-2 py-1 rounded bg-popover border border-border text-xs text-popover-foreground whitespace-nowrap shadow-md z-50 pointer-events-none"
        >
          {name}
        </div>
      )}
    </div>
  );
}

function SortableHead({ label, sortKey, sortConfig, onSort, className }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          sortConfig.direction === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

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
    if (!newPlayerName.trim()) return;
    setSubmitting(true);
    try {
      await axios.post('/api/players', { name: newPlayerName.trim() });
      setNewPlayerName('');
      fetchPlayers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al agregar jugador');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aVal, bVal;

      if (sortConfig.key === 'currentCharacter') {
        aVal = a.currentCharacter?.name ?? '';
        bVal = b.currentCharacter?.name ?? '';
      } else if (sortConfig.key === 'favoriteCharacter') {
        aVal = a.favoriteCharacter?.name ?? '';
        bVal = b.favoriteCharacter?.name ?? '';
      } else if (sortConfig.key === 'avgPosition') {
        aVal = a.avgPosition !== null ? parseFloat(a.avgPosition) : Infinity;
        bVal = b.avgPosition !== null ? parseFloat(b.avgPosition) : Infinity;
      } else {
        aVal = a[sortConfig.key];
        bVal = b[sortConfig.key];
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const diff = aVal - bVal;
      return sortConfig.direction === 'asc' ? diff : -diff;
    });
  }, [players, sortConfig]);

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
        <p className="text-muted-foreground">Gestiona los jugadores de la liga</p>
      </div>

      {/* Add Player Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Nuevo Jugador
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddPlayer} className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="playerName" className="sr-only">Nombre del jugador</Label>
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
            {players.length} {players.length === 1 ? 'jugador registrado' : 'jugadores registrados'} · Click en un jugador para ver sus stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No hay jugadores registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[52px]">Usuario</TableHead>
                  <SortableHead label="Nombre" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHead label="Personaje Actual" sortKey="currentCharacter" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHead label="PJ Favorito" sortKey="favoriteCharacter" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHead label="Posición Promedio" sortKey="avgPosition" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHead label="Total Partidas" sortKey="totalMatches" sortConfig={sortConfig} onSort={handleSort} />
                  <SortableHead label="Victorias" sortKey="wins" sortConfig={sortConfig} onSort={handleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlayers.map((player) => (
                  <TableRow
                    key={player.id}
                    className="cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <TableCell>
                      {player.user ? (
                        <UserTooltip name={player.user.name ?? player.name}>
                          {player.user.image ? (
                            <img
                              src={player.user.image}
                              alt={player.user.name ?? player.name}
                              className="h-8 w-8 rounded-full object-cover border border-border"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                              {(player.user.name ?? player.name).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </UserTooltip>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">{player.name}</TableCell>
                    <TableCell>
                      {player.currentCharacter ? (
                        <div className="flex items-center gap-2">
                          {player.currentCharacter.image ? (
                            <img
                              src={player.currentCharacter.image}
                              alt={player.currentCharacter.name}
                              className="h-7 w-7 rounded-full object-cover border border-border bg-muted"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {player.currentCharacter.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm">{player.currentCharacter.name}</span>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {player.favoriteCharacter ? (
                        <div className="flex items-center gap-2">
                          {player.favoriteCharacter.image ? (
                            <img
                              src={player.favoriteCharacter.image}
                              alt={player.favoriteCharacter.name}
                              className="h-7 w-7 rounded-full object-cover border border-border bg-muted"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {player.favoriteCharacter.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm">{player.favoriteCharacter.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {player.avgPosition !== null ? (
                        <span className="text-sm font-medium">{player.avgPosition}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold">{player.totalMatches ?? 0}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{player.wins}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
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
