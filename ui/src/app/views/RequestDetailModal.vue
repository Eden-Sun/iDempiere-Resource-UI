<template>
  <Teleport to="body">
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="closeModal"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">{{ isEditing ? '編輯諮詢單' : '諮詢單詳情' }}</h3>
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
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">諮詢單名稱</label>
            <input
              v-model="form.name"
              type="text"
              :disabled="!isEditing"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-600"
              placeholder="諮詢單名稱"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">說明</label>
            <textarea
              v-model="form.description"
              :disabled="!isEditing"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-600"
              rows="3"
              placeholder="需求說明..."
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">諮詢師</label>
            <input
              :value="request?.salesRepName"
              type="text"
              disabled
              class="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600"
            />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700">Request Type</label>
            <select
              v-model="form.requestTypeId"
              :disabled="!isEditing"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-600"
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
              :disabled="!isEditing"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-600"
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
                :disabled="!isEditing"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-slate-700">結束日期</label>
              <input
                v-model="form.closeDate"
                type="datetime-local"
                :disabled="!isEditing"
                class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>
          </div>
          <div class="text-xs text-slate-500">
            建立時間：{{ formatDateTime(request?.created) }}
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <template v-if="isEditing">
            <button
              class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="submitting"
              @click="submitUpdate"
            >
              {{ submitting ? '儲存中…' : '儲存' }}
            </button>
            <button
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="cancelEdit"
            >
              取消
            </button>
          </template>
          <template v-else>
            <button
              class="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
              @click="startEdit"
            >
              編輯
            </button>
            <button
              class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"
              @click="confirmDelete"
            >
              刪除
            </button>
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40"
        @click.self="cancelDelete"
      >
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 class="text-lg font-semibold text-slate-900">確認刪除</h3>
          <p class="mt-2 text-sm text-slate-600">
            確定要刪除此諮詢單嗎？此操作無法復原。
          </p>
          <div class="mt-6 flex gap-3">
            <button
              class="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              :disabled="deleting"
              @click="deleteRequest"
            >
              {{ deleting ? '刪除中…' : '確認刪除' }}
            </button>
            <button
              class="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="cancelDelete"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuth } from '../../features/auth/store'
import {
  getRequest,
  updateRequest,
  deleteRequest as deleteRequestAPI,
  listRequestTypes,
  listRequestStatuses,
  type Request,
  type RequestType,
  type RequestStatus,
} from '../../features/request/api'

const props = defineProps<{
  showModal: boolean
  requestId?: number
}>()

const emit = defineEmits<{
  'update:showModal': [value: boolean]
  updated: []
  deleted: []
}>()

const auth = useAuth()

const request = ref<Request | null>(null)
const requestTypes = ref<RequestType[]>([])
const requestStatuses = ref<RequestStatus[]>([])
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)

const isEditing = ref(false)

const form = ref({
  name: '',
  description: '',
  requestTypeId: undefined as number | undefined,
  requestStatusId: undefined as number | undefined,
  startDate: '',
  closeDate: '',
})

const showDeleteConfirm = ref(false)

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadRequest() {
  if (!props.requestId || !auth.token.value) return

  loading.value = true
  try {
    request.value = await getRequest(auth.token.value, props.requestId)
    form.value = {
      name: request.value.name || '',
      description: request.value.description || '',
      requestTypeId: request.value.requestTypeId,
      requestStatusId: request.value.requestStatusId,
      startDate: request.value.startDate ? request.value.startDate.slice(0, 16) : '',
      closeDate: request.value.closeDate ? request.value.closeDate.slice(0, 16) : '',
    }
  } catch (e) {
    console.error('Failed to load request:', e)
  } finally {
    loading.value = false
  }
}

function startEdit() {
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  if (request.value) {
    form.value = {
      name: request.value.name || '',
      description: request.value.description || '',
      requestTypeId: request.value.requestTypeId,
      requestStatusId: request.value.requestStatusId,
      startDate: request.value.startDate ? request.value.startDate.slice(0, 16) : '',
      closeDate: request.value.closeDate ? request.value.closeDate.slice(0, 16) : '',
    }
  }
}

async function submitUpdate() {
  if (!auth.token.value || !props.requestId) return

  submitting.value = true
  try {
    await updateRequest(auth.token.value, props.requestId, {
      name: form.value.name || undefined,
      description: form.value.description || undefined,
      requestTypeId: form.value.requestTypeId,
      requestStatusId: form.value.requestStatusId,
      startDate: form.value.startDate ? new Date(form.value.startDate) : undefined,
      closeDate: form.value.closeDate ? new Date(form.value.closeDate) : undefined,
    })
    isEditing.value = false
    await loadRequest()
    emit('updated')
  } catch (e) {
    console.error('Failed to update request:', e)
  } finally {
    submitting.value = false
  }
}

function confirmDelete() {
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
}

async function deleteRequest() {
  if (!auth.token.value || !props.requestId) return

  deleting.value = true
  try {
    await deleteRequestAPI(auth.token.value, props.requestId)
    showDeleteConfirm.value = false
    closeModal()
    emit('deleted')
  } catch (e) {
    console.error('Failed to delete request:', e)
  } finally {
    deleting.value = false
  }
}

function closeModal() {
  emit('update:showModal', false)
  isEditing.value = false
  showDeleteConfirm.value = false
}

watch(() => props.showModal, async (show) => {
  if (show) {
    if (requestTypes.value.length === 0) {
      try {
        requestTypes.value = await listRequestTypes(auth.token.value)
        requestStatuses.value = await listRequestStatuses(auth.token.value)
      } catch (e) {
        console.error('Failed to load request types/statuses:', e)
      }
    }
    await loadRequest()
  }
})
</script>
