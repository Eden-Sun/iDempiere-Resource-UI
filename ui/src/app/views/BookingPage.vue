<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">使用者：預約</h1>
      <p class="mt-1 text-sm text-slate-600">
        選擇醫師/諮詢師，點選開始時段，再點選結束時段進行預約。
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

      <!-- 時段資訊 -->
      <div v-if="resourceType" class="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span class="font-medium">營業時段：</span>
        {{ formatTime(resourceType.timeSlotStart) }} - {{ formatTime(resourceType.timeSlotEnd) }}
        <span class="ml-3 font-medium">營業日：</span>
        <span v-for="(day, idx) in availableDaysText" :key="idx">{{ day }}</span>
      </div>

      <!-- 選擇提示 -->
      <div v-if="selectionMode" class="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
        <template v-if="selectionMode === 'start'">
          <span class="font-semibold">步驟 1/2：</span> 請點選<span class="font-semibold">開始時段</span>
        </template>
        <template v-else-if="selectionMode === 'end'">
          <span class="font-semibold">步驟 2/2：</span> 已選開始 {{ selectedStart?.day.label }} {{ selectedStart?.slot.label.split(' - ')[0] }}，請點選<span class="font-semibold">結束時段</span>
          <button class="ml-2 text-xs underline" @click="resetSelection">重新選擇</button>
        </template>
      </div>

      <!-- 時段網格 -->
      <div v-if="selectedResource && resourceType" class="mt-6">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-sm font-semibold text-slate-900">本週時段</div>
          <div class="flex items-center gap-3">
            <div class="text-xs text-slate-500">{{ weekStart.toLocaleDateString() }} ～ {{ weekEnd.toLocaleDateString() }}</div>
            <button
              v-if="!selectionMode"
              class="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              @click="startSelection"
            >
              新增預約
            </button>
            <button
              v-if="selectionMode"
              class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              @click="resetSelection"
            >
              取消選擇
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th class="border border-slate-200 bg-slate-50 px-2 py-1 text-left">時間</th>
                <th 
                  v-for="day in weekDays" 
                  :key="day.key" 
                  class="border border-slate-200 px-2 py-1 text-center min-w-[80px]"
                  :class="isDayAvailable(day.dayOfWeek) ? 'bg-slate-50' : 'bg-slate-200 text-slate-400'"
                >
                  {{ day.label }}<br /><span class="text-slate-400">{{ day.date }}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="slot in timeSlots" :key="slot.key">
                <td class="border border-slate-200 bg-slate-50 px-2 py-1 font-medium whitespace-nowrap">
                  {{ slot.label }}
                </td>
                <td
                  v-for="day in weekDays"
                  :key="day.key + slot.key"
                  class="border border-slate-200 px-1 py-1 text-center transition-colors"
                  :class="getSlotClass(day, slot)"
                  @click="onSlotClick(day, slot)"
                >
                  <span v-if="getSlotAssignment(day, slot)">{{ getSlotAssignment(day, slot)?.name || '已預約' }}</span>
                  <span v-else-if="isSlotInSelection(day, slot)" class="text-brand-600 font-semibold">✓</span>
                  <span v-else-if="!isDayAvailable(day.dayOfWeek)" class="text-slate-300">—</span>
                  <span v-else class="text-slate-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 新增預約表單 -->
      <div v-if="showBookingForm && selectedStart && selectedEnd" class="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
        <div class="text-sm font-semibold text-slate-900">確認預約</div>
        <div class="mt-2 text-xs text-slate-600">
          <div><span class="font-medium">日期：</span>{{ selectedStart.day.label }} ({{ selectedStart.day.date }})</div>
          <div><span class="font-medium">時段：</span>{{ selectedStart.slot.label.split(' - ')[0] }} - {{ selectedEnd.slot.label.split(' - ')[1] }}</div>
          <div><span class="font-medium">時長：</span>{{ calculateDuration() }} 分鐘</div>
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
              @click="resetSelection"
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
import { 
  listResources, 
  listAssignmentsForRange, 
  createAssignment, 
  getResourceType,
  type Resource, 
  type ResourceAssignment,
  type ResourceType,
} from '../../features/resource/api'

const auth = useAuth()

const resources = ref<Resource[]>([])
const selectedResourceId = ref<number | null>(null)
const resourceType = ref<ResourceType | null>(null)
const assignments = ref<ResourceAssignment[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 選擇模式
const selectionMode = ref<'start' | 'end' | null>(null)
const selectedStart = ref<{ day: WeekDay; slot: TimeSlot } | null>(null)
const selectedEnd = ref<{ day: WeekDay; slot: TimeSlot } | null>(null)
const showBookingForm = ref(false)
const bookingName = ref('')
const submitting = ref(false)

// 時間相關
const now = new Date()
const weekStart = new Date(now)
weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)) // Monday
weekStart.setHours(0, 0, 0, 0)
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 7)

type WeekDay = {
  key: string
  label: string
  date: string
  dateObj: Date
  dayOfWeek: number
}

type TimeSlot = {
  key: string
  label: string
  hour: number
  minute: number
  endHour: number
  endMinute: number
  index: number
}

function parseTimeString(timeStr?: string): { hour: number; minute: number } | null {
  if (!timeStr) return null
  const match = timeStr.match(/^(\d{2}):(\d{2})/)
  if (!match) return null
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) }
}

function formatTime(timeStr?: string): string {
  const t = parseTimeString(timeStr)
  if (!t) return '--:--'
  return `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`
}

const timeSlots = computed<TimeSlot[]>(() => {
  if (!resourceType.value) return []
  
  const start = parseTimeString(resourceType.value.timeSlotStart)
  const end = parseTimeString(resourceType.value.timeSlotEnd)
  
  if (!start || !end) return []
  
  const slots: TimeSlot[] = []
  let hour = start.hour
  let minute = start.minute
  const slotMinutes = 30
  let index = 0
  
  while (hour < end.hour || (hour === end.hour && minute < end.minute)) {
    const endMinute = minute + slotMinutes
    const endHour = hour + Math.floor(endMinute / 60)
    const actualEndMinute = endMinute % 60
    
    if (endHour > end.hour || (endHour === end.hour && actualEndMinute > end.minute)) {
      break
    }
    
    slots.push({
      key: `${hour}${String(minute).padStart(2, '0')}`,
      label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(actualEndMinute).padStart(2, '0')}`,
      hour,
      minute,
      endHour,
      endMinute: actualEndMinute,
      index: index++,
    })
    
    minute += slotMinutes
    if (minute >= 60) {
      hour += Math.floor(minute / 60)
      minute = minute % 60
    }
  }
  
  return slots
})

const weekDays = computed<WeekDay[]>(() => {
  const dayLabels = ['日', '一', '二', '三', '四', '五', '六']
  const days: WeekDay[] = []
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    const dow = d.getDay()
    days.push({
      key: `d${i}`,
      label: `週${dayLabels[dow]}`,
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      dateObj: new Date(d),
      dayOfWeek: dow,
    })
  }
  
  return days
})

function isDayAvailable(dayOfWeek: number): boolean {
  if (!resourceType.value) return false
  switch (dayOfWeek) {
    case 0: return resourceType.value.onSunday ?? false
    case 1: return resourceType.value.onMonday ?? false
    case 2: return resourceType.value.onTuesday ?? false
    case 3: return resourceType.value.onWednesday ?? false
    case 4: return resourceType.value.onThursday ?? false
    case 5: return resourceType.value.onFriday ?? false
    case 6: return resourceType.value.onSaturday ?? false
    default: return false
  }
}

const availableDaysText = computed(() => {
  if (!resourceType.value) return []
  const days: string[] = []
  if (resourceType.value.onMonday) days.push('一')
  if (resourceType.value.onTuesday) days.push('二')
  if (resourceType.value.onWednesday) days.push('三')
  if (resourceType.value.onThursday) days.push('四')
  if (resourceType.value.onFriday) days.push('五')
  if (resourceType.value.onSaturday) days.push('六')
  if (resourceType.value.onSunday) days.push('日')
  return days.length ? [days.join('、')] : ['無']
})

const selectedResource = computed(() => resources.value.find((r) => r.id === selectedResourceId.value) ?? null)

function getSlotAssignment(day: WeekDay, slot: TimeSlot): ResourceAssignment | null {
  const slotStart = new Date(day.dateObj)
  slotStart.setHours(slot.hour, slot.minute, 0, 0)
  const slotEnd = new Date(day.dateObj)
  slotEnd.setHours(slot.endHour, slot.endMinute, 0, 0)

  return assignments.value.find((a) => {
    const from = new Date(a.from)
    const to = a.to ? new Date(a.to) : new Date(from.getTime() + 30 * 60 * 1000)
    return from < slotEnd && to > slotStart
  }) ?? null
}

function isSlotInSelection(day: WeekDay, slot: TimeSlot): boolean {
  if (!selectedStart.value) return false
  if (day.key !== selectedStart.value.day.key) return false
  
  const startIdx = selectedStart.value.slot.index
  const endIdx = selectedEnd.value?.slot.index ?? startIdx
  
  return slot.index >= startIdx && slot.index <= endIdx
}

function isSlotAvailableForSelection(day: WeekDay, slot: TimeSlot): boolean {
  if (!isDayAvailable(day.dayOfWeek)) return false
  if (getSlotAssignment(day, slot)) return false
  
  const slotDate = new Date(day.dateObj)
  slotDate.setHours(slot.hour, slot.minute)
  if (slotDate < now) return false
  
  return true
}

function canSelectAsEnd(day: WeekDay, slot: TimeSlot): boolean {
  if (!selectedStart.value) return false
  if (day.key !== selectedStart.value.day.key) return false
  if (slot.index < selectedStart.value.slot.index) return false
  
  // 檢查中間所有時段是否可用
  const startIdx = selectedStart.value.slot.index
  for (let i = startIdx; i <= slot.index; i++) {
    const checkSlot = timeSlots.value[i]
    if (!checkSlot) return false
    if (getSlotAssignment(day, checkSlot)) return false
  }
  
  return true
}

function getSlotClass(day: WeekDay, slot: TimeSlot): string {
  // 選中的時段
  if (isSlotInSelection(day, slot)) {
    return 'bg-brand-200 text-brand-700'
  }
  
  // 非營業日
  if (!isDayAvailable(day.dayOfWeek)) {
    return 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }
  
  // 已預約
  if (getSlotAssignment(day, slot)) {
    return 'bg-rose-100 text-rose-700 cursor-not-allowed'
  }

  // 過去時間
  const slotDate = new Date(day.dateObj)
  slotDate.setHours(slot.hour, slot.minute)
  if (slotDate < now) return 'bg-slate-100 text-slate-400 cursor-not-allowed'

  // 選擇結束時段模式
  if (selectionMode.value === 'end') {
    if (canSelectAsEnd(day, slot)) {
      return 'hover:bg-brand-100 cursor-pointer'
    }
    return 'bg-slate-100 text-slate-400 cursor-not-allowed'
  }

  // 選擇開始時段模式
  if (selectionMode.value === 'start') {
    return 'hover:bg-brand-100 cursor-pointer'
  }

  return 'bg-white'
}

function startSelection() {
  selectionMode.value = 'start'
  selectedStart.value = null
  selectedEnd.value = null
  showBookingForm.value = false
  bookingName.value = ''
}

function resetSelection() {
  selectionMode.value = null
  selectedStart.value = null
  selectedEnd.value = null
  showBookingForm.value = false
  bookingName.value = ''
}

function onSlotClick(day: WeekDay, slot: TimeSlot) {
  if (!selectionMode.value) return
  
  if (!isSlotAvailableForSelection(day, slot)) return
  
  if (selectionMode.value === 'start') {
    selectedStart.value = { day, slot }
    selectedEnd.value = { day, slot } // 預設同一個時段
    selectionMode.value = 'end'
  } else if (selectionMode.value === 'end') {
    if (!canSelectAsEnd(day, slot)) return
    
    selectedEnd.value = { day, slot }
    selectionMode.value = null
    showBookingForm.value = true
  }
}

function calculateDuration(): number {
  if (!selectedStart.value || !selectedEnd.value) return 0
  const startMin = selectedStart.value.slot.hour * 60 + selectedStart.value.slot.minute
  const endMin = selectedEnd.value.slot.endHour * 60 + selectedEnd.value.slot.endMinute
  return endMin - startMin
}

async function submitBooking() {
  if (!auth.token.value || !selectedResourceId.value || !selectedStart.value || !selectedEnd.value || !bookingName.value.trim()) return

  submitting.value = true
  error.value = null

  try {
    const from = new Date(selectedStart.value.day.dateObj)
    from.setHours(selectedStart.value.slot.hour, selectedStart.value.slot.minute, 0, 0)
    const to = new Date(selectedEnd.value.day.dateObj)
    to.setHours(selectedEnd.value.slot.endHour, selectedEnd.value.slot.endMinute, 0, 0)

    await createAssignment(auth.token.value, {
      resourceId: selectedResourceId.value,
      name: bookingName.value.trim(),
      from,
      to,
    })

    resetSelection()
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

async function loadResourceType() {
  if (!auth.token.value || !selectedResource.value) {
    resourceType.value = null
    return
  }
  resourceType.value = await getResourceType(auth.token.value, selectedResource.value.resourceTypeId)
}

async function loadAssignments() {
  if (!auth.token.value || !selectedResourceId.value) return
  assignments.value = await listAssignmentsForRange(auth.token.value, selectedResourceId.value, weekStart, weekEnd)
}

async function reload() {
  error.value = null
  loading.value = true
  resetSelection()
  try {
    await loadResources()
    await loadResourceType()
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
  resetSelection()
  try {
    await loadResourceType()
    await loadAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入預約失敗'
  } finally {
    loading.value = false
  }
})

onMounted(reload)
</script>
