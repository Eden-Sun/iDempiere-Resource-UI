<!-- Parent: ../AGENTS.md -->
# views - Page Components

## Purpose
Contains all page-level Vue components, one per route. These are the main entry points for each feature's UI.

## Key Files

### Authentication
- `LoginPage.vue` - Two-step login: credentials → tenant/role/org/warehouse selection

### Resource Booking (Core Feature)
- `BookingPage.vue` - Weekly calendar for resource booking (Google Calendar style)
- `AdminCalendarPage.vue` - Admin view with quick booking and export

### Consultation/Request Management
- `RequestPage.vue` - Main request management with tabs
- `RequestListView.vue` - Request list with filtering and status
- `RequestDetailModal.vue` - Request detail popup modal
- `PendingCustomersView.vue` - Customers awaiting consultation
- `MyCustomersView.vue` - Current user's assigned customers
- `CustomerDetailView.vue` - Customer consultation history
- `GanttChartView.vue` - Timeline view for request tracking
- `KanbanBoardView.vue` - Kanban-style request board
- `StatisticsView.vue` - Employee statistics dashboard

### Business Operations
- `BPartnerPage.vue` - Business partner (customer/employee/vendor) management
- `OrderPage.vue` - Sales and purchase order management (IsSOTrx flag)
- `ProductionPage.vue` - Treatment/production order management
- `InOutPage.vue` - Goods receiving and shipping
- `PaymentPage.vue` - Payment processing and tracking
- `ReportPage.vue` - Report generation

### Administration
- `AdminPermissionsPage.vue` - Menu permission management (System users only)

## For AI Agents

### Calendar Component (BookingPage.vue)
- **Grid**: 7 columns (days) × 24 rows (hours)
- **Height**: `HOUR_HEIGHT = 60px` per hour
- **Time calculation**: `top = (minutes / 60) * HOUR_HEIGHT`
- **Hover preview**: Green overlay shows duration while dragging
- **Past slots**: Disabled with striped pattern, `cursor: not-allowed`

### Common Patterns
```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/features/auth/store'
import { apiFetch } from '@/shared/api/http'

const { token } = useAuth()
const loading = ref(false)
const data = ref<T[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const res = await apiFetch<{ records: T[] }>('/api/v1/models/Table', { token })
    data.value = res.records
  } finally {
    loading.value = false
  }
})
</script>
```

### Modal Pattern
```vue
<!-- Trigger -->
<button class="btn" @click="showModal = true">Open</button>

<!-- Modal -->
<dialog :class="['modal', { 'modal-open': showModal }]">
  <div class="modal-box">
    <!-- Content -->
    <div class="modal-action">
      <button class="btn" @click="showModal = false">Close</button>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop" @click="showModal = false" />
</dialog>
```

## Dependencies
- `features/` modules for business logic
- `components/` for shared UI
- `composables/` for form and list handling
- daisyUI for styling
