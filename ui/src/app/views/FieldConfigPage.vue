<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">欄位顯示配置</h1>
      <p class="mt-1 text-sm text-slate-600">
        配置表單中哪些欄位顯示或隱藏（需要 Admin 權限）
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Window/Tab Selector -->
      <div class="lg:col-span-1">
        <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 class="text-sm font-semibold text-slate-800 mb-3">選擇視窗/頁籤</h2>

          <div class="space-y-1">
            <button
              v-for="tab in availableTabs"
              :key="`${tab.windowSlug}-${tab.tabSlug}`"
              type="button"
              class="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-slate-100 transition"
              :class="
                selectedWindow === tab.windowSlug && selectedTab === tab.tabSlug
                  ? 'bg-brand-100 text-brand-700 font-medium'
                  : 'text-slate-700'
              "
              @click="selectTab(tab.windowSlug, tab.tabSlug, tab.windowName, tab.tabName)"
            >
              <div>{{ tab.windowName }}</div>
              <div class="text-xs text-slate-500">{{ tab.tabName }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Field Configuration -->
      <div class="lg:col-span-2">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div v-if="!selectedWindow || !selectedTab" class="text-center py-12 text-slate-500">
            請從左側選擇視窗/頁籤
          </div>

          <div v-else-if="loading" class="text-center py-12">
            <div class="animate-pulse text-slate-500">載入欄位中...</div>
          </div>

          <div v-else>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-semibold text-slate-800">
                {{ selectedWindowName }} / {{ selectedTabName }}
              </h2>
              <button
                type="button"
                class="text-sm text-brand-600 hover:text-brand-700"
                @click="resetToDefault"
              >
                重設為預設
              </button>
            </div>

            <div v-if="error" class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {{ error }}
            </div>

            <div v-if="successMessage" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {{ successMessage }}
            </div>

            <div class="mb-4 text-sm text-slate-600">
              勾選要<strong>隱藏</strong>的欄位（不勾選=顯示）
            </div>

            <div class="max-h-96 overflow-y-auto space-y-2 mb-4">
              <label
                v-for="field in fields"
                :key="field.columnName"
                class="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :checked="hiddenFields.includes(field.columnName)"
                  @change="toggleField(field.columnName)"
                  class="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <div class="flex-1">
                  <div class="text-sm font-medium text-slate-900">{{ field.name }}</div>
                  <div class="text-xs text-slate-500">{{ field.columnName }}</div>
                </div>
              </label>
            </div>

            <div class="flex gap-3">
              <button
                type="button"
                @click="saveConfiguration"
                :disabled="saving"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {{ saving ? '儲存中...' : '儲存配置' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../../features/auth/store'
import { type TabField, getTabFieldsWithMeta, getFieldVisibility, setFieldVisibility } from '../../features/window/api'

const auth = useAuth()

// Available tabs to configure (hardcoded for now, can be dynamic later)
const availableTabs = [
  { windowSlug: 'business-partner', tabSlug: 'business-partner', windowName: '業務夥伴', tabName: '業務夥伴' },
  { windowSlug: 'business-partner', tabSlug: 'contact-user', windowName: '業務夥伴', tabName: '聯絡人' },
  { windowSlug: 'business-partner', tabSlug: 'location', windowName: '業務夥伴', tabName: '地址' },
]

// Selected window/tab
const selectedWindow = ref<string | null>(null)
const selectedTab = ref<string | null>(null)
const selectedWindowName = ref<string>('')
const selectedTabName = ref<string>('')

// Fields and configuration
const fields = ref<TabField[]>([])
const hiddenFields = ref<string[]>([])

// UI state
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

async function selectTab(windowSlug: string, tabSlug: string, windowName: string, tabName: string) {
  selectedWindow.value = windowSlug
  selectedTab.value = tabSlug
  selectedWindowName.value = windowName
  selectedTabName.value = tabName
  error.value = null
  successMessage.value = null

  await loadFields()
}

async function loadFields() {
  if (!auth.token.value || !selectedWindow.value || !selectedTab.value) return

  loading.value = true
  error.value = null

  try {
    // Load fields
    fields.value = await getTabFieldsWithMeta(
      auth.token.value,
      selectedWindow.value,
      selectedTab.value,
      auth.language.value
    )

    // Load existing configuration
    const config = await getFieldVisibility(
      auth.token.value,
      selectedWindow.value,
      selectedTab.value
    )

    hiddenFields.value = config?.hiddenFields || []
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入欄位失敗'
  } finally {
    loading.value = false
  }
}

function toggleField(columnName: string) {
  const index = hiddenFields.value.indexOf(columnName)
  if (index > -1) {
    hiddenFields.value.splice(index, 1)
  } else {
    hiddenFields.value.push(columnName)
  }
}

async function saveConfiguration() {
  if (!auth.token.value || !selectedWindow.value || !selectedTab.value) return

  saving.value = true
  error.value = null
  successMessage.value = null

  try {
    const success = await setFieldVisibility(
      auth.token.value,
      selectedWindow.value,
      selectedTab.value,
      hiddenFields.value
    )

    if (success) {
      successMessage.value = '配置已儲存'
    } else {
      error.value = '儲存失敗（可能需要 Admin 權限）'
    }
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '儲存失敗'
  } finally {
    saving.value = false
  }
}

function resetToDefault() {
  hiddenFields.value = []
}
</script>
