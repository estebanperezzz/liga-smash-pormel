'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Lock } from 'lucide-react'

export default function AuthToast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (searchParams.get('authRequired') === '1') {
      setVisible(true)
      router.replace(pathname, { scroll: false })
      const timer = setTimeout(() => setVisible(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, pathname, router])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border border-orange-500/30 bg-background/95 backdrop-blur-md text-sm font-medium text-foreground"
        >
          <Lock className="h-4 w-4 text-orange-400 shrink-0" />
          <span>Necesitas iniciar sesión para ver esa ruta</span>
          <button
            onClick={() => setVisible(false)}
            className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
