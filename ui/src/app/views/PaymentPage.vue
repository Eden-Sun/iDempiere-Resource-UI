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
        <div class="flex flex-wrap gap-4 mb-4">
          <div class="flex-1 min-w-[200px]">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜尋單號或客戶..."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              @keyup.enter="loadList"
            />
          </div>
          <div class="min-w-[150px]">
            <select
              v-model="filter.tenderType"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              @change="loadList"
            >
              <option value="">全部付款方式</option>
              <option v-for="type in TENDER_TYPES" :key="type.code" :value="type.code">
                {{ type.name }}
              </option>
            </select>
          </div>
          <div class="min-w-[120px]">
            <select
              v-model="filter.docStatus"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              @change="loadList"
            >
              <option value="">全部狀態</option>
              <option value="DR">草稿</option>
              <option value="CO">完成</option>
              <option value="VO">作廢</option>
            </select>
          </div>
          <div class="min-w-[120px]">
            <input
              v-model="filter.dateFrom"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              @change="loadList"
            />
          </div>
          <div class="min-w-[120px]">
            <input
              v-model="filter.dateTo"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              @change="loadList"
            />
          </div>
          <button
            type="button"
            class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            @click="clearFilters"
          >
            清除篩選
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            @click="loadList"
          >
            搜尋
          </button>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            @click="setQuickFilter('today')"
          >
            今天
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            @click="setQuickFilter('week')"
          >
            本週
          </button>
          <button
            type="button"
            class="rounded-lg bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
            @click="setQuickFilter('month')"
          >
            本月
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
              @change="onCustomerChange"
            >
              <option value="">請選擇...</option>
              <option v-for="bp in customers" :key="bp.id" :value="bp.id">{{ bp.name }}</option>
            </select>
            <div v-if="customerBalance && formData.bpartnerId" class="mt-1 text-xs text-slate-600">
              未結清: {{ formatMoney(customerBalance.totalOutstanding) }} / 
              信用額度: {{ formatMoney(customerBalance.creditLimit) }}
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">收款日期 <span class="text-rose-500">*</span></label>
            <input
              v-model="formData.dateTrx"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">付款方式 <span class="text-rose-500">*</span></label>
            <select
              v-model="formData.tenderType"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
            />
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-6 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="backToList"
        >
          {{ editingId ? '返回列表' : '取消' }}
        </button>
        <template v-if="!editingId">
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-6 py-2 text-sm font-medium text-white hover:bg-brand-700"
            @click="handleSubmit"
            :disabled="submitting"
          >
            {{ submitting ? '儲存中...' : '確認收款' }}
          </button>
        </template>
        <template v-else>
          <button
            v-if="editingRecord?.docStatus === 'DR'"
            type="button"
            class="rounded-lg bg-amber-600 px-6 py-2 text-sm font-medium text-white hover:bg-amber-700"
            @click="handleComplete"
            :disabled="submitting"
          >
            {{ submitting ? '處理中...' : '完成' }}
          </button>
          <button
            v-if="editingRecord?.docStatus === 'CO'"
            type="button"
            class="rounded-lg bg-rose-600 px-6 py-2 text-sm font-medium text-white hover:bg-rose-700"
            @click="handleVoid"
            :disabled="submitting"
          >
            {{ submitting ? '處理中...' : '作廢' }}
          </button>
          <button
            v-if="editingRecord?.docStatus === 'DR'"
            type="button"
            class="rounded-lg bg-slate-600 px-6 py-2 text-sm font-medium text-white hover:bg-slate-700"
            @click="handleUpdate"
            :disabled="submitting"
          >
            {{ submitting ? '更新中...' : '更新' }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  listPayments, 
  createPayment, 
  updatePayment, 
  updatePaymentStatus, 
  deletePayment, 
  getCustomerBalance,
  TENDER_TYPES, 
  type TenderType 
} from '../../features/payment/api'
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
const customerBalance = ref<{
  totalOutstanding: number
  creditLimit: number
  availableCredit: number
} | null>(null)
const editingRecord = ref<any>(null)

const filter = ref({
  tenderType: '',
  docStatus: '',
  dateFrom: '',
  dateTo: '',
})

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
    const searchParams: { 
      filter?: string
      tenderType?: string
      docStatus?: string
      dateFrom?: string
      dateTo?: string
      top?: number
      skip?: number
    } = {
      top: pageSize,
      skip: (currentPage.value - 1) * pageSize,
    }

    // Build filter string
    let filterParts = ['IsReceipt eq true']
    
    if (searchQuery.value.trim()) {
      filterParts.push(`contains(DocumentNo,'${searchQuery.value.trim()}') or contains(C_BPartner_ID/identifier,'${searchQuery.value.trim()}')`)
    }

    if (filter.value.tenderType) {
      searchParams.tenderType = filter.value.tenderType
    }

    if (filter.value.docStatus) {
      searchParams.docStatus = filter.value.docStatus
    }

    if (filter.value.dateFrom) {
      searchParams.dateFrom = filter.value.dateFrom
    }

    if (filter.value.dateTo) {
      searchParams.dateTo = filter.value.dateTo
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
  editingRecord.value = record
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
  
  // Load customer balance for this payment
  if (formData.value.bpartnerId) {
    onCustomerChange()
  }
}

function backToList() {
  mode.value = 'list'
  editingId.value = null
  error.value = null
  loadList()
}

function validatePayment(): string[] {
  const errors: string[] = []

  if (!formData.value.bpartnerId) {
    errors.push('請選擇客戶')
  }

  if (!formData.value.dateTrx) {
    errors.push('請選擇收款日期')
  }

  if (formData.value.payAmt <= 0) {
    errors.push('收款金額必須大於 0')
  }

  if (!formData.value.tenderType) {
    errors.push('請選擇付款方式')
  }

  // Date validation - can't be in future
  if (formData.value.dateTrx) {
    const trxDate = new Date(formData.value.dateTrx)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    if (trxDate > today) {
      errors.push('收款日期不能是未來日期')
    }
  }

  // Customer credit validation
  if (customerBalance.value && formData.value.payAmt > 0) {
    if (customerBalance.value.availableCredit < 0) {
      errors.push('客戶信用額度不足')
    }
  }

  // Amount validation for different tender types
  if (formData.value.tenderType === 'X' && formData.value.payAmt > 10000) {
    errors.push('現金支付金額不宜超過 10,000 元')
  }

  return errors
}

async function handleSubmit() {
  if (!auth.token.value) {
    error.value = '尚未登入'
    return
  }

  const validationErrors = validatePayment()
  if (validationErrors.length > 0) {
    error.value = validationErrors.join('\n')
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

async function onCustomerChange() {
  if (!formData.value.bpartnerId || !auth.token.value) {
    customerBalance.value = null
    return
  }

  try {
    customerBalance.value = await getCustomerBalance(auth.token.value, formData.value.bpartnerId)
  } catch (e) {
    console.error('Failed to load customer balance:', e)
    customerBalance.value = null
  }
}

function clearFilters() {
  filter.value = {
    tenderType: '',
    docStatus: '',
    dateFrom: '',
    dateTo: '',
  }
  searchQuery.value = ''
  loadList()
}

function setQuickFilter(period: 'today' | 'week' | 'month') {
  const today = new Date()
  let fromDate: Date

  switch (period) {
    case 'today':
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      break
    case 'week':
      const dayOfWeek = today.getDay()
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dayOfWeek)
      break
    case 'month':
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
  }

  filter.value.dateFrom = fromDate.toISOString().split('T')[0]
  filter.value.dateTo = today.toISOString().split('T')[0]
  loadList()
}

async function handleUpdate() {
  if (!auth.token.value || !editingId.value) return

  const validationErrors = validatePayment()
  if (validationErrors.length > 0) {
    error.value = validationErrors.join('\n')
    return
  }

  error.value = null
  submitting.value = true

  try {
    await updatePayment(auth.token.value, editingId.value, {
      payAmt: formData.value.payAmt,
      tenderType: formData.value.tenderType,
      description: formData.value.description,
    })

    successMessage.value = '付款單已更新'
    setTimeout(() => {
      backToList()
    }, 1000)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '更新失敗'
  } finally {
    submitting.value = false
  }
}

async function handleComplete() {
  if (!auth.token.value || !editingId.value) return

  error.value = null
  submitting.value = true

  try {
    await updatePaymentStatus(auth.token.value, editingId.value, 'CO')

    successMessage.value = '付款單已完成'
    setTimeout(() => {
      backToList()
    }, 1000)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '完成失敗'
  } finally {
    submitting.value = false
  }
}

async function handleVoid() {
  if (!auth.token.value || !editingId.value) return

  if (!confirm('確定要作廢此付款單嗎？此操作無法復原。')) {
    return
  }

  error.value = null
  submitting.value = true

  try {
    await updatePaymentStatus(auth.token.value, editingId.value, 'VO')

    successMessage.value = '付款單已作廢'
    setTimeout(() => {
      backToList()
    }, 1000)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '作廢失敗'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadList()
  loadDropdownData()
})
</script>
