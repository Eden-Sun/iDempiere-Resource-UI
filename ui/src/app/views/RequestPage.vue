<template>
  <div class="space-y-6">
    <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 class="text-lg font-semibold">諮詢單</h1>
      <p class="mt-1 text-sm text-slate-600">諮詢師接應客戶使用，一個客戶一個需求開一單。</p>
    </div>

    <!-- Tabs -->
    <div class="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex border-b border-slate-200">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-6 py-3 text-sm font-medium transition-colors"
          :class="activeTab === tab.id
            ? 'border-b-2 border-brand-600 text-brand-600'
            : 'text-slate-600 hover:text-slate-900'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 列表視圖 -->
      <div v-if="activeTab === 'list'" class="p-6">
        <RequestListView />
      </div>

      <!-- 待接應 -->
      <div v-if="activeTab === 'pending'" class="p-6">
        <PendingCustomersView />
      </div>

      <!-- 我的客戶 -->
      <div v-if="activeTab === 'my'" class="p-6">
        <MyCustomersView />
      </div>

      <!-- 客戶查詢 -->
      <div v-if="activeTab === 'customer'" class="p-6">
        <CustomerDetailView />
      </div>

      <!-- 統計 -->
      <div v-if="activeTab === 'stats'" class="p-6">
        <StatisticsView />
      </div>

       <!-- 甘特圖 -->
       <div v-if="activeTab === 'gantt'" class="p-6">
         <GanttChartView />
       </div>

       <!-- 看板 -->
       <div v-if="activeTab === 'kanban'" class="p-6">
         <KanbanBoardView />
       </div>
     </div>
   </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import RequestListView from './RequestListView.vue'
import PendingCustomersView from './PendingCustomersView.vue'
import MyCustomersView from './MyCustomersView.vue'
import CustomerDetailView from './CustomerDetailView.vue'
import StatisticsView from './StatisticsView.vue'
import GanttChartView from './GanttChartView.vue'
import KanbanBoardView from './KanbanBoardView.vue'

type TabId = 'list' | 'pending' | 'my' | 'customer' | 'stats' | 'gantt' | 'kanban'

const tabs = [
  { id: 'list' as TabId, label: '所有諮詢單' },
  { id: 'pending' as TabId, label: '待接應' },
  { id: 'my' as TabId, label: '我的客戶' },
  { id: 'customer' as TabId, label: '客戶查詢' },
  { id: 'stats' as TabId, label: '統計' },
  { id: 'gantt' as TabId, label: '甘特圖' },
  { id: 'kanban' as TabId, label: '看板' },
]

const activeTab = ref<TabId>('list')
</script>
