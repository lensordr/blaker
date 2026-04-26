import { useState, useCallback, useEffect } from 'react'
import { IconCheck, IconX } from './Icons'

let toastFn = null

export function useToast() {
  return useCallback((message, type = 'success') => {
    if (toastFn) toastFn(message, type)
  }, [])
}

export function ToastProvider() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    toastFn = (message, type) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    }
    return () => { toastFn = null }
  }, [])

  if (!toasts.length) return null

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? (
            <IconCheck size={16} />
          ) : (
            <IconX size={16} />
          )}
          {t.message}
        </div>
      ))}
    </div>
  )
}
