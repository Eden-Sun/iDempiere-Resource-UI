<script setup lang="ts">
import { useToast } from '../composables/useToast'

const { toasts, remove } = useToast()

const getAlertClass = (type: string) => {
  const classes: Record<string, string> = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning'
  }
  return classes[type] || 'alert-info'
}

const getIcon = (type: string) => {
  const icons: Record<string, string> = {
    success: '✓',
    error: '✕',
    info: 'ⓘ',
    warning: '⚠'
  }
  return icons[type] || 'ⓘ'
}
</script>

<template>
  <div class="toast toast-top toast-end z-[9999]">
    <TransitionGroup
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-x-0 opacity-100 scale-100"
      leave-to-class="translate-x-8 opacity-0 scale-95"
      move-class="transition-transform duration-300"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="['alert shadow-lg min-w-[320px] max-w-md', getAlertClass(toast.type)]"
        class="relative backdrop-blur-sm"
      >
        <div class="flex items-center gap-3 flex-1">
          <span class="text-xl font-bold">{{ getIcon(toast.type) }}</span>
          <span class="text-sm font-medium">{{ toast.message }}</span>
        </div>
        <button
          @click="remove(toast.id)"
          class="btn btn-sm btn-circle btn-ghost absolute -top-1 -right-1 opacity-60 hover:opacity-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.alert {
  animation: gentle-bounce 0.4s ease-out;
}

@keyframes gentle-bounce {
  0% {
    transform: translateX(100%) scale(0.95);
  }
  60% {
    transform: translateX(-8px) scale(1.02);
  }
  100% {
    transform: translateX(0) scale(1);
  }
}
</style>
