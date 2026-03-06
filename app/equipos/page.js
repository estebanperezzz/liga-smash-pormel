'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import { Users, Plus, Trash2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function EquiposPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const [week, setWeek] = useState(null)
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  // Estado del formulario de nuevo equipo
  const [showForm, setShowForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const weekRes = await axios.get('/api/weeks/current')
      setWeek(weekRes.data)

      if (weekRes.data?.isTeamWeek && weekRes.data?.id) {
        const [teamsRes, playersRes] = await Promise.all([
          axios.get(`/api/teams?weekId=${weekRes.data.id}`),
          axios.get('/api/players'),
        ])
        setTeams(teamsRes.data)
        setPlayers(playersRes.data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Jugadores que aún no tienen equipo esta semana
  const assignedPlayerIds = new Set(teams.flatMap((t) => t.members.map((m) => m.player.id)))
  const availablePlayers = players.filter((p) => !assignedPlayerIds.has(p.id))

  function togglePlayer(playerId) {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    )
  }

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!teamName.trim() || selectedPlayerIds.length === 0) return
    setSaving(true)
    setError(null)
    try {
      await axios.post('/api/teams', {
        name: teamName.trim(),
        weekId: week.id,
        playerIds: selectedPlayerIds,
      })
      setTeamName('')
      setSelectedPlayerIds([])
      setShowForm(false)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al crear equipo')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTeam(teamId) {
    if (!confirm('¿Eliminar este equipo?')) return
    try {
      await axios.delete(`/api/teams/${teamId}`)
      await fetchData()
    } catch (err) {
      console.error('Error deleting team:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Cargando equipos...</p>
        </div>
      </div>
    )
  }

  if (!week?.isTeamWeek) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">Semana de equipos</p>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-center">
          <div className="rounded-full bg-orange-500/10 p-6 border border-orange-500/20">
            <Shield className="h-12 w-12 text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">No hay semana de equipos activa</h2>
            <p className="text-muted-foreground mt-2">
              El admin debe activar el modo de equipos desde el panel de administración.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
          <p className="text-muted-foreground">
            Semana {week.weekNumber} — Modo equipos activo
          </p>
        </div>
        {isAdmin && availablePlayers.length > 0 && (
          <button
            onClick={() => { setShowForm((v) => !v); setError(null) }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nuevo equipo
          </button>
        )}
      </div>

      {/* Formulario de nuevo equipo */}
      {showForm && isAdmin && (
        <Card className="border-orange-500/30 bg-orange-950/10">
          <CardHeader>
            <CardTitle className="text-base">Crear equipo</CardTitle>
            <CardDescription>Asigná un nombre y seleccioná los jugadores.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nombre del equipo</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ej: Team Rojo"
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-orange-500/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Jugadores disponibles ({availablePlayers.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePlayers.map((p) => {
                    const selected = selectedPlayerIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlayer(p.id)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          selected
                            ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
                        }`}
                      >
                        {p.name}
                      </button>
                    )
                  })}
                </div>
                {selectedPlayerIds.length > 0 && (
                  <p className="text-xs text-orange-400 mt-2">
                    {selectedPlayerIds.length} jugador{selectedPlayerIds.length !== 1 ? 'es' : ''} seleccionado{selectedPlayerIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setTeamName(''); setSelectedPlayerIds([]); setError(null) }}
                  className="px-4 py-2 rounded-md text-sm border border-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !teamName.trim() || selectedPlayerIds.length === 0}
                  className="px-4 py-2 rounded-md text-sm bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creando...' : 'Crear equipo'}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de equipos */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center">
          <div className="rounded-full bg-white/5 p-6 border border-white/10">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Aún no hay equipos armados</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? 'Usá el botón "Nuevo equipo" para comenzar.' : 'El admin está armando los equipos.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="shrink-0 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar equipo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <CardDescription>
                  {team.members.length} miembro{team.members.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {team.members.map((m) => (
                    <Badge key={m.player.id} variant="secondary">
                      {m.player.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Jugadores sin equipo (visible para admin) */}
      {isAdmin && availablePlayers.length > 0 && (
        <Card className="border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
              Sin equipo asignado ({availablePlayers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availablePlayers.map((p) => (
                <span key={p.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
                  {p.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
