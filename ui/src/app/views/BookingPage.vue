<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">使用者：預約</h1>
      <p class="mt-1 text-sm text-slate-600">
        選擇醫師/諮詢師，點選可用時段進行預約。
      </p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="min-w-[220px]">
          <label class="text-sm font-medium text-slate-700">選擇資源（醫師/諮詢師）</label>
          <select v-model="selectedResourceId" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option :value="null" disabled>請選擇</option>
            <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }} (#{{ r.id }})</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            :disabled="loading"
            type="button"
            @click="reload"
          >
            {{ loading ? '載入中…' : '重新整理' }}
          </button>
        </div>
      </div>

      <p v-if="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {{ error }}
      </p>

      <!-- 時段網格 -->
      <div v-if="selectedResource" class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-900">本週時段</div>
          <div class="text-xs text-slate-500">{{ weekStart.toLocaleDateString() }} ～ {{ weekEnd.toLocaleDateString() }}</div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="border border-slate-200 bg-slate-50 px-2 py-1 text-left">時間</th>
                <th v-for="day in weekDays" :key="day.key" class="border border-slate-200 bg-slate-50 px-2 py-1 text-center min-w-[80px]">
                  {{ day.label }}<br /><span class="text-slate-400">{{ day.date }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="hour in hours" :key="hour">
                <td class="border border-slate-200 bg-slate-50 px-2 py-1 font-medium">{{ hour }}:00</td>
                <td
                  v-for="day in weekDays"
                  :key="day.key + hour"
                  class="border border-slate-200 px-1 py-1 text-center cursor-pointer transition-colors"
                  :class="getSlotClass(day, hour)"
                  @click="onSlotClick(day, hour)"
                >
                  <span v-if="getSlotAssignment(day, hour)">{{ getSlotAssignment(day, hour)?.name || '已預約' }}</span>
                  <span v-else class="text-slate-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 新增預約表單 -->
      <div v-if="showBookingForm" class="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
        <div class="text-sm font-semibold text-slate-900">新增預約</div>
        <div class="mt-2 text-xs text-slate-600">
          時段：{{ bookingSlot?.day.label }} {{ bookingSlot?.hour }}:00 - {{ (bookingSlot?.hour ?? 0) + 1 }}:00
        </div>
        <div class="mt-3 space-y-3">
          <div>
            <label class="text-sm font-medium text-slate-700">預約名稱</label>
            <input
              v-model="bookingName"
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              placeholder="例如：王小明 諮詢"
            />
          </div>
          <div class="flex gap-2">
            <button
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="submitting || !bookingName.trim()"
              @click="submitBooking"
            >
              {{ submitting ? '送出中…' : '確認預約' }}
            </button>
            <button
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              @click="cancelBooking"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuth } from '../../features/auth/store'
import { listResources, listAssignmentsForRange, createAssignment, type Resource, type ResourceAssignment } from '../../features/resource/api'

const auth = useAuth()

const resources = ref<Resource[]>([])
const selectedResourceId = ref<number | null>(null)
const assignments = ref<ResourceAssignment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 預約表單
const showBookingForm = ref(false)
const bookingSlot = ref<{ day: { key: string; date: string; dateObj: Date }; hour: number } | null>(null)
const bookingName = ref('')
const submitting = ref(false)

const now = new Date()
const weekStart = new Date(now)
weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
weekStart.setHours(0, 0, 0, 0)
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 7)

// 營業時段 (9:00-18:00)
const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]

const weekDays = computed(() => {
  const days = ['一', '二', '三', '四', '五', '六', '日']
  return days.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return {
      key: `d${i}`,
      label: `週${label}`,
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      dateObj: new Date(d),
    }
  })
})

const selectedResource = computed(() => resources.value.find((r) => r.id === selectedResourceId.value) ?? null)

function getSlotAssignment(day: { dateObj: Date }, hour: number): ResourceAssignment | null {
  const slotStart = new Date(day.dateObj)
  slotStart.setHours(hour, 0, 0, 0)
  const slotEnd = new Date(slotStart)
  slotEnd.setHours(hour + 1)

  return assignments.value.find((a) => {
    const from = new Date(a.from)
    return from >= slotStart && from < slotEnd
  }) ?? null
}

function getSlotClass(day: { dateObj: Date }, hour: number): string {
  const assignment = getSlotAssignment(day, hour)
  if (assignment) return 'bg-rose-100 text-rose-700'

  const slotDate = new Date(day.dateObj)
  slotDate.setHours(hour)
  if (slotDate < now) return 'bg-slate-100 text-slate-400 cursor-not-allowed'

  return 'hover:bg-brand-100'
}

function onSlotClick(day: { key: string; date: string; dateObj: Date }, hour: number) {
  if (getSlotAssignment(day, hour)) return // 已預約
  const slotDate = new Date(day.dateObj)
  slotDate.setHours(hour)
  if (slotDate < now) return // 過去時間

  bookingSlot.value = { day, hour }
  bookingName.value = ''
  showBookingForm.value = true
}

function cancelBooking() {
  showBookingForm.value = false
  bookingSlot.value = null
  bookingName.value = ''
}

async function submitBooking() {
  if (!auth.token.value || !selectedResourceId.value || !bookingSlot.value || !bookingName.value.trim()) return

  submitting.value = true
  error.value = null

  try {
    const from = new Date(bookingSlot.value.day.dateObj)
    from.setHours(bookingSlot.value.hour, 0, 0, 0)
    const to = new Date(from)
    to.setHours(bookingSlot.value.hour + 1)

    await createAssignment(auth.token.value, {
      resourceId: selectedResourceId.value,
      name: bookingName.value.trim(),
      from,
      to,
    })

    cancelBooking()
    await loadAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '預約失敗'
  } finally {
    submitting.value = false
  }
}

async function loadResources() {
  if (!auth.token.value) return
  resources.value = await listResources(auth.token.value)
  if (!selectedResourceId.value && resources.value.length) selectedResourceId.value = resources.value[0].id
}

async function loadAssignments() {
  if (!auth.token.value || !selectedResourceId.value) return
  assignments.value = await listAssignmentsForRange(auth.token.value, selectedResourceId.value, weekStart, weekEnd)
}

async function reload() {
  error.value = null
  loading.value = true
  try {
    await loadResources()
    await loadAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

watch(selectedResourceId, async () => {
  error.value = null
  loading.value = true
  try {
    await loadAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入預約失敗'
  } finally {
    loading.value = false
  }
})

onMounted(reload)
</script>

