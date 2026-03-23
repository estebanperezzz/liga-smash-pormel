'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Redirige a "/" si la liga está en pausa (sin temporada activa).
 * Usar al inicio de cualquier página bloqueada durante la pausa.
 */
export function usePauseRedirect() {
  const router = useRouter()
  useEffect(() => {
    fetch('/api/weeks/current')
      .then((r) => r.json())
      .then((data) => { if (data.isPaused) router.replace('/') })
      .catch(() => {})
  }, [router])
}
