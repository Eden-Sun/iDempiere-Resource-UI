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
        <div class="flex-1 min-w-[300px]">
          <label class="text-sm font-medium text-slate-700">選擇資源（醫師/諮詢師）</label>
          <div class="mt-2 flex flex-wrap gap-3">
            <label
              v-for="r in resources"
              :key="r.id"
              class="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 transition-colors"
              :class="selectedResourceIds.includes(r.id) ? 'border-brand-500 bg-brand-50' : ''"
            >
              <input
                type="checkbox"
                :value="r.id"
                :checked="selectedResourceIds.includes(r.id)"
                class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                @change="onResourceToggle(r.id)"
              />
              <span>{{ r.name }} (#{{ r.id }})</span>
            </label>
          </div>
          <div v-if="selectedResourceIds.length > 0" class="mt-2 text-xs text-slate-600">
            已選擇 {{ selectedResourceIds.length }} 個資源（可疊加觀看）
          </div>
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
      <div v-if="selectedResources.length > 0" class="mt-4 space-y-2">
        <div
          v-for="res in selectedResources"
          :key="res.id"
          class="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600"
          :style="{ borderLeft: `4px solid ${getResourceColor(res.id)}` }"
        >
          <span class="font-semibold" :style="{ color: getResourceColor(res.id) }">{{ res.name }}：</span>
          <span class="font-medium">營業時段：</span>
          {{ formatTime(resourceTypes.get(res.id)?.timeSlotStart) }} - {{ formatTime(resourceTypes.get(res.id)?.timeSlotEnd) }}
          <span class="ml-3 font-medium">營業日：</span>
          <span>{{ getAvailableDaysText(res.id) }}</span>
        </div>
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
      <div v-if="selectedResources.length > 0 && commonResourceType" class="mt-6">
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
                  class="border border-slate-200 px-1 py-1 text-center transition-colors relative"
                  :class="getSlotClass(day, slot)"
                  @click="onSlotClick(day, slot)"
                >
                  <div v-if="getSlotAssignments(day, slot).length > 0" class="space-y-0.5">
                    <div
                      v-for="(assignment, idx) in getSlotAssignments(day, slot)"
                      :key="idx"
                      class="text-xs rounded px-1 py-0.5 truncate"
                      :style="{
                        backgroundColor: getAssignmentColor(assignment.id) + '40',
                        color: getAssignmentColor(assignment.id),
                        borderLeft: `3px solid ${getAssignmentColor(assignment.id)}`
                      }"
                      :title="`${assignment.resourceName}: ${assignment.name || '已預約'}`"
                    >
                      {{ assignment.resourceName }}: {{ assignment.name || '已預約' }}
                    </div>
                  </div>
                  <span v-else-if="isSlotInSelection(day, slot)" class="text-brand-600 font-semibold">✓</span>
                  <span v-else-if="!isAnyDayAvailable(day.dayOfWeek)" class="text-slate-300">—</span>
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
          <div v-if="selectedResourceIds.length > 1" class="mt-2">
            <span class="font-medium">將為以下資源建立預約：</span>
            <div class="mt-1 flex flex-wrap gap-2">
              <span
                v-for="resId in selectedResourceIds"
                :key="resId"
                class="inline-block rounded px-2 py-0.5 text-xs"
                :style="{
                  backgroundColor: getResourceColor(resId) + '40',
                  color: getResourceColor(resId),
                  borderLeft: `3px solid ${getResourceColor(resId)}`
                }"
              >
                {{ resources.find(r => r.id === resId)?.name }}
              </span>
            </div>
          </div>
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
          <div>
            <label class="text-sm font-medium text-slate-700">顏色標籤（用於疊加觀看）</label>
            <div class="mt-1 flex items-center gap-3">
              <input
                v-model="bookingColor"
                type="color"
                class="h-10 w-20 cursor-pointer rounded border border-slate-300"
                title="選擇顏色標籤"
              />
              <div class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" :style="{ backgroundColor: bookingColor + '20', color: bookingColor, borderColor: bookingColor }">
                預覽：{{ bookingColor }}
              </div>
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                @click="resetColor"
              >
                重置
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-500">設定顏色標籤以便在疊加觀看時區分不同預約</p>
          </div>
          <div class="flex gap-2">
            <button
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              :disabled="submitting || !bookingName.trim() || selectedResourceIds.length === 0"
              @click="submitBooking"
            >
              {{ submitting ? '送出中…' : `確認預約${selectedResourceIds.length > 1 ? ` (${selectedResourceIds.length}個資源)` : ''}` }}
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
  getAssignmentColors,
  setAssignmentColor,
  type Resource, 
  type ResourceAssignment,
  type ResourceType,
} from '../../features/resource/api'

const auth = useAuth()

const resources = ref<Resource[]>([])
const selectedResourceIds = ref<number[]>([])
const resourceTypes = ref<Map<number, ResourceType>>(new Map())
const assignments = ref<Map<number, ResourceAssignment[]>>(new Map())
const loading = ref(false)
const error = ref<string | null>(null)

// 資源顏色映射
const resourceColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

function getResourceColor(resourceId: number): string {
  const index = resources.value.findIndex(r => r.id === resourceId)
  return resourceColors[index % resourceColors.length]
}

function getAssignmentColor(assignmentId: number): string {
  // 優先使用保存的顏色標籤，否則使用資源的預設顏色
  return assignmentColors.value.get(assignmentId) || getResourceColor(
    selectedResourceIds.value.find(id => 
      assignments.value.get(id)?.some(a => a.id === assignmentId)
    ) || selectedResourceIds.value[0] || 0
  )
}

// 選擇模式
const selectionMode = ref<'start' | 'end' | null>(null)
const selectedStart = ref<{ day: WeekDay; slot: TimeSlot } | null>(null)
const selectedEnd = ref<{ day: WeekDay; slot: TimeSlot } | null>(null)
const showBookingForm = ref(false)
const bookingName = ref('')
const bookingColor = ref('#3b82f6') // 預設藍色
const submitting = ref(false)
const assignmentColors = ref<Map<number, string>>(new Map()) // assignmentId -> color

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
  if (!commonResourceType.value) return []
  
  const start = parseTimeString(commonResourceType.value.timeSlotStart)
  const end = parseTimeString(commonResourceType.value.timeSlotEnd)
  
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

function isDayAvailable(dayOfWeek: number, resourceId?: number): boolean {
  const rt = resourceId ? resourceTypes.value.get(resourceId) : commonResourceType.value
  if (!rt) return false
  switch (dayOfWeek) {
    case 0: return rt.onSunday ?? false
    case 1: return rt.onMonday ?? false
    case 2: return rt.onTuesday ?? false
    case 3: return rt.onWednesday ?? false
    case 4: return rt.onThursday ?? false
    case 5: return rt.onFriday ?? false
    case 6: return rt.onSaturday ?? false
    default: return false
  }
}

function isAnyDayAvailable(dayOfWeek: number): boolean {
  // 如果任何選中的資源在該天可用，則顯示為可用
  return selectedResourceIds.value.some(resId => isDayAvailable(dayOfWeek, resId))
}

function getAvailableDaysText(resourceId: number): string {
  const rt = resourceTypes.value.get(resourceId)
  if (!rt) return '無'
  const days: string[] = []
  if (rt.onMonday) days.push('一')
  if (rt.onTuesday) days.push('二')
  if (rt.onWednesday) days.push('三')
  if (rt.onThursday) days.push('四')
  if (rt.onFriday) days.push('五')
  if (rt.onSaturday) days.push('六')
  if (rt.onSunday) days.push('日')
  return days.length ? days.join('、') : '無'
}

const selectedResources = computed(() => 
  resources.value.filter((r) => selectedResourceIds.value.includes(r.id))
)

// 使用第一個選中資源的類型作為通用類型（用於生成時段）
const commonResourceType = computed(() => {
  if (selectedResourceIds.value.length === 0) return null
  const firstRes = selectedResources.value[0]
  return resourceTypes.value.get(firstRes?.id) ?? null
})

function getSlotAssignments(day: WeekDay, slot: TimeSlot): Array<ResourceAssignment & { resourceId: number; resourceName: string }> {
  const slotStart = new Date(day.dateObj)
  slotStart.setHours(slot.hour, slot.minute, 0, 0)
  const slotEnd = new Date(day.dateObj)
  slotEnd.setHours(slot.endHour, slot.endMinute, 0, 0)

  const result: Array<ResourceAssignment & { resourceId: number; resourceName: string }> = []
  
  for (const resId of selectedResourceIds.value) {
    const resourceAssignments = assignments.value.get(resId) ?? []
    const resource = resources.value.find(r => r.id === resId)
    
    for (const a of resourceAssignments) {
      const from = new Date(a.from)
      const to = a.to ? new Date(a.to) : new Date(from.getTime() + 30 * 60 * 1000)
      if (from < slotEnd && to > slotStart) {
        result.push({
          ...a,
          resourceId: resId,
          resourceName: resource?.name ?? `資源 #${resId}`
        })
      }
    }
  }
  
  return result
}

function isSlotInSelection(day: WeekDay, slot: TimeSlot): boolean {
  if (!selectedStart.value) return false
  if (day.key !== selectedStart.value.day.key) return false
  
  const startIdx = selectedStart.value.slot.index
  const endIdx = selectedEnd.value?.slot.index ?? startIdx
  
  return slot.index >= startIdx && slot.index <= endIdx
}

function isSlotAvailableForSelection(day: WeekDay, slot: TimeSlot): boolean {
  // 檢查是否至少有一個選中的資源在該天可用
  if (!isAnyDayAvailable(day.dayOfWeek)) return false
  
  // 檢查是否所有選中的資源在該時段都可用
  const slotAssignments = getSlotAssignments(day, slot)
  if (slotAssignments.length > 0) return false
  
  const slotDate = new Date(day.dateObj)
  slotDate.setHours(slot.hour, slot.minute)
  if (slotDate < now) return false
  
  return true
}

function canSelectAsEnd(day: WeekDay, slot: TimeSlot): boolean {
  if (!selectedStart.value) return false
  if (day.key !== selectedStart.value.day.key) return false
  if (slot.index < selectedStart.value.slot.index) return false
  
  // 檢查中間所有時段是否可用（所有選中的資源都必須可用）
  const startIdx = selectedStart.value.slot.index
  for (let i = startIdx; i <= slot.index; i++) {
    const checkSlot = timeSlots.value[i]
    if (!checkSlot) return false
    const slotAssignments = getSlotAssignments(day, checkSlot)
    if (slotAssignments.length > 0) return false
  }
  
  return true
}

function getSlotClass(day: WeekDay, slot: TimeSlot): string {
  // 選中的時段
  if (isSlotInSelection(day, slot)) {
    return 'bg-brand-200 text-brand-700'
  }
  
  // 非營業日（所有資源都不可用）
  if (!isAnyDayAvailable(day.dayOfWeek)) {
    return 'bg-slate-200 text-slate-400 cursor-not-allowed'
  }
  
  // 已預約（至少有一個資源被預約）
  const slotAssignments = getSlotAssignments(day, slot)
  if (slotAssignments.length > 0) {
    return 'cursor-not-allowed'
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
  bookingColor.value = '#3b82f6' // 重置為預設顏色
}

function resetColor() {
  bookingColor.value = '#3b82f6' // 重置為預設藍色
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
  if (!auth.token.value || selectedResourceIds.value.length === 0 || !selectedStart.value || !selectedEnd.value || !bookingName.value.trim()) return

  submitting.value = true
  error.value = null

  try {
    const from = new Date(selectedStart.value.day.dateObj)
    from.setHours(selectedStart.value.slot.hour, selectedStart.value.slot.minute, 0, 0)
    const to = new Date(selectedEnd.value.day.dateObj)
    to.setHours(selectedEnd.value.slot.endHour, selectedEnd.value.slot.endMinute, 0, 0)

    // 為所有選中的資源創建預約
    const createdAssignments = await Promise.all(
      selectedResourceIds.value.map(resourceId =>
        createAssignment(auth.token.value!, {
          resourceId,
          name: bookingName.value.trim(),
          from,
          to,
        })
      )
    )

    // 為所有創建的預約保存顏色標籤
    if (bookingColor.value) {
      await Promise.all(
        createdAssignments.map(async (assignment: any) => {
          const assignmentId = assignment.id || assignment.S_ResourceAssignment_ID
          if (assignmentId) {
            try {
              await setAssignmentColor(auth.token.value!, assignmentId, bookingColor.value)
            } catch (e) {
              console.error(`Failed to save color for assignment ${assignmentId}:`, e)
            }
          }
        })
      )
    }

    resetSelection()
    await loadAllAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '預約失敗'
  } finally {
    submitting.value = false
  }
}

async function loadResources() {
  if (!auth.token.value) return
  resources.value = await listResources(auth.token.value)
  // 預設選擇第一個資源
  if (selectedResourceIds.value.length === 0 && resources.value.length) {
    selectedResourceIds.value = [resources.value[0].id]
  }
}

async function loadResourceTypes() {
  if (!auth.token.value) return
  const map = new Map<number, ResourceType>()
  for (const resId of selectedResourceIds.value) {
    const resource = resources.value.find(r => r.id === resId)
    if (resource) {
      try {
        const rt = await getResourceType(auth.token.value, resource.resourceTypeId)
        map.set(resId, rt)
      } catch (e) {
        console.error(`Failed to load resource type for resource ${resId}:`, e)
      }
    }
  }
  resourceTypes.value = map
}

async function loadAllAssignments() {
  if (!auth.token.value || selectedResourceIds.value.length === 0) return
  const map = new Map<number, ResourceAssignment[]>()
  const allAssignmentIds: number[] = []
  
  await Promise.all(
    selectedResourceIds.value.map(async (resId) => {
      try {
        const list = await listAssignmentsForRange(auth.token.value!, resId, weekStart, weekEnd)
        map.set(resId, list)
        allAssignmentIds.push(...list.map(a => a.id))
      } catch (e) {
        console.error(`Failed to load assignments for resource ${resId}:`, e)
        map.set(resId, [])
      }
    })
  )
  assignments.value = map

  // 批量載入所有預約的顏色配置
  if (allAssignmentIds.length > 0) {
    try {
      const colors = await getAssignmentColors(auth.token.value!, allAssignmentIds)
      assignmentColors.value = colors
    } catch (e) {
      console.error('Failed to load assignment colors:', e)
      assignmentColors.value = new Map()
    }
  } else {
    assignmentColors.value = new Map()
  }
}

function onResourceToggle(resourceId: number) {
  const index = selectedResourceIds.value.indexOf(resourceId)
  if (index > -1) {
    selectedResourceIds.value.splice(index, 1)
  } else {
    selectedResourceIds.value.push(resourceId)
  }
  // 當資源選擇改變時，重新載入相關數據
  reloadForSelectedResources()
}

async function reloadForSelectedResources() {
  error.value = null
  loading.value = true
  resetSelection()
  try {
    await loadResourceTypes()
    await loadAllAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入預約失敗'
  } finally {
    loading.value = false
  }
}

async function reload() {
  error.value = null
  loading.value = true
  resetSelection()
  try {
    await loadResources()
    await reloadForSelectedResources()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

watch(selectedResourceIds, async () => {
  await reloadForSelectedResources()
}, { deep: true })

onMounted(reload)
</script>
