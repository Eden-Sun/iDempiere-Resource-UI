<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">管理員：行事曆</h1>
      <p class="mt-1 text-sm text-slate-600">查看所有資源的預約狀況，可新增或刪除預約。</p>
    </div>

    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <select v-model="selectedResourceId" class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option :value="null">全部資源</option>
            <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <div class="text-xs text-slate-500">{{ weekStart.toLocaleDateString() }} ～ {{ weekEnd.toLocaleDateString() }}</div>
        </div>
        <button
          class="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          :disabled="loading"
          @click="reload"
        >
          {{ loading ? '載入中…' : '重新整理' }}
        </button>
      </div>

      <p v-if="error" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {{ error }}
      </p>

      <!-- 時段網格 -->
      <div class="mt-4 overflow-x-auto">
        <table class="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th class="border border-slate-200 bg-slate-50 px-2 py-1 text-left w-16">時間</th>
              <th v-for="day in weekDays" :key="day.key" class="border border-slate-200 bg-slate-50 px-2 py-1 text-center min-w-[140px]">
                {{ day.label }}<br /><span class="text-slate-400">{{ day.date }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="hour in hours" :key="hour">
              <td class="border border-slate-200 bg-slate-50 px-2 py-1 font-medium whitespace-nowrap align-top">
                {{ hour }}:00
              </td>
              <td
                v-for="day in weekDays"
                :key="day.key + hour"
                class="border border-slate-200 p-0 align-top h-12 relative"
              >
                <!-- 30分鐘分隔線 -->
                <div class="absolute inset-0 pointer-events-none">
                  <div class="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-200"></div>
                </div>
                <!-- 預約條 -->
                <div class="relative h-full">
                  <div
                    v-for="a in getHourAssignments(day, hour)"
                    :key="a.id"
                    class="absolute flex items-center gap-1 rounded text-xs px-1 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                    :style="{
                      left: `${a.leftPercent}%`,
                      width: `${a.widthPercent}%`,
                      top: `${a.column * 24}px`,
                      height: '22px',
                      backgroundColor: getAssignmentColor(a.id, a.resourceId) + '40',
                      color: getAssignmentColor(a.id, a.resourceId),
                      borderLeft: `3px solid ${getAssignmentColor(a.id, a.resourceId)}`,
                      zIndex: activePopout && activePopout.assignment.id === a.id ? 20 : 10,
                    }"
                    @click="showPopout($event, a)"
                    @mouseenter="showPopout($event, a)"
                    @mouseleave="hidePopout"
                  >
                    <span class="truncate font-medium">{{ a.resourceName }}: {{ a.name || '—' }}</span>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 新增預約 -->
      <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="text-sm font-semibold text-slate-900">快速新增預約</div>
        <div class="mt-3 grid gap-3 sm:grid-cols-5">
          <select v-model="newResourceId" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
            <option :value="null" disabled>選擇資源</option>
            <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <select v-model="newDay" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
            <option :value="null" disabled>選擇日期</option>
            <option v-for="d in weekDays" :key="d.key" :value="d.key">{{ d.label }} {{ d.date }}</option>
          </select>
          <select v-model="newSlot" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
            <option :value="null" disabled>選擇時段</option>
            <option v-for="s in timeSlots" :key="s.key" :value="s.key">{{ s.label }}</option>
          </select>
          <input v-model="newName" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" placeholder="預約名稱" />
          <button
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="submitting || !newResourceId || !newDay || !newSlot || !newName.trim()"
            @click="submitNew"
          >
            {{ submitting ? '…' : '新增' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Popout 資訊卡 -->
    <Teleport to="body">
      <div
        v-if="activePopout"
        class="fixed z-50 rounded-lg bg-white shadow-xl border border-slate-200 p-3 min-w-[200px] max-w-[280px]"
        :style="popoutStyle"
        @mouseenter="keepPopout"
        @mouseleave="hidePopout"
      >
        <div class="flex items-start justify-between gap-2">
          <div
            class="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
            :style="{ backgroundColor: getAssignmentColor(activePopout.assignment.id, activePopout.assignment.resourceId) }"
          ></div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm text-slate-900 truncate">{{ activePopout.assignment.name || '—' }}</div>
            <div class="text-xs text-slate-500 mt-0.5">{{ activePopout.assignment.resourceName }}</div>
          </div>
        </div>
        <div class="mt-2 text-xs text-slate-600 space-y-1">
          <div class="flex items-center gap-1">
            <span class="text-slate-400">開始:</span>
            <span>{{ formatDateTime(activePopout.assignment.from) }}</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-slate-400">結束:</span>
            <span>{{ formatDateTime(activePopout.assignment.to) }}</span>
          </div>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-100">
          <button
            class="w-full rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
            @click="confirmDeleteFromPopout"
          >
            刪除預約
          </button>
        </div>
      </div>
    </Teleport>

    <!-- 刪除確認 Modal -->
    <div v-if="deleteTarget" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="deleteTarget = null">
      <div class="rounded-xl bg-white p-6 shadow-xl">
        <div class="text-sm font-semibold">確定刪除此預約？</div>
        <div class="mt-2 text-xs text-slate-600">{{ deleteTarget.name }} ({{ deleteTarget.from }})</div>
        <div class="mt-4 flex gap-2">
          <button class="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700" @click="doDelete">刪除</button>
          <button class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm" @click="deleteTarget = null">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuth } from '../../features/auth/store'
import { listResources, listAssignmentsForRange, createAssignment, deleteAssignment, getAssignmentColors, type Resource, type ResourceAssignment } from '../../features/resource/api'

// 預約在小時格內的顯示資訊
type HourAssignment = ResourceAssignment & {
  resourceId: number
  resourceName: string
  leftPercent: number
  widthPercent: number
  column: number
}

const auth = useAuth()

const resources = ref<Resource[]>([])
const selectedResourceId = ref<number | null>(null)
const allAssignments = ref<Map<number, ResourceAssignment[]>>(new Map())
const loading = ref(false)
const error = ref<string | null>(null)

// 新增
const newResourceId = ref<number | null>(null)
const newDay = ref<string | null>(null)
const newSlot = ref<string | null>(null)
const newName = ref('')
const submitting = ref(false)

// 刪除
const deleteTarget = ref<(ResourceAssignment & { resourceId: number }) | null>(null)

// Popout
const activePopout = ref<{ assignment: HourAssignment; x: number; y: number } | null>(null)
let hidePopoutTimer: ReturnType<typeof setTimeout> | null = null

function showPopout(e: MouseEvent | TouchEvent, assignment: HourAssignment) {
  e.stopPropagation()
  // 取消隱藏計時器
  if (hidePopoutTimer) {
    clearTimeout(hidePopoutTimer)
    hidePopoutTimer = null
  }
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  activePopout.value = {
    assignment,
    x: rect.left + rect.width / 2,
    y: rect.bottom + 4,
  }
}

function hidePopout() {
  // 延遲隱藏，讓滑鼠有時間移到 popout
  hidePopoutTimer = setTimeout(() => {
    activePopout.value = null
  }, 150)
}

function keepPopout() {
  // 滑鼠進入 popout 時，取消隱藏計時器
  if (hidePopoutTimer) {
    clearTimeout(hidePopoutTimer)
    hidePopoutTimer = null
  }
}

const popoutStyle = computed(() => {
  if (!activePopout.value) return {}
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 300 : 1000
  return {
    left: `${Math.min(activePopout.value.x, maxX)}px`,
    top: `${activePopout.value.y}px`,
    transform: 'translateX(-50%)',
  }
})

function confirmDeleteFromPopout() {
  if (activePopout.value) {
    deleteTarget.value = activePopout.value.assignment
    activePopout.value = null
  }
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 顏色配置
const assignmentColors = ref<Map<number, string>>(new Map())
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

function getAssignmentColor(assignmentId: number, resourceId: number): string {
  return assignmentColors.value.get(assignmentId) || getResourceColor(resourceId)
}

const now = new Date()
const weekStart = new Date(now)
weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
weekStart.setHours(0, 0, 0, 0)
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 7)

const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]

// 30分鐘時段選項（用於新增預約）
type TimeSlot = { key: string; label: string; hour: number; minute: number }
const timeSlots: TimeSlot[] = []
for (let h = 9; h < 18; h++) {
  timeSlots.push({ key: `${h}00`, label: `${h}:00`, hour: h, minute: 0 })
  timeSlots.push({ key: `${h}30`, label: `${h}:30`, hour: h, minute: 30 })
}

const weekDays = computed(() => {
  const days = ['一', '二', '三', '四', '五', '六', '日']
  return days.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return { key: `d${i}`, label: `週${label}`, date: `${d.getMonth() + 1}/${d.getDate()}`, dateObj: new Date(d) }
  })
})

function getHourAssignments(day: { dateObj: Date }, hour: number): HourAssignment[] {
  const hourStart = new Date(day.dateObj)
  hourStart.setHours(hour, 0, 0, 0)
  const hourEnd = new Date(hourStart)
  hourEnd.setHours(hour + 1)

  const rawAssignments: Array<ResourceAssignment & { resourceId: number; resourceName: string; from: Date; to: Date }> = []

  for (const r of resources.value) {
    if (selectedResourceId.value && r.id !== selectedResourceId.value) continue
    const assignments = allAssignments.value.get(r.id) ?? []
    for (const a of assignments) {
      const from = new Date(a.from)
      const to = a.to ? new Date(a.to) : new Date(from.getTime() + 30 * 60 * 1000)
      // 檢查預約與小時是否有重疊
      if (from < hourEnd && to > hourStart) {
        rawAssignments.push({ ...a, resourceId: r.id, resourceName: r.name, from, to })
      }
    }
  }

  // 計算每個預約在格內的位置和寬度
  const result: HourAssignment[] = []

  // 先按開始時間排序
  rawAssignments.sort((a, b) => a.from.getTime() - b.from.getTime())

  // 分配欄位（處理重疊的預約）
  const columns: Array<{ endTime: number }> = []

  for (const a of rawAssignments) {
    // 計算在這個小時內的起止時間
    const effectiveStart = Math.max(a.from.getTime(), hourStart.getTime())
    const effectiveEnd = Math.min(a.to.getTime(), hourEnd.getTime())

    // 轉換成百分比 (0-100%)
    const leftPercent = ((effectiveStart - hourStart.getTime()) / (60 * 60 * 1000)) * 100
    const widthPercent = ((effectiveEnd - effectiveStart) / (60 * 60 * 1000)) * 100

    // 找一個可用的欄位
    let column = 0
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].endTime <= effectiveStart) {
        column = i
        columns[i].endTime = effectiveEnd
        break
      }
      column = i + 1
    }
    if (column >= columns.length) {
      columns.push({ endTime: effectiveEnd })
    } else {
      columns[column].endTime = effectiveEnd
    }

    result.push({
      ...a,
      from: a.from.toISOString(),
      to: a.to.toISOString(),
      leftPercent,
      widthPercent,
      column,
    })
  }

  return result
}

function getMaxColumns(day: { dateObj: Date }, hour: number): number {
  const assignments = getHourAssignments(day, hour)
  if (assignments.length === 0) return 1
  return Math.max(...assignments.map(a => a.column)) + 1
}

async function loadAll() {
  if (!auth.token.value) return
  resources.value = await listResources(auth.token.value)
  const map = new Map<number, ResourceAssignment[]>()
  const allAssignmentIds: number[] = []
  await Promise.all(
    resources.value.map(async (r) => {
      const list = await listAssignmentsForRange(auth.token.value!, r.id, weekStart, weekEnd)
      map.set(r.id, list)
      allAssignmentIds.push(...list.map(a => a.id))
    }),
  )
  allAssignments.value = map

  // 載入所有預約的顏色配置
  if (allAssignmentIds.length > 0) {
    try {
      assignmentColors.value = await getAssignmentColors(auth.token.value!, allAssignmentIds)
    } catch (e) {
      console.error('Failed to load assignment colors:', e)
      assignmentColors.value = new Map()
    }
  }
}

async function reload() {
  error.value = null
  loading.value = true
  try {
    await loadAll()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入失敗'
  } finally {
    loading.value = false
  }
}

function confirmDelete(a: ResourceAssignment & { resourceId: number }) {
  deleteTarget.value = a
}

async function doDelete() {
  if (!auth.token.value || !deleteTarget.value) return
  try {
    await deleteAssignment(auth.token.value, deleteTarget.value.id)
    deleteTarget.value = null
    await reload()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '刪除失敗'
  }
}

async function submitNew() {
  if (!auth.token.value || !newResourceId.value || !newDay.value || !newSlot.value || !newName.value.trim()) return
  submitting.value = true
  error.value = null
  try {
    const dayObj = weekDays.value.find((d) => d.key === newDay.value)!
    const slotObj = timeSlots.find((s) => s.key === newSlot.value)!
    const from = new Date(dayObj.dateObj)
    from.setHours(slotObj.hour, slotObj.minute, 0, 0)
    const to = new Date(from)
    to.setMinutes(to.getMinutes() + 30)
    await createAssignment(auth.token.value, { resourceId: newResourceId.value, name: newName.value.trim(), from, to })
    newName.value = ''
    await reload()
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '新增失敗'
  } finally {
    submitting.value = false
  }
}

watch(selectedResourceId, () => {})

onMounted(reload)
</script>

