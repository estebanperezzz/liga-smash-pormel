'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, Award, User, Gamepad2 } from 'lucide-react';

const configs = {
  1: {
    wrapperClass: 'order-2',
    cardHeight: 'h-72',
    icon: <Trophy className="h-7 w-7 text-yellow-400" />,
    label: '1° Lugar',
    labelClass: 'bg-yellow-400/90 text-yellow-900',
    border: 'border-yellow-400 border-2',
    marginTop: 'mt-0',
  },
  2: {
    wrapperClass: 'order-1',
    cardHeight: 'h-56',
    icon: <Medal className="h-6 w-6 text-gray-300" />,
    label: '2° Lugar',
    labelClass: 'bg-gray-400/90 text-gray-900',
    border: 'border-gray-400',
    marginTop: 'mt-10',
  },
  3: {
    wrapperClass: 'order-3',
    cardHeight: 'h-48',
    icon: <Award className="h-6 w-6 text-orange-400" />,
    label: '3° Lugar',
    labelClass: 'bg-orange-400/90 text-orange-900',
    border: 'border-orange-400',
    marginTop: 'mt-16',
  },
};

export default function PodiumCard({ player, position }) {
  const router = useRouter();
  const config = configs[position];

  return (
    <div className={`${config.wrapperClass} ${config.marginTop} flex-1`}>
      <div
        className={`relative ${config.cardHeight} rounded-2xl overflow-hidden border-2 ${config.border} shadow-xl cursor-pointer transition-transform hover:scale-105`}
        onClick={() => router.push(`/players/${player.playerId}`)}
      >
        {/* Imagen del personaje */}
        {player.characterImage ? (
          <Image
            src={player.characterImage}
            alt={player.character || ''}
            fill
            className="object-contain object-bottom"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <User className="h-16 w-16 text-muted-foreground" />
          </div>
        )}

        {/* Gradiente para legibilidad */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Badge posición - arriba izquierda */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${config.labelClass}`}>
            {config.icon}
            {config.label}
          </div>
        </div>

        {/* Partidas - arriba derecha */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
            <Gamepad2 className="h-3 w-3 text-white/80" />
            <span className="text-white/90 text-xs font-medium">{player.matchesPlayed}</span>
          </div>
        </div>

        {/* Info jugador - abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-xl leading-tight drop-shadow-lg">
            {player.playerName}
          </p>
          {player.character && (
            <p className="text-white/75 text-sm mt-0.5 drop-shadow">
              {player.character}
            </p>
          )}
          <p className="text-white font-extrabold text-2xl mt-1 drop-shadow-lg">
            {player.totalPoints}
            <span className="text-sm font-normal opacity-75 ml-1">pts</span>
          </p>
        </div>
      </div>
    </div>
  );
}