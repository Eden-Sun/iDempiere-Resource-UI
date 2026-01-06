<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
        <h1 class="card-title">業務夥伴</h1>
        <p>建立業務夥伴（可選擇建立聯絡人與地址）。</p>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="alert alert-error whitespace-pre-line">
      {{ error }}
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <!-- Main Form -->
    <div class="card bg-base-100 shadow-sm">
      <div class="card-body">
      <!-- Step Indicator -->
      <ul class="steps mb-6 w-full">
        <li
          v-for="(step, idx) in steps"
          :key="step.key"
          class="step"
          :class="{ 'step-primary': currentStep >= idx }"
        >
          {{ step.label }}
        </li>
      </ul>

      <!-- Step 1: Business Partner -->
      <div v-show="currentStep === 0">
        <h2 class="mb-4 text-base font-semibold text-slate-800">業務夥伴</h2>
        <DynamicForm
          ref="bpFormRef"
          window-slug="business-partner"
          tab-slug="business-partner"
          :default-values="bpDefaults"
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
          :default-values="contactDefaults"
          submit-label="下一步：地址"
          @submit="handleContactSubmit"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="currentStep = 0"
              >
                返回
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="btn btn-primary btn-sm"
              >
                {{ submitting ? '儲存中…' : '下一步：地址' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
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
          :default-values="locationDefaults"
          submit-label="完成"
          @submit="handleLocationSubmit"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="btn btn-outline btn-sm"
                @click="currentStep = 1"
              >
                返回
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="btn btn-success btn-sm"
              >
                {{ submitting ? '儲存中…' : '完成' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-sm"
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
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
          <span class="text-3xl text-success">✓</span>
        </div>
        <h2 class="text-lg font-semibold">業務夥伴已建立！</h2>
        <p class="mt-2">
          已成功建立 <strong>{{ createdBpName }}</strong>
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="btn btn-primary btn-sm"
            @click="resetForm"
          >
            再建立一筆
          </button>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import DynamicForm from '../../components/DynamicForm.vue'
import { createWindowRecord, createChildTabRecord, createModelRecord } from '../../features/window/api'
import { useAuth } from '../../features/auth/store'

const auth = useAuth()

const steps = [
  { key: 'bp', label: '業務夥伴' },
  { key: 'contact', label: '聯絡人' },
  { key: 'location', label: '地址' },
]

// Default values to prevent creation failures
// C_BP_Group_ID: 104 = Standard (GardenWorld default BP Group)
const bpDefaults = computed(() => ({
  C_BP_Group_ID: 104,
}))

// Contact defaults - Name will be auto-filled from BP name if needed
const contactDefaults = computed(() => ({
  // No special defaults needed, Name is usually required
}))

// Location defaults
// C_Country_ID: 100 = USA (iDempiere default), 316 = Taiwan
const locationDefaults = computed(() => ({
  C_Country_ID: 100,
}))

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

  // 如果有缺少的必填欄位，優先顯示清楚的欄位列表
  if (missingFields && missingFields.length > 0) {
    result = `請填寫以下必填欄位：\n• ${missingFields.join('\n• ')}`
    return result
  }

  // 否則顯示 API 回傳的錯誤
  if (title) result += title
  if (detail && detail !== title) {
    result += result ? `: ${detail}` : detail
  }
  if (!result && message) result = message

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
      locationData.C_Country_ID = locationDefaults.value.C_Country_ID || 100 // Default: USA
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
