'use client';

import Image from 'next/image';
import { User } from 'lucide-react';

/**
 * Muestra uno o dos personajes.
 * - 1 personaje → imagen full.
 * - 2 personajes → split diagonal (izquierda / derecha).
 *
 * El contenedor padre DEBE ser `relative` y tener dimensiones definidas.
 */
export default function CharacterSplit({ characters, imageFit = 'object-contain object-bottom' }) {
  const chars = characters?.filter(c => c?.image) ?? [];

  if (chars.length === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <User className="h-16 w-16 text-muted-foreground" />
      </div>
    );
  }

  if (chars.length === 1) {
    return (
      <Image
        src={chars[0].image}
        alt={chars[0].name}
        fill
        className={imageFit}
      />
    );
  }

  // Diagonal: línea de (62%, 0%) → (38%, 100%)
  // Cada imagen se desplaza hacia su lado para que el personaje quede
  // centrado en su mitad visible y no quede cortado por la diagonal.
  return (
    <>
      {/* Personaje 1 — mitad izquierda, desplazado a la izquierda */}
      <div
        className="absolute inset-0"
        style={{ clipPath: 'polygon(0 0, 62% 0, 38% 100%, 0 100%)' }}
      >
        <Image
          src={chars[0].image}
          alt={chars[0].name}
          fill
          className="object-contain"
          style={{ objectPosition: '20% 100%' }}
        />
      </div>

      {/* Personaje 2 — mitad derecha, desplazado a la derecha */}
      <div
        className="absolute inset-0"
        style={{ clipPath: 'polygon(62% 0, 100% 0, 100% 100%, 38% 100%)' }}
      >
        <Image
          src={chars[1].image}
          alt={chars[1].name}
          fill
          className="object-contain"
          style={{ objectPosition: '80% 100%' }}
        />
      </div>

      {/* Línea diagonal separadora */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        preserveAspectRatio="none"
      >
        <line
          x1="62%" y1="0%"
          x2="38%" y2="100%"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="2.5"
        />
      </svg>
    </>
  );
}
