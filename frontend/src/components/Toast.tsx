import { useEffect, useState, useCallback } from 'react'
import { cn } from '../lib/utils'
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

let toastId = 0
let addToastFn: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null

export function toast(message: string, type: ToastType = 'info') {
  addToastFn?.({ message, type })
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = String(++toastId)
    setToasts((prev) => [...prev, { ...msg, id }])
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
  const [progress, setProgress] = useState(100)
  const duration = 5000

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        onClose()
      }
    }, 50)
    return () => clearInterval(interval)
  }, [onClose])

  const icons = {
    success: <CheckCircle2 className="size-5 text-green-600 shrink-0" />,
    error: <XCircle className="size-5 text-red-600 shrink-0" />,
    warning: <AlertTriangle className="size-5 text-amber-600 shrink-0" />,
    info: <Info className="size-5 text-blue-600 shrink-0" />,
  }

  const borders = {
    success: 'border-green-200',
    error: 'border-red-200',
    warning: 'border-amber-200',
    info: 'border-blue-200',
  }

  const progressColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  }

  return (
    <div
      className={cn(
        'relative pointer-events-auto flex items-start gap-3 p-4 bg-white rounded-xl shadow-lg border overflow-hidden animate-in slide-in-from-right-2 fade-in-0 duration-200',
        borders[toast.type],
      )}
    >
      {icons[toast.type]}
      <p className="text-sm text-foreground flex-1 min-w-0">{toast.message}</p>
      <button
        onClick={onClose}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="size-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
        <div
          className={cn('h-full transition-all duration-100 ease-linear rounded-full', progressColors[toast.type])}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
