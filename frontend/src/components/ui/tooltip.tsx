import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'right'
  delay?: number
  className?: string
}

export function Tooltip({ content, children, side = 'top', delay = 0, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const show = () => {
    if (delay > 0) {
      timerRef.current = setTimeout(() => setVisible(true), delay)
    } else {
      setVisible(true)
    }
  }

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => {
    if (!visible || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 10
    let top = 0, left = 0
    switch (side) {
      case 'top':
        top = rect.top - gap; left = rect.left + rect.width / 2; break
      case 'bottom':
        top = rect.bottom + gap; left = rect.left + rect.width / 2; break
      case 'right':
        top = rect.top + rect.height / 2; left = rect.right + gap; break
    }
    setPos({ top, left })
  }, [visible, side])

  return (
    <>
      <span
        ref={triggerRef}
        className={cn('inline-flex', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
      >
        {children}
      </span>
      {visible && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none"
          style={{
            top: pos.top,
            left: pos.left,
            transform: side === 'top' || side === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)',
            animation: 'tooltip-in 0.12s ease-out',
          }}
        >
          <div
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shadow-lg',
              'bg-primary text-primary-foreground',
            )}
          >
            {content}
          </div>
          <div
            className={cn(
              'absolute w-2 h-2 bg-primary rotate-45',
              side === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2',
              side === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2',
              side === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2',
            )}
          />
        </div>,
        document.body
      )}
    </>
  )
}

export default Tooltip
