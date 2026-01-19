<script setup lang="ts">
import type { SalesRep } from '../../features/request/api'
import { onMounted, ref } from 'vue'
import CustomerSearchSelect from '../../components/CustomerSearchSelect.vue'
import { useAuth } from '../../features/auth/store'
import {
  createRequestFromDynamicForm,
  listSalesReps,
} from '../../features/request/api'
import CustomerDetailView from './CustomerDetailView.vue'
import GanttChartView from './GanttChartView.vue'
import KanbanBoardView from './KanbanBoardView.vue'
import MyCustomersView from './MyCustomersView.vue'
import PendingCustomersView from './PendingCustomersView.vue'
import RequestListView from './RequestListView.vue'
import StatisticsView from './StatisticsView.vue'

type TabId = 'list' | 'pending' | 'my' | 'customer' | 'stats' | 'gantt' | 'kanban'

const tabs = [
  { id: 'list' as TabId, label: '所有諮詢單' },
  { id: 'pending' as TabId, label: '待接應' },
  { id: 'my' as TabId, label: '我的客戶' },
  { id: 'customer' as TabId, label: '客戶查詢' },
  { id: 'stats' as TabId, label: '統計' },
  { id: 'gantt' as TabId, label: '甘特圖' },
  { id: 'kanban' as TabId, label: '看板' },
]

const activeTab = ref<TabId>('list')

const auth = useAuth()
const showModal = ref(false)
const submitting = ref(false)
const error = ref<string | null>(null)

// Form state
const form = ref({
  customerId: undefined as number | undefined,
  salesRepId: undefined as number | undefined,
  name: '',
  description: '',
})

// Sales rep options
const salesReps = ref<SalesRep[]>([])

async function loadSalesReps() {
  if (!auth.token.value)
    return
  try {
    salesReps.value = await listSalesReps(auth.token.value)
  }
  catch (e) {
    console.error('Failed to load sales reps:', e)
  }
}

function openModal() {
  // Reset form with current user as default sales rep
  form.value = {
    customerId: undefined,
    salesRepId: auth.userId.value ?? undefined,
    name: '',
    description: '',
  }
  error.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  error.value = null
}

async function submitForm() {
  if (!auth.token.value || !auth.userId.value) {
    error.value = '無法取得使用者資訊，請重新登入'
    return
  }

  if (!form.value.customerId) {
    error.value = '請選擇客戶'
    return
  }

  if (!form.value.salesRepId) {
    error.value = '請選擇諮詢師'
    return
  }

  submitting.value = true
  error.value = null

  try {
    await createRequestFromDynamicForm(auth.token.value, {
      C_BPartner_ID: form.value.customerId,
      SalesRep_ID: form.value.salesRepId,
      Summary: form.value.name || undefined,
      Result: form.value.description || undefined,
    })
    closeModal()
    window.location.reload()
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '建立失敗'
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadSalesReps()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-lg font-semibold">
          諮詢單
        </h1>
        <p class="mt-1 text-sm text-slate-600">
          諮詢師接應客戶使用，一個客戶一個需求開一單。
        </p>
      </div>
      <button
        class="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        @click="openModal"
      >
        新增諮詢單
      </button>
    </div>

    <!-- Tabs -->
    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === tab.id
            ? 'border-b-2 border-brand-600 text-brand-600'
            : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 列表視圖 -->
      <div v-if="activeTab === 'list'" class="p-6">
        <RequestListView />
      </div>

      <!-- 待接應 -->
      <div v-if="activeTab === 'pending'" class="p-6">
        <PendingCustomersView />
      </div>

      <!-- 我的客戶 -->
      <div v-if="activeTab === 'my'" class="p-6">
        <MyCustomersView />
      </div>

      <!-- 客戶查詢 -->
      <div v-if="activeTab === 'customer'" class="p-6">
        <CustomerDetailView />
      </div>

      <!-- 統計 -->
      <div v-if="activeTab === 'stats'" class="p-6">
        <StatisticsView />
      </div>

      <!-- 甘特圖 -->
      <div v-if="activeTab === 'gantt'" class="p-6">
        <GanttChartView />
      </div>

      <!-- 看板 -->
      <div v-if="activeTab === 'kanban'" class="p-6">
        <KanbanBoardView />
      </div>
    </div>

    <!-- Create Request Modal -->
    <Teleport to="body">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="closeModal"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900">
              新增諮詢單
            </h3>
            <button
              class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              @click="closeModal"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Error Message -->
          <div
            v-if="error"
            class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {{ error }}
          </div>

          <div class="mt-4 space-y-4">
            <!-- Customer Search -->
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                客戶 <span class="text-rose-500">*</span>
              </label>
              <CustomerSearchSelect
                v-model="form.customerId"
                placeholder="搜尋客戶名稱..."
              />
            </div>

            <!-- Sales Rep Selector -->
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                諮詢師 <span class="text-rose-500">*</span>
              </label>
              <select
                v-model="form.salesRepId"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option :value="undefined" disabled>
                  選擇諮詢師
                </option>
                <option v-for="rep in salesReps" :key="rep.id" :value="rep.id">
                  {{ rep.name }}
                </option>
              </select>
              <p class="mt-1 text-xs text-slate-500">
                預設為當前登入帳號，可選擇其他諮詢師代開
              </p>
            </div>

            <!-- Request Name -->
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                諮詢單名稱
              </label>
              <input
                v-model="form.name"
                type="text"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="例：初次諮詢、療程規劃..."
              >
            </div>

            <!-- Description -->
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">
                說明
              </label>
              <textarea
                v-model="form.description"
                class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                rows="3"
                placeholder="客戶需求說明..."
              />
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="submitting"
              @click="submitForm"
            >
              {{ submitting ? '建立中...' : '建立' }}
            </button>
            <button
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="closeModal"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
