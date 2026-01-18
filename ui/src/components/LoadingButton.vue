<template>
  <button
    :type="type"
    :disabled="loading || disabled"
    :class="buttonClasses"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="loading loading-spinner"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  variant?: 'primary' | 'secondary' | 'error' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  type: 'button',
  variant: 'primary',
  size: 'md'
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const classes = ['btn', 'active:scale-95', 'transition-transform']

  // Variant classes
  switch (props.variant) {
    case 'primary':
      classes.push('btn-primary')
      break
    case 'secondary':
      classes.push('btn-secondary')
      break
    case 'error':
      classes.push('btn-error')
      break
    case 'ghost':
      classes.push('btn-ghost')
      break
  }

  // Size classes
  switch (props.size) {
    case 'sm':
      classes.push('btn-sm')
      break
    case 'md':
      // Default size, no additional class needed
      break
    case 'lg':
      classes.push('btn-lg')
      break
  }

  return classes.join(' ')
})
</script>
