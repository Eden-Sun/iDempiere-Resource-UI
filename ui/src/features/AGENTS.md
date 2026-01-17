<!-- Parent: ../AGENTS.md -->
# features - Domain Logic Modules

## Purpose
Contains all business domain logic organized by feature. Each subdirectory is a self-contained module with its own API calls, state management, and types.

## Subdirectories
- `auth/` - Authentication and session management (see auth/AGENTS.md)
- `resource/` - Resource booking and calendar (see resource/AGENTS.md)
- `request/` - Consultation requests R_Request (see request/AGENTS.md)
- `permission/` - Access control and menu permissions (see permission/AGENTS.md)
- `bpartner/` - Business partner C_BPartner management
- `order/` - Sales/Purchase orders C_Order
- `production/` - Treatment/production M_Production
- `inout/` - Goods movement M_InOut
- `payment/` - Payment processing C_Payment
- `window/` - Generic iDempiere window API wrapper

## Module Structure Pattern
Each feature module typically contains:
```
feature/
├── api.ts      # API functions using apiFetch()
├── store.ts    # Vue composable for state (if needed)
├── types.ts    # TypeScript interfaces
└── index.ts    # Re-exports (optional)
```

## For AI Agents
- **API Pattern**: Use `apiFetch()` from `shared/api/http.ts`
- **iDempiere REST**:
  - GET/PUT/DELETE: `/api/v1/models/{Table}/{id}`
  - POST (create with business logic): `/api/v1/windows/{slug}`
- **Filter Syntax**: Use `$filter=Field eq 'value'` for queries
- **Token**: All API calls require `token` from `useAuth()`

## iDempiere Table Reference
| Feature | Primary Table | Related Tables |
|---------|--------------|----------------|
| auth | AD_User | AD_Client, AD_Role, AD_Org |
| resource | S_ResourceAssignment | S_Resource, S_ResourceType |
| request | R_Request | R_RequestType, R_Status |
| bpartner | C_BPartner | AD_User (Contact), C_BPartner_Location |
| order | C_Order | C_OrderLine, M_Product |
| production | M_Production | M_ProductionLine |
| inout | M_InOut | M_InOutLine |
| payment | C_Payment | C_BankAccount |
| permission | AD_SysConfig | - |

## Dependencies
- `shared/api/http.ts` - HTTP client
- `shared/utils/` - Datetime, formatting utilities
