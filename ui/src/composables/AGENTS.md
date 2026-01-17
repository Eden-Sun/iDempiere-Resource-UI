<!-- Parent: ../AGENTS.md -->
# composables - Reusable Composition Functions

## Purpose
Vue 3 composables that encapsulate reusable stateful logic. These follow the Vue Composition API pattern and can be shared across multiple components.

## Key Files
- `useForm.ts` - Form state management with validation and submission handling
- `useList.ts` - List pagination, filtering, and loading state management

## For AI Agents
- **Naming**: All composables must start with `use` prefix
- **Pattern**: Return reactive refs and methods from composable functions
- **State**: Use `ref()` and `reactive()` for reactive state
- **Cleanup**: Use `onUnmounted()` for cleanup if needed

## useForm.ts
Handles form state including:
- Field values and validation
- Dirty/pristine state tracking
- Submission loading state
- Error handling

## useList.ts
Handles list operations including:
- Pagination (page, pageSize, total)
- Filtering and search
- Loading and error states
- Refresh functionality

## Usage Example
```typescript
// In a component
import { useForm } from '@/composables/useForm'
import { useList } from '@/composables/useList'

const { fields, isValid, submit } = useForm(initialValues)
const { items, loading, pagination, fetchList } = useList(fetchFunction)
```

## Dependencies
- Vue 3 Composition API (`ref`, `reactive`, `computed`, `watch`)
- No external dependencies
