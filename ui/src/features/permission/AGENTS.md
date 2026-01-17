<!-- Parent: ../AGENTS.md -->
# permission - Access Control Module

## Purpose
Manages menu permissions and feature access control. Distinguishes between System users (admins) and regular Users.

## Key Files
- `api.ts` - Permission queries to AD_SysConfig
- `store.ts` - `usePermission()` composable for checking access
- `types.ts` - Menu item definitions and permission types
- `index.ts` - Re-exports

## Permission Model

### System vs User
- **System**: Has System Administrator role, can manage permissions
- **User**: Regular user, menu access controlled by AD_SysConfig

### Storage (AD_SysConfig)
Permissions stored as key-value pairs:
```
Name: EMUI_MENU_PERMISSION_{userId}
Value: "booking,request,order"  // comma-separated menu keys
```

## Menu Definition (types.ts)
```typescript
const MENU_ITEMS = [
  { key: 'booking', label: '預約', path: '/booking' },
  { key: 'request', label: '諮詢單', path: '/request' },
  { key: 'bpartner', label: '業務夥伴', path: '/bpartner' },
  { key: 'order', label: '銷售訂單', path: '/order' },
  { key: 'production', label: '療程單', path: '/production' },
  { key: 'inout', label: '收貨單', path: '/inout' },
  { key: 'payment', label: '付款單', path: '/payment' },
  { key: 'report', label: '報表', path: '/report' },
]
```

## usePermission() Composable

```typescript
import { usePermission } from '@/features/permission'

const {
  allowedMenus,      // Menu keys user can access
  isSystemUser,      // Has admin role
  canAccess,         // (key) => boolean
  loadPermissions,   // Fetch from AD_SysConfig
} = usePermission()
```

## API Functions (api.ts)

```typescript
// Get user's allowed menus
getUserPermissions(token, userId): Promise<string[]>

// Set user's allowed menus (System only)
setUserPermissions(token, userId, menuKeys): Promise<void>

// Get all users with their permissions (for admin UI)
getAllUserPermissions(token): Promise<UserPermission[]>
```

## For AI Agents
- **Default behavior**: No permissions = no access (whitelist model)
- **System users**: Bypass permission checks, see all menus
- **Admin UI**: Only visible to System users at `/admin/permissions`
- **Route guards**: Check `canAccess(menuKey)` before navigation

## AD_SysConfig Query Pattern
```typescript
// Get permission config
GET /api/v1/models/AD_SysConfig?$filter=Name eq 'EMUI_MENU_PERMISSION_${userId}'

// Set permission config
PUT /api/v1/models/AD_SysConfig/${configId}
Body: { Value: "booking,request,order" }
```

## Dependencies
- `shared/api/http.ts` - HTTP client
- `features/auth/store.ts` - User ID and System role check
