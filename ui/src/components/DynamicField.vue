<template>
  <div class="dynamic-field">
    <label :for="fieldId" class="block text-sm font-medium text-slate-700">
      {{ labelText }}
      <span v-if="isRequired" class="text-rose-500">*</span>
    </label>

    <!-- Text Input -->
    <input
      v-if="inputType === 'text'"
      :id="fieldId"
      v-model="localValue"
      type="text"
      :maxlength="maxLength"
      :required="isRequired"
      :placeholder="field.description"
      :class="inputClass"
    />

    <!-- Number Input -->
    <input
      v-else-if="inputType === 'number'"
      :id="fieldId"
      v-model.number="localValue"
      type="number"
      :required="isRequired"
      :placeholder="field.description"
      :class="inputClass"
    />

    <!-- Checkbox (Yes/No) -->
    <div v-else-if="inputType === 'checkbox'" class="mt-2 flex items-center">
      <input
        :id="fieldId"
        v-model="localValue"
        type="checkbox"
        class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
      />
      <span class="ml-2 text-sm text-slate-600">{{ field.description }}</span>
    </div>

    <!-- Date Input -->
    <input
      v-else-if="inputType === 'date'"
      :id="fieldId"
      v-model="localValue"
      type="date"
      :required="isRequired"
      :class="inputClass"
    />

    <!-- DateTime Input -->
    <input
      v-else-if="inputType === 'datetime'"
      :id="fieldId"
      v-model="localValue"
      type="datetime-local"
      :required="isRequired"
      :class="inputClass"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="inputType === 'textarea'"
      :id="fieldId"
      v-model="localValue"
      :required="isRequired"
      :placeholder="field.description"
      rows="3"
      :class="inputClass"
    />

    <!-- Select (Lookup) -->
    <select
      v-else-if="inputType === 'select'"
      :id="fieldId"
      v-model="localValue"
      :required="isRequired"
      :disabled="lookupLoading"
      :class="inputClass"
    >
      <option :value="null">{{ lookupLoading ? '載入中...' : '-- 請選擇 --' }}</option>
      <option v-for="opt in lookupOptions" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <p v-if="lookupError && inputType === 'select'" class="mt-1 text-xs text-rose-600">
      {{ lookupError }}
    </p>

    <!-- Help text -->
    <p v-if="field.help && showHelp" class="mt-1 text-xs text-slate-500">
      {{ field.help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { type TabField, getInputType, ReferenceType, getReferenceLookupOptions, getTableLookupOptions, type LookupOption } from '../features/window/api'
import { useAuth } from '../features/auth/store'
import { getColumnLabel } from '../shared/labels/columnLabels'

const props = defineProps<{
  field: TabField
  modelValue: unknown
  showHelp?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
}>()

const auth = useAuth()

const localValue = ref(props.modelValue)
const lookupOptions = ref<LookupOption[]>([])
const lookupLoading = ref(false)
const lookupError = ref<string | null>(null)

const fieldId = computed(() => `field-${props.field.id}`)

const labelText = computed(() => {
  const col = props.field.columnName
  return getColumnLabel(col, props.field.description)
})

const inputType = computed(() => {
  if (!props.field.column) return 'text'
  return getInputType(props.field.column.referenceId)
})

const isRequired = computed(() => props.field.column?.isMandatory ?? false)

const maxLength = computed(() => props.field.column?.fieldLength || undefined)

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500'

// Sync local value with prop
watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val
  },
)

// Emit changes
watch(localValue, (val) => {
  emit('update:modelValue', val)
})

// Load lookup options for select fields
async function loadLookupOptions() {
  lookupError.value = null
  lookupOptions.value = []

  if (inputType.value !== 'select') return
  if (!props.field.column) return
  if (!auth.token.value) {
    lookupError.value = '未登入，無法載入選項'
    return
  }

  const refId = props.field.column.referenceId
  const refValueId = props.field.column.referenceValueId
  const colName = props.field.columnName

  lookupLoading.value = true
  try {
    // 1) List/Table validation (最可靠)：走 Reference API
    if ((refId === ReferenceType.List || refId === ReferenceType.Table || refId === ReferenceType.Search) && refValueId) {
      lookupOptions.value = await getReferenceLookupOptions(auth.token.value, refValueId)
      if (lookupOptions.value.length) return
    }

    // 2) TableDirect / fallback：用欄位名推表名
    if (colName.endsWith('_ID')) {
      const tableName = colName.slice(0, -3)
      lookupOptions.value = await getTableLookupOptions(auth.token.value, tableName, {
        select: `${tableName}_ID,Name`,
        orderby: 'Name',
        top: 200,
      })
    }
  } catch (e: any) {
    const status = e?.status
    if (status === 401) {
      lookupError.value = 'Token 已過期，請重新登入'
    } else if (status === 403) {
      lookupError.value = '無權限存取此資料'
    } else {
      lookupError.value = e?.detail || e?.title || e?.message || `下拉選單載入失敗 (${status || 'unknown'})`
    }
    console.error(`[DynamicField] loadLookupOptions failed for ${colName}:`, e)
  } finally {
    lookupLoading.value = false
  }

  // 必填但沒有選項：要提示，否則使用者會卡住卻不知道原因
  if (isRequired.value && lookupOptions.value.length === 0) {
    lookupError.value = lookupError.value || '此欄位為必填，但目前沒有可選項（可能是參照設定或權限/資料問題）'
  }
}

onMounted(loadLookupOptions)

watch([() => auth.token.value, () => props.field.id], () => {
  loadLookupOptions()
})
</script>
