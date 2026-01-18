import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
}

const toasts = ref<Toast[]>([])
let idCounter = 0

const addToast = (type: ToastType, message: string) => {
  const id = `toast-${++idCounter}-${Date.now()}`
  toasts.value.push({ id, type, message })

  setTimeout(() => {
    remove(id)
  }, 3000)

  return id
}

const remove = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

export const useToast = () => {
  return {
    toasts,
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    info: (message: string) => addToast('info', message),
    warning: (message: string) => addToast('warning', message),
    remove
  }
}
