<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAuth } from '../features/auth/store'
import { searchCustomers } from '../features/bpartner/api'

const props = defineProps<{
  modelValue?: number
  placeholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const auth = useAuth()

const searchQuery = ref('')
const selectedName = ref('')
const isOpen = ref(false)
const loading = ref(false)
const options = ref<{ id: number, name: string }[]>([])

let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function search(query: string) {
  if (!auth.token.value)
    return

  loading.value = true
  try {
    options.value = await searchCustomers(auth.token.value, query, { top: 20 })
  }
  catch (e) {
    console.error('Failed to search customers:', e)
    options.value = []
  }
  finally {
    loading.value = false
  }
}

function handleInput() {
  if (searchTimeout)
    clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    search(searchQuery.value)
  }, 300)
  isOpen.value = true
}

function selectOption(option: { id: number, name: string }) {
  emit('update:modelValue', option.id)
  selectedName.value = option.name
  searchQuery.value = option.name
  isOpen.value = false
}

function clearSelection() {
  emit('update:modelValue', undefined)
  selectedName.value = ''
  searchQuery.value = ''
  options.value = []
}

function handleFocus() {
  if (!searchQuery.value && options.value.length === 0) {
    search('')
  }
  isOpen.value = true
}

function handleBlur() {
  // Delay closing to allow click on option
  setTimeout(() => {
    isOpen.value = false
    // If no selection, restore the selected name
    if (props.modelValue && selectedName.value) {
      searchQuery.value = selectedName.value
    }
  }, 200)
}

// Load initial customer name if modelValue is set
watch(() => props.modelValue, async (id) => {
  if (id && auth.token.value) {
    try {
      const results = await searchCustomers(auth.token.value, '', { top: 1000 })
      const customer = results.find(c => c.id === id)
      if (customer) {
        selectedName.value = customer.name
        searchQuery.value = customer.name
      }
    }
    catch (e) {
      console.error('Failed to load customer name:', e)
    }
  }
}, { immediate: true })

onMounted(() => {
  // Initial load
  search('')
})
</script>

<template>
  <div class="relative">
    <div class="relative">
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder || '搜尋客戶名稱...'"
        :disabled="disabled"
        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-8 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      >
      <button
        v-if="modelValue && !disabled"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        @mousedown.prevent="clearSelection"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Dropdown -->
    <div
      v-if="isOpen && !disabled"
      class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
    >
      <div v-if="loading" class="px-3 py-2 text-sm text-slate-500">
        搜尋中...
      </div>
      <div v-else-if="options.length === 0" class="px-3 py-2 text-sm text-slate-500">
        找不到客戶
      </div>
      <button
        v-for="option in options"
        v-else
        :key="option.id"
        type="button"
        class="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
        :class="option.id === modelValue ? 'bg-brand-50 text-brand-700' : 'text-slate-900'"
        @mousedown.prevent="selectOption(option)"
      >
        {{ option.name }}
      </button>
    </div>
  </div>
</template>
