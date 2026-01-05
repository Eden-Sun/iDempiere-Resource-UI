<template>
  <div class="dynamic-field">
    <label :for="fieldId" class="block text-sm font-medium text-slate-700">
      {{ field.name }}
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
      class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
    />

    <!-- Number Input -->
    <input
      v-else-if="inputType === 'number'"
      :id="fieldId"
      v-model.number="localValue"
      type="number"
      :required="isRequired"
      :placeholder="field.description"
      class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
      class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
    />

    <!-- DateTime Input -->
    <input
      v-else-if="inputType === 'datetime'"
      :id="fieldId"
      v-model="localValue"
      type="datetime-local"
      :required="isRequired"
      class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="inputType === 'textarea'"
      :id="fieldId"
      v-model="localValue"
      :required="isRequired"
      :placeholder="field.description"
      rows="3"
      class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
    />

    <!-- Select (Lookup) -->
    <select
      v-else-if="inputType === 'select'"
      :id="fieldId"
      v-model="localValue"
      :required="isRequired"
      class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
    >
      <option :value="null">-- 請選擇 --</option>
      <option v-for="opt in lookupOptions" :key="opt.id" :value="opt.id">
        {{ opt.identifier }}
      </option>
    </select>

    <!-- Help text -->
    <p v-if="field.help && showHelp" class="mt-1 text-xs text-slate-500">
      {{ field.help }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { type TabField, getInputType, ReferenceType, getLookupValues } from '../features/window/api'
import { useAuth } from '../features/auth/store'

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
const lookupOptions = ref<{ id: number; identifier: string }[]>([])

const fieldId = computed(() => `field-${props.field.id}`)

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
onMounted(async () => {
  if (inputType.value === 'select' && props.field.column && auth.token.value) {
    const refId = props.field.column.referenceId
    const colName = props.field.columnName

    // Determine table name from column name (e.g., C_Greeting_ID -> C_Greeting)
    if (refId === ReferenceType.TableDirect && colName.endsWith('_ID')) {
      const tableName = colName.slice(0, -3)
      try {
        lookupOptions.value = await getLookupValues(auth.token.value, tableName, {
          select: `${tableName}_ID,Name`,
          orderby: 'Name',
          top: 100,
        })
      } catch {
        // Ignore lookup errors for now
      }
    }
  }
})
</script>
