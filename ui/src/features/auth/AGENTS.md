<!-- Parent: ../AGENTS.md -->
# auth - Authentication Module

## Purpose
Handles user authentication, session management, and token storage for iDempiere REST API access.

## Key Files
- `api.ts` - Login API calls to iDempiere auth endpoints
- `store.ts` - `useAuth()` composable for authentication state
- `types.ts` - TypeScript interfaces for auth data

## Authentication Flow

### Step 1: Initial Login
```typescript
POST /api/v1/auth/tokens
Body: { userName, password }
Response: { token, clients: [...] }
```

### Step 2: Select Context
```typescript
PUT /api/v1/auth/tokens
Headers: { Authorization: Bearer {token} }
Body: { clientId, roleId, organizationId, warehouseId?, language }
Response: { token (updated) }
```

## useAuth() Composable

```typescript
import { useAuth } from '@/features/auth/store'

const {
  token,           // Current JWT token
  user,            // User info
  isAuthenticated, // Boolean login state
  isSystemUser,    // Has System role
  login,           // Step 1: credentials
  setContext,      // Step 2: client/role/org
  logout,          // Clear session
} = useAuth()
```

## Storage
- Token persisted in `localStorage` key: `auth_token`
- Context (client/role/org) in `localStorage` key: `auth_context`

## For AI Agents
- **Token required**: Pass `token` to all `apiFetch()` calls
- **System vs User**: Check `isSystemUser` for admin features
- **Logout**: Clears localStorage and redirects to `/`
- **Session expiry**: Token may expire, handle 401 errors

## Types (types.ts)
```typescript
interface AuthUser {
  id: number
  name: string
  email: string
}

interface AuthClient {
  id: number
  name: string
}

interface AuthRole {
  id: number
  name: string
}

interface AuthOrg {
  id: number
  name: string
}
```

## Dependencies
- `shared/api/http.ts` - HTTP client
- Vue 3 reactivity for state management
