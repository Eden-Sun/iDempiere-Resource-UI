<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h1 class="card-title">登入</h1>
        <p class="text-sm opacity-60">使用 iDempiere REST API 取得 Token（不自行實作後端）。</p>

        <div class="mt-4">
          <ul class="steps steps-horizontal mb-6 w-full">
            <li class="step" :class="{ 'step-primary': step >= 1 }">帳密</li>
            <li class="step" :class="{ 'step-primary': step >= 2 }">租戶/角色</li>
          </ul>

          <form v-if="step === 1" class="space-y-4" @submit.prevent="onSubmitCredentials">
            <div class="form-control">
              <label class="label">
                <span class="label-text">帳號</span>
              </label>
              <input
                v-model="userName"
                type="text"
                placeholder="例如：GardenAdmin"
                class="input input-bordered input-sm"
                autocomplete="username"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">密碼</span>
              </label>
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="input input-bordered input-sm"
                autocomplete="current-password"
              />
            </div>

            <button class="btn btn-primary btn-sm w-full" :disabled="loading">
              {{ loading ? '登入中…' : '登入' }}
            </button>
          </form>

          <form v-else class="space-y-4" @submit.prevent="onSubmitParameters">
            <div class="alert alert-info py-2 text-xs">
              第一次登入會回傳可用的 Tenant/Role。請完成選擇後，系統會呼叫 <code>PUT /api/v1/auth/tokens</code>
              取得正式 token。
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">租戶</span>
              </label>
              <select v-model="clientId" class="select select-bordered select-sm">
                <option :value="null" disabled>請選擇</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }} (#{{ c.id }})</option>
              </select>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">角色</span>
                </label>
                <select v-model="roleId" class="select select-bordered select-sm">
                  <option :value="null" disabled>請選擇</option>
                  <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }} (#{{ r.id }})</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">組織</span>
                </label>
                <select v-model="organizationId" class="select select-bordered select-sm">
                  <option :value="null" disabled>請選擇</option>
                  <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }} (#{{ o.id }})</option>
                </select>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">倉庫（可選）</span>
                </label>
                <select v-model="warehouseId" class="select select-bordered select-sm">
                  <option :value="null">不指定</option>
                  <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }} (#{{ w.id }})</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label">
                  <span class="label-text">語系</span>
                </label>
                <input
                  v-model="language"
                  type="text"
                  placeholder="例如：zh_TW / en_US"
                  class="input input-bordered input-sm"
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                class="btn btn-primary btn-sm flex-1"
                :disabled="loading || !clientId || !roleId || !organizationId"
              >
                {{ loading ? '設定中…' : '完成登入' }}
              </button>
              <button class="btn btn-ghost btn-sm" type="button" :disabled="loading" @click="resetToStep1">
                返回
              </button>
            </div>
          </form>

          <div v-if="error" class="alert alert-error mt-4 py-2 text-sm">
            {{ error }}
          </div>
        </div>
      </div>
    </div>

    <div class="card bg-gradient-to-br from-primary/10 to-base-100">
      <div class="card-body">
        <h2 class="card-title text-sm">API 位置</h2>
        <div class="space-y-2 text-sm">
          <div class="flex items-center justify-between rounded-lg bg-base-100 p-3 shadow-sm">
            <code class="text-xs">POST /api/v1/auth/tokens</code>
            <span class="badge badge-ghost badge-sm">取得 token</span>
          </div>
          <div class="flex items-center justify-between rounded-lg bg-base-100 p-3 shadow-sm">
            <code class="text-xs">PUT /api/v1/auth/tokens</code>
            <span class="badge badge-ghost badge-sm">設定 client/role/org</span>
          </div>
          <div class="rounded-lg bg-base-100 p-3 shadow-sm">
            <div class="badge badge-warning badge-sm mb-1">注意</div>
            <div class="text-xs">
              前端 base 必須是 <code>/emui/</code>，否則 build 後資源路徑會 404。
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login, getRoles, getOrganizations, getWarehouses, getClientLanguage, setLoginParameters } from '../../features/auth/api'
import { useAuth } from '../../features/auth/store'
import type { ClientOption, NamedId } from '../../features/auth/types'

// Dev defaults from env (方便測試)
const userName = ref(import.meta.env.VITE_DEFAULT_USER || '')
const password = ref(import.meta.env.VITE_DEFAULT_PASS || '')
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

