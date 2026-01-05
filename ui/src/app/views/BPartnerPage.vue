<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">建立業務夥伴</h1>
      <p class="mt-1 text-sm text-slate-600">
        建立新的業務夥伴主檔，包含聯絡人與地址資訊。
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
        <h2 class="mb-4 text-base font-semibold text-slate-800">業務夥伴基本資料</h2>
        <DynamicForm
          ref="bpFormRef"
          window-slug="business-partner"
          tab-slug="business-partner"
          :exclude-fields="bpExcludeFields"
          @submit="handleBpSubmit"
          @loaded="onBpFieldsLoaded"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {{ submitting ? '處理中...' : '下一步：聯絡人' }}
              </button>
            </div>
          </template>
        </DynamicForm>
      </div>

      <!-- Step 2: Contact -->
      <div v-show="currentStep === 1">
        <h2 class="mb-4 text-base font-semibold text-slate-800">聯絡人資訊</h2>
        <DynamicForm
          ref="contactFormRef"
          window-slug="business-partner"
          tab-slug="contact-user"
          :exclude-fields="contactExcludeFields"
          @submit="handleContactSubmit"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                @click="currentStep = 0"
              >
                上一步
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {{ submitting ? '處理中...' : '下一步：地址' }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                @click="skipContact"
              >
                跳過此步驟
              </button>
            </div>
          </template>
        </DynamicForm>
      </div>

      <!-- Step 3: Location -->
      <div v-show="currentStep === 2">
        <h2 class="mb-4 text-base font-semibold text-slate-800">地址資訊</h2>
        <DynamicForm
          ref="locationFormRef"
          window-slug="business-partner"
          tab-slug="location"
          :exclude-fields="locationExcludeFields"
          @submit="handleLocationSubmit"
        >
          <template #actions>
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                @click="currentStep = 1"
              >
                上一步
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {{ submitting ? '儲存中...' : '完成建立' }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                @click="skipLocation"
              >
                跳過此步驟
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
        <h2 class="text-lg font-semibold text-slate-900">業務夥伴建立完成！</h2>
        <p class="mt-2 text-sm text-slate-600">
          已成功建立業務夥伴 <strong>{{ createdBpName }}</strong>
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            @click="resetForm"
          >
            建立另一筆
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DynamicForm from '../../components/DynamicForm.vue'
import { createWindowRecord, createChildTabRecord, type TabField } from '../../features/window/api'
import { useAuth } from '../../features/auth/store'

const auth = useAuth()

const steps = [
  { key: 'bp', label: '基本資料' },
  { key: 'contact', label: '聯絡人' },
  { key: 'location', label: '地址' },
]

const currentStep = ref(0)
const submitting = ref(false)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Created record references
const createdBpId = ref<number | null>(null)
const createdBpName = ref('')

// Form refs
const bpFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const contactFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)
const locationFormRef = ref<InstanceType<typeof DynamicForm> | null>(null)

// Fields to exclude from each form (auto-filled or irrelevant)
const bpExcludeFields = [
  'C_BPartner_ID',
  'C_BPartner_UU',
  // Customer/Vendor specific fields (handled in sub-tabs)
  'IsCustomer',
  'IsVendor',
  'IsEmployee',
  'IsSalesRep',
  // Accounting fields
  'SO_CreditLimit',
  'SO_CreditUsed',
  'TotalOpenBalance',
  'ActualLifeTimeValue',
  'PotentialLifeTimeValue',
  'AcqusitionCost',
  'ShareOfCustomer',
  'SalesVolume',
  'FirstSale',
  // Complex fields for later
  'Logo_ID',
  'BPartner_Parent_ID',
  'SalesRep_ID',
  'C_Dunning_ID',
  'C_PaymentTerm_ID',
  'M_PriceList_ID',
  'M_DiscountSchema_ID',
  'PO_PriceList_ID',
  'PO_DiscountSchema_ID',
  'PO_PaymentTerm_ID',
  'C_InvoiceSchedule_ID',
  'Invoice_PrintFormat_ID',
  'C_TaxGroup_ID',
  'C_Greeting_ID',
]

const contactExcludeFields = [
  'AD_User_ID',
  'AD_User_UU',
  'C_BPartner_ID', // Will be auto-set
  'C_BPartner_Location_ID',
  'Password',
  'Salt',
  'SecurityQuestion',
  'Answer',
  'LastPasswordReset',
  'DatePasswordChanged',
  'FailedLoginCount',
  'DateAccountLocked',
  'DateLastLogin',
  'LDAPUser',
  'EMail',
  'EmailUser',
  'EmailUserPW',
  'AD_OrgTrx_ID',
  'Supervisor_ID',
  'BP_Location_ID',
  'C_Location_ID',
  'C_Greeting_ID',
]

const locationExcludeFields = [
  'C_BPartner_Location_ID',
  'C_BPartner_Location_UU',
  'C_BPartner_ID', // Will be auto-set
  'C_Location_ID', // Complex location lookup
  'C_SalesRegion_ID',
]

function onBpFieldsLoaded(fields: TabField[]) {
  // Could use this to customize form behavior
}

async function handleBpSubmit(data: Record<string, unknown>) {
  if (!auth.token.value) {
    error.value = '未登入'
    return
  }

  submitting.value = true
  error.value = null

  try {
    const result = await createWindowRecord(auth.token.value, 'business-partner', data)
    createdBpId.value = result.id
    createdBpName.value = String(data.Name || result.Name || '')
    currentStep.value = 1
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '建立業務夥伴失敗'
  } finally {
    submitting.value = false
  }
}

async function handleContactSubmit(data: Record<string, unknown>) {
  if (!auth.token.value || !createdBpId.value) {
    error.value = '請先完成業務夥伴基本資料'
    return
  }

  submitting.value = true
  error.value = null

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
    error.value = e?.detail || e?.title || e?.message || '建立聯絡人失敗'
  } finally {
    submitting.value = false
  }
}

async function handleLocationSubmit(data: Record<string, unknown>) {
  if (!auth.token.value || !createdBpId.value) {
    error.value = '請先完成業務夥伴基本資料'
    return
  }

  submitting.value = true
  error.value = null

  try {
    await createChildTabRecord(
      auth.token.value,
      'business-partner',
      'business-partner',
      createdBpId.value,
      'location',
      data,
    )
    currentStep.value = 3
    successMessage.value = `業務夥伴「${createdBpName.value}」已成功建立！`
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '建立地址失敗'
  } finally {
    submitting.value = false
  }
}

function skipContact() {
  currentStep.value = 2
}

function skipLocation() {
  currentStep.value = 3
  successMessage.value = `業務夥伴「${createdBpName.value}」已成功建立！`
}

function resetForm() {
  currentStep.value = 0
  createdBpId.value = null
  createdBpName.value = ''
  error.value = null
  successMessage.value = null

  // Reset form data
  if (bpFormRef.value) bpFormRef.value.reload()
  if (contactFormRef.value) contactFormRef.value.reload()
  if (locationFormRef.value) locationFormRef.value.reload()
}
</script>
