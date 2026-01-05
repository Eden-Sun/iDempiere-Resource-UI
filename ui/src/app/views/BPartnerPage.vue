<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">業務夥伴</h1>
      <p class="mt-1 text-sm text-slate-600">
        建立業務夥伴（可選擇建立聯絡人與地址）。
      </p>
    </div>

    <!-- Error Message -->
    <div
      v-if="error"
      class="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
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

    <!-- Main Form -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <!-- Step Indicator -->
      <div class="mb-6 flex items-center gap-2">
        <div
          v-for="(step, idx) in steps"
          :key="step.key"
          class="flex items-center"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
            :class="
              currentStep === idx
                ? 'bg-brand-600 text-white'
                : currentStep > idx
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-600'
            "
          >
            {{ currentStep > idx ? '✓' : idx + 1 }}
          </div>
          <span
            class="ml-2 text-sm font-medium"
            :class="currentStep === idx ? 'text-slate-900' : 'text-slate-500'"
          >
            {{ step.label }}
          </span>
          <div v-if="idx < steps.length - 1" class="mx-3 h-px w-8 bg-slate-300" />
        </div>
      </div>

      <!-- Step 1: Business Partner -->
      <div v-show="currentStep === 0">
        <h2 class="mb-4 text-base font-semibold text-slate-800">業務夥伴</h2>
        <DynamicForm
          ref="bpFormRef"
          window-slug="business-partner"
          tab-slug="business-partner"
          submit-label="下一步：聯絡人"
          @submit="handleBpSubmit"
        />
      </div>

      <!-- Step 2: Contact -->
      <div v-show="currentStep === 1">
        <h2 class="mb-4 text-base font-semibold text-slate-800">聯絡人</h2>
        <DynamicForm
          ref="contactFormRef"
          window-slug="business-partner"
          tab-slug="contact-user"
          :exclude-fields="['C_BPartner_ID']"
          submit-label="下一步：地址"
          @submit="handleContactSubmit"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                @click="currentStep = 0"
              >
                返回
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {{ submitting ? '儲存中…' : '下一步：地址' }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                @click="skipContact"
              >
                略過
              </button>
            </div>
          </template>
        </DynamicForm>
      </div>

      <!-- Step 3: Location -->
      <div v-show="currentStep === 2">
        <h2 class="mb-4 text-base font-semibold text-slate-800">地址</h2>
        <DynamicForm
          ref="locationFormRef"
          window-slug="business-partner"
          tab-slug="location"
          :exclude-fields="['C_BPartner_ID', 'C_Location_ID']"
          submit-label="完成"
          @submit="handleLocationSubmit"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                @click="currentStep = 1"
              >
                返回
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {{ submitting ? '儲存中…' : '完成' }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                @click="skipLocation"
              >
                略過
              </button>
            </div>
          </template>
        </DynamicForm>
      </div>

      <!-- Step 4: Done -->
      <div v-if="currentStep === 3" class="py-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <span class="text-3xl">✓</span>
        </div>
        <h2 class="text-lg font-semibold text-slate-900">業務夥伴已建立！</h2>
        <p class="mt-2 text-sm text-slate-600">
          已成功建立 <strong>{{ createdBpName }}</strong>
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            @click="resetForm"
          >
            再建立一筆
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DynamicForm from '../../components/DynamicForm.vue'
import { createWindowRecord, createChildTabRecord, createModelRecord } from '../../features/window/api'
import { useAuth } from '../../features/auth/store'

const auth = useAuth()

const steps = [
  { key: 'bp', label: '業務夥伴' },
  { key: 'contact', label: '聯絡人' },
  { key: 'location', label: '地址' },
]

const currentStep = ref(0)
const submitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const createdBpId = ref<number | null>(null)
const createdBpName = ref('')

const bpFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const contactFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const locationFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)

function formatApiError(e: any, fallback: string, missingFields?: string[]): string {
  const detail = e?.detail || ''
  const title = e?.title || ''
  const message = e?.message || ''

  let result = ''
  if (title) result += title
  if (detail && detail !== title) {
    result += result ? `: ${detail}` : detail
  }
  if (!result && message) result = message

  // 如果是 mandatory fields 錯誤，附加可能缺少的欄位
  if (missingFields && missingFields.length > 0 && detail.includes('mandatory')) {
    result += `\n可能缺少的欄位: ${missingFields.join(', ')}`
  }

  return result || fallback
}

async function handleBpSubmit(data: Record<string, unknown>) {
  if (!auth.token.value) {
    error.value = '尚未登入'
    return
  }

  submitting.value = true
  error.value = null
  bpFormRef.value?.setSubmitting(true)

  try {
    const result = await createWindowRecord(auth.token.value, 'business-partner', data)
    createdBpId.value = result.id
    createdBpName.value = String(data.Name || result.id)
    currentStep.value = 1
  } catch (e: any) {
    const missing = bpFormRef.value?.getMissingMandatoryFields() || []
    error.value = formatApiError(e, '建立業務夥伴失敗', missing)
  } finally {
    submitting.value = false
    bpFormRef.value?.setSubmitting(false)
  }
}

async function handleContactSubmit(data: Record<string, unknown>) {
  if (!auth.token.value || !createdBpId.value) {
    error.value = '請先完成「業務夥伴」步驟'
    return
  }

  submitting.value = true
  error.value = null
  contactFormRef.value?.setSubmitting(true)

  try {
    await createChildTabRecord(
      auth.token.value,
      'business-partner',
      'business-partner',
      createdBpId.value,
      'contact-user',
      data,
    )
    currentStep.value = 2
  } catch (e: any) {
    const missing = contactFormRef.value?.getMissingMandatoryFields() || []
    error.value = formatApiError(e, '建立聯絡人失敗', missing)
  } finally {
    submitting.value = false
    contactFormRef.value?.setSubmitting(false)
  }
}

async function handleLocationSubmit(data: Record<string, unknown>) {
  if (!auth.token.value || !createdBpId.value) {
    error.value = '請先完成「業務夥伴」步驟'
    return
  }

  submitting.value = true
  error.value = null
  locationFormRef.value?.setSubmitting(true)

  try {
    // Step 1: Create C_Location first
    const locationData: Record<string, unknown> = {}
    // Extract C_Location fields from data
    const locationFields = ['C_Country_ID', 'C_Region_ID', 'C_City_ID', 'Address1', 'Address2', 'Address3', 'Address4', 'City', 'Postal', 'Postal_Add', 'RegionName']
    for (const field of locationFields) {
      if (data[field] !== undefined && data[field] !== null && data[field] !== '') {
        locationData[field] = data[field]
        delete data[field]
      }
    }

    // Ensure C_Country_ID is set (required)
    if (!locationData.C_Country_ID) {
      locationData.C_Country_ID = 316 // Default: Taiwan
    }

    const locationResult = await createModelRecord(auth.token.value, 'C_Location', locationData)

    // Step 2: Create C_BPartner_Location with C_Location_ID
    data.C_Location_ID = locationResult.id

    await createChildTabRecord(
      auth.token.value,
      'business-partner',
      'business-partner',
      createdBpId.value,
      'location',
      data,
    )
    currentStep.value = 3
    successMessage.value = `已成功建立業務夥伴「${createdBpName.value}」！`
  } catch (e: any) {
    const missing = locationFormRef.value?.getMissingMandatoryFields() || []
    error.value = formatApiError(e, '建立地址失敗', missing)
  } finally {
    submitting.value = false
    locationFormRef.value?.setSubmitting(false)
  }
}

function skipContact() {
  currentStep.value = 2
}

function skipLocation() {
  currentStep.value = 3
  successMessage.value = `已成功建立業務夥伴「${createdBpName.value}」！`
}

function resetForm() {
  currentStep.value = 0
  createdBpId.value = null
  createdBpName.value = ''
  error.value = null
  successMessage.value = null
  // Reload forms to reset data
  bpFormRef.value?.reload()
  contactFormRef.value?.reload()
  locationFormRef.value?.reload()
}
</script>
