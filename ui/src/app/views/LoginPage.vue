<template>
  <div class="hero min-h-[calc(100vh-200px)] bg-base-200">
    <div class="hero-content flex-col lg:flex-row-reverse gap-8 w-full max-w-4xl">
      <!-- Right side: Info (desktop only) -->
      <div class="hidden lg:block text-center lg:text-left flex-1">
        <h1 class="text-4xl font-bold">iDempiere 預約系統</h1>
        <p class="py-6 opacity-70">
          使用 iDempiere REST API 進行身份驗證。支援多租戶、多角色、多組織的企業級權限管理。
        </p>
        <div class="flex flex-col gap-2 text-sm opacity-60">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span>支援多租戶企業架構</span>
          </div>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span>基於角色的存取控制</span>
          </div>
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            <span>JWT Token 安全認證</span>
          </div>
        </div>
      </div>

      <!-- Left side: Login card -->
      <div class="card bg-base-100 shadow-xl w-full max-w-md shrink-0">
        <div class="card-body">
          <!-- Header (mobile only shows logo) -->
          <div class="text-center mb-6 lg:mb-4">
            <div class="avatar placeholder mb-4 lg:mb-2">
              <div class="bg-primary text-primary-content w-16 lg:w-12 rounded-xl">
                <span class="text-2xl lg:text-lg font-bold">Rx</span>
              </div>
            </div>
            <h1 class="text-2xl font-bold lg:hidden">iDempiere 預約系統</h1>
            <p class="text-sm opacity-60 mt-2 lg:mt-0">使用 REST API 登入</p>
          </div>

          <!-- Steps -->
          <ul class="steps w-full mb-6">
            <li class="step" :class="{ 'step-primary': step >= 1 }">帳密</li>
            <li class="step" :class="{ 'step-primary': step >= 2 }">租戶/角色</li>
          </ul>

          <!-- Step 1: Credentials -->
          <form v-if="step === 1" class="space-y-4" @submit.prevent="onSubmitCredentials">
            <div class="form-control">
              <label class="label">
                <span class="label-text">帳號</span>
              </label>
              <input
                v-model="userName"
                type="text"
                placeholder="GardenAdmin"
                class="input input-bordered"
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
                class="input input-bordered"
                autocomplete="current-password"
              />
            </div>

            <button class="btn btn-neutral btn-lg w-full" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner"></span>
              {{ loading ? '登入中…' : '登入' }}
            </button>
          </form>

          <!-- Step 2: Client/Role/Org -->
          <form v-else class="space-y-4" @submit.prevent="onSubmitParameters">
            <div class="form-control">
              <label class="label">
                <span class="label-text">租戶</span>
              </label>
              <select v-model="clientId" class="select select-bordered">
                <option :value="null" disabled>請選擇租戶</option>
                <option v-for="c in clients" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">角色</span>
              </label>
              <select v-model="roleId" class="select select-bordered">
                <option :value="null" disabled>請選擇角色</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">組織</span>
              </label>
              <select v-model="organizationId" class="select select-bordered">
                <option :value="null" disabled>請選擇組織</option>
                <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
              </select>
            </div>

            <div class="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div class="collapse-title text-sm font-medium">進階選項（可選）</div>
              <div class="collapse-content space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">倉庫</span>
                  </label>
                  <select v-model="warehouseId" class="select select-bordered select-sm">
                    <option :value="null">不指定</option>
                    <option v-for="w in warehouses" :key="w.id" :value="w.id">{{ w.name }}</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label">
                    <span class="label-text">語系</span>
                  </label>
                  <input
                    v-model="language"
                    type="text"
                    placeholder="zh_TW / en_US"
                    class="input input-bordered input-sm"
                  />
                </div>
              </div>
            </div>

            <div class="flex flex-col-reverse sm:flex-row gap-3">
              <button class="btn btn-ghost" type="button" :disabled="loading" @click="resetToStep1">
                返回
              </button>
              <button
                class="btn btn-neutral btn-lg flex-1"
                :disabled="loading || !clientId || !roleId || !organizationId"
              >
                <span v-if="loading" class="loading loading-spinner"></span>
                {{ loading ? '設定中…' : '完成登入' }}
              </button>
            </div>
          </form>

          <div v-if="error" class="alert alert-error mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{{ error }}</span>
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

