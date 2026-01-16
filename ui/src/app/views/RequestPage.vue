<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 class="text-lg font-semibold">諮詢單</h1>
        <p class="mt-1 text-sm text-slate-600">諮詢師接應客戶使用，一個客戶一個需求開一單。</p>
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
            <h3 class="text-lg font-semibold text-slate-900">新增諮詢單</h3>
            <button
              class="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              @click="closeModal"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mt-4 space-y-4">
            <div>
              <label class="text-sm font-medium text-slate-700">客戶</label>
              <select
                v-model="form.bPartnerId"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option :value="undefined">請選擇客戶</option>
                <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                  {{ customer.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">諮詢單名稱</label>
              <input
                v-model="form.name"
                type="text"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                placeholder="例如：諮詢需求"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">說明</label>
              <textarea
                v-model="form.description"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                rows="3"
                placeholder="選填：需求說明..."
              />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">Request Type</label>
              <select
                v-model="form.requestTypeId"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option :value="undefined">未選擇</option>
                <option v-for="type in requestTypes" :key="type.id" :value="type.id">
                  {{ type.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">Status</label>
              <select
                v-model="form.requestStatusId"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                <option :value="undefined">未選擇</option>
                <option v-for="status in requestStatuses" :key="status.id" :value="status.id">
                  {{ status.name }}
                </option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-700">開始日期</label>
                <input
                  v-model="form.startDate"
                  type="datetime-local"
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-slate-700">結束日期</label>
                <input
                  v-model="form.closeDate"
                  type="datetime-local"
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 flex gap-3">
            <button
              class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="submitting || !form.name.trim() || !form.bPartnerId"
              @click="submitRequest"
            >
              {{ submitting ? '建立中…' : '建立' }}
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

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../../features/auth/store'
import { listBPartners, type BPartner } from '../../features/bpartner/api'
import {
  listRequestTypes,
  listRequestStatuses,
  createRequest,
  type RequestType,
  type RequestStatus,
} from '../../features/request/api'
import RequestListView from './RequestListView.vue'
import PendingCustomersView from './PendingCustomersView.vue'
import MyCustomersView from './MyCustomersView.vue'
import CustomerDetailView from './CustomerDetailView.vue'
import StatisticsView from './StatisticsView.vue'
import GanttChartView from './GanttChartView.vue'
import KanbanBoardView from './KanbanBoardView.vue'

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
const customers = ref<BPartner[]>([])
const requestTypes = ref<RequestType[]>([])
const requestStatuses = ref<RequestStatus[]>([])
const submitting = ref(false)

const form = ref({
  bPartnerId: undefined as number | undefined,
  name: '',
  description: '',
  requestTypeId: undefined as number | undefined,
  requestStatusId: undefined as number | undefined,
  startDate: '' as string,
  closeDate: '' as string,
})

function openModal() {
  form.value = {
    bPartnerId: undefined,
    name: '',
    description: '',
    requestTypeId: undefined,
    requestStatusId: undefined,
    startDate: '',
    closeDate: '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  form.value = {
    bPartnerId: undefined,
    name: '',
    description: '',
    requestTypeId: undefined,
    requestStatusId: undefined,
    startDate: '',
    closeDate: '',
  }
}

async function submitRequest() {
  if (!auth.token.value || !form.value.bPartnerId || !form.value.name.trim()) return
  if (!auth.userId.value) {
    alert('無法取得使用者資訊，請重新登入')
    return
  }

  submitting.value = true

  try {
    await createRequest(auth.token.value, {
      bPartnerId: form.value.bPartnerId,
      salesRepId: auth.userId.value,
      name: form.value.name.trim(),
      description: form.value.description || undefined,
      requestTypeId: form.value.requestTypeId,
      requestStatusId: form.value.requestStatusId,
      startDate: form.value.startDate ? new Date(form.value.startDate) : undefined,
      closeDate: form.value.closeDate ? new Date(form.value.closeDate) : undefined,
    })

    closeModal()
    window.location.reload()
  } catch (e: any) {
    alert('建立失敗：' + (e?.detail || e?.title || e?.message || '未知錯誤'))
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (!auth.token.value) return

  try {
    const allCustomers = await listBPartners(auth.token.value)
    customers.value = allCustomers.filter((c) => c.isCustomer)
  } catch (e) {
    console.error('Failed to load customers:', e)
  }

  try {
    requestTypes.value = await listRequestTypes(auth.token.value)
    requestStatuses.value = await listRequestStatuses(auth.token.value)
  } catch (e) {
    console.error('Failed to load request types/statuses:', e)
  }
})
</script>
