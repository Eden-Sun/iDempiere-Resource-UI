<template>
  <div class="dynamic-form">
    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-pulse text-slate-500">載入表單中...</div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-lg border border-rose-200 bg-rose-50 p-4">
      <p class="text-sm text-rose-700">{{ error }}</p>
      <button
        type="button"
        class="mt-2 text-sm text-rose-600 underline hover:text-rose-700"
        @click="loadFields"
      >
        重試
      </button>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit">
      <div
        v-if="formError"
        class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-line"
      >
        {{ formError }}
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <DynamicField
          v-for="field in visibleFields"
          :key="field.id"
          v-model="formData[field.columnName]"
          :field="field"
          :show-help="showHelp"
        />
      </div>

      <slot name="actions">
        <div class="mt-6 flex gap-3">
          <button
            type="submit"
            :disabled="submitting"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {{ submitting ? '儲存中...' : submitLabel }}
          </button>
          <button
            v-if="showCancel"
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="emit('cancel')"
          >
            取消
          </button>
        </div>
      </slot>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import DynamicField from './DynamicField.vue'
import { type TabField, getTabFieldsWithMeta, getFieldVisibility, ReferenceType } from '../features/window/api'
import { useAuth } from '../features/auth/store'

const props = withDefaults(
  defineProps<{
    windowSlug: string
    tabSlug: string
    excludeFields?: string[]
    defaultValues?: Record<string, unknown>
    submitLabel?: string
    showCancel?: boolean
    showHelp?: boolean
    showOnlyMandatory?: boolean
    essentialFields?: string[]  // Whitelist of essential fields to show
  }>(),
  {
    excludeFields: () => [],
    defaultValues: () => ({}),
    submitLabel: '儲存',
    showCancel: false,
    showHelp: false,
    showOnlyMandatory: false,
    essentialFields: () => [],
  },
)

const emit = defineEmits<{
  (e: 'submit', data: Record<string, unknown>): void
  (e: 'cancel'): void
  (e: 'loaded', fields: TabField[]): void
}>()

const auth = useAuth()

const fields = ref<TabField[]>([])
const formData = reactive<Record<string, unknown>>({})
const loading = ref(false)
const error = ref<string | null>(null)
const submitting = ref(false)
const formError = ref<string | null>(null)
const adminHiddenFields = ref<string[]>([])  // Admin-configured hidden fields

// System fields to exclude by default
// Note: AD_Org_ID is NOT excluded - users should be able to select organization
const systemFields = [
  'AD_Client_ID',
  'Created',
  'CreatedBy',
  'Updated',
  'UpdatedBy',
  'IsActive',
]

const visibleFields = computed(() => {
  const filtered = fields.value.filter((f) => {
    const colName = f.columnName
    // Exclude system fields
    if (systemFields.includes(colName)) return false
    // Exclude explicitly excluded fields
    if (props.excludeFields.includes(colName)) return false
    // Exclude key fields (auto-generated IDs)
    if (f.column?.isKey) return false
    // Exclude parent link fields
    if (f.column?.isParent) return false
    // Exclude UU fields
    if (colName.endsWith('_UU')) return false
    // Exclude button types
    if (f.column?.referenceId === ReferenceType.Button) return false
    // Exclude fields not displayed (IsDisplayed = false or SeqNo = 0)
    if (!f.isDisplayed || f.seqNo === 0) return false

    // Exclude admin-configured hidden fields
    if (adminHiddenFields.value.includes(colName)) return false

    // If essentialFields whitelist is provided, only show those fields
    if (props.essentialFields.length > 0) {
      // Show field if it's in the whitelist OR if it's mandatory
      if (!props.essentialFields.includes(colName) && !f.column?.isMandatory) {
        return false
      }
    } else if (props.showOnlyMandatory) {
      // Fallback: If showOnlyMandatory is enabled, exclude non-mandatory fields
      if (!f.column?.isMandatory) return false
    }

    return true
  })

  // Sort by SeqNo (window tab field sequence)
  return filtered.sort((a, b) => a.seqNo - b.seqNo)
})

async function loadFields() {
  if (!auth.token.value) {
    error.value = '未登入'
    return
  }

  loading.value = true
  error.value = null
  formError.value = null

  try {
    // Load fields metadata
    fields.value = await getTabFieldsWithMeta(auth.token.value, props.windowSlug, props.tabSlug, auth.language.value)

    // Load admin-configured field visibility
    const fieldVisibility = await getFieldVisibility(auth.token.value, props.windowSlug, props.tabSlug)
    adminHiddenFields.value = fieldVisibility?.hiddenFields || []

    // Initialize form data with defaults
    for (const field of visibleFields.value) {
      if (!(field.columnName in formData)) {
        // Check if a default value is provided via props
        if (field.columnName in props.defaultValues) {
          formData[field.columnName] = props.defaultValues[field.columnName]
        } else {
          formData[field.columnName] = getDefaultValue(field)
        }
      }
    }

    emit('loaded', fields.value)
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入表單失敗'
  } finally {
    loading.value = false
  }
}

function getDefaultValue(field: TabField): unknown {
  if (!field.column) return null
  switch (field.column.referenceId) {
    case ReferenceType.YesNo:
      return false
    case ReferenceType.Integer:
    case ReferenceType.Number:
    case ReferenceType.Amount:
      return null
    default:
      return null
  }
}

function handleSubmit() {
  formError.value = null
  // Build data object, include all non-empty values
  const data: Record<string, unknown> = {}
  for (const field of visibleFields.value) {
    const val = formData[field.columnName]
    if (val !== null && val !== undefined && val !== '') {
      data[field.columnName] = val
    }
  }
  emit('submit', data)
}

/**
 * 找出可能缺少的必填欄位（用於後端報錯時輔助提示）
 * 回傳格式：「標籤 (欄位名)」
 */
function getMissingMandatoryFields(): string[] {
  const missing: string[] = []
  // 從 fields.value 檢查所有欄位（包含被隱藏的）
  for (const f of fields.value) {
    if (!f.column?.isMandatory) continue
    // 跳過系統自動處理的欄位
    if (systemFields.includes(f.columnName)) continue
    // 跳過 key/parent 欄位
    if (f.column.isKey || f.column.isParent) continue
    // 跳過 UU 欄位
    if (f.columnName.endsWith('_UU')) continue
    // 跳過被明確排除的欄位
    if (props.excludeFields.includes(f.columnName)) continue
    
    const val = formData[f.columnName]
    // YesNo: false 也是合法值
    if (f.column.referenceId === ReferenceType.YesNo) continue
    if (val === null || val === undefined || val === '') {
      const label = f.name || f.columnName
      missing.push(`${label} (${f.columnName})`)
    }
  }
  return missing
}

// Expose methods for parent components
defineExpose({
  formData,
  fields,
  reload: loadFields,
  setSubmitting: (val: boolean) => {
    submitting.value = val
  },
  setFormError: (msg: string | null) => {
    formError.value = msg
  },
  getMissingMandatoryFields,
})

// Watch for tab changes
watch([() => props.windowSlug, () => props.tabSlug], loadFields)

onMounted(loadFields)
</script>
