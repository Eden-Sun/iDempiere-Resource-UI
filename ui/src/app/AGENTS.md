<!-- Parent: ../AGENTS.md -->
# app - Application Layer

## Purpose
Contains the Vue application shell, routing configuration, and all page-level view components. This is the presentation layer that orchestrates features and components.

## Key Files
- `App.vue` - Root Vue component with layout structure and navigation
- `routes.ts` - Vue Router configuration with all route definitions

## Subdirectories
- `views/` - Page components (one per route) (see views/AGENTS.md)

## For AI Agents
- **Layout**: `App.vue` contains the main layout with sidebar navigation
- **Routing**: All routes defined in `routes.ts`, use Vue Router's `<RouterView>`
- **Navigation**: Sidebar menu dynamically filtered by user permissions
- **Auth Guard**: Routes check authentication state from `useAuth()`

## Route Structure
| Path | Component | Description |
|------|-----------|-------------|
| `/` | LoginPage | Two-step login (credentials → tenant/role/org selection) |
| `/booking` | BookingPage | Calendar-based resource booking |
| `/admin-calendar` | AdminCalendarPage | Admin calendar management |
| `/request` | RequestPage | Consultation request management |
| `/bpartner` | BPartnerPage | Business partner (customer/employee) management |
| `/order` | OrderPage | Sales/Purchase order management |
| `/production` | ProductionPage | Treatment/production orders |
| `/inout` | InOutPage | Goods movement (receiving/shipping) |
| `/payment` | PaymentPage | Payment processing |
| `/report` | ReportPage | Reports |
| `/admin/permissions` | AdminPermissionsPage | Permission management (System only) |

## Dependencies
- `features/auth/store.ts` - Authentication state
- `features/permission/store.ts` - Permission checking
- All feature modules for page-specific logic
