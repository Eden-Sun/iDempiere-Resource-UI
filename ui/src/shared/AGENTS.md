<!-- Parent: ../AGENTS.md -->
# shared - Cross-Cutting Infrastructure

## Purpose
Contains infrastructure code used across all features: HTTP client, utilities, and shared constants. This layer has no business logic.

## Subdirectories
- `api/` - HTTP client and API utilities
- `utils/` - Helper functions (datetime, formatting, errors) (see utils/AGENTS.md)
- `labels/` - UI label translations and constants

## Key Files

### api/http.ts
The core HTTP client wrapper around `ky`. All API calls must use this.

```typescript
import { apiFetch } from '@/shared/api/http'

// GET with query params
const res = await apiFetch<{ records: T[] }>('/api/v1/models/Table', {
  token,
  searchParams: { $filter: `Field eq '${value}'` }
})

// POST with JSON body
await apiFetch('/api/v1/windows/slug', {
  method: 'POST',
  token,
  json: { Field: value }
})

// PUT update
await apiFetch(`/api/v1/models/Table/${id}`, {
  method: 'PUT',
  token,
  json: { Field: newValue }
})

// DELETE
await apiFetch(`/api/v1/models/Table/${id}`, {
  method: 'DELETE',
  token
})
```

### labels/columnLabels.ts
Field label translations for iDempiere columns (Chinese zh_TW).

## For AI Agents
- **Always use apiFetch**: Never use raw `fetch` or `ky` directly
- **Token required**: All authenticated endpoints need `token` option
- **Error handling**: `apiFetch` throws on HTTP errors, wrap in try/catch
- **Base URL**: Configured via Vite proxy, requests go to `/api/v1/...`

## API Response Patterns
```typescript
// List response
{ records: T[], row-count: number }

// Single record
{ ...fields }

// Create response
{ id: number, ...fields }
```

## Dependencies
- `ky` - HTTP client library
- Environment: `VITE_API_IP` for backend URL
