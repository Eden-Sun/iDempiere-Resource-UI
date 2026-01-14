<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-900">我的客戶</h2>
      <button
        class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        :disabled="loading"
        @click="loadData"
      >
        {{ loading ? '載入中…' : '重新整理' }}
      </button>
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
            <th class="px-4 py-3">Type</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">開始日期</th>
            <th class="px-4 py-3">結束日期</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-if="loading">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500">載入中...</td>
          </tr>
          <tr v-else-if="requests.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-slate-500">尚未接應任何客戶</td>
          </tr>
          <tr
            v-for="req in requests"
            :key="req.id"
            class="hover:bg-slate-50 cursor-pointer"
          >
            <td class="px-4 py-3 font-medium text-slate-900">{{ req.name || '—' }}</td>
            <td class="px-4 py-3 text-slate-600">{{ req.bPartnerName || '—' }}</td>
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
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../../features/auth/store'
import {
  getMyCustomersRequests,
  type Request,
} from '../../features/request/api'

const auth = useAuth()

const requests = ref<Request[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

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
  if (!auth.token.value || !auth.userId.value) return

  loading.value = true
  error.value = null

  try {
    requests.value = await getMyCustomersRequests(auth.token.value, auth.userId.value)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>
