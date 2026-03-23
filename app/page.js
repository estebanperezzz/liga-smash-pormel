'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Trophy, Gamepad2, Users, History, Swords, Calendar,
  List, Crown, TrendingUp, Star, PauseCircle, Shield,
} from 'lucide-react'

// ─── Animation variants ──────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

// ─── Quick actions ────────────────────────────────────────────────────────────
const quickActions = [
  { href: '/ranking',    icon: Trophy,   label: 'Ranking',          description: 'Tabla de posiciones', iconGradient: 'from-yellow-500 to-orange-500', hoverGradient: 'from-yellow-500/15 to-orange-500/15', hoverBorder: 'hover:border-yellow-500/40' },
  { href: '/match/new', icon: Gamepad2,  label: 'Nueva Partida',    description: 'Cargar resultados',   iconGradient: 'from-emerald-500 to-green-600', hoverGradient: 'from-emerald-500/15 to-green-500/15', hoverBorder: 'hover:border-emerald-500/40' },
  { href: '/matches',   icon: List,      label: 'Ver Partidas',     description: 'Historial completo',  iconGradient: 'from-blue-500 to-indigo-600',   hoverGradient: 'from-blue-500/15 to-indigo-500/15',   hoverBorder: 'hover:border-blue-500/40' },
  { href: '/characters',icon: Swords,    label: 'Mi Personaje',     description: 'Seleccionar main',    iconGradient: 'from-purple-500 to-violet-600', hoverGradient: 'from-purple-500/15 to-violet-500/15', hoverBorder: 'hover:border-purple-500/40' },
  { href: '/players',   icon: Users,     label: 'Jugadores',        description: 'Ver y gestionar',     iconGradient: 'from-cyan-500 to-blue-600',     hoverGradient: 'from-cyan-500/15 to-blue-500/15',     hoverBorder: 'hover:border-cyan-500/40' },
  { href: '/history',   icon: History,   label: 'Historial',        description: 'Ver campeones',       iconGradient: 'from-red-500 to-rose-600',      hoverGradient: 'from-red-500/15 to-rose-500/15',      hoverBorder: 'hover:border-red-500/40' },
]

// ─── Position medal config ────────────────────────────────────────────────────
const positionConfig = {
  1: { label: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  2: { label: '🥈', color: 'text-slate-300',  bg: 'bg-slate-500/10 border-slate-500/30' },
  3: { label: '🥉', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
}

// Standard competition ranking: 1 + number of players with strictly more points
function computeRanks(players) {
  return players.map((player) =>
    1 + players.filter(p => p.totalPoints > player.totalPoints).length
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function CharacterAvatar({ src, name, size = 'md' }) {
  const [error, setError] = useState(false)
  const sizeClass = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-11 h-11'

  if (!src || error) {
    return (
      <div className={`${sizeClass} rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-white/10 flex items-center justify-center flex-shrink-0`}>
        <Swords className="w-4 h-4 text-orange-400/60" />
      </div>
    )
  }
  return (
    <div className={`${sizeClass} rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/30`}>
      <Image src={src} alt={name ?? ''} width={64} height={64} className="w-full h-full object-cover" onError={() => setError(true)} />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [rankingData, setRankingData] = useState(null)
  const [historyData, setHistoryData] = useState(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [weekRes, historyRes, playersRes] = await Promise.all([
          fetch('/api/weeks/current'),
          fetch('/api/weeks/history'),
          fetch('/api/players'),
        ])
        const week = await weekRes.json()
        const history = await historyRes.json()
        const players = await playersRes.json()

        setHistoryData(history)
        setTotalPlayers(Array.isArray(players) ? players.length : 0)

        if (week.isPaused) {
          setIsPaused(true)
          setRankingData({ week, ranking: [], totalMatches: 0, isTeamWeek: false })
          return
        }

        const rankingRes = await fetch(`/api/weeks/ranking?weekId=${week.id}`)
        const ranking = await rankingRes.json()
        setRankingData({ week, ranking: ranking.ranking ?? [], totalMatches: ranking.totalMatches ?? 0, isTeamWeek: ranking.isTeamWeek ?? false })
      } catch (err) {
        console.error('Error fetching home data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const lastChampion = historyData?.weeks?.[0] ?? null
  const topPlayers   = historyData?.historicalPointsRanking?.slice(0, 3) ?? []
  const topWeekly    = rankingData?.ranking?.slice(0, 5) ?? []
  const totalWeeks   = historyData?.totalWeeks ?? 0
  const isTeamWeek   = rankingData?.isTeamWeek ?? false
  const weeklyRanks  = computeRanks(topWeekly)
  const hofRanks     = computeRanks(topPlayers)

  const PAUSED_ACTIONS = new Set(['/match/new', '/matches', '/characters'])

  return (
    <div className="space-y-14">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <motion.div
        className="relative text-center space-y-6 py-14 overflow-hidden"
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-r from-orange-600/15 to-red-700/15 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ scale: 1.03 }}
          className="drop-shadow-[0_0_40px_rgba(255,100,0,0.25)]"
        >
          <Image
            src="/logo.svg"
            alt="Liga Smash Pormel"
            width={480}
            height={360}
            className="w-72 sm:w-96 md:w-[480px] h-auto mx-auto"
            priority
          />
        </motion.div>

        {/* ── Banner de pausa ── */}
        {isPaused && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mx-auto max-w-lg"
          >
            <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-950/60 via-red-950/40 to-transparent px-6 py-5">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/8 to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-orange-500/50 via-red-500/30 to-transparent" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <PauseCircle className="h-5 w-5 text-orange-400 shrink-0" />
                  <span className="font-bold text-orange-300 text-base">Liga en pausa</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed">
                  La <span className="text-orange-400 font-medium">Temporada 1</span> ha finalizado.
                  <br />
                  La próxima temporada comenzará pronto.
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="h-3.5 w-3.5 text-orange-500/60" />
                  <span className="text-xs text-orange-500/60 font-medium uppercase tracking-wider">
                    Temporada 1 — Completada
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        variants={stagger} initial="hidden" animate="show"
      >
        {[
          { icon: Users,      label: 'Jugadores',          value: loading ? '—' : totalPlayers,                           color: 'text-cyan-400',   bg: 'from-cyan-500/10 to-blue-500/5',    border: 'border-cyan-500/15' },
          { icon: Calendar,   label: 'Semanas jugadas',    value: loading ? '—' : totalWeeks,                             color: 'text-orange-400', bg: 'from-orange-500/10 to-red-500/5',   border: 'border-orange-500/15' },
          { icon: Gamepad2,   label: 'Partidas esta sem.', value: loading ? '—' : (rankingData?.totalMatches ?? '—'),     color: 'text-emerald-400',bg: 'from-emerald-500/10 to-green-500/5',border: 'border-emerald-500/15' },
          { icon: Swords,     label: 'Personajes activos', value: loading ? '—' : (rankingData?.week?.weeklyCharacters?.length ?? '—'), color: 'text-purple-400', bg: 'from-purple-500/10 to-violet-500/5', border: 'border-purple-500/15' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div key={stat.label} variants={fadeUp}>
              <Card className={`border ${stat.border} bg-gradient-to-br ${stat.bg} text-center py-4 px-3`}>
                <Icon className={`h-5 w-5 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </Card>
            </motion.div>
          )
        })}
      </motion.div>

      {/* ── Ranking actual + Último campeón ──────────────────────────────── */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* Ranking semana actual */}
        <motion.div
          className="lg:col-span-3 space-y-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                Ranking Semana Actual
              </h2>
              {rankingData?.week && (
                <p className="text-xs text-muted-foreground">Semana #{rankingData.week.weekNumber}</p>
              )}
            </div>
            <Button asChild variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 text-xs">
              <Link href="/ranking">Ver todo →</Link>
            </Button>
          </div>

          <Card className="border border-white/8 bg-card overflow-hidden">
            {loading ? (
              <div className="divide-y divide-white/5">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                    <div className="w-6 h-4 bg-white/10 rounded" />
                    <div className="w-10 h-10 rounded-xl bg-white/10" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/10 rounded w-24" />
                      <div className="h-2.5 bg-white/5 rounded w-16" />
                    </div>
                    <div className="w-10 h-4 bg-white/10 rounded" />
                  </div>
                ))}
              </div>
            ) : topWeekly.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
                <Gamepad2 className="h-8 w-8 opacity-30" />
                <p>Aún no hay partidas esta semana</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {topWeekly.map((entry, idx) => {
                  const pos = weeklyRanks[idx]
                  const cfg = positionConfig[pos]

                  /* ── SEMANA DE EQUIPOS ── */
                  if (isTeamWeek) {
                    return (
                      <motion.div
                        key={entry.teamId}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + idx * 0.06 }}
                      >
                        {/* Position */}
                        <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${cfg?.color ?? 'text-muted-foreground'}`}>
                          {cfg?.label ?? `#${pos}`}
                        </span>

                        {/* Team image or icon */}
                        {entry.teamImage ? (
                          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/30">
                            <Image src={entry.teamImage} alt={entry.teamName} width={32} height={32} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-orange-400/60" />
                          </div>
                        )}

                        {/* Team name + member chars */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{entry.teamName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            {entry.members.map((m) => (
                              <div key={m.id} className="relative w-5 h-5 rounded overflow-hidden border border-white/10 bg-black/30 flex-shrink-0" title={`${m.name}${m.characterName ? ` — ${m.characterName}` : ''}`}>
                                {m.characterImage ? (
                                  <Image src={m.characterImage} alt={m.characterName || m.name} fill className="object-contain" />
                                ) : (
                                  <Swords className="w-3 h-3 text-white/30 m-auto" />
                                )}
                              </div>
                            ))}
                            <p className="text-xs text-muted-foreground truncate ml-1">{entry.members.map(m => m.name).join(', ')}</p>
                          </div>
                        </div>

                        {/* Points */}
                        <Badge variant="outline" className={`text-xs font-semibold tabular-nums flex-shrink-0 ${cfg?.bg ?? 'border-white/10'}`}>
                          {entry.totalPoints} pts
                        </Badge>
                      </motion.div>
                    )
                  }

                  /* ── SEMANA INDIVIDUAL ── */
                  return (
                    <motion.div
                      key={entry.playerId}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.06 }}
                    >
                      <span className={`w-6 text-center text-sm font-bold flex-shrink-0 ${cfg?.color ?? 'text-muted-foreground'}`}>
                        {cfg?.label ?? `#${pos}`}
                      </span>
                      <CharacterAvatar src={entry.characterImage} name={entry.character} size="sm" />
                      <div className="flex-1 min-w-0">
                        <Link href={`/players/${entry.playerId}`} className="font-semibold text-sm hover:text-orange-400 transition-colors truncate block">
                          {entry.playerName}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate">{entry.character ?? 'Sin personaje'}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs font-semibold tabular-nums ${cfg?.bg ?? 'border-white/10'}`}>
                        {entry.totalPoints} pts
                      </Badge>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Último campeón */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              Último Campeón
            </h2>
            <Button asChild variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 text-xs">
              <Link href="/history">Historial →</Link>
            </Button>
          </div>

          {loading ? (
            <Card className="border border-white/8 bg-card animate-pulse h-48" />
          ) : !lastChampion ? (
            <Card className="border border-white/8 bg-card flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
              <Trophy className="h-8 w-8 opacity-30" />
              <p>Sin campeón aún</p>
            </Card>
          ) : (
            <Link href={`/week/${lastChampion.id}`}>
              <Card className="relative overflow-hidden border border-yellow-500/20 bg-card group cursor-pointer hover:border-yellow-500/40 transition-all hover:scale-[1.01] duration-300">
                {/* Background image or gradient */}
                {lastChampion.championImage ? (
                  <div className="absolute inset-0">
                    <Image
                      src={lastChampion.championImage}
                      alt="Champion"
                      fill
                      className="object-cover opacity-25 group-hover:opacity-35 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-600/10" />
                )}

                <CardContent className="relative pt-6 pb-5 px-5 flex flex-col gap-4">
                  {/* Badge semana */}
                  <Badge className="self-start bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-medium">
                    Semana #{lastChampion.weekNumber}
                  </Badge>

                  {/* Winner info */}
                  <div className="flex items-center gap-3">
                    {lastChampion.winnerCharacters?.[0]?.image && (
                      <CharacterAvatar
                        src={lastChampion.winnerCharacters[0].image}
                        name={lastChampion.winnerCharacters[0].name}
                        size="lg"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-yellow-400 font-medium uppercase tracking-wider mb-0.5">Campeón</p>
                      <p className="font-bold text-lg leading-tight truncate">{lastChampion.winner?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{lastChampion.winnerCharacters?.[0]?.name ?? '—'}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-3">
                    {lastChampion.winnerPoints != null && (
                      <div className="flex-1 rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-center">
                        <p className="text-base font-bold text-yellow-400">{lastChampion.winnerPoints}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">puntos</p>
                      </div>
                    )}
                    {lastChampion.winnerMatchesPlayed != null && (
                      <div className="flex-1 rounded-lg bg-white/5 border border-white/8 px-3 py-2 text-center">
                        <p className="text-base font-bold">{lastChampion.winnerMatchesPlayed}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">partidas</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </motion.div>
      </div>

      {/* ── Mejores jugadores (histórico) ─────────────────────────────────── */}
      {(loading || topPlayers.length > 0) && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-orange-400" />
                Hall of Fame
              </h2>
              <p className="text-xs text-muted-foreground">Top jugadores históricos por puntos</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 text-xs">
              <Link href="/players">Ver todos →</Link>
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {loading ? (
              [1,2,3].map(i => (
                <Card key={i} className="border border-white/8 bg-card animate-pulse h-24" />
              ))
            ) : topPlayers.map((player, idx) => {
                const medals  = ['🥇', '🥈', '🥉']
                const glows   = ['shadow-yellow-500/10', 'shadow-slate-400/10', 'shadow-orange-400/10']
                const borders = ['border-yellow-500/25 hover:border-yellow-500/40', 'border-slate-400/20 hover:border-slate-400/35', 'border-orange-400/20 hover:border-orange-400/35']
                const cfgIdx  = hofRanks[idx] - 1
                return (
                  <motion.div
                    key={player.playerId}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                  >
                    <Link href={`/players/${player.playerId}`}>
                      <Card className={`border ${borders[cfgIdx]} bg-card hover:shadow-xl ${glows[cfgIdx]} transition-all duration-300 hover:scale-[1.02] cursor-pointer group`}>
                        <CardContent className="px-4 py-4 flex items-center gap-3">
                          <span className="text-2xl flex-shrink-0">{medals[cfgIdx]}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm group-hover:text-orange-400 transition-colors truncate">{player.playerName}</p>
                            <p className="text-xs text-muted-foreground">{player.matchesPlayed} partidas</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-base tabular-nums">{player.totalPoints}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">pts</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })
            }
          </div>
        </motion.div>
      )}

      {/* ── Acciones Rápidas ──────────────────────────────────────────────── */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">Acciones Rápidas</h2>
          <p className="text-muted-foreground text-sm">Elegí una opción para empezar</p>
        </div>

        <motion.div
          className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
        >
          {quickActions.map((action) => {
            const Icon = action.icon
            const blocked = isPaused && PAUSED_ACTIONS.has(action.href)
            const inner = (
              <div className={`group relative overflow-hidden rounded-xl border border-white/8 bg-card p-5 flex items-center gap-4 transition-all duration-300 ${blocked ? 'opacity-40 cursor-not-allowed' : `hover:scale-[1.02] hover:shadow-xl cursor-pointer ${action.hoverBorder}`}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${action.hoverGradient} opacity-0 ${!blocked ? 'group-hover:opacity-100' : ''} transition-opacity duration-300`} />
                <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${action.iconGradient} flex items-center justify-center shadow-md`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <h3 className="font-semibold text-sm group-hover:text-white transition-colors">{action.label}</h3>
                  <p className="text-xs text-muted-foreground group-hover:text-white/70 transition-colors">{action.description}</p>
                </div>
                <div className="relative text-muted-foreground group-hover:text-white/50 transition-all group-hover:translate-x-1 duration-200">
                  {blocked
                    ? <PauseCircle className="h-3.5 w-3.5 text-orange-400/50" />
                    : <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  }
                </div>
              </div>
            )
            return (
              <motion.div key={action.href} variants={fadeUp}>
                {blocked ? inner : <Link href={action.href}>{inner}</Link>}
              </motion.div>
            )
          })}
        </motion.div>
      </motion.div>

    </div>
  )
}
