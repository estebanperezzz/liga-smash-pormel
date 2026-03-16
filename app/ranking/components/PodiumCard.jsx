'use client';

import { useRouter } from 'next/navigation';
import { Trophy, Medal, Award, Gamepad2 } from 'lucide-react';
import CharacterSplit from './CharacterSplit';

// Slot only controls horizontal order — NOT height (that comes from displayPosition)
const slotOrder = {
  1: 'order-2',
  2: 'order-1',
  3: 'order-3',
};

// Height and top offset derived from the actual display rank (supports ties)
const positionDimensions = {
  1: { cardHeight: 'h-80',      marginTop: 'mt-0'  },
  2: { cardHeight: 'h-[17rem]', marginTop: 'mt-6'  },
  3: { cardHeight: 'h-56',      marginTop: 'mt-14' },
};

// Badge label and color scheme per rank
const positionStyles = {
  1: {
    icon: <Trophy className="h-3.5 w-3.5" />,
    label: '1° Lugar',
    badgeClass:  'bg-gradient-to-r from-yellow-300 to-amber-500 text-yellow-950',
    borderClass: 'border-yellow-400/60',
    shadowClass: 'shadow-[0_0_40px_rgba(234,179,8,0.45)] hover:shadow-[0_0_55px_rgba(234,179,8,0.6)]',
    accentBar:   'bg-yellow-400',
    glowOverlay: 'from-yellow-500/25 via-transparent',
  },
  2: {
    icon: <Medal className="h-3.5 w-3.5" />,
    label: '2° Lugar',
    badgeClass:  'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-900',
    borderClass: 'border-slate-400/50',
    shadowClass: 'shadow-[0_0_28px_rgba(148,163,184,0.4)] hover:shadow-[0_0_40px_rgba(148,163,184,0.55)]',
    accentBar:   'bg-slate-400',
    glowOverlay: 'from-slate-400/20 via-transparent',
  },
  3: {
    icon: <Award className="h-3.5 w-3.5" />,
    label: '3° Lugar',
    badgeClass:  'bg-gradient-to-r from-orange-400 to-amber-600 text-orange-950',
    borderClass: 'border-orange-400/50',
    shadowClass: 'shadow-[0_0_22px_rgba(251,146,60,0.38)] hover:shadow-[0_0_35px_rgba(251,146,60,0.52)]',
    accentBar:   'bg-orange-400',
    glowOverlay: 'from-orange-500/20 via-transparent',
  },
};

function resolveCharacters(player) {
  if (player.characters?.length) return player.characters;
  if (player.characterImage) return [{ name: player.character || '', image: player.characterImage }];
  return [];
}

export default function PodiumCard({ player, position, displayPosition, imageFit }) {
  const router = useRouter();

  const orderClass = slotOrder[position];
  const posKey = displayPosition ?? position;
  const dim = positionDimensions[posKey] ?? positionDimensions[3];
  const pos = positionStyles[posKey]    ?? positionStyles[3];

  return (
    <div className={`${orderClass} ${dim.marginTop} flex-1`}>
      <div
        className={`relative ${dim.cardHeight} rounded-2xl overflow-hidden border ${pos.borderClass} ${pos.shadowClass} cursor-pointer transition-all duration-300 hover:scale-[1.03]`}
        onClick={() => router.push(`/players/${player.playerId}`)}
      >
        {/* Character image(s) con split diagonal */}
        <CharacterSplit
          characters={resolveCharacters(player)}
          imageFit={imageFit ?? 'object-contain object-bottom'}
        />

        {/* Color glow from bottom matching position */}
        <div className={`absolute inset-0 bg-gradient-to-t ${pos.glowOverlay} to-transparent`} />

        {/* Dark gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        {/* Accent bar at the top edge */}
        <div className={`absolute top-0 left-0 right-0 h-0.5 ${pos.accentBar} opacity-90`} />

        {/* Position badge — top left */}
        <div className="absolute top-3 left-3">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md ${pos.badgeClass}`}>
            {pos.icon}
            {pos.label}
          </div>
        </div>

        {/* Match count — top right */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
            <Gamepad2 className="h-3 w-3 text-white/60" />
            <span className="text-white/80 text-xs font-medium tabular-nums">
              {player.matchesPlayed}
            </span>
          </div>
        </div>

        {/* Player info — glass panel at bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/55 backdrop-blur-md border-t border-white/10 px-4 py-3">
          <p className="text-white font-bold text-base leading-tight truncate drop-shadow">
            {player.playerName}
          </p>
          {player.characters?.length > 0 ? (
            <p className="text-white/50 text-xs mt-0.5 truncate">
              {player.characters.map(c => c.name).join(' / ')}
            </p>
          ) : player.character ? (
            <p className="text-white/50 text-xs mt-0.5 truncate">{player.character}</p>
          ) : null}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-white font-extrabold text-2xl leading-none tabular-nums drop-shadow">
                {player.totalPoints}
              </span>
              <span className="text-white/45 text-xs font-medium">pts</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-0.5">
                <Trophy className="h-3 w-3 text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold tabular-nums">{player.top1 ?? 0}</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Medal className="h-3 w-3 text-orange-400" />
                <span className="text-orange-400 text-xs font-bold tabular-nums">{player.top3 ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
