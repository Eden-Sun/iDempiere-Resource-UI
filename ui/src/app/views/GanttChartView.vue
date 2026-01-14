<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-900">諮詢甘特圖</h2>
      <div class="flex items-center gap-2">
        <select
          v-model="groupBy"
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          @change="loadData"
        >
          <option value="customer">依客戶</option>
          <option value="salesRep">依諮詢師</option>
        </select>
        <button
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          :disabled="loading"
          @click="loadData"
        >
          {{ loading ? '載入中…' : '重新整理' }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </div>

    <!-- Gantt Chart -->
    <div v-if="!loading && groupedRequests.size > 0" class="overflow-x-auto">
      <div class="min-w-[800px]">
        <!-- Timeline Header -->
        <div class="flex border-b border-slate-200 bg-slate-50">
          <div class="w-48 flex-shrink-0 px-4 py-2 text-xs font-medium text-slate-500">
            {{ groupBy === 'customer' ? '客戶' : '諮詢師' }}
          </div>
          <div class="flex-1 flex">
            <div
              v-for="day in timelineDays"
              :key="day.key"
              class="flex-1 border-l border-slate-200 px-2 py-2 text-center text-xs text-slate-600"
            >
              <div>{{ day.day }}</div>
              <div class="text-slate-400">{{ day.date }}</div>
            </div>
          </div>
        </div>

        <!-- Request Rows -->
        <div
          v-for="([groupKey, requests], idx) in Array.from(groupedRequests.entries())"
          :key="idx"
          class="flex border-b border-slate-100"
        >
          <div class="w-48 flex-shrink-0 px-4 py-3 text-sm text-slate-900">
            {{ getGroupName(groupKey) }}
          </div>
          <div class="flex-1 relative h-12">
            <!-- Request Bars -->
            <div
              v-for="req in requests"
              :key="req.id"
              class="absolute top-2 h-8 rounded border cursor-pointer hover:opacity-80 transition-opacity"
              :style="getRequestStyle(req)"
              :title="`${req.name || '—'}\n${formatDate(req.startDate)} - ${formatDate(req.closeDate)}`"
            >
              <div class="h-full px-2 py-1 text-xs font-medium text-white truncate">
                {{ req.name || '—' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && groupedRequests.size === 0" class="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
      <p class="text-sm text-slate-600">尚無諮詢記錄</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
      <p class="text-sm text-slate-600">載入中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../features/auth/store'
import {
  listRequests,
  listRequestTypes,
  listRequestStatuses,
  type Request,
  type RequestType,
  type RequestStatus,
} from '../../features/request/api'

const auth = useAuth()

const requests = ref<Request[]>([])
const requestTypes = ref<RequestType[]>([])
const requestStatuses = ref<RequestStatus[]>([])
const groupBy = ref<'customer' | 'salesRep'>('customer')
const loading = ref(false)
const error = ref<string | null>(null)

const groupNames = ref<Map<number, string>>(new Map())

const timelineDays = computed(() => {
  const days: Array<{ key: string; day: string; date: string }> = []
  const today = new Date()

  for (let i = -14; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dayNames = ['日', '一', '二', '三', '四', '五', '六']
    days.push({
      key: `d${i}`,
      day: `週${dayNames[d.getDay()]}`,
      date: `${d.getMonth() + 1}/${d.getDate()}`,
    })
  }

  return days
})

const groupedRequests = computed(() => {
  const groups = new Map<number, Request[]>()

  for (const req of requests.value) {
    if (!req.startDate) continue

    const key = groupBy.value === 'customer' ? req.bPartnerId : (req.salesRepId || 0)

    if (!groups.has(key)) {
      groups.set(key, [])
    }

    groups.get(key)!.push(req)
  }

  return groups
})

function getGroupName(groupId: number): string {
  if (groupId === 0) return '未指派'
  return groupNames.value.get(groupId) || `#${groupId}`
}

function getRequestStyle(req: Request): Record<string, string> {
  if (!req.startDate || !req.closeDate) {
    return {
      left: '0%',
      width: '0%',
      backgroundColor: '#94a3b8',
      borderColor: '#64748b',
    }
  }

  const start = new Date(req.startDate)
  const end = new Date(req.closeDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() - 14)

  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 14)

  const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
  const startDays = Math.max(0, (startDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
  const endDays = Math.min(totalDays, (endDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

  const left = (startDays / totalDays) * 100
  const width = Math.max(20, (endDays - startDays) / totalDays * 100)

  const statusColors: Record<string, string> = {
    '開啟': '#10b981',
    '進行中': '#3b82f6',
    '已關閉': '#6b7280',
    '待處理': '#f59e0b',
  }

  const color = statusColors[req.requestStatusName || ''] || '#3b82f6'

  return {
    left: `${left}%`,
    width: `${width}%`,
    backgroundColor: `${color}90`,
    borderColor: color,
  }
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
    const result = await listRequests(auth.token.value, { hasStartDate: true })
    requests.value = result.records.filter(r => r.startDate && r.closeDate)

    // Load group names
    const ids = Array.from(
      new Set([
        ...requests.value.map(r => r.bPartnerId),
        ...requests.value.map(r => r.salesRepId || 0),
      ])
    ).filter(id => id > 0)

    if (ids.length > 0) {
      const filter = ids.map(id => `AD_User_ID eq ${id}`).join(' or ')
      const res = await fetch(`/api/v1/models/AD_User?$select=AD_User_ID,Name&$filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${auth.token.value}`,
        },
      })

      if (res.ok) {
        const data = await res.json()
        groupNames.value = new Map(
          (data.records || []).map((r: any) => [Number(r.id), String(r.Name || '')])
        )
      }

      const bpFilter = ids.map(id => `C_BPartner_ID eq ${id}`).join(' or ')
      const bpRes = await fetch(`/api/v1/models/C_BPartner?$select=C_BPartner_ID,Name&$filter=${bpFilter}`, {
        headers: {
          'Authorization': `Bearer ${auth.token.value}`,
        },
      })

      if (bpRes.ok) {
        const bpData = await bpRes.json()
        for (const r of bpData.records || []) {
          groupNames.value.set(Number(r.id), String(r.Name || ''))
        }
      }
    }
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
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
