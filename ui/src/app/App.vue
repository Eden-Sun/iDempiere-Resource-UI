<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ToastContainer from '../components/ToastContainer.vue'
import { useAuth } from '../features/auth/store'
import { usePermission } from '../features/permission/store'
import { setTokenExpiredHandler } from '../shared/api/http'

const router = useRouter()
const route = useRoute()
const auth = useAuth()
const permission = usePermission()
const errorMessage = ref<string | null>(null)
const drawerOpen = ref(false)

const isLoginPage = computed(() => route.path === '/login')
const isAuthenticated = computed(() => auth.isAuthenticated.value)
const isSystem = computed(() => permission.isSystem.value)
const visibleMenuItems = computed(() => permission.visibleMenuItems.value)
const userDisplayName = computed(() => auth.userName.value || `User #${auth.userId.value}`)
const roleDisplay = computed(() => {
  if (isSystem.value)
    return '系統管理員'
  const role = auth.roleName.value || auth.roleId.value
  return role ? `角色：${role}` : null
})
const clientDisplay = computed(() => {
  const client = auth.clientName.value || auth.clientId.value
  return client ? `客戶：${client}` : null
})

function logout(): void {
  auth.clear()
  permission.resetPermissions()
  router.push('/login')
  drawerOpen.value = false
}

function handleTokenExpired(): void {
  auth.clear()
  permission.resetPermissions()
  errorMessage.value = '登入已過期，請重新登入'
  setTimeout(() => {
    errorMessage.value = null
  }, 3000)
  router.push('/login')
}

function closeDrawer(): void {
  drawerOpen.value = false
}

function isActiveRoute(path: string): boolean {
  return route.path === path
}

onMounted(() => {
  setTokenExpiredHandler(handleTokenExpired)
})
</script>

<template>
  <!-- Login page (no navigation) -->
  <div v-if="isLoginPage" class="min-h-screen">
    <main class="mx-auto max-w-screen-2xl px-4 py-6">
      <div v-if="errorMessage" class="alert alert-error mb-4 py-2 text-sm">
        <span>{{ errorMessage }}</span>
      </div>
      <RouterView />
    </main>
    <ToastContainer />
  </div>

  <!-- Main app with drawer navigation -->
  <div v-else class="drawer lg:drawer-open">
    <input id="main-drawer" v-model="drawerOpen" type="checkbox" class="drawer-toggle">

    <div class="drawer-content flex min-h-screen flex-col">
      <!-- Mobile header (hidden on desktop) -->
      <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
              <span class="text-sm font-semibold">Rx</span>
            </div>
            <div>
              <div class="text-sm font-semibold leading-tight">
                預約系統
              </div>
              <div class="text-xs text-slate-500">
                iDempiere Resource
              </div>
            </div>
          </div>
          <label v-if="isAuthenticated" for="main-drawer" class="btn btn-square btn-ghost drawer-button" aria-label="開啟選單">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block h-6 w-6 stroke-current">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <RouterLink v-else class="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700" to="/login">
            登入
          </RouterLink>
        </div>
      </header>

      <!-- Main content -->
      <main class="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6">
        <div v-if="errorMessage" class="alert alert-error mb-4 py-2 text-sm">
          <span>{{ errorMessage }}</span>
        </div>
        <RouterView />
      </main>

      <ToastContainer />
    </div>

    <!-- Sidebar (drawer on mobile, fixed on desktop) -->
    <div class="drawer-side z-20">
      <label for="main-drawer" aria-label="關閉選單" class="drawer-overlay" />
      <aside class="flex min-h-full w-72 flex-col bg-white border-r border-slate-200">
        <!-- Logo section -->
        <div class="border-b border-slate-200 p-4">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
              <span class="text-sm font-bold">Rx</span>
            </div>
            <div>
              <div class="text-sm font-semibold leading-tight text-slate-900">
                預約系統
              </div>
              <div class="text-xs text-slate-500">
                iDempiere Resource
              </div>
            </div>
          </div>
        </div>

        <!-- User info section -->
        <div v-if="isAuthenticated" class="border-b border-slate-200 bg-slate-50 p-4">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-brand-600 font-semibold">
              {{ userDisplayName.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-slate-900 truncate">
                {{ userDisplayName }}
              </div>
              <div v-if="roleDisplay" class="text-xs text-slate-500 truncate">
                {{ roleDisplay }}
              </div>
              <div v-if="clientDisplay" class="text-xs text-slate-500 truncate">
                {{ clientDisplay }}
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation menu -->
        <nav class="flex-1 overflow-y-auto p-3">
          <ul class="menu gap-1">
            <li v-for="item in visibleMenuItems" :key="item.id">
              <RouterLink
                class="rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
                :class="[
                  isActiveRoute(item.path)
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100',
                ]"
                :to="item.path"
                @click="closeDrawer"
              >
                <span>{{ item.name }}</span>
                <span v-if="item.id.startsWith('SYS_')" class="ml-auto text-xs opacity-75">(S)</span>
              </RouterLink>
            </li>
          </ul>
        </nav>

        <!-- Logout button -->
        <div v-if="isAuthenticated" class="border-t border-slate-200 p-3">
          <button
            class="btn btn-ghost btn-sm w-full justify-start gap-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            type="button"
            @click="logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3-3l3 3m0 0l-3 3m3-3H9" />
            </svg>
            登出
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>
