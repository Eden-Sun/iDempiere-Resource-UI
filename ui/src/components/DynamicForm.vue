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
import { type TabField, getTabFieldsWithMeta, ReferenceType } from '../features/window/api'
import { useAuth } from '../features/auth/store'

const props = withDefaults(
  defineProps<{
    windowSlug: string
    tabSlug: string
    excludeFields?: string[]
    submitLabel?: string
    showCancel?: boolean
    showHelp?: boolean
  }>(),
  {
    excludeFields: () => [],
    submitLabel: '儲存',
    showCancel: false,
    showHelp: false,
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

// System fields to exclude by default
const systemFields = [
  'AD_Client_ID',
  'AD_Org_ID',
  'Created',
  'CreatedBy',
  'Updated',
  'UpdatedBy',
  'IsActive',
]

// Fields that are read-only (key fields, calculated)
const readOnlyPatterns = ['_ID', '_UU']

const visibleFields = computed(() => {
  return fields.value.filter((f) => {
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
    return true
  })
})

async function loadFields() {
  if (!auth.token.value) {
    error.value = '未登入'
    return
  }

  loading.value = true
  error.value = null

  try {
    fields.value = await getTabFieldsWithMeta(auth.token.value, props.windowSlug, props.tabSlug)

    // Initialize form data with defaults
    for (const field of visibleFields.value) {
      if (!(field.columnName in formData)) {
        formData[field.columnName] = getDefaultValue(field)
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
  // Build clean data object (remove nulls/undefined for optional fields)
  const data: Record<string, unknown> = {}
  for (const field of visibleFields.value) {
    const val = formData[field.columnName]
    if (val !== null && val !== undefined && val !== '') {
      data[field.columnName] = val
    } else if (field.column?.isMandatory) {
      // Include mandatory fields even if empty (will trigger validation)
      data[field.columnName] = val
    }
  }
  emit('submit', data)
}

// Expose methods for parent components
defineExpose({
  formData,
  fields,
  reload: loadFields,
  setSubmitting: (val: boolean) => {
    submitting.value = val
  },
})

// Watch for tab changes
watch([() => props.windowSlug, () => props.tabSlug], loadFields)

onMounted(loadFields)
</script>
