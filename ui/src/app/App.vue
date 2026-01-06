<template>
  <div class="drawer">
    <input id="main-drawer" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content min-h-screen flex flex-col">
      <!-- Navbar -->
      <div class="navbar bg-base-100 border-b sticky top-0 z-10">
        <div class="navbar-start">
          <!-- Mobile hamburger menu -->
          <label for="main-drawer" class="btn btn-ghost btn-circle md:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </label>

          <!-- Logo -->
          <div class="flex items-center gap-3 ml-2 md:ml-0">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content w-10 rounded-lg">
                <span class="text-sm font-semibold">Rx</span>
              </div>
            </div>
            <div class="hidden sm:block">
              <div class="text-sm font-semibold">預約系統</div>
              <div class="text-xs opacity-60">iDempiere Resource</div>
            </div>
          </div>
        </div>

        <!-- Desktop/Tablet menu -->
        <div class="navbar-center hidden md:flex">
          <ul class="menu menu-horizontal px-1">
            <li><RouterLink to="/book">預約</RouterLink></li>
            <li><RouterLink to="/bpartner">業務夥伴</RouterLink></li>
            <li><RouterLink to="/admin/calendar">管理行事曆</RouterLink></li>
          </ul>
        </div>

        <div class="navbar-end">
          <div v-if="isAuthenticated" class="flex items-center gap-2">
            <div class="text-right hidden sm:block">
              <div class="text-sm font-medium">{{ userDisplayName }}</div>
              <div class="text-xs opacity-60">{{ userRole }}</div>
            </div>
            <button class="btn btn-outline btn-sm" type="button" @click="logout">
              登出
            </button>
          </div>
          <RouterLink v-else class="btn btn-primary btn-sm" to="/login">
            登入
          </RouterLink>
        </div>
      </div>

      <!-- Main content -->
      <main class="mx-auto max-w-6xl px-4 py-6 flex-1">
        <RouterView />
      </main>
    </div>

    <!-- Drawer sidebar (mobile) -->
    <div class="drawer-side z-20">
      <label for="main-drawer" class="drawer-overlay"></label>
      <div class="menu p-4 w-80 min-h-full bg-base-100">
        <!-- Logo in drawer -->
        <div class="flex items-center gap-3 mb-6 px-4">
          <div class="avatar placeholder">
            <div class="bg-primary text-primary-content w-10 rounded-lg">
              <span class="text-sm font-semibold">Rx</span>
            </div>
          </div>
          <div>
            <div class="text-sm font-semibold">預約系統</div>
            <div class="text-xs opacity-60">iDempiere Resource</div>
          </div>
        </div>

        <!-- User info in drawer (if authenticated) -->
        <div v-if="isAuthenticated" class="bg-base-200 rounded-lg p-4 mb-4">
          <div class="text-sm font-medium">{{ userDisplayName }}</div>
          <div class="text-xs opacity-60">{{ userRole }}</div>
        </div>

        <!-- Menu items -->
        <ul>
          <li><RouterLink to="/book" @click="closeDrawer">預約</RouterLink></li>
          <li><RouterLink to="/bpartner" @click="closeDrawer">業務夥伴</RouterLink></li>
          <li><RouterLink to="/admin/calendar" @click="closeDrawer">管理行事曆</RouterLink></li>
        </ul>
      </div>
    </div>
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

function closeDrawer(): void {
  const drawer = document.getElementById('main-drawer') as HTMLInputElement
  if (drawer) drawer.checked = false
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

