<template>
  <div class="dynamic-field">
    <div class="flex items-center justify-between gap-2">
      <label :for="fieldId" class="label">
        <span class="label-text">
          {{ labelText }}
          <span v-if="isRequired" class="text-error">*</span>
        </span>
      </label>

      <!-- Admin mode: checkbox to mark field as hidden -->
      <label v-if="adminMode" class="label cursor-pointer gap-1">
        <span class="label-text text-xs">隱藏</span>
        <input
          type="checkbox"
          :checked="markedHidden"
          @change="emit('update:markedHidden', !markedHidden)"
          class="checkbox checkbox-xs"
        />
      </label>
    </div>

    <!-- Text Input -->
    <input
      v-if="inputType === 'text'"
      :id="fieldId"
      v-model="localValue"
      type="text"
      :maxlength="maxLength"
      :required="isRequired"
      :placeholder="field.description"
      class="input input-bordered input-sm w-full"
    />

    <!-- Number Input -->
    <input
      v-else-if="inputType === 'number'"
      :id="fieldId"
      v-model.number="localValue"
      type="number"
      :required="isRequired"
      :placeholder="field.description"
      class="input input-bordered input-sm w-full"
    />

    <!-- Checkbox (Yes/No) -->
    <div v-else-if="inputType === 'checkbox'" class="form-control">
      <label class="label cursor-pointer justify-start gap-2">
        <input
          :id="fieldId"
          v-model="localValue"
          type="checkbox"
          class="checkbox checkbox-sm"
        />
        <span class="label-text">{{ field.description }}</span>
      </label>
    </div>

    <!-- Date Input -->
    <input
      v-else-if="inputType === 'date'"
      :id="fieldId"
      v-model="localValue"
      type="date"
      :required="isRequired"
      class="input input-bordered input-sm w-full"
    />

    <!-- DateTime Input -->
    <input
      v-else-if="inputType === 'datetime'"
      :id="fieldId"
      v-model="localValue"
      type="datetime-local"
      :required="isRequired"
      class="input input-bordered input-sm w-full"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="inputType === 'textarea'"
      :id="fieldId"
      v-model="localValue"
      :required="isRequired"
      :placeholder="field.description"
      rows="3"
      class="textarea textarea-bordered textarea-sm w-full"
    />

    <!-- Select (Lookup) -->
    <select
      v-else-if="inputType === 'select'"
      :id="fieldId"
      v-model="localValue"
      :required="isRequired"
      :disabled="lookupLoading"
      class="select select-bordered select-sm w-full"
    >
      <option :value="null">{{ lookupLoading ? '載入中...' : '-- 請選擇 --' }}</option>
      <option v-for="opt in lookupOptions" :key="String(opt.value)" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <p v-if="lookupError && inputType === 'select'" class="label">
      <span class="label-text-alt text-error">{{ lookupError }}</span>
    </p>

    <!-- Help text -->
    <p v-if="field.help && showHelp" class="label">
      <span class="label-text-alt">{{ field.help }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { type TabField, getInputType, ReferenceType, getReferenceLookupOptions, getTableLookupOptions, type LookupOption } from '../features/window/api'
import { useAuth } from '../features/auth/store'

const props = defineProps<{
  field: TabField
  modelValue: unknown
  showHelp?: boolean
  adminMode?: boolean
  markedHidden?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: unknown): void
  (e: 'update:markedHidden', value: boolean): void
}>()

const auth = useAuth()

const localValue = ref(props.modelValue)
const lookupOptions = ref<LookupOption[]>([])
const lookupLoading = ref(false)
const lookupError = ref<string | null>(null)

const fieldId = computed(() => `field-${props.field.id}`)

const labelText = computed(() => {
  // Use field name from API directly (no translation)
  return props.field.name || props.field.columnName
})

const inputType = computed(() => {
  if (!props.field.column) return 'text'
  return getInputType(props.field.column.referenceId)
})

const isRequired = computed(() => props.field.column?.isMandatory ?? false)

const maxLength = computed(() => props.field.column?.fieldLength || undefined)

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

  const colName = props.field.columnName

  if (inputType.value !== 'select') {
    return
  }
  if (!props.field.column) {
    console.log(`[DynamicField] ${colName}: no column metadata available`)
    lookupError.value = '欄位元資料載入失敗'
    return
  }
  if (!auth.token.value) {
    console.log(`[DynamicField] ${colName}: no token`)
    lookupError.value = '未登入，無法載入選項'
    return
  }

  const refId = props.field.column.referenceId
  const refValueId = props.field.column.referenceValueId

  console.log(`[DynamicField] ${colName}: refId=${refId}, refValueId=${refValueId}`)

  lookupLoading.value = true
  try {
    // 1) List/Table/Search with Reference: use Reference API
    if ((refId === ReferenceType.List || refId === ReferenceType.Table || refId === ReferenceType.Search) && refValueId) {
      console.log(`[DynamicField] ${colName}: trying Reference API (refValueId=${refValueId})`)
      lookupOptions.value = await getReferenceLookupOptions(auth.token.value, refValueId)
      console.log(`[DynamicField] ${colName}: got ${lookupOptions.value.length} from Reference API`)
      // Don't fallback for Table/List/Search types - they MUST use Reference API
      return
    }

    // 2) TableDirect only: derive table name from column name
    if (refId === ReferenceType.TableDirect && colName.endsWith('_ID')) {
      const tableName = colName.slice(0, -3)
      console.log(`[DynamicField] ${colName}: trying TableDirect, table=${tableName}`)
      lookupOptions.value = await getTableLookupOptions(auth.token.value, tableName, {
        select: `${tableName}_ID,Name`,
        orderby: 'Name',
        top: 200,
      })
      console.log(`[DynamicField] ${colName}: got ${lookupOptions.value.length} from table`)
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
