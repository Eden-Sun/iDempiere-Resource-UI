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
      <form v-show="currentStep === 0" @submit.prevent="handleBpSubmit">
        <h2 class="mb-4 text-base font-semibold text-slate-800">業務夥伴基本資料</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- 編號 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              編號 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="bpForm.Value"
              type="text"
              required
              placeholder="例如：BP-001"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 名稱 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              名稱 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="bpForm.Name"
              type="text"
              required
              placeholder="公司或個人名稱"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 第二名稱 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">第二名稱</label>
            <input
              v-model="bpForm.Name2"
              type="text"
              placeholder="別名或英文名"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 統一編號 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">統一編號</label>
            <input
              v-model="bpForm.TaxID"
              type="text"
              placeholder="公司統編"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 說明 -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700">說明</label>
            <textarea
              v-model="bpForm.Description"
              rows="2"
              placeholder="備註說明"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 網址 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">網址</label>
            <input
              v-model="bpForm.URL"
              type="url"
              placeholder="https://example.com"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 類型 -->
          <div class="flex flex-wrap gap-4 sm:col-span-2">
            <label class="flex items-center gap-2">
              <input v-model="bpForm.IsCustomer" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">客戶</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="bpForm.IsVendor" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">供應商</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="bpForm.IsEmployee" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">員工</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="bpForm.IsSalesRep" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">業務代表</span>
            </label>
          </div>
        </div>

        <div class="mt-6 flex gap-3">
          <button
            type="submit"
            :disabled="submitting"
            class="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {{ submitting ? '處理中...' : '下一步：聯絡人' }}
          </button>
        </div>
      </form>

      <!-- Step 2: Contact -->
      <form v-show="currentStep === 1" @submit.prevent="handleContactSubmit">
        <h2 class="mb-4 text-base font-semibold text-slate-800">聯絡人資訊</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- 姓名 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              姓名 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="contactForm.Name"
              type="text"
              required
              placeholder="聯絡人姓名"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 職稱 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">職稱</label>
            <input
              v-model="contactForm.Title"
              type="text"
              placeholder="例如：經理"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 電話 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">電話</label>
            <input
              v-model="contactForm.Phone"
              type="tel"
              placeholder="02-1234-5678"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 手機 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">手機</label>
            <input
              v-model="contactForm.Phone2"
              type="tel"
              placeholder="0912-345-678"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 電子郵件 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">電子郵件</label>
            <input
              v-model="contactForm.EMail"
              type="email"
              placeholder="contact@example.com"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 傳真 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">傳真</label>
            <input
              v-model="contactForm.Fax"
              type="tel"
              placeholder="02-1234-5679"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 說明 -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700">說明</label>
            <textarea
              v-model="contactForm.Description"
              rows="2"
              placeholder="聯絡人備註"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

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
            跳過
          </button>
        </div>
      </form>

      <!-- Step 3: Location -->
      <form v-show="currentStep === 2" @submit.prevent="handleLocationSubmit">
        <h2 class="mb-4 text-base font-semibold text-slate-800">地址資訊</h2>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- 地址名稱 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">
              地址名稱 <span class="text-rose-500">*</span>
            </label>
            <input
              v-model="locationForm.Name"
              type="text"
              required
              placeholder="例如：總公司、倉庫"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 電話 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">電話</label>
            <input
              v-model="locationForm.Phone"
              type="tel"
              placeholder="02-1234-5678"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 傳真 -->
          <div>
            <label class="block text-sm font-medium text-slate-700">傳真</label>
            <input
              v-model="locationForm.Fax"
              type="tel"
              placeholder="02-1234-5679"
              class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <!-- 用途 -->
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2">
              <input v-model="locationForm.IsShipTo" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">送貨地址</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="locationForm.IsBillTo" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">帳單地址</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="locationForm.IsPayFrom" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">付款地址</span>
            </label>
            <label class="flex items-center gap-2">
              <input v-model="locationForm.IsRemitTo" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span class="text-sm text-slate-700">匯款地址</span>
            </label>
          </div>
        </div>

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
            跳過
          </button>
        </div>
      </form>

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
import { reactive, ref } from 'vue'
import { createWindowRecord, createChildTabRecord } from '../../features/window/api'
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

const createdBpId = ref<number | null>(null)
const createdBpName = ref('')

// Form data
const bpForm = reactive({
  Value: '',
  Name: '',
  Name2: '',
  TaxID: '',
  Description: '',
  URL: '',
  IsCustomer: true,
  IsVendor: false,
  IsEmployee: false,
  IsSalesRep: false,
})

const contactForm = reactive({
  Name: '',
  Title: '',
  Phone: '',
  Phone2: '',
  EMail: '',
  Fax: '',
  Description: '',
})

const locationForm = reactive({
  Name: '',
  Phone: '',
  Fax: '',
  IsShipTo: true,
  IsBillTo: true,
  IsPayFrom: false,
  IsRemitTo: false,
})

async function handleBpSubmit() {
  if (!auth.token.value) {
    error.value = '未登入'
    return
  }

  submitting.value = true
  error.value = null

  try {
    const data: Record<string, unknown> = {
      Value: bpForm.Value,
      Name: bpForm.Name,
      IsCustomer: bpForm.IsCustomer,
      IsVendor: bpForm.IsVendor,
      IsEmployee: bpForm.IsEmployee,
      IsSalesRep: bpForm.IsSalesRep,
    }
    if (bpForm.Name2) data.Name2 = bpForm.Name2
    if (bpForm.TaxID) data.TaxID = bpForm.TaxID
    if (bpForm.Description) data.Description = bpForm.Description
    if (bpForm.URL) data.URL = bpForm.URL

    const result = await createWindowRecord(auth.token.value, 'business-partner', data)
    createdBpId.value = result.id
    createdBpName.value = bpForm.Name
    currentStep.value = 1
  } catch (e: any) {
    error.value = e?.detail || e?.title || e?.message || '建立業務夥伴失敗'
  } finally {
    submitting.value = false
  }
}

async function handleContactSubmit() {
  if (!auth.token.value || !createdBpId.value) {
    error.value = '請先完成業務夥伴基本資料'
    return
  }

  submitting.value = true
  error.value = null

  try {
    const data: Record<string, unknown> = {
      Name: contactForm.Name,
    }
    if (contactForm.Title) data.Title = contactForm.Title
    if (contactForm.Phone) data.Phone = contactForm.Phone
    if (contactForm.Phone2) data.Phone2 = contactForm.Phone2
    if (contactForm.EMail) data.EMail = contactForm.EMail
    if (contactForm.Fax) data.Fax = contactForm.Fax
    if (contactForm.Description) data.Description = contactForm.Description

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

async function handleLocationSubmit() {
  if (!auth.token.value || !createdBpId.value) {
    error.value = '請先完成業務夥伴基本資料'
    return
  }

  submitting.value = true
  error.value = null

  try {
    const data: Record<string, unknown> = {
      Name: locationForm.Name,
      IsShipTo: locationForm.IsShipTo,
      IsBillTo: locationForm.IsBillTo,
      IsPayFrom: locationForm.IsPayFrom,
      IsRemitTo: locationForm.IsRemitTo,
    }
    if (locationForm.Phone) data.Phone = locationForm.Phone
    if (locationForm.Fax) data.Fax = locationForm.Fax

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

  // Reset forms
  Object.assign(bpForm, {
    Value: '',
    Name: '',
    Name2: '',
    TaxID: '',
    Description: '',
    URL: '',
    IsCustomer: true,
    IsVendor: false,
    IsEmployee: false,
    IsSalesRep: false,
  })
  Object.assign(contactForm, {
    Name: '',
    Title: '',
    Phone: '',
    Phone2: '',
    EMail: '',
    Fax: '',
    Description: '',
  })
  Object.assign(locationForm, {
    Name: '',
    Phone: '',
    Fax: '',
    IsShipTo: true,
    IsBillTo: true,
    IsPayFrom: false,
    IsRemitTo: false,
  })
}
</script>
