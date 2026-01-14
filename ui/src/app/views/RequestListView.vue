<template>
  <div class="space-y-4">
    <!-- Filter -->
    <div class="flex flex-wrap gap-4">
      <div class="flex-1 min-w-[200px]">
        <label class="text-sm font-medium text-slate-700">搜尋</label>
        <input
          v-model="searchQuery"
          type="text"
          class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          placeholder="客戶名稱、諮詢單名稱..."
          @keyup.enter="loadData"
        />
      </div>
      <div class="min-w-[150px]">
        <label class="text-sm font-medium text-slate-700">Request Type</label>
        <select
          v-model="filter.requestTypeId"
          class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          @change="loadData"
        >
          <option :value="undefined">全部</option>
          <option v-for="type in requestTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>
      <div class="min-w-[150px]">
        <label class="text-sm font-medium text-slate-700">Status</label>
        <select
          v-model="filter.requestStatusId"
          class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          @change="loadData"
        >
          <option :value="undefined">全部</option>
          <option v-for="status in requestStatuses" :key="status.id" :value="status.id">
            {{ status.name }}
          </option>
        </select>
      </div>
      <div class="flex items-end">
        <button
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          @click="loadData"
        >
          {{ loading ? '載入中…' : '搜尋' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </div>

    <!-- Table -->
    <div class="overflow-x-auto border border-slate-200 rounded-lg">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">諮詢單</th>
            <th class="px-4 py-3">客戶</th>
            <th class="px-4 py-3">諮詢師</th>
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">開始日期</th>
            <th class="px-4 py-3">結束日期</th>
            <th class="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-if="loading">
            <td colspan="8" class="px-4 py-8 text-center text-slate-500">載入中...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
            <td colspan="8" class="px-4 py-8 text-center text-slate-500">無資料</td>
          </tr>
          <tr
            v-for="req in requests"
            :key="req.id"
            class="hover:bg-slate-50"
          >
            <td class="px-4 py-3 font-medium text-slate-900">{{ req.name || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ req.bPartnerName || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ req.salesRepName || '—' }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {{ req.requestTypeName || '—' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="getStatusColor(req.requestStatusName)"
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
              >
                {{ req.requestStatusName || '—' }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-600">{{ formatDate(req.startDate) }}</td>
            <td class="px-4 py-3 text-slate-600">{{ formatDate(req.closeDate) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-brand-600 hover:text-brand-700 font-medium"
                @click="openDetail(req)"
              >
                查看詳情
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-slate-600">
        共 {{ totalCount }} 筆
      </div>
      <div class="flex gap-2">
        <button
          :disabled="currentPage <= 1"
          class="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
          @click="prevPage"
        >
          上一頁
        </button>
        <span class="px-3 py-1 text-sm text-slate-600">第 {{ currentPage }} 頁</span>
        <button
          :disabled="!hasNextPage"
          class="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
          @click="nextPage"
        >
          下一頁
        </button>
      </div>
    </div>

    <!-- Request Detail Modal -->
    <RequestDetailModal
      v-model:show-modal="showDetailModal"
      :request-id="selectedRequestId"
      @updated="onRequestUpdated"
      @deleted="onRequestDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../../features/auth/store'
import {
  listRequests,
  listRequestTypes,
  listRequestStatuses,
  type Request,
  type RequestType,
  type RequestStatus,
} from '../../features/request/api'
import RequestDetailModal from './RequestDetailModal.vue'

const auth = useAuth()

const requests = ref<Request[]>([])
const requestTypes = ref<RequestType[]>([])
const requestStatuses = ref<RequestStatus[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const searchQuery = ref('')
const filter = ref({
  requestTypeId: undefined as number | undefined,
  requestStatusId: undefined as number | undefined,
})

const currentPage = ref(1)
const pageSize = 20
const totalCount = ref(0)

const hasNextPage = ref(false)
const showDetailModal = ref(false)
const selectedRequestId = ref<number | undefined>(undefined)

function getStatusColor(statusName?: string): string {
  const map: Record<string, string> = {
    '開啟': 'bg-emerald-100 text-emerald-700',
    '進行中': 'bg-blue-100 text-blue-700',
    '已關閉': 'bg-slate-100 text-slate-700',
    '待處理': 'bg-amber-100 text-amber-700',
  }
  return map[statusName || ''] || 'bg-slate-100 text-slate-700'
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function loadData() {
  if (!auth.token.value) return

  loading.value = true
  error.value = null

  try {
    const result = await listRequests(
      auth.token.value,
      {
        requestTypeId: filter.value.requestTypeId,
        requestStatusId: filter.value.requestStatusId,
      },
      { top: pageSize, skip: (currentPage.value - 1) * pageSize },
    )

    requests.value = result.records
    totalCount.value = result.totalCount || 0
    hasNextPage.value = currentPage.value * pageSize < totalCount.value
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

function nextPage() {
  if (hasNextPage.value) {
    currentPage.value++
    loadData()
  }
}

function openDetail(req: Request) {
  selectedRequestId.value = req.id
  showDetailModal.value = true
}

function onRequestUpdated() {
  loadData()
}

function onRequestDeleted() {
  currentPage.value = 1
  loadData()
}

onMounted(async () => {
  if (!auth.token.value) return

  try {
    requestTypes.value = await listRequestTypes(auth.token.value)
    requestStatuses.value = await listRequestStatuses(auth.token.value)
  } catch (e) {
    console.error('Failed to load request types/statuses:', e)
  }

  await loadData()
})
</script>
