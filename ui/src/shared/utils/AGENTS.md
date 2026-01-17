<!-- Parent: ../AGENTS.md -->
# utils - Utility Functions

## Purpose
Pure utility functions for common operations. No side effects, no state, no dependencies on Vue or features.

## Key Files

### datetime.ts
Date and time parsing/formatting for iDempiere API.

```typescript
// Parse ISO string to Date
parseISODate(str: string): Date

// Format Date to ISO string
formatISODate(date: Date): string  // "2026-01-14T09:00:00Z"

// Format for display
formatDisplayDate(date: Date): string      // "2026/01/14"
formatDisplayTime(date: Date): string      // "09:00"
formatDisplayDateTime(date: Date): string  // "2026/01/14 09:00"

// Date arithmetic
addDays(date: Date, days: number): Date
addMinutes(date: Date, minutes: number): Date
startOfDay(date: Date): Date
startOfWeek(date: Date): Date
```

### format.ts
Number and string formatting utilities.

```typescript
// Currency formatting
formatCurrency(amount: number): string  // "NT$ 1,234"

// Number formatting
formatNumber(num: number, decimals?: number): string

// Percentage
formatPercent(value: number): string  // "85%"

// Truncate text
truncate(str: string, maxLen: number): string
```

### error.ts
Error handling utilities.

```typescript
// Extract error message from various error types
getErrorMessage(error: unknown): string

// Check if error is API error
isApiError(error: unknown): boolean

// Format API error for display
formatApiError(error: ApiError): string
```

## For AI Agents
- **No dependencies**: These are pure functions, import directly
- **iDempiere dates**: Always use ISO format `yyyy-MM-dd'T'HH:mm:ss'Z'`
- **Timezone**: Backend uses UTC, convert for display if needed
- **Currency**: Default to NT$ (Taiwan Dollar) formatting

## Usage Examples

```typescript
import { formatISODate, parseISODate } from '@/shared/utils/datetime'
import { formatCurrency } from '@/shared/utils/format'
import { getErrorMessage } from '@/shared/utils/error'

// Date handling
const date = parseISODate(assignment.AssignDateFrom)
const isoString = formatISODate(new Date())

// Currency
const display = formatCurrency(order.GrandTotal)  // "NT$ 5,000"

// Error handling
try {
  await apiFetch(...)
} catch (e) {
  errorMessage.value = getErrorMessage(e)
}
```

## Dependencies
None - pure JavaScript/TypeScript utilities.
