<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold">收貨單</h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ mode === 'list' ? '查看未完成收貨的採購訂單' : '收貨確認' }}
          </p>
        </div>
        <button
          v-if="mode === 'detail'"
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="backToList"
        >
          返回列表
        </button>
      </div>
    </div>

    <div v-if="error" class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </div>

    <div v-if="successMessage" class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {{ successMessage }}
    </div>

    <div v-if="mode === 'list'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th class="px-4 py-3">採購單號</th>
              <th class="px-4 py-3">供應商</th>
              <th class="px-4 py-3">訂單日期</th>
              <th class="px-4 py-3">金額</th>
              <th class="px-4 py-3">狀態</th>
              <th class="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="loading">
              <td colspan="6" class="px-4 py-8 text-center text-slate-500">載入中...</td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-slate-500">無待收貨訂單</td>
            </tr>
            <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-50">
              <td class="px-4 py-3 font-medium text-slate-900">{{ order.DocumentNo }}</td>
              <td class="px-4 py-3 text-slate-600">{{ order.C_BPartner_ID?.identifier || '-' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ formatDate(order.DateOrdered) }}</td>
              <td class="px-4 py-3 text-slate-900">${{ Number(order.GrandTotal || 0).toFixed(2) }}</td>
              <td class="px-4 py-3">
                <span
                  :class="{
                    'bg-yellow-100 text-yellow-700': getDocStatus(order) === 'DR',
                    'bg-blue-100 text-blue-700': getDocStatus(order) === 'IP',
                    'bg-green-100 text-green-700': getDocStatus(order) === 'CO',
                  }"
                  class="inline-block rounded-full px-2 py-1 text-xs"
                >
                  {{ getDocStatusText(getDocStatus(order)) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  @click="viewOrder(order)"
                >
                  收貨
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="mode === 'detail'" class="space-y-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold">採購單資訊</h2>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-slate-600">採購單號</label>
            <div class="mt-1 text-sm text-slate-900">{{ currentOrder?.DocumentNo }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600">供應商</label>
            <div class="mt-1 text-sm text-slate-900">{{ currentOrder?.C_BPartner_ID?.identifier }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600">訂單日期</label>
            <div class="mt-1 text-sm text-slate-900">{{ formatDate(currentOrder?.DateOrdered) }}</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600">收貨日期</label>
            <input
              v-model="movementDate"
              type="date"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-base font-semibold">商品明細</h2>
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
              <tr>
                <th class="px-4 py-3">商品</th>
                <th class="px-4 py-3">訂購數量</th>
                <th class="px-4 py-3">收貨數量</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200">
              <tr v-if="linesLoading">
                <td colspan="3" class="px-4 py-8 text-center text-slate-500">載入中...</td>
              </tr>
              <tr v-else-if="orderLines.length === 0">
                <td colspan="3" class="px-4 py-8 text-center text-slate-500">無明細資料</td>
              </tr>
              <tr v-for="line in orderLines" :key="line.id">
                <td class="px-4 py-3 text-slate-900">{{ line.M_Product_ID?.identifier || line.M_Product_ID?.name }}</td>
                <td class="px-4 py-3 text-slate-600">{{ line.QtyEntered }}</td>
                <td class="px-4 py-3">
                  <input
                    v-model.number="line.qtyToReceive"
                    type="number"
                    :max="line.QtyEntered"
                    :min="0"
                    step="0.01"
                    @blur="validateQty(line)"
                    class="w-32 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <span v-if="line.qtyError" class="block text-xs text-rose-600">{{ line.qtyError }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          @click="backToList"
        >
          取消
        </button>
        <button
          type="button"
          :disabled="submitting"
          class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:bg-slate-300"
          @click="confirmReceipt"
        >
          {{ submitting ? '處理中...' : '確認收貨' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '../../features/auth/store'
import * as InOutAPI from '../../features/inout/api'

const auth = useAuth()
const token = computed(() => auth.token.value)

const mode = ref<'list' | 'detail'>('list')
const error = ref('')
const successMessage = ref('')
const loading = ref(false)
const linesLoading = ref(false)
const submitting = ref(false)

const orders = ref<any[]>([])
const currentOrder = ref<any>(null)
const orderLines = ref<any[]>([])
const movementDate = ref(new Date().toISOString().split('T')[0])

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-TW')
}

function getDocStatus(order: any): string {
  // Handle object { id, identifier } or plain string
  return order.DocStatus?.id ?? order.DocStatus ?? ''
}

function getDocStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    DR: '草稿',
    IP: '進行中',
    CO: '完成',
    VO: '作廢',
    CL: '關閉',
  }
  return statusMap[status] || status
}

async function loadOrders(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    orders.value = await InOutAPI.getPendingPurchaseOrders(token.value)
  } catch (e: any) {
    error.value = `載入失敗: ${e.message}`
  } finally {
    loading.value = false
  }
}

async function viewOrder(order: any): Promise<void> {
  mode.value = 'detail'
  currentOrder.value = order
  movementDate.value = new Date().toISOString().split('T')[0]
  await loadOrderLines(order.id)
}

async function loadOrderLines(orderId: number): Promise<void> {
  linesLoading.value = true
  error.value = ''
  try {
    const lines = await InOutAPI.getOrderLines(token.value, orderId)
    orderLines.value = lines.map((l) => ({
      ...l,
      qtyToReceive: l.QtyEntered,
      qtyError: '',
    }))
  } catch (e: any) {
    error.value = `載入明細失敗: ${e.message}`
  } finally {
    linesLoading.value = false
  }
}

function validateQty(line: any): void {
  if (line.qtyToReceive < 0) {
    line.qtyError = '不能小於 0'
    line.qtyToReceive = 0
  } else if (line.qtyToReceive > line.QtyEntered) {
    line.qtyError = '不能超過訂購數量'
    line.qtyToReceive = line.QtyEntered
  } else {
    line.qtyError = ''
  }
}

async function confirmReceipt(): Promise<void> {
  submitting.value = true
  error.value = ''
  successMessage.value = ''

  try {
    for (const line of orderLines.value) {
      validateQty(line)
      if (line.qtyError) {
        throw new Error(line.qtyError)
      }
    }

    const inOut = await InOutAPI.createInOut(token.value, currentOrder.value.id, movementDate.value)
    const inOutId = inOut.id || inOut.M_InOut_ID

    if (!inOutId) {
      throw new Error('建立收貨單失敗')
    }

    const inOutLines = await InOutAPI.getInOutLines(token.value, inOutId)

    for (const line of orderLines.value) {
      const inOutLine = inOutLines.find((il) => il.orderLineId === line.id)
      if (inOutLine && line.qtyToReceive > 0) {
        await InOutAPI.updateInOutLine(token.value, inOutLine.id, line.qtyToReceive)
      }
    }

    await InOutAPI.completeInOut(token.value, inOutId)

    successMessage.value = `收貨完成！收貨單號: ${inOut.DocumentNo || inOutId}`
    await loadOrders()
    backToList()
  } catch (e: any) {
    error.value = `收貨失敗: ${e.message}`
  } finally {
    submitting.value = false
  }
}

function backToList(): void {
  mode.value = 'list'
  currentOrder.value = null
  orderLines.value = []
  successMessage.value = ''
}

onMounted(() => {
  loadOrders()
})
</script>
