<script setup lang="ts">
export type IconType = 'inbox' | 'search' | 'calendar' | 'users' | 'document'

interface Props {
  icon?: IconType
  title?: string
  description?: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'inbox',
  title: '無資料',
})

const emit = defineEmits<{
  action: []
}>()

const iconPaths: Record<IconType, string> = {
  inbox: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
}
</script>

<template>
  <div class="flex min-h-[400px] flex-col items-center justify-center px-6 py-16">
    <!-- Icon Container with Subtle Animation -->
    <div class="relative mb-6">
      <!-- Soft Glow Background -->
      <div
        class="absolute inset-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 blur-2xl opacity-60"
        style="transform: scale(1.4)"
      />

      <!-- Icon Circle -->
      <div
        class="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-white shadow-sm transition-all duration-500 hover:scale-110 hover:border-slate-300 hover:shadow-md"
      >
        <svg
          class="h-9 w-9 text-slate-400 transition-colors duration-300"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            :d="iconPaths[icon]"
          />
        </svg>
      </div>
    </div>

    <!-- Title -->
    <h3 class="text-lg font-semibold text-slate-700 tracking-tight">
      {{ title }}
    </h3>

    <!-- Description -->
    <p
      v-if="description"
      class="mt-2 max-w-md text-center text-sm leading-relaxed text-slate-500"
    >
      {{ description }}
    </p>

    <!-- Action Button -->
    <button
      v-if="actionText"
      class="mt-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-slate-700 hover:to-slate-800 hover:shadow-md active:scale-95"
      @click="emit('action')"
    >
      {{ actionText }}
    </button>
  </div>
</template>
