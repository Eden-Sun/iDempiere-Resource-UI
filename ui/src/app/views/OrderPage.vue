<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold">{{ title }}</h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ mode === 'list' ? `查看和管理${subtitle}` : (editingId ? '編輯訂單' : `建立${subtitle}`) }}
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
            新增
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
            placeholder="搜尋單號或客戶/供應商..."
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
              <th class="px-4 py-3">{{ isPurchase ? '供應商' : '客戶' }}</th>
              <th class="px-4 py-3">日期</th>
              <th class="px-4 py-3">金額</th>
              <th class="px-4 py-3">狀態</th>
              <th class="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="listLoading">
              <td :colspan="isPurchase ? 6 : 5" class="px-4 py-8 text-center text-slate-500">載入中...</td>
            </tr>
            <tr v-else-if="listRecords.length === 0">
              <td :colspan="isPurchase ? 6 : 5" class="px-4 py-8 text-center text-slate-500">無資料</td>
            </tr>
            <tr
              v-for="record in listRecords"
              :key="record.id"
              class="hover:bg-slate-50 cursor-pointer"
              @click="startEdit(record)"
            >
              <td class="px-4 py-3 font-medium text-slate-900">{{ record.DocumentNo }}</td>
              <td class="px-4 py-3 text-slate-600">{{ record.bpartnerName }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatDate(record.DateOrdered) }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatMoney(record.GrandTotal) }}</td>
              <td class="px-4 py-3">
                <span
                  :class="getStatusClass(record.DocStatus)"
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {{ getStatusText(record.DocStatus) }}
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
        <h2 class="text-base font-semibold mb-4">訂單資訊</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">{{ isPurchase ? '供應商' : '客戶' }} <span class="text-rose-500">*</span></label>
            <select
              v-model="formData.bpartnerId"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              :disabled="!!editingId"
            >
              <option value="">請選擇...</option>
              <option v-for="bp in bpartners" :key="bp.id" :value="bp.id">{{ bp.Name }}</option>
            </select>
          </div>
          <div v-if="isPurchase">
            <label class="block text-sm font-medium text-slate-700 mb-1">入庫倉 <span class="text-rose-500">*</span></label>
            <select
              v-model="formData.warehouseId"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">請選擇...</option>
              <option v-for="wh in warehouses" :key="wh.id" :value="wh.id">{{ wh.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">訂單日期 <span class="text-rose-500">*</span></label>
            <input
              v-model="formData.dateOrdered"
              type="date"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold">商品明細</h2>
          <button
            v-if="!editingId"
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            @click="addLine"
          >
            新增明細
          </button>
        </div>

        <div v-if="editingId && orderLinesLoading" class="py-8 text-center text-slate-500">
          載入明細中...
        </div>
        <div v-else-if="orderLines.length === 0" class="py-8 text-center text-slate-500">
          無明細
        </div>
        <div v-else class="space-y-3">
          <div v-for="(line, index) in orderLines" :key="index" class="border border-slate-200 rounded-lg p-4">
            <div class="grid grid-cols-12 gap-3 items-center">
              <div class="col-span-4">
                <label class="block text-xs font-medium text-slate-700 mb-1">商品</label>
                <select
                  v-model="line.productId"
                  class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  :disabled="!!editingId"
                  @change="updateLineTotal(index)"
                >
                  <option value="">請選擇...</option>
                  <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-700 mb-1">數量</label>
                <input
                  v-model.number="line.qtyEntered"
                  type="number"
                  min="1"
                  step="1"
                  class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  :disabled="!!editingId"
                  @input="updateLineTotal(index)"
                />
              </div>
              <div class="col-span-3">
                <label class="block text-xs font-medium text-slate-700 mb-1">單價</label>
                <input
                  v-model.number="line.priceEntered"
                  type="number"
                  min="0"
                  step="0.01"
                  class="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  :disabled="!!editingId"
                  @input="updateLineTotal(index)"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-xs font-medium text-slate-700 mb-1">小計</label>
                <input
                  :value="formatMoney(line.qtyEntered * line.priceEntered)"
                  type="text"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600"
                  readonly
                />
              </div>
              <div class="col-span-1 text-center">
                <button
                  v-if="!editingId"
                  type="button"
                  class="text-rose-600 hover:text-rose-700"
                  @click="removeLine(index)"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!editingId" class="mt-4 flex justify-between items-center text-sm">
          <div></div>
          <div class="space-y-1 text-right">
            <div class="text-slate-600">總計：{{ formatMoney(totalAmount) }}</div>
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
          {{ submitting ? '儲存中...' : '完成開單' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { listOrders, listProducts, listWarehouses, createOrder, getOrderLines } from '../../features/order/api'
import { listBPartners } from '../../features/bpartner/api'
import { useAuth } from '../../features/auth/store'

const route = useRoute()
const auth = useAuth()

const orderType = computed(() => {
  // Determine order type from route path instead of query params
  return route.path === '/sales-order' ? 'sales' : 'purchase'
})

const isPurchase = computed(() => orderType.value === 'purchase')
const title = computed(() => isPurchase.value ? '採購訂單' : '銷售訂單')
const subtitle = computed(() => isPurchase.value ? '採購單' : '銷售單')

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

const bpartners = ref<any[]>([])
const products = ref<any[]>([])
const warehouses = ref<any[]>([])

const formData = ref({
  bpartnerId: 0,
  warehouseId: 0,
  dateOrdered: new Date().toISOString().split('T')[0],
})

const orderLines = ref<Array<{ productId: number; qtyEntered: number; priceEntered: number; taxId?: number }>>([])
const orderLinesLoading = ref(false)

const totalAmount = computed(() => {
  return orderLines.value.reduce((sum, line) => sum + (line.qtyEntered * line.priceEntered), 0)
})

const hasNextPage = computed(() => {
  return currentPage.value * pageSize < totalCount.value
})

async function loadList() {
  if (!auth.token.value) return

  listLoading.value = true
  error.value = null

  try {
    const searchParams: { isSOTrx: boolean; filter?: string; top?: number; skip?: number } = {
      isSOTrx: !isPurchase.value,
      top: pageSize,
      skip: (currentPage.value - 1) * pageSize,
    }

    if (searchQuery.value.trim()) {
      searchParams.filter = `contains(DocumentNo,'${searchQuery.value.trim()}') or contains(C_BPartner_ID/identifier,'${searchQuery.value.trim()}')`
    }

    const result = await listOrders(auth.token.value, searchParams)
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
    const [bpData, prodData, whData] = await Promise.all([
      listBPartners(auth.token.value),
      listProducts(auth.token.value, { top: 100 }),
      listWarehouses(auth.token.value),
    ])

    bpartners.value = bpData.filter((bp) => isPurchase.value ? bp.isVendor : bp.isCustomer)
    products.value = prodData
    warehouses.value = whData
  } catch (e: any) {
    console.error('Failed to load dropdown data:', e)
  }
}

async function loadOrderLines(orderId: number) {
  if (!auth.token.value) return

  orderLinesLoading.value = true
  try {
    const lines = await getOrderLines(auth.token.value, orderId)
    orderLines.value = lines.map((l) => ({
      productId: l.productId,
      qtyEntered: l.qtyEntered,
      priceEntered: l.priceEntered,
      taxId: l.taxId,
    }))
  } catch (e: any) {
    console.error('Failed to load order lines:', e)
  } finally {
    orderLinesLoading.value = false
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
  orderLines.value = []
  formData.value = {
    bpartnerId: 0,
    warehouseId: 0,
    dateOrdered: new Date().toISOString().split('T')[0],
  }
  mode.value = 'form'
}

async function startEdit(record: any) {
  editingId.value = record.id
  error.value = null
  successMessage.value = null
  formData.value = {
    bpartnerId: record.C_BPartner_ID?.id || record.bpartnerId || 0,
    warehouseId: record.M_Warehouse_ID?.id || 0,
    dateOrdered: record.DateOrdered?.split('T')[0] || new Date().toISOString().split('T')[0],
  }
  await loadOrderLines(record.id)
  mode.value = 'form'
}

function backToList() {
  mode.value = 'list'
  editingId.value = null
  error.value = null
  loadList()
}

function addLine() {
  orderLines.value.push({
    productId: 0,
    qtyEntered: 1,
    priceEntered: 0,
  })
}

function removeLine(index: number) {
  orderLines.value.splice(index, 1)
}

function updateLineTotal(index: number) {
}

async function handleSubmit() {
  if (!auth.token.value) {
    error.value = '尚未登入'
    return
  }

  if (!formData.value.bpartnerId) {
    error.value = isPurchase.value ? '請選擇供應商' : '請選擇客戶'
    return
  }

  if (isPurchase.value && !formData.value.warehouseId) {
    error.value = '請選擇入庫倉'
    return
  }

  if (orderLines.value.length === 0) {
    error.value = '請至少新增一筆商品明細'
    return
  }

  for (let i = 0; i < orderLines.value.length; i++) {
    const line = orderLines.value[i]
    if (!line.productId) {
      error.value = `第 ${i + 1} 筆明細：請選擇商品`
      return
    }
    if (line.qtyEntered <= 0) {
      error.value = `第 ${i + 1} 筆明細：數量必須大於 0`
      return
    }
    if (line.priceEntered < 0) {
      error.value = `第 ${i + 1} 筆明細：單價不能為負數`
      return
    }
  }

  error.value = null
  submitting.value = true

  try {
    await createOrder(auth.token.value, {
      bpartnerId: formData.value.bpartnerId,
      isSOTrx: !isPurchase.value,
      dateOrdered: formData.value.dateOrdered,
      warehouseId: isPurchase.value ? formData.value.warehouseId : undefined,
    }, orderLines.value)

    successMessage.value = isPurchase.value ? '採購訂單已建立' : '銷售訂單已建立'

    setTimeout(() => {
      backToList()
    }, 1000)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '開單失敗'
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

watch(() => route.path, () => {
  loadList()
  loadDropdownData()
})

onMounted(() => {
  loadList()
  loadDropdownData()
})
</script>
