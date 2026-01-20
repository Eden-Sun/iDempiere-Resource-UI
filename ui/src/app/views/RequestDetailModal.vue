<script setup lang="ts">
import type { Request, RequestStatus, RequestType, SalesRep } from '../../features/request/api'
import { ref, watch } from 'vue'
import { useAuth } from '../../features/auth/store'
import {
  getRequest,
  listRequestStatuses,
  listRequestTypes,
  listSalesReps,
  updateRequest,
} from '../../features/request/api'
import { formatDateTimeLong } from '../../shared/utils/datetime'

const props = defineProps<{
  showModal: boolean
  requestId?: number
}>()

const emit = defineEmits<{
  'update:showModal': [value: boolean]
  'updated': []
  'deleted': []
  'close': []
}>()

const auth = useAuth()

const request = ref<Request | null>(null)
const requestTypes = ref<RequestType[]>([])
const requestStatuses = ref<RequestStatus[]>([])
const salesReps = ref<SalesRep[]>([])
const loading = ref(false)
const submitting = ref(false)

const form = ref({
  name: '',
  description: '',
  salesRepId: undefined as number | undefined,
  requestTypeId: undefined as number | undefined,
  requestStatusId: undefined as number | undefined,
  startDate: '',
  closeDate: '',
  priority: '' as string,
  dateNextAction: '',
  confidentialType: '' as string,
})

// iDempiere Priority reference list values
const priorityOptions = [
  { value: '3', label: '高 (High)' },
  { value: '5', label: '中 (Medium)' },
  { value: '7', label: '低 (Low)' },
]

// iDempiere ConfidentialType reference list values
const confidentialTypeOptions = [
  { value: 'A', label: '公開 (Public)' },
  { value: 'C', label: '僅限客戶 (Customer Only)' },
  { value: 'I', label: '內部 (Internal)' },
  { value: 'P', label: '私人 (Private)' },
]

async function loadLookups() {
  if (!auth.token.value)
    return

  try {
    const [types, statuses, reps] = await Promise.all([
      listRequestTypes(auth.token.value),
      listRequestStatuses(auth.token.value),
      listSalesReps(auth.token.value),
    ])
    requestTypes.value = types
    requestStatuses.value = statuses
    salesReps.value = reps
  }
  catch (e) {
    console.error('Failed to load lookups:', e)
  }
}

async function loadRequest() {
  if (!props.requestId || !auth.token.value)
    return

  loading.value = true
  try {
    request.value = await getRequest(auth.token.value, props.requestId)
    form.value = {
      name: request.value.name || '',
      description: request.value.description || '',
      salesRepId: request.value.salesRepId,
      requestTypeId: request.value.requestTypeId,
      requestStatusId: request.value.requestStatusId,
      startDate: request.value.startDate ? request.value.startDate.slice(0, 16) : '',
      closeDate: request.value.closeDate ? request.value.closeDate.slice(0, 16) : '',
      priority: request.value.priority || '',
      dateNextAction: request.value.dateNextAction ? request.value.dateNextAction.slice(0, 16) : '',
      confidentialType: request.value.confidentialType || '',
    }
  }
  catch (e) {
    console.error('Failed to load request:', e)
  }
  finally {
    loading.value = false
  }
}

async function submitUpdate() {
  if (!auth.token.value || !props.requestId)
    return

  submitting.value = true
  try {
    await updateRequest(auth.token.value, props.requestId, {
      name: form.value.name || undefined,
      description: form.value.description || undefined,
      salesRepId: form.value.salesRepId,
      requestTypeId: form.value.requestTypeId,
      requestStatusId: form.value.requestStatusId,
      startDate: form.value.startDate ? new Date(form.value.startDate) : undefined,
      closeDate: form.value.closeDate ? new Date(form.value.closeDate) : undefined,
      priority: form.value.priority || undefined,
      dateNextAction: form.value.dateNextAction ? new Date(form.value.dateNextAction) : undefined,
      confidentialType: form.value.confidentialType || undefined,
    })
    await loadRequest()
    emit('updated')
    closeModal()
  }
  catch (e) {
    console.error('Failed to update request:', e)
  }
  finally {
    submitting.value = false
  }
}

function closeModal() {
  emit('update:showModal', false)
  emit('close')
  // Reset form
  if (request.value) {
    form.value = {
      name: request.value.name || '',
      description: request.value.description || '',
      salesRepId: request.value.salesRepId,
      requestTypeId: request.value.requestTypeId,
      requestStatusId: request.value.requestStatusId,
      startDate: request.value.startDate ? request.value.startDate.slice(0, 16) : '',
      closeDate: request.value.closeDate ? request.value.closeDate.slice(0, 16) : '',
      priority: request.value.priority || '',
      dateNextAction: request.value.dateNextAction ? request.value.dateNextAction.slice(0, 16) : '',
      confidentialType: request.value.confidentialType || '',
    }
  }
}

watch(() => props.showModal, async (show) => {
  if (show) {
    await loadLookups()
    await loadRequest()
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">
            編輯諮詢單
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

        <div class="mt-4 space-y-4">
          <div>
            <label class="text-sm font-medium text-slate-700">客戶</label>
            <input
              :value="request?.bPartnerName"
              type="text"
              disabled
              class="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            >
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">諮詢單名稱</label>
            <input
              v-model="form.name"
              type="text"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="諮詢單名稱"
            >
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">說明</label>
            <textarea
              v-model="form.description"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              rows="3"
              placeholder="需求說明..."
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">諮詢師</label>
            <select
              v-model="form.salesRepId"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option :value="undefined">
                未指派
              </option>
              <option v-for="rep in salesReps" :key="rep.id" :value="rep.id">
                {{ rep.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">諮詢類型</label>
            <select
              v-model="form.requestTypeId"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option :value="undefined">
                未選擇
              </option>
              <option v-for="type in requestTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">狀態</label>
            <select
              v-model="form.requestStatusId"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option :value="undefined">
                未選擇
              </option>
              <option v-for="status in requestStatuses" :key="status.id" :value="status.id">
                {{ status.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">優先順序</label>
            <select
              v-model="form.priority"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">
                未選擇
              </option>
              <option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">下次行動日期</label>
            <input
              v-model="form.dateNextAction"
              type="datetime-local"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">保密類型</label>
            <select
              v-model="form.confidentialType"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">
                未選擇
              </option>
              <option v-for="opt in confidentialTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-slate-700">諮詢開始</label>
              <input
                v-model="form.startDate"
                type="datetime-local"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">諮詢結束</label>
              <input
                v-model="form.closeDate"
                type="datetime-local"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
          </div>
          <div class="text-xs text-slate-500">
            建立時間：{{ formatDateTimeLong(request?.created) }}
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="submitting"
            @click="submitUpdate"
          >
            {{ submitting ? '儲存中…' : '儲存' }}
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
</template>
