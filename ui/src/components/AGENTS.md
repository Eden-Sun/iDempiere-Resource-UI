<!-- Parent: ../AGENTS.md -->
# components - Reusable UI Components

## Purpose
Shared Vue components used across multiple views. These are presentation-focused, reusable building blocks.

## Key Files
- `Pagination.vue` - Page navigation with prev/next and page numbers
- `StatusBadge.vue` - Colored status indicator badges
- `ErrorMessage.vue` - Error alert display component
- `SuccessMessage.vue` - Success notification component
- `DynamicField.vue` - Renders form fields based on iDempiere column metadata
- `DynamicForm.vue` - Builds entire forms from window/tab field definitions

## For AI Agents
- **Styling**: Use daisyUI classes exclusively (no custom CSS unless necessary)
- **Props**: Define props with TypeScript interfaces
- **Events**: Use `defineEmits` for component events
- **Slots**: Use named slots for flexible content injection

## Component Patterns

### StatusBadge
```vue
<StatusBadge status="completed" />  <!-- Shows green badge -->
<StatusBadge status="pending" />    <!-- Shows yellow badge -->
```

### Pagination
```vue
<Pagination
  :current-page="page"
  :total-pages="totalPages"
  @page-change="onPageChange"
/>
```

### DynamicField
Renders appropriate input type based on iDempiere AD_Column metadata:
- Text → `<input type="text">`
- Number → `<input type="number">`
- Date → `<input type="date">`
- List → `<select>` with reference values
- YesNo → `<input type="checkbox">`

## daisyUI Classes Reference
- Buttons: `btn`, `btn-primary`, `btn-secondary`, `btn-error`
- Forms: `input`, `select`, `checkbox`, `textarea`
- Layout: `card`, `card-body`, `modal`, `drawer`
- Feedback: `alert`, `badge`, `loading`

## Dependencies
- daisyUI (Tailwind CSS component library)
- Vue 3 Composition API
