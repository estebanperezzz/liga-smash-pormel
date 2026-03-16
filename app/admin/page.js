import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import prisma from '@/lib/prisma'
import { linkPlayerToUser, unlinkPlayer, setUserRole, setTeamWeek, setBlockPreviousWeekChars } from './actions'

export const metadata = { title: 'Admin — Liga Smash Pormel' }

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== 'admin') redirect('/')

  const now = new Date()
  const [users, availablePlayers, currentWeek] = await Promise.all([
    prisma.user.findMany({
      include: { player: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.player.findMany({
      where: { userId: null },
      orderBy: { name: 'asc' },
    }),
    prisma.week.findFirst({
      where: { startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { startDate: 'desc' },
    }),
  ])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Panel de Administración</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vinculá cuentas Google con los jugadores existentes y gestioná roles.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Usuarios registrados ({users.length})
          </h2>
        </div>

        <div className="divide-y divide-white/5">
          {users.map((user) => (
            <div key={user.id} className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Info del usuario */}
              <div className="flex items-center gap-3 min-w-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ''}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-white/10 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-sm font-bold">
                    {user.name?.[0] ?? '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{user.name ?? 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                {/* Badge de rol */}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  user.role === 'admin'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-white/5 text-muted-foreground border border-white/10'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'Usuario'}
                </span>
              </div>

              {/* Acciones */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:shrink-0">
                {/* Vincular/Desvincular jugador */}
                {user.player ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-orange-400 font-medium">
                      {user.player.name}
                    </span>
                    <form action={unlinkPlayer}>
                      <input type="hidden" name="playerId" value={user.player.id} />
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 rounded border border-white/10 text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors"
                      >
                        Desvincular
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={linkPlayerToUser} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <select
                      name="playerId"
                      defaultValue=""
                      className="text-sm bg-white/5 border border-white/10 rounded px-2 py-1 text-foreground focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="" disabled>Sin jugador</option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="text-xs px-3 py-1 rounded bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-colors"
                    >
                      Vincular
                    </button>
                  </form>
                )}

                {/* Cambiar rol */}
                <form action={setUserRole} className="flex items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="role" value={user.role === 'admin' ? 'user' : 'admin'} />
                  <button
                    type="submit"
                    disabled={user.id === session.user.id}
                    className="text-xs px-2 py-1 rounded border border-white/10 text-muted-foreground hover:text-orange-400 hover:border-orange-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title={user.id === session.user.id ? 'No podés cambiar tu propio rol' : ''}
                  >
                    {user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                  </button>
                </form>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground text-sm">
              Ningún usuario se ha registrado todavía.
            </div>
          )}
        </div>
      </div>

      {/* Semana de Equipos */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Semana de Equipos
          </h2>
        </div>
        <div className="px-6 py-4">
          {currentWeek ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-sm">Semana {currentWeek.weekNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(currentWeek.startDate).toLocaleDateString('es-AR')} —{' '}
                  {new Date(currentWeek.endDate).toLocaleDateString('es-AR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  currentWeek.isTeamWeek
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-white/5 text-muted-foreground border-white/10'
                }`}>
                  {currentWeek.isTeamWeek ? 'Semana de equipos activa' : 'Semana individual'}
                </span>
                <form action={setTeamWeek}>
                  <input type="hidden" name="weekId" value={currentWeek.id} />
                  <input type="hidden" name="isTeamWeek" value={String(!currentWeek.isTeamWeek)} />
                  <button
                    type="submit"
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      currentWeek.isTeamWeek
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-orange-500/30 text-orange-400 hover:bg-orange-500/10'
                    }`}
                  >
                    {currentWeek.isTeamWeek ? 'Desactivar equipos' : 'Activar equipos'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay semana activa en este momento.</p>
          )}
        </div>
      </div>

      {/* Bloqueo personajes semana anterior */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Bloqueo de personajes
          </h2>
        </div>
        <div className="px-6 py-4">
          {currentWeek ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-sm">Regla: no repetir personaje de semana anterior</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentWeek.blockPreviousWeekChars
                    ? 'Activa — los jugadores no pueden elegir personajes que usaron la semana pasada.'
                    : 'Desactivada — los jugadores pueden elegir cualquier personaje sin restricción histórica.'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  currentWeek.blockPreviousWeekChars
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}>
                  {currentWeek.blockPreviousWeekChars ? 'Bloqueado' : 'Desbloqueado'}
                </span>
                <form action={setBlockPreviousWeekChars}>
                  <input type="hidden" name="weekId" value={currentWeek.id} />
                  <input type="hidden" name="blockPreviousWeekChars" value={String(!currentWeek.blockPreviousWeekChars)} />
                  <button
                    type="submit"
                    className={`text-xs px-3 py-1 rounded border transition-colors ${
                      currentWeek.blockPreviousWeekChars
                        ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {currentWeek.blockPreviousWeekChars ? 'Quitar bloqueo semanal' : 'Restaurar bloqueo semanal'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay semana activa en este momento.</p>
          )}
        </div>
      </div>

      {/* Jugadores sin vincular */}
      {availablePlayers.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Jugadores sin cuenta vinculada ({availablePlayers.length})
            </h2>
          </div>
          <div className="px-6 py-4 flex flex-wrap gap-2">
            {availablePlayers.map((p) => (
              <span key={p.id} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-muted-foreground">
                {p.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
