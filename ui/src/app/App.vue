<template>
  <div class="min-h-screen">
    <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
            <span class="text-sm font-semibold">Rx</span>
          </div>
          <div>
            <div class="text-sm font-semibold leading-tight">預約系統</div>
            <div class="text-xs text-slate-500">iDempiere Resource</div>
          </div>
        </div>
        <nav class="flex items-center gap-2 text-sm">
          <RouterLink
            class="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            to="/book"
          >
            預約
          </RouterLink>
          <RouterLink
            class="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            to="/bpartner"
          >
            業務夥伴
          </RouterLink>
          <RouterLink
            class="rounded-md px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            to="/admin/calendar"
          >
            管理行事曆
          </RouterLink>

          <!-- User info (when authenticated) -->
          <div v-if="isAuthenticated" class="ml-2 flex items-center gap-3 border-l border-slate-200 pl-3">
            <div class="text-right">
              <div class="text-sm font-medium text-slate-900">{{ userDisplayName }}</div>
              <div class="text-xs text-slate-500">{{ userRole }}</div>
            </div>
            <button
              class="rounded-md border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
              type="button"
              @click="logout"
            >
              登出
            </button>
          </div>
          <RouterLink v-else class="rounded-md bg-brand-600 px-3 py-2 font-medium text-white hover:bg-brand-700" to="/login">
            登入
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../features/auth/store'
import { setTokenExpiredHandler } from '../shared/api/http'

const router = useRouter()
const auth = useAuth()

const isAuthenticated = computed(() => auth.isAuthenticated.value)
const userDisplayName = computed(() => auth.userName.value || `User #${auth.userId.value}`)
const userRole = computed(() => {
  const parts: string[] = []
  if (auth.roleId.value) parts.push(`Role: ${auth.roleId.value}`)
  if (auth.clientId.value) parts.push(`Client: ${auth.clientId.value}`)
  return parts.length > 0 ? parts.join(' • ') : 'User'
})

function logout(): void {
  auth.clear()
  router.push('/login')
}

function handleTokenExpired(): void {
  auth.clear()
  alert('登入已過期，請重新登入')
  router.push('/login')
}

onMounted(() => {
  setTokenExpiredHandler(handleTokenExpired)
})
</script>

