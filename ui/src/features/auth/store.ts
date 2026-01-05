import { computed, ref } from 'vue'
import type { Session } from './types'

const STORAGE_KEY = 'idempiere.resource.session.v1'

const session = ref<Session | null>(null)

export function useAuth() {
  const isAuthenticated = computed(() => !!session.value?.token)
  const token = computed(() => session.value?.token ?? null)
  const userId = computed(() => session.value?.userId ?? null)
  const clientId = computed(() => session.value?.clientId ?? null)
  const organizationId = computed(() => session.value?.organizationId ?? null)
  const language = computed(() => session.value?.language ?? 'en_US')

  function load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      session.value = JSON.parse(raw) as Session
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      session.value = null
    }
  }

  function set(next: Session) {
    session.value = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function clear() {
    session.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    session,
    isAuthenticated,
    token,
    userId,
    clientId,
    organizationId,
    language,
    load,
    set,
    clear,
  }
}

