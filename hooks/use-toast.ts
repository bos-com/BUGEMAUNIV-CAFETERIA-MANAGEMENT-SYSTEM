// Simple toast implementation without external dependencies
import { useState } from 'react'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export interface ToastActionElement {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: 'default' | 'destructive'
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
      return
    }

    const timeout = setTimeout(() => {
      toastTimeouts.delete(toastId)
      setToasts((prev) => prev.filter((t) => t.id !== toastId))
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.set(toastId, timeout)
  }

  const toast = ({ ...props }: ToastProps) => {
    const id = genId()

    const newToast: Toast = {
      id,
      ...props,
    }

    setToasts((prev) => {
      const newToasts = [newToast, ...prev]
      return newToasts.length > TOAST_LIMIT ? newToasts.slice(0, TOAST_LIMIT) : newToasts
    })

    addToRemoveQueue(id)

    return {
      id: id,
      dismiss: () => setToasts((prev) => prev.filter((t) => t.id !== id)),
    }
  }

  return {
    toast,
    toasts,
    dismiss: (toastId?: string) => {
      if (toastId) {
        setToasts((prev) => prev.filter((t) => t.id !== toastId))
      } else {
        setToasts([])
      }
    },
  }
}
