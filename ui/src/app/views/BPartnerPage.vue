<script setup lang="ts">
import type { BPartnerContact, BPartnerLocationFull } from '../../features/bpartner/api'
import type { BPartner } from '../../features/bpartner/types'
import { computed, onMounted, ref, watch } from 'vue'
import DynamicForm from '../../components/DynamicForm.vue'
import EmptyState from '../../components/EmptyState.vue'
import TableSkeleton from '../../components/TableSkeleton.vue'
import { useAuth } from '../../features/auth/store'
import {
  createBPartnerContact,
  createBPartnerLocation,
  createBPartnerWithRelations,
  deleteBPartnerContact,
  deleteBPartnerLocation,
  listBPartnerContacts,
  listBPartnerLocationsFull,
  updateBPartnerContact,
  updateBPartnerLocation,
} from '../../features/bpartner/api'
import { apiFetch } from '../../shared/api/http'

const auth = useAuth()

// View mode
const mode = ref<'list' | 'form'>('list')
const editingId = ref<number | null>(null)
const editingRecord = ref<Record<string, unknown> | null>(null)

// Active tab in form view
const activeTab = ref<'basic' | 'locations' | 'contacts'>('basic')

// List state
const listRecords = ref<BPartner[]>([])
const listLoading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 20
const searchQuery = ref('')

// Form state
const bpFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Location state
const locations = ref<BPartnerLocationFull[]>([])
const locationsLoading = ref(false)
const editingLocation = ref<BPartnerLocationFull | null>(null)
const showLocationForm = ref(false)
const locationForm = ref({
  name: '',
  address1: '',
  city: '',
  postalCode: '',
})

// Contact state
const contacts = ref<BPartnerContact[]>([])
const contactsLoading = ref(false)
const editingContact = ref<BPartnerContact | null>(null)
const showContactForm = ref(false)
const contactForm = ref({
  name: '',
  email: '',
  phone: '',
})

// Default values for new records
const formDefaults = computed(() => {
  if (editingRecord.value) {
    // Flatten nested objects from Model API (e.g., { C_BP_Group_ID: { id: 104 } } -> { C_BP_Group_ID: 104 })
    const flattened: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(editingRecord.value)) {
      if (value && typeof value === 'object' && 'id' in (value as object)) {
        flattened[key] = (value as { id: unknown }).id
      }
      else {
        flattened[key] = value
      }
    }
    return flattened
  }
  return {
    C_BP_Group_ID: 104, // Standard BP Group
  }
})

const hasNextPage = computed(() => {
  return currentPage.value * pageSize < totalCount.value
})

// Load list using Model API
async function loadList() {
  if (!auth.token.value)
    return

  listLoading.value = true
  error.value = null

  try {
    const searchParams: Record<string, string | number> = {
      $orderby: 'Name',
      $top: pageSize,
      $skip: (currentPage.value - 1) * pageSize,
    }

    if (searchQuery.value.trim()) {
      searchParams.$filter = `contains(Name,'${searchQuery.value.trim()}')`
    }

    const result = await apiFetch<{ 'records': any[], 'row-count'?: number }>(
      '/api/v1/models/C_BPartner',
      { token: auth.token.value, searchParams },
    )

    listRecords.value = result.records ?? []
    totalCount.value = result['row-count'] ?? result.records?.length ?? 0
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入列表失敗'
  }
  finally {
    listLoading.value = false
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadList()
  }
}

function nextPage() {
  if (hasNextPage.value) {
    currentPage.value++
    loadList()
  }
}

// Form actions
function startCreate() {
  editingId.value = null
  editingRecord.value = null
  error.value = null
  successMessage.value = null
  activeTab.value = 'basic'
  mode.value = 'form'
}

function startEdit(record: BPartner) {
  editingId.value = record.id
  editingRecord.value = record as unknown as Record<string, unknown>
  error.value = null
  successMessage.value = null
  activeTab.value = 'basic'
  mode.value = 'form'
}

function backToList() {
  mode.value = 'list'
  editingId.value = null
  editingRecord.value = null
  error.value = null
  activeTab.value = 'basic'
  locations.value = []
  contacts.value = []
  loadList()
}

async function handleSubmit(data: Record<string, unknown>) {
  if (!auth.token.value) {
    error.value = '尚未登入'
    return
  }

  error.value = null
  bpFormRef.value?.setSubmitting(true)

  try {
    if (editingId.value) {
      // Update existing using Model API
      await apiFetch(`/api/v1/models/C_BPartner/${editingId.value}`, {
        method: 'PUT',
        token: auth.token.value,
        json: data,
      })
      successMessage.value = '業務夥伴已更新'
    }
    else {
      // Create new BPartner with associated Location and User records
      const name = String(data.Name || '')
      await createBPartnerWithRelations(auth.token.value, {
        name,
        value: data.Value ? String(data.Value) : undefined,
        bpGroupId: data.C_BP_Group_ID ? Number(data.C_BP_Group_ID) : undefined,
        isCustomer: data.IsCustomer === true || data.IsCustomer === 'Y',
        isVendor: data.IsVendor === true || data.IsVendor === 'Y',
        isEmployee: data.IsEmployee === true || data.IsEmployee === 'Y',
      })
      successMessage.value = '業務夥伴已建立（含同名地點與聯絡人）'
    }

    // Go back to list after short delay
    setTimeout(() => {
      backToList()
    }, 1000)
  }
  catch (e: any) {
    // Prioritize showing API error if it has meaningful detail
    const apiError = e?.detail || e?.title || e?.message
    if (apiError) {
      // Check for common error patterns and provide user-friendly messages
      if (apiError.includes('duplicate key') || apiError.includes('unique constraint')) {
        error.value = '搜尋鍵已存在，請使用其他值'
      }
      else {
        error.value = apiError
      }
    }
    else {
      // Fallback to mandatory field check only if no API error
      const missing = bpFormRef.value?.getMissingMandatoryFields() || []
      if (missing.length > 0) {
        error.value = `請填寫以下必填欄位：\n• ${missing.join('\n• ')}`
      }
      else {
        error.value = '操作失敗'
      }
    }
  }
  finally {
    bpFormRef.value?.setSubmitting(false)
  }
}

// Location functions
async function loadLocations() {
  if (!auth.token.value || !editingId.value)
    return

  locationsLoading.value = true
  try {
    locations.value = await listBPartnerLocationsFull(auth.token.value, editingId.value)
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入地點失敗'
  }
  finally {
    locationsLoading.value = false
  }
}

function openLocationForm(loc?: BPartnerLocationFull) {
  if (loc) {
    editingLocation.value = loc
    locationForm.value = {
      name: loc.name || '',
      address1: loc.address1 || '',
      city: loc.city || '',
      postalCode: loc.postalCode || '',
    }
  }
  else {
    editingLocation.value = null
    locationForm.value = {
      name: editingRecord.value?.Name ? String(editingRecord.value.Name) : '',
      address1: '',
      city: '',
      postalCode: '',
    }
  }
  showLocationForm.value = true
}

function closeLocationForm() {
  showLocationForm.value = false
  editingLocation.value = null
}

async function saveLocation() {
  if (!auth.token.value || !editingId.value)
    return

  try {
    if (editingLocation.value) {
      // Update existing
      await updateBPartnerLocation(
        auth.token.value,
        editingLocation.value.id,
        editingLocation.value.locationId!,
        locationForm.value,
      )
      successMessage.value = '地點已更新'
    }
    else {
      // Create new
      await createBPartnerLocation(auth.token.value, {
        bPartnerId: editingId.value,
        name: locationForm.value.name,
        address1: locationForm.value.address1,
        city: locationForm.value.city,
        postalCode: locationForm.value.postalCode,
      })
      successMessage.value = '地點已新增'
    }
    closeLocationForm()
    await loadLocations()
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '儲存地點失敗'
  }
}

async function deleteLocation(loc: BPartnerLocationFull) {
  if (!auth.token.value)
    return
  if (!confirm('確定要刪除此地點？'))
    return

  try {
    await deleteBPartnerLocation(auth.token.value, loc.id)
    successMessage.value = '地點已刪除'
    await loadLocations()
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '刪除地點失敗'
  }
}

// Contact functions
async function loadContacts() {
  if (!auth.token.value || !editingId.value)
    return

  contactsLoading.value = true
  try {
    contacts.value = await listBPartnerContacts(auth.token.value, editingId.value)
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '載入聯絡人失敗'
  }
  finally {
    contactsLoading.value = false
  }
}

function openContactForm(contact?: BPartnerContact) {
  if (contact) {
    editingContact.value = contact
    contactForm.value = {
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
    }
  }
  else {
    editingContact.value = null
    contactForm.value = {
      name: editingRecord.value?.Name ? String(editingRecord.value.Name) : '',
      email: '',
      phone: '',
    }
  }
  showContactForm.value = true
}

function closeContactForm() {
  showContactForm.value = false
  editingContact.value = null
}

async function saveContact() {
  if (!auth.token.value || !editingId.value)
    return

  try {
    if (editingContact.value) {
      // Update existing
      await updateBPartnerContact(auth.token.value, editingContact.value.id, contactForm.value)
      successMessage.value = '聯絡人已更新'
    }
    else {
      // Create new
      await createBPartnerContact(auth.token.value, {
        bPartnerId: editingId.value,
        name: contactForm.value.name,
        email: contactForm.value.email,
        phone: contactForm.value.phone,
      })
      successMessage.value = '聯絡人已新增'
    }
    closeContactForm()
    await loadContacts()
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '儲存聯絡人失敗'
  }
}

async function deleteContact(contact: BPartnerContact) {
  if (!auth.token.value)
    return
  if (!confirm('確定要刪除此聯絡人？'))
    return

  try {
    await deleteBPartnerContact(auth.token.value, contact.id)
    successMessage.value = '聯絡人已刪除'
    await loadContacts()
  }
  catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '刪除聯絡人失敗'
  }
}

// Watch tab changes to load data
watch(activeTab, (tab) => {
  if (tab === 'locations' && editingId.value && locations.value.length === 0) {
    loadLocations()
  }
  else if (tab === 'contacts' && editingId.value && contacts.value.length === 0) {
    loadContacts()
  }
})

onMounted(() => {
  loadList()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-semibold">
            業務夥伴
          </h1>
          <p class="mt-1 text-sm text-slate-600">
            {{ mode === 'list' ? '查看和管理業務夥伴' : (editingId ? '編輯業務夥伴' : '建立新業務夥伴') }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="mode === 'form'"
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            @click="backToList"
          >
            返回列表
          </button>
          <button
            v-if="mode === 'list'"
            type="button"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            @click="startCreate"
          >
            新增
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 whitespace-pre-line"
    >
      {{ error }}
    </div>

    <!-- Success Message -->
    <div
      v-if="successMessage"
      class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
    >
      {{ successMessage }}
    </div>

    <!-- List View -->
    <div v-if="mode === 'list'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <!-- Search -->
      <div class="border-b border-slate-200 p-4">
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜尋名稱..."
            class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            @keyup.enter="loadList"
          >
          <button
            type="button"
            class="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            @click="loadList"
          >
            搜尋
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs font-medium uppercase text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3">
                名稱
              </th>
              <th scope="col" class="px-4 py-3">
                搜尋鍵
              </th>
              <th scope="col" class="px-4 py-3">
                客戶
              </th>
              <th scope="col" class="px-4 py-3">
                供應商
              </th>
              <th scope="col" class="px-4 py-3">
                操作
              </th>
            </tr>
          </thead>
          <tbody v-if="!listLoading" class="divide-y divide-slate-200">
            <tr
              v-for="record in listRecords"
              :key="record.id"
              class="hover:bg-slate-50 cursor-pointer"
              @click="startEdit(record)"
            >
              <td class="px-4 py-3 font-medium text-slate-900">
                {{ record.Name }}
              </td>
              <td class="px-4 py-3 text-slate-600">
                {{ record.Value }}
              </td>
              <td class="px-4 py-3">
                <span
                  :class="record.IsCustomer ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {{ record.IsCustomer ? '是' : '否' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="record.IsVendor ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                >
                  {{ record.IsVendor ? '是' : '否' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <button
                  type="button"
                  class="text-brand-600 hover:text-brand-700 font-medium"
                  @click.stop="startEdit(record)"
                >
                  編輯
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Loading Skeleton -->
        <TableSkeleton v-if="listLoading" :rows="10" :columns="5" />
      </div>

      <!-- Empty State -->
      <EmptyState
        v-if="!listLoading && listRecords.length === 0"
        icon="users"
        title="尚無業務夥伴"
        description="目前沒有符合條件的業務夥伴。您可以新增業務夥伴或調整搜尋條件。"
        action-text="新增業務夥伴"
        @action="startCreate"
      />

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t border-slate-200 px-4 py-3">
        <div class="text-sm text-slate-600">
          共 {{ totalCount }} 筆
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="currentPage <= 1"
            class="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
            @click="prevPage"
          >
            上一頁
          </button>
          <span class="px-3 py-1 text-sm text-slate-600">第 {{ currentPage }} 頁</span>
          <button
            type="button"
            :disabled="!hasNextPage"
            class="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
            @click="nextPage"
          >
            下一頁
          </button>
        </div>
      </div>
    </div>

    <!-- Form View -->
    <div v-if="mode === 'form'" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <!-- Tabs (only show when editing) -->
      <div v-if="editingId" class="flex border-b border-slate-200">
        <button
          type="button"
          class="px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'basic' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'basic'"
        >
          基本資料
        </button>
        <button
          type="button"
          class="px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'locations' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'locations'"
        >
          地點
        </button>
        <button
          type="button"
          class="px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'contacts' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = 'contacts'"
        >
          聯絡人
        </button>
      </div>

      <!-- Basic Info Tab -->
      <div v-if="activeTab === 'basic'" class="p-6">
        <DynamicForm
          ref="bpFormRef"
          window-slug="business-partner"
          tab-slug="business-partner"
          :default-values="formDefaults"
          :submit-label="editingId ? '儲存' : '建立'"
          @submit="handleSubmit"
        />
      </div>

      <!-- Locations Tab -->
      <div v-if="activeTab === 'locations'">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="font-medium">
            地點列表
          </h3>
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            @click="openLocationForm()"
          >
            新增地點
          </button>
        </div>

        <!-- Location Form Modal -->
        <div v-if="showLocationForm" class="border-b border-slate-200 bg-slate-50 p-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">名稱</label>
              <input
                v-model="locationForm.name"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">地址</label>
              <input
                v-model="locationForm.address1"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">城市</label>
              <input
                v-model="locationForm.city"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">郵遞區號</label>
              <input
                v-model="locationForm.postalCode"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="closeLocationForm"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              @click="saveLocation"
            >
              {{ editingLocation ? '更新' : '新增' }}
            </button>
          </div>
        </div>

        <!-- Location List -->
        <div v-if="locationsLoading" class="p-4">
          <div class="animate-pulse space-y-3">
            <div class="h-12 rounded bg-slate-200" />
            <div class="h-12 rounded bg-slate-200" />
          </div>
        </div>
        <div v-else-if="locations.length === 0" class="p-8 text-center text-sm text-slate-500">
          尚無地點資料
        </div>
        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="loc in locations"
            :key="loc.id"
            class="flex items-center justify-between p-4 hover:bg-slate-50"
          >
            <div>
              <div class="font-medium text-slate-900">
                {{ loc.name || '(未命名)' }}
              </div>
              <div class="text-sm text-slate-600">
                {{ [loc.address1, loc.city, loc.postalCode].filter(Boolean).join(', ') || '(無地址)' }}
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded px-2 py-1 text-sm text-brand-600 hover:bg-brand-50"
                @click="openLocationForm(loc)"
              >
                編輯
              </button>
              <button
                type="button"
                class="rounded px-2 py-1 text-sm text-rose-600 hover:bg-rose-50"
                @click="deleteLocation(loc)"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Contacts Tab -->
      <div v-if="activeTab === 'contacts'">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h3 class="font-medium">
            聯絡人列表
          </h3>
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            @click="openContactForm()"
          >
            新增聯絡人
          </button>
        </div>

        <!-- Contact Form Modal -->
        <div v-if="showContactForm" class="border-b border-slate-200 bg-slate-50 p-4">
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">姓名</label>
              <input
                v-model="contactForm.name"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                v-model="contactForm.email"
                type="email"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700">電話</label>
              <input
                v-model="contactForm.phone"
                type="tel"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              @click="closeContactForm"
            >
              取消
            </button>
            <button
              type="button"
              class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              @click="saveContact"
            >
              {{ editingContact ? '更新' : '新增' }}
            </button>
          </div>
        </div>

        <!-- Contact List -->
        <div v-if="contactsLoading" class="p-4">
          <div class="animate-pulse space-y-3">
            <div class="h-12 rounded bg-slate-200" />
            <div class="h-12 rounded bg-slate-200" />
          </div>
        </div>
        <div v-else-if="contacts.length === 0" class="p-8 text-center text-sm text-slate-500">
          尚無聯絡人資料
        </div>
        <div v-else class="divide-y divide-slate-200">
          <div
            v-for="contact in contacts"
            :key="contact.id"
            class="flex items-center justify-between p-4 hover:bg-slate-50"
          >
            <div>
              <div class="font-medium text-slate-900">
                {{ contact.name || '(未命名)' }}
              </div>
              <div class="flex gap-4 text-sm text-slate-600">
                <span v-if="contact.email">{{ contact.email }}</span>
                <span v-if="contact.phone">{{ contact.phone }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded px-2 py-1 text-sm text-brand-600 hover:bg-brand-50"
                @click="openContactForm(contact)"
              >
                編輯
              </button>
              <button
                type="button"
                class="rounded px-2 py-1 text-sm text-rose-600 hover:bg-rose-50"
                @click="deleteContact(contact)"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
