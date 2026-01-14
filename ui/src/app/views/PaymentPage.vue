<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold">{{ title }}</h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ mode === 'list' ? '查看和管理收款記錄' : (editingId ? '查看收款' : '建立收款') }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="mode === 'form'"
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="backToList"
          >
            返回列表
          </button>
          <button
            v-if="mode === 'list'"
            type="button"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            @click="startCreate"
          >
            新增收款
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-line"
    >
      {{ error }}
    </div>

    <div
      v-if="successMessage"
      class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      {{ successMessage }}
    </div>

    <div v-if="mode === 'list'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 p-4">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋單號或客戶..."
            class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            @keyup.enter="loadList"
          />
          <button
            type="button"
            class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            @click="loadList"
          >
            搜尋
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">單號</th>
              <th class="px-4 py-3">客戶</th>
              <th class="px-4 py-3">日期</th>
              <th class="px-4 py-3">金額</th>
              <th class="px-4 py-3">付款方式</th>
              <th class="px-4 py-3">狀態</th>
              <th class="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="listLoading">
              <td colspan="7" class="px-4 py-8 text-center text-slate-500">載入中...</td>
            </tr>
            <tr v-else-if="listRecords.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-slate-500">無資料</td>
            </tr>
            <tr
              v-for="record in listRecords"
              :key="record.id"
              class="hover:bg-slate-50 cursor-pointer"
              @click="startEdit(record)"
            >
              <td class="px-4 py-3 font-medium text-slate-900">{{ record.documentNo }}</td>
              <td class="px-4 py-3 text-slate-600">{{ record.bpartnerName }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatDate(record.dateTrx) }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatMoney(record.payAmt) }}</td>
              <td class="px-4 py-3 text-slate-600">{{ getTenderTypeName(record.tenderType) }}</td>
              <td class="px-4 py-3">
                <span
                  :class="getStatusClass(record.docStatus)"
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {{ getStatusText(record.docStatus) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="text-brand-600 hover:text-brand-700 font-medium"
                  @click.stop="startEdit(record)"
                >
                  查看詳情
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <div class="text-sm text-slate-600">
          共 {{ totalCount }} 筆
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="currentPage <= 1"
            class="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
            @click="prevPage"
          >
            上一頁
          </button>
          <span class="px-3 py-1 text-sm text-slate-600">第 {{ currentPage }} 頁</span>
          <button
            type="button"
            :disabled="!hasNextPage"
            class="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
            @click="nextPage"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>

    <div v-if="mode === 'form'" class="space-y-6">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold mb-4">收款資訊</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">客戶 <span class="text-rose-500">*</span></label>
            <select
              v-model="formData.bpartnerId"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              :disabled="!!editingId"
            >
              <option value="">請選擇...</option>
              <option v-for="bp in customers" :key="bp.id" :value="bp.id">{{ bp.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">收款日期 <span class="text-rose-500">*</span></label>
            <input
              v-model="formData.dateTrx"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              :disabled="!!editingId"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">收款金額 <span class="text-rose-500">*</span></label>
            <input
              v-model.number="formData.payAmt"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              :disabled="!!editingId"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">付款方式 <span class="text-rose-500">*</span></label>
            <select
              v-model="formData.tenderType"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              :disabled="!!editingId"
            >
              <option value="">請選擇...</option>
              <option v-for="type in TENDER_TYPES" :key="type.code" :value="type.code">{{ type.name }}</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-1">備註</label>
            <input
              v-model="formData.description"
              type="text"
              placeholder="選填備註..."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              :disabled="!!editingId"
            />
          </div>
        </div>
      </div>

      <div v-if="!editingId" class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="backToList"
        >
          取消
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
          @click="handleSubmit"
          :disabled="submitting"
        >
          {{ submitting ? '儲存中...' : '確認收款' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listPayments, createPayment, TENDER_TYPES, type TenderType } from '../../features/payment/api'
import { listBPartners } from '../../features/bpartner/api'
import { useAuth } from '../../features/auth/store'

const auth = useAuth()

const title = '付款單'

const mode = ref<'list' | 'form'>('list')
const editingId = ref<number | null>(null)

const listRecords = ref<any[]>([])
const listLoading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 20
const searchQuery = ref('')

const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const submitting = ref(false)

const customers = ref<any[]>([])

const formData = ref({
  bpartnerId: 0,
  dateTrx: new Date().toISOString().split('T')[0],
  payAmt: 0,
  tenderType: '',
  description: '',
})

const hasNextPage = computed(() => {
  return currentPage.value * pageSize < totalCount.value
})

async function loadList() {
  if (!auth.token.value) return

  listLoading.value = true
  error.value = null

  try {
    const searchParams: { filter?: string; top?: number; skip?: number } = {
      top: pageSize,
      skip: (currentPage.value - 1) * pageSize,
    }

    if (searchQuery.value.trim()) {
      searchParams.filter = `contains(DocumentNo,'${searchQuery.value.trim()}') or contains(C_BPartner_ID/identifier,'${searchQuery.value.trim()}')`
    }

    const result = await listPayments(auth.token.value, searchParams)
    listRecords.value = result.records
    totalCount.value = result.totalCount
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入列表失敗'
  } finally {
    listLoading.value = false
  }
}

async function loadDropdownData() {
  if (!auth.token.value) return

  try {
    const bpData = await listBPartners(auth.token.value)
    customers.value = bpData.filter((bp) => bp.isCustomer)
  } catch (e: any) {
    console.error('Failed to load customers:', e)
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadList()
  }
}

function nextPage() {
  if (hasNextPage.value) {
    currentPage.value++
    loadList()
  }
}

function startCreate() {
  editingId.value = null
  error.value = null
  successMessage.value = null
  formData.value = {
    bpartnerId: 0,
    dateTrx: new Date().toISOString().split('T')[0],
    payAmt: 0,
    tenderType: '',
    description: '',
  }
  mode.value = 'form'
}

function startEdit(record: any) {
  editingId.value = record.id
  error.value = null
  successMessage.value = null
  formData.value = {
    bpartnerId: record.C_BPartner_ID?.id || record.bpartnerId || 0,
    dateTrx: record.DateTrx?.split('T')[0] || new Date().toISOString().split('T')[0],
    payAmt: record.PayAmt || record.payAmt || 0,
    tenderType: record.TenderType || record.tenderType || '',
    description: record.Description || record.description || '',
  }
  mode.value = 'form'
}

function backToList() {
  mode.value = 'list'
  editingId.value = null
  error.value = null
  loadList()
}

async function handleSubmit() {
  if (!auth.token.value) {
    error.value = '尚未登入'
    return
  }

  if (!formData.value.bpartnerId) {
    error.value = '請選擇客戶'
    return
  }

  if (!formData.value.dateTrx) {
    error.value = '請選擇收款日期'
    return
  }

  if (formData.value.payAmt <= 0) {
    error.value = '收款金額必須大於 0'
    return
  }

  if (!formData.value.tenderType) {
    error.value = '請選擇付款方式'
    return
  }

  error.value = null
  submitting.value = true

  try {
    await createPayment(auth.token.value, {
      bpartnerId: formData.value.bpartnerId,
      dateTrx: formData.value.dateTrx,
      payAmt: formData.value.payAmt,
      tenderType: formData.value.tenderType,
      description: formData.value.description,
    })

    successMessage.value = '收款已建立'

    setTimeout(() => {
      backToList()
    }, 1000)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '收款失敗'
  } finally {
    submitting.value = false
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('zh-TW', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

function getTenderTypeName(tenderType: string): string {
  const type = TENDER_TYPES.find((t) => t.code === tenderType)
  return type?.name || tenderType
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'CO':
      return 'bg-emerald-100 text-emerald-700'
    case 'DR':
      return 'bg-amber-100 text-amber-700'
    case 'VO':
      return 'bg-rose-100 text-rose-700'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'CO':
      return '完成'
    case 'DR':
      return '草稿'
    case 'VO':
      return '作廢'
    default:
      return status
  }
}

onMounted(() => {
  loadList()
  loadDropdownData()
})
</script>
