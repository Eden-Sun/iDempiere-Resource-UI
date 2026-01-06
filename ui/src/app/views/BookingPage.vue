<template>
  <div class="space-y-6">
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h1 class="card-title">預約系統</h1>

        <!-- Mode Tabs -->
        <div class="tabs tabs-boxed mb-4">
          <button
            class="tab"
            :class="{ 'tab-active': viewMode === 'single' }"
            @click="viewMode = 'single'"
          >
            單一資源
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': viewMode === 'overlay' }"
            @click="viewMode = 'overlay'"
          >
            疊加觀看
          </button>
        </div>

        <!-- Single Mode: Resource Select + Color Picker -->
        <div v-if="viewMode === 'single'" class="flex flex-wrap items-end gap-4">
          <div class="form-control min-w-[220px]">
            <label class="label">
              <span class="label-text">選擇資源（醫師/諮詢師）</span>
            </label>
            <select v-model="selectedResourceId" class="select select-bordered select-sm">
              <option :value="null" disabled>請選擇</option>
              <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>

          <!-- Color Picker -->
          <div v-if="selectedResourceId" class="form-control">
            <label class="label">
              <span class="label-text">顏色標籤</span>
            </label>
            <div class="flex gap-2">
              <button
                v-for="c in RESOURCE_COLORS"
                :key="c"
                type="button"
                class="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                :class="[
                  `bg-${c}-500`,
                  resourceColors.get(selectedResourceId) === c ? 'border-base-content ring-2 ring-base-content ring-offset-2' : 'border-base-300 hover:border-base-content'
                ]"
                @click="onColorSelect(c)"
              />
            </div>
          </div>

          <button
            class="btn btn-outline btn-sm"
            :disabled="loading"
            type="button"
            @click="reload"
          >
            {{ loading ? '載入中…' : '重新整理' }}
          </button>
        </div>

        <!-- Overlay Mode: Checkbox Multi-Select -->
        <div v-else class="space-y-3">
          <label class="label">
            <span class="label-text">選擇要疊加顯示的資源</span>
          </label>
          <div class="flex flex-wrap gap-4">
            <label
              v-for="r in resources"
              :key="r.id"
              class="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                :class="`checkbox-${getResourceColor(r.id)}`"
                :checked="selectedResourceIds.includes(r.id)"
                @change="toggleResourceSelection(r.id)"
              />
              <span
                class="px-2 py-0.5 rounded text-sm"
                :class="`bg-${getResourceColor(r.id)}-100 text-${getResourceColor(r.id)}-700`"
              >
                {{ r.name }}
              </span>
            </label>
          </div>
          <button
            class="btn btn-outline btn-sm"
            :disabled="loading"
            type="button"
            @click="reload"
          >
            {{ loading ? '載入中…' : '重新整理' }}
          </button>
        </div>

        <div v-if="error" class="alert alert-error mt-4">
          {{ error }}
        </div>

        <!-- 時段資訊 (single mode only) -->
        <div v-if="viewMode === 'single' && resourceType" class="alert mt-4">
          <div class="text-xs">
            <span class="font-medium">營業時段：</span>
            {{ formatTime(resourceType.timeSlotStart) }} - {{ formatTime(resourceType.timeSlotEnd) }}
            <span class="ml-3 font-medium">營業日：</span>
            <span v-for="(day, idx) in availableDaysText" :key="idx">{{ day }}</span>
          </div>
        </div>

        <!-- 選擇提示 (single mode only) -->
        <div v-if="viewMode === 'single' && selectionMode" class="alert alert-info mt-4">
          <div class="text-sm">
            <template v-if="selectionMode === 'start'">
              <span class="font-semibold">步驟 1/2：</span> 請點選<span class="font-semibold">開始時段</span>
            </template>
            <template v-else-if="selectionMode === 'end'">
              <span class="font-semibold">步驟 2/2：</span> 已選開始 {{ selectedStart?.day.label }} {{ selectedStart?.slot.label.split(' - ')[0] }}，請點選<span class="font-semibold">結束時段</span>
              <button class="btn btn-ghost btn-xs ml-2" @click="resetSelection">重新選擇</button>
            </template>
          </div>
        </div>

        <!-- 時段網格 -->
        <div v-if="canShowCalendar" class="mt-6">
          <div class="mb-3 flex items-center justify-between">
            <div class="text-sm font-semibold">本週時段</div>
            <div class="flex items-center gap-3">
              <div class="text-xs opacity-60">{{ weekStart.toLocaleDateString() }} ～ {{ weekEnd.toLocaleDateString() }}</div>
              <template v-if="viewMode === 'single'">
                <button
                  v-if="!selectionMode"
                  class="btn btn-primary btn-xs"
                  @click="startSelection"
                >
                  新增預約
                </button>
                <button
                  v-if="selectionMode"
                  class="btn btn-outline btn-xs"
                  @click="resetSelection"
                >
                  取消選擇
                </button>
              </template>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th class="border border-base-300 bg-base-200 px-2 py-1 text-left">時間</th>
                  <th
                    v-for="day in weekDays"
                    :key="day.key"
                    class="border border-base-300 px-2 py-1 text-center min-w-[100px]"
                    :class="isDayAvailable(day.dayOfWeek) ? 'bg-base-200' : 'bg-base-300 opacity-50'"
                  >
                    {{ day.label }}<br /><span class="opacity-60">{{ day.date }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="slot in timeSlots" :key="slot.key">
                  <td class="border border-base-300 bg-base-200 px-2 py-1 font-medium whitespace-nowrap">
                    {{ slot.label }}
                  </td>
                  <td
                    v-for="day in weekDays"
                    :key="day.key + slot.key"
                    class="border border-base-300 px-1 py-1 align-top transition-colors"
                    :class="getSlotCellClass(day, slot)"
                    @click="onSlotClick(day, slot)"
                  >
                    <!-- Overlay Mode: Show all assignments -->
                    <template v-if="viewMode === 'overlay'">
                      <div
                        v-for="item in getSlotAssignments(day, slot)"
                        :key="item.assignment.id"
                        class="text-xs px-1 py-0.5 mb-0.5 rounded truncate"
                        :class="`bg-${item.color}-100 text-${item.color}-700`"
                        :title="`${item.resourceName}: ${item.assignment.name}`"
                      >
                        {{ item.assignment.name }}
                      </div>
                      <span v-if="getSlotAssignments(day, slot).length === 0 && isDayAvailable(day.dayOfWeek)" class="opacity-30">—</span>
                    </template>

                    <!-- Single Mode: Show single resource -->
                    <template v-else>
                      <span v-if="getSingleSlotAssignment(day, slot)" class="text-xs">
                        {{ getSingleSlotAssignment(day, slot)?.name || '已預約' }}
                      </span>
                      <span v-else-if="isSlotInSelection(day, slot)" class="text-primary font-semibold">✓</span>
                      <span v-else-if="!isDayAvailable(day.dayOfWeek)" class="opacity-30">—</span>
                      <span v-else class="opacity-50">—</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 新增預約表單 (single mode only) -->
        <div v-if="viewMode === 'single' && showBookingForm && selectedStart && selectedEnd" class="alert alert-info mt-6">
          <div class="w-full">
            <div class="font-semibold mb-2">確認預約</div>
            <div class="text-xs space-y-1 mb-3">
              <div><span class="font-medium">日期：</span>{{ selectedStart.day.label }} ({{ selectedStart.day.date }})</div>
              <div><span class="font-medium">時段：</span>{{ selectedStart.slot.label.split(' - ')[0] }} - {{ selectedEnd.slot.label.split(' - ')[1] }}</div>
              <div><span class="font-medium">時長：</span>{{ calculateDuration() }} 分鐘</div>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">預約名稱</span>
              </label>
              <input
                v-model="bookingName"
                class="input input-bordered input-sm"
                placeholder="例如：王小明 諮詢"
              />
            </div>
            <div class="flex gap-2 mt-3">
              <button
                class="btn btn-primary btn-sm"
                :disabled="submitting || !bookingName.trim()"
                @click="submitBooking"
              >
                {{ submitting ? '送出中…' : '確認預約' }}
              </button>
              <button
                class="btn btn-outline btn-sm"
                @click="resetSelection"
              >
                取消
              </button>
            </div>
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
  getResourceColors,
  setResourceColor,
  RESOURCE_COLORS,
  type Resource,
  type ResourceAssignment,
  type ResourceType,
  type ResourceColor,
} from '../../features/resource/api'

const auth = useAuth()

// View mode
const viewMode = ref<'single' | 'overlay'>('single')

// Resources
const resources = ref<Resource[]>([])
const resourceColors = ref<Map<number, ResourceColor>>(new Map())

// Single mode state
const selectedResourceId = ref<number | null>(null)
const resourceType = ref<ResourceType | null>(null)

// Overlay mode state
const selectedResourceIds = ref<number[]>([])

// Assignments (keyed by resourceId for overlay mode)
const assignmentsByResource = ref<Map<number, ResourceAssignment[]>>(new Map())

// UI state
const loading = ref(false)
const error = ref<string | null>(null)

// Selection state (single mode only)
const selectionMode = ref<'start' | 'end' | null>(null)
const selectedStart = ref<{ day: WeekDay; slot: TimeSlot } | null>(null)
const selectedEnd = ref<{ day: WeekDay; slot: TimeSlot } | null>(null)
const showBookingForm = ref(false)
const bookingName = ref('')
const submitting = ref(false)

// Week calculation
const now = new Date()
const weekStart = new Date(now)
weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
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

// Helper functions
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

function getResourceColor(resourceId: number): ResourceColor {
  return resourceColors.value.get(resourceId) || RESOURCE_COLORS[resourceId % RESOURCE_COLORS.length]
}

// Computed
const canShowCalendar = computed(() => {
  if (viewMode.value === 'single') {
    return selectedResourceId.value && resourceType.value
  }
  return selectedResourceIds.value.length > 0
})

const timeSlots = computed<TimeSlot[]>(() => {
  // For overlay mode, we need to merge time slots from all selected resources
  // For now, use a default 09:00-18:00 range, or from the first selected resource type
  let start = { hour: 9, minute: 0 }
  let end = { hour: 18, minute: 0 }

  if (viewMode.value === 'single' && resourceType.value) {
    const s = parseTimeString(resourceType.value.timeSlotStart)
    const e = parseTimeString(resourceType.value.timeSlotEnd)
    if (s) start = s
    if (e) end = e
  }

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
  if (viewMode.value === 'overlay') {
    // In overlay mode, show all days
    return true
  }
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

// Slot assignment helpers
function getSingleSlotAssignment(day: WeekDay, slot: TimeSlot): ResourceAssignment | null {
  if (!selectedResourceId.value) return null
  const assignments = assignmentsByResource.value.get(selectedResourceId.value) ?? []
  return findAssignmentInSlot(assignments, day, slot)
}

function getSlotAssignments(day: WeekDay, slot: TimeSlot): Array<{
  assignment: ResourceAssignment
  resourceId: number
  resourceName: string
  color: ResourceColor
}> {
  const result: Array<{
    assignment: ResourceAssignment
    resourceId: number
    resourceName: string
    color: ResourceColor
  }> = []

  for (const resourceId of selectedResourceIds.value) {
    const assignments = assignmentsByResource.value.get(resourceId) ?? []
    const assignment = findAssignmentInSlot(assignments, day, slot)
    if (assignment) {
      const resource = resources.value.find((r) => r.id === resourceId)
      result.push({
        assignment,
        resourceId,
        resourceName: resource?.name ?? `#${resourceId}`,
        color: getResourceColor(resourceId),
      })
    }
  }

  return result
}

function findAssignmentInSlot(assignments: ResourceAssignment[], day: WeekDay, slot: TimeSlot): ResourceAssignment | null {
  const slotStart = new Date(day.dateObj)
  slotStart.setHours(slot.hour, slot.minute, 0, 0)
  const slotEnd = new Date(day.dateObj)
  slotEnd.setHours(slot.endHour, slot.endMinute, 0, 0)

  return assignments.find((a) => {
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
  if (getSingleSlotAssignment(day, slot)) return false

  const slotDate = new Date(day.dateObj)
  slotDate.setHours(slot.hour, slot.minute)
  if (slotDate < now) return false

  return true
}

function canSelectAsEnd(day: WeekDay, slot: TimeSlot): boolean {
  if (!selectedStart.value) return false
  if (day.key !== selectedStart.value.day.key) return false
  if (slot.index < selectedStart.value.slot.index) return false

  const startIdx = selectedStart.value.slot.index
  for (let i = startIdx; i <= slot.index; i++) {
    const checkSlot = timeSlots.value[i]
    if (!checkSlot) return false
    if (getSingleSlotAssignment(day, checkSlot)) return false
  }

  return true
}

function getSlotCellClass(day: WeekDay, slot: TimeSlot): string {
  if (viewMode.value === 'overlay') {
    // Overlay mode: simpler styling
    if (!isDayAvailable(day.dayOfWeek)) return 'bg-base-200 opacity-50'
    return 'bg-base-100'
  }

  // Single mode
  if (isSlotInSelection(day, slot)) {
    const color = selectedResourceId.value ? getResourceColor(selectedResourceId.value) : 'blue'
    return `bg-${color}-100`
  }

  if (!isDayAvailable(day.dayOfWeek)) {
    return 'bg-base-200 opacity-50 cursor-not-allowed'
  }

  if (getSingleSlotAssignment(day, slot)) {
    return 'bg-error/10 text-error cursor-not-allowed'
  }

  const slotDate = new Date(day.dateObj)
  slotDate.setHours(slot.hour, slot.minute)
  if (slotDate < now) return 'bg-base-200 opacity-50 cursor-not-allowed'

  if (selectionMode.value === 'end') {
    if (canSelectAsEnd(day, slot)) {
      return 'hover:bg-primary/10 cursor-pointer'
    }
    return 'bg-base-200 opacity-50 cursor-not-allowed'
  }

  if (selectionMode.value === 'start') {
    return 'hover:bg-primary/10 cursor-pointer'
  }

  return 'bg-base-100'
}

// Event handlers
async function onColorSelect(color: ResourceColor) {
  if (!selectedResourceId.value || !auth.token.value) return
  resourceColors.value.set(selectedResourceId.value, color)
  await setResourceColor(auth.token.value, selectedResourceId.value, color)
}

function toggleResourceSelection(resourceId: number) {
  const idx = selectedResourceIds.value.indexOf(resourceId)
  if (idx >= 0) {
    selectedResourceIds.value.splice(idx, 1)
  } else {
    selectedResourceIds.value.push(resourceId)
  }
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
  if (viewMode.value === 'overlay') return // No click action in overlay mode
  if (!selectionMode.value) return
  if (!isSlotAvailableForSelection(day, slot)) return

  if (selectionMode.value === 'start') {
    selectedStart.value = { day, slot }
    selectedEnd.value = { day, slot }
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

// Data loading
async function loadResources() {
  if (!auth.token.value) return
  resources.value = await listResources(auth.token.value)
  if (!selectedResourceId.value && resources.value.length) {
    selectedResourceId.value = resources.value[0].id
  }
  // Load colors for all resources
  const ids = resources.value.map((r) => r.id)
  resourceColors.value = await getResourceColors(auth.token.value, ids)
}

async function loadResourceType() {
  if (!auth.token.value || !selectedResourceId.value) {
    resourceType.value = null
    return
  }
  const resource = resources.value.find((r) => r.id === selectedResourceId.value)
  if (resource) {
    resourceType.value = await getResourceType(auth.token.value, resource.resourceTypeId)
  }
}

async function loadAssignments() {
  if (!auth.token.value) return

  const idsToLoad = viewMode.value === 'single'
    ? (selectedResourceId.value ? [selectedResourceId.value] : [])
    : selectedResourceIds.value

  if (idsToLoad.length === 0) {
    assignmentsByResource.value.clear()
    return
  }

  const newMap = new Map<number, ResourceAssignment[]>()
  await Promise.all(
    idsToLoad.map(async (id) => {
      const assignments = await listAssignmentsForRange(auth.token.value!, id, weekStart, weekEnd)
      newMap.set(id, assignments)
    })
  )
  assignmentsByResource.value = newMap
}

async function reload() {
  error.value = null
  loading.value = true
  resetSelection()
  try {
    await loadResources()
    if (viewMode.value === 'single') {
      await loadResourceType()
    }
    await loadAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

// Watchers
watch(selectedResourceId, async () => {
  if (viewMode.value !== 'single') return
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

watch(selectedResourceIds, async () => {
  if (viewMode.value !== 'overlay') return
  error.value = null
  loading.value = true
  try {
    await loadAssignments()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入預約失敗'
  } finally {
    loading.value = false
  }
}, { deep: true })

watch(viewMode, async () => {
  error.value = null
  resetSelection()
  if (viewMode.value === 'overlay' && selectedResourceIds.value.length === 0 && resources.value.length > 0) {
    // Auto-select first 2 resources for overlay
    selectedResourceIds.value = resources.value.slice(0, 2).map((r) => r.id)
  }
  await loadAssignments()
})

onMounted(reload)
</script>
