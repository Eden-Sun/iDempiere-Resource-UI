<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">登入</h1>
      <p class="mt-1 text-sm text-slate-600">使用 iDempiere REST API 取得 Token（不自行實作後端）。</p>

      <div class="mt-6">
        <div class="mb-4 flex items-center gap-2 text-xs">
          <div
            class="inline-flex h-6 items-center rounded-full px-3"
            :class="step === 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'"
          >
            1. 帳密
          </div>
          <div class="h-px flex-1 bg-slate-200"></div>
          <div
            class="inline-flex h-6 items-center rounded-full px-3"
            :class="step === 2 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'"
          >
            2. 租戶/角色
          </div>
        </div>

        <form v-if="step === 1" class="space-y-4" @submit.prevent="onSubmitCredentials">
          <div>
            <label class="text-sm font-medium text-slate-700">帳號</label>
            <input
              v-model="userName"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-200 focus:ring"
              placeholder="例如：GardenAdmin"
              autocomplete="username"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">密碼</label>
            <input
              v-model="password"
              type="password"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-200 focus:ring"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <button
            class="inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="loading"
          >
            {{ loading ? '登入中…' : '登入' }}
          </button>
        </form>

        <form v-else class="space-y-4" @submit.prevent="onSubmitParameters">
          <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            第一次登入會回傳可用的 Tenant/Role。請完成選擇後，系統會呼叫 <span class="font-mono">PUT /api/v1/auth/tokens</span>
            取得正式 token。
          </div>

          <div>
            <label class="text-sm font-medium text-slate-700">租戶</label>
            <select v-model="clientId" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option :value="null" disabled>請選擇</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }} (#{{ c.id }})</option>
            </select>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium text-slate-700">角色</label>
              <select v-model="roleId" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option :value="null" disabled>請選擇</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }} (#{{ r.id }})</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">組織</label>
              <select
                v-model="organizationId"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option :value="null" disabled>請選擇</option>
                <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }} (#{{ o.id }})</option>
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="text-sm font-medium text-slate-700">倉庫（可選）</label>
              <select v-model="warehouseId" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
                <option :value="null">不指定</option>
                <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} (#{{ w.id }})</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">語系</label>
              <input
                v-model="language"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="例如：zh_TW / en_US"
              />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="inline-flex flex-1 items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading || !clientId || !roleId || !organizationId"
            >
              {{ loading ? '設定中…' : '完成登入' }}
            </button>
            <button
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              type="button"
              :disabled="loading"
              @click="resetToStep1"
            >
              返回
            </button>
          </div>
        </form>

        <p v-if="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {{ error }}
        </p>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-gradient-to-br from-brand-50 to-white p-6">
      <h2 class="text-sm font-semibold text-slate-800">API 位置</h2>
      <div class="mt-3 space-y-2 text-sm text-slate-700">
        <div class="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
          <span class="font-mono">POST /api/v1/auth/tokens</span>
          <span class="text-xs text-slate-500">取得 token</span>
        </div>
        <div class="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
          <span class="font-mono">PUT /api/v1/auth/tokens</span>
          <span class="text-xs text-slate-500">設定 client/role/org</span>
        </div>
        <div class="rounded-lg bg-white p-3 shadow-sm">
          <div class="text-xs text-slate-500">注意</div>
          <div class="mt-1">
            前端 base 必須是 <span class="font-mono">/emui/</span>，否則 build 後資源路徑會 404。
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login, getRoles, getOrganizations, getWarehouses, getClientLanguage, setLoginParameters } from '../../features/auth/api'
import { useAuth } from '../../features/auth/store'
import type { ClientOption, NamedId } from '../../features/auth/types'

// Dev defaults (方便測試)
const userName = ref('GardenAdmin')
const password = ref('GardenAdmin')
const loading = ref(false)
const error = ref<string | null>(null)

const router = useRouter()
const auth = useAuth()

const step = ref<1 | 2>(1)

const pendingToken = ref<string | null>(null)
const clients = ref<ClientOption[]>([])

const clientId = ref<number | null>(null)
const roleId = ref<number | null>(null)
const organizationId = ref<number | null>(null)
const warehouseId = ref<number | null>(null)
const language = ref<string>('zh_TW')

const roles = ref<NamedId[]>([])
const organizations = ref<NamedId[]>([])
const warehouses = ref<NamedId[]>([])

function resetToStep1() {
  step.value = 1
  pendingToken.value = null
  clients.value = []
  clientId.value = null
  roleId.value = null
  organizationId.value = null
  warehouseId.value = null
  roles.value = []
  organizations.value = []
  warehouses.value = []
}

async function onSubmitCredentials() {
  error.value = null
  loading.value = true
  try {
    const res = await login({ userName: userName.value.trim(), password: password.value })
    if (!res.token) throw new Error('未取得 token')

    // If already has full session, store and go.
    // Note: This case is rare; usually requires client/role/org selection.
    if (res.userId) {
      auth.set({
        token: res.token,
        refreshToken: res.refresh_token,
        userId: res.userId,
        clientId: 0,  // Will be set from token context
        organizationId: 0,
        language: res.language,
      })
      await router.push('/book')
      return
    }

    // Otherwise, require selection of client/role/org.
    pendingToken.value = res.token
    clients.value = res.clients ?? []
    step.value = 2

    // Preselect first client if only one
    if (clients.value.length === 1) clientId.value = clients.value[0].id
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '登入失敗'
  } finally {
    loading.value = false
  }
}

watch(clientId, async (id) => {
  if (!id || !pendingToken.value) return
  error.value = null
  roles.value = []
  organizations.value = []
  warehouses.value = []
  roleId.value = null
  organizationId.value = null
  warehouseId.value = null
  try {
    const lang = await getClientLanguage(id, pendingToken.value)
    language.value = lang.language || language.value
    roles.value = await getRoles(id, pendingToken.value)
    if (roles.value.length === 1) roleId.value = roles.value[0].id
  } catch (e: any) {
    error.value = e?.detail || e?.title || '讀取角色失敗'
  }
})

watch(roleId, async (rid) => {
  if (!clientId.value || !rid || !pendingToken.value) return
  error.value = null
  organizations.value = []
  warehouses.value = []
  organizationId.value = null
  warehouseId.value = null
  try {
    organizations.value = await getOrganizations(clientId.value, rid, pendingToken.value)
    if (organizations.value.length === 1) organizationId.value = organizations.value[0].id
  } catch (e: any) {
    error.value = e?.detail || e?.title || '讀取組織失敗'
  }
})

watch(organizationId, async (oid) => {
  if (!clientId.value || !roleId.value || !oid || !pendingToken.value) return
  error.value = null
  warehouses.value = []
  warehouseId.value = null
  try {
    warehouses.value = await getWarehouses(clientId.value, roleId.value, oid, pendingToken.value)
  } catch (e: any) {
    // warehouse is optional; don't block
    warehouses.value = []
  }
})

async function onSubmitParameters() {
  if (!pendingToken.value || !clientId.value || !roleId.value || !organizationId.value) return
  error.value = null
  loading.value = true
  try {
    const res = await setLoginParameters(
      {
        clientId: clientId.value,
        roleId: roleId.value,
        organizationId: organizationId.value,
        warehouseId: warehouseId.value ?? undefined,
        language: language.value || undefined,
      },
      pendingToken.value,
    )
    if (!res.token || !res.userId) throw new Error('登入參數設定後未取得完整 token/userId')
    auth.set({
      token: res.token,
      refreshToken: res.refresh_token,
      userId: res.userId,
      clientId: clientId.value,
      organizationId: organizationId.value,
      roleId: roleId.value ?? undefined,
      warehouseId: warehouseId.value ?? undefined,
      language: res.language,
    })
    await router.push('/book')
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '登入參數設定失敗'
  } finally {
    loading.value = false
  }
}
</script>

