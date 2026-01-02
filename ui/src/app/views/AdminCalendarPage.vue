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
              <th class="border border-slate-200 bg-slate-50 px-2 py-1 text-left">時間</th>
              <th v-for="day in weekDays" :key="day.key" class="border border-slate-200 bg-slate-50 px-2 py-1 text-center min-w-[100px]">
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
                class="border border-slate-200 px-1 py-1 align-top"
              >
                <div v-for="a in getSlotAssignments(day, hour)" :key="a.id" class="mb-1 flex items-center justify-between gap-1 rounded bg-brand-100 px-1.5 py-0.5 text-brand-800">
                  <span class="truncate">{{ a.resourceName }}: {{ a.name || '—' }}</span>
                  <button class="text-rose-500 hover:text-rose-700" title="刪除" @click="confirmDelete(a)">×</button>
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
          <select v-model="newHour" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
            <option :value="null" disabled>選擇時段</option>
            <option v-for="h in hours" :key="h" :value="h">{{ h }}:00</option>
          </select>
          <input v-model="newName" class="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm" placeholder="預約名稱" />
          <button
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            :disabled="submitting || !newResourceId || !newDay || !newHour || !newName.trim()"
            @click="submitNew"
          >
            {{ submitting ? '…' : '新增' }}
          </button>
        </div>
      </div>
    </div>

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
import { listResources, listAssignmentsForRange, createAssignment, deleteAssignment, type Resource, type ResourceAssignment } from '../../features/resource/api'

const auth = useAuth()

const resources = ref<Resource[]>([])
const selectedResourceId = ref<number | null>(null)
const allAssignments = ref<Map<number, ResourceAssignment[]>>(new Map())
const loading = ref(false)
const error = ref<string | null>(null)

// 新增
const newResourceId = ref<number | null>(null)
const newDay = ref<string | null>(null)
const newHour = ref<number | null>(null)
const newName = ref('')
const submitting = ref(false)

// 刪除
const deleteTarget = ref<(ResourceAssignment & { resourceId: number }) | null>(null)

const now = new Date()
const weekStart = new Date(now)
weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
weekStart.setHours(0, 0, 0, 0)
const weekEnd = new Date(weekStart)
weekEnd.setDate(weekStart.getDate() + 7)

const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17]

const weekDays = computed(() => {
  const days = ['一', '二', '三', '四', '五', '六', '日']
  return days.map((label, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return { key: `d${i}`, label: `週${label}`, date: `${d.getMonth() + 1}/${d.getDate()}`, dateObj: new Date(d) }
  })
})

function getSlotAssignments(day: { dateObj: Date }, hour: number) {
  const slotStart = new Date(day.dateObj)
  slotStart.setHours(hour, 0, 0, 0)
  const slotEnd = new Date(slotStart)
  slotEnd.setHours(hour + 1)

  const result: (ResourceAssignment & { resourceId: number; resourceName: string })[] = []
  for (const r of resources.value) {
    if (selectedResourceId.value && r.id !== selectedResourceId.value) continue
    const assignments = allAssignments.value.get(r.id) ?? []
    for (const a of assignments) {
      const from = new Date(a.from)
      if (from >= slotStart && from < slotEnd) {
        result.push({ ...a, resourceId: r.id, resourceName: r.name })
      }
    }
  }
  return result
}

async function loadAll() {
  if (!auth.token.value) return
  resources.value = await listResources(auth.token.value)
  const map = new Map<number, ResourceAssignment[]>()
  await Promise.all(
    resources.value.map(async (r) => {
      const list = await listAssignmentsForRange(auth.token.value!, r.id, weekStart, weekEnd)
      map.set(r.id, list)
    }),
  )
  allAssignments.value = map
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
  if (!auth.token.value || !newResourceId.value || !newDay.value || newHour.value == null || !newName.value.trim()) return
  submitting.value = true
  error.value = null
  try {
    const dayObj = weekDays.value.find((d) => d.key === newDay.value)!
    const from = new Date(dayObj.dateObj)
    from.setHours(newHour.value, 0, 0, 0)
    const to = new Date(from)
    to.setHours(newHour.value + 1)
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

