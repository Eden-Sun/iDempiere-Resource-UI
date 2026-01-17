<!-- Parent: ../AGENTS.md -->
# request - Consultation Request Module

## Purpose
Manages consultation requests (R_Request) - the consultation/inquiry tracking system for clinic customers.

## Key Files
- `api.ts` - CRUD operations for R_Request using models API
- `window-api.ts` - Window-based API calls for business logic triggers

## iDempiere Tables

### R_Request
Main request/consultation record.
```typescript
{
  R_Request_ID: number
  DocumentNo: string
  R_RequestType_ID: number
  R_Status_ID: number
  C_BPartner_ID: number      // Customer
  SalesRep_ID: number        // Assigned employee
  Summary: string
  StartDate: string
  CloseDate: string
  Priority: string           // 1-9
  IsEscalated: boolean
}
```

### R_RequestType
Request category/type.
```typescript
{
  R_RequestType_ID: number
  Name: string
  IsDefault: boolean
}
```

### R_Status
Request status (New, In Progress, Closed, etc.).
```typescript
{
  R_Status_ID: number
  Name: string
  IsClosed: boolean
  IsDefault: boolean
}
```

## API Functions

### api.ts (Models API)
```typescript
// List requests with filters
getRequests(token, filters?): Promise<Request[]>

// Get single request
getRequest(token, id): Promise<Request>

// Update request
updateRequest(token, id, data): Promise<void>

// Delete request
deleteRequest(token, id): Promise<void>

// Get request types
getRequestTypes(token): Promise<RequestType[]>

// Get statuses
getStatuses(token): Promise<Status[]>
```

### window-api.ts (Window API)
Use for creating with business logic:
```typescript
// Create request (triggers iDempiere process)
createRequest(token, data): Promise<Request>
```

## Common Filters
```typescript
// By status
$filter: `R_Status_ID eq ${statusId}`

// By sales rep (my customers)
$filter: `SalesRep_ID eq ${userId}`

// By customer
$filter: `C_BPartner_ID eq ${partnerId}`

// Open requests only
$filter: `R_Status/IsClosed eq false`
```

## For AI Agents
- **Create**: Use `/api/v1/windows/request` (triggers business logic)
- **Read/Update/Delete**: Use `/api/v1/models/R_Request`
- **Pending customers**: Requests where customer has no completed consultation
- **Gantt view**: Uses `StartDate` and `CloseDate` for timeline
- **Statistics**: Group by `SalesRep_ID` or `R_RequestType_ID`

## Views Using This Module
- `RequestPage.vue` - Main request management
- `RequestListView.vue` - Filtered request list
- `RequestDetailModal.vue` - Request details
- `PendingCustomersView.vue` - Awaiting consultation
- `MyCustomersView.vue` - Assigned to current user
- `GanttChartView.vue` - Timeline visualization
- `StatisticsView.vue` - Employee statistics

## Dependencies
- `shared/api/http.ts` - HTTP client
- `features/auth/store.ts` - Current user for SalesRep filtering
