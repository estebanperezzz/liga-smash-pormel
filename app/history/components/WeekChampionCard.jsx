'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Crown, Calendar, Gamepad2, Star, User } from 'lucide-react';

export default function WeekChampionCard({ week }) {
  const router = useRouter();

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
    });

  return (
    <div
      className="relative h-64 rounded-2xl overflow-hidden border border-border shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-xl group"
      onClick={() => router.push(`/players/${week.winner.id}`)}
    >
      {/* Fondo: imagen del personaje */}
      {week.winnerCharacter?.image ? (
        <Image
          src={week.winnerCharacter.image}
          alt={week.winnerCharacter.name || ''}
          fill
          className="object-contain object-bottom transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <User className="h-20 w-20 text-muted-foreground" />
        </div>
      )}

      {/* Gradiente overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

      {/* Badge semana - arriba izquierda */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm text-white border border-white/20 shadow">
          <Calendar className="h-3 w-3" />
          Semana {week.weekNumber}
        </div>
      </div>

      {/* Fecha - arriba derecha */}
      <div className="absolute top-3 right-3">
        <div className="text-[11px] text-white/70 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm">
          {formatDate(week.startDate)} – {formatDate(week.endDate)}
        </div>
      </div>

      {/* Stats - debajo del badge semana si hay datos */}
      {(week.winnerPoints !== null || week.winnerMatchesPlayed !== null) && (
        <div className="absolute top-11 left-3 flex gap-1.5 mt-1">
          {week.winnerPoints !== null && (
            <div className="flex items-center gap-1 bg-yellow-400/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-yellow-400/30">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-yellow-300 text-[11px] font-semibold">
                {week.winnerPoints} pts
              </span>
            </div>
          )}
          {week.winnerMatchesPlayed !== null && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">
              <Gamepad2 className="h-3 w-3 text-white/70" />
              <span className="text-white/70 text-[11px]">
                {week.winnerMatchesPlayed} partidas
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info campeón - abajo */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center gap-1.5 mb-1">
          <Crown className="h-4 w-4 text-yellow-400" />
          <span className="text-yellow-400 text-[11px] font-bold uppercase tracking-widest">
            Campeón
          </span>
        </div>
        <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">
          {week.winner.name}
        </p>
        {week.winnerCharacter && (
          <p className="text-white/75 text-sm mt-0.5 drop-shadow">
            {week.winnerCharacter.name}
            {week.winnerCharacter.series && (
              <span className="text-white/45 ml-1.5">
                · {week.winnerCharacter.series}
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
