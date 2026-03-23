'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { PauseCircle, X } from 'lucide-react'

const PAUSED_BLOCKED = new Set(['/match/new', '/matches', '/characters', '/equipos'])

export default function NavLinks({ isPaused, isAdmin, items }) {
  const [toastVisible, setToastVisible] = useState(false)

  const handleClick = (e, href) => {
    if (isPaused && PAUSED_BLOCKED.has(href)) {
      e.preventDefault()
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 3500)
    }
  }

  return (
    <>
      <nav className="flex items-center text-sm font-medium flex-1 flex-wrap gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleClick(e, item.href)}
            className={`px-3 py-1.5 rounded-md transition-all duration-200 hover:text-orange-400 hover:bg-orange-500/10 text-muted-foreground ${
              isPaused && PAUSED_BLOCKED.has(item.href)
                ? 'opacity-40 cursor-not-allowed'
                : ''
            }`}
          >
            {item.label}
          </Link>
        ))}
        {isAdmin && (
          <Link
            href="/admin"
            className="px-3 py-1.5 rounded-md transition-all duration-200 hover:text-orange-400 hover:bg-orange-500/10 text-orange-500/70 font-semibold"
          >
            Admin
          </Link>
        )}
      </nav>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border border-orange-500/30 bg-background/95 backdrop-blur-md text-sm font-medium text-foreground"
          >
            <PauseCircle className="h-4 w-4 text-orange-400 shrink-0" />
            <span>Liga en pausa — no hay temporada activa</span>
            <button
              onClick={() => setToastVisible(false)}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
