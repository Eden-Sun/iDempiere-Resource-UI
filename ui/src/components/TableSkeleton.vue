<script setup lang="ts">
interface Props {
  rows?: number
  columns?: number
}

withDefaults(defineProps<Props>(), {
  rows: 5,
  columns: 4,
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table w-full">
      <!-- Header skeleton -->
      <thead>
        <tr>
          <th v-for="col in columns" :key="`header-${col}`" class="bg-base-200">
            <div class="skeleton h-4 w-full" />
          </th>
        </tr>
      </thead>

      <!-- Body skeleton rows -->
      <tbody>
        <tr v-for="row in rows" :key="`row-${row}`" class="hover">
          <td v-for="col in columns" :key="`cell-${row}-${col}`">
            <div class="skeleton h-4 w-full" />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.skeleton {
  @apply animate-pulse bg-base-300 rounded;
}
</style>
