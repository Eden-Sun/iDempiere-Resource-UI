<!-- Parent: ../AGENTS.md -->
# resource - Resource Booking Module

## Purpose
Core booking functionality for clinic resources (consultation rooms, doctors, operating rooms). Manages S_Resource and S_ResourceAssignment tables.

## Key Files
- `api.ts` - CRUD operations for resource assignments
- `utils.ts` - Calendar calculations, color utilities, time slot helpers

## iDempiere Tables

### S_Resource
Resource master data (rooms, doctors, equipment).
```typescript
{
  S_Resource_ID: number
  Name: string
  S_ResourceType_ID: number
  IsAvailable: boolean
}
```

### S_ResourceType
Resource type configuration with business hours.
```typescript
{
  S_ResourceType_ID: number
  Name: string
  TimeSlotStart: string  // "09:00:00"
  TimeSlotEnd: string    // "18:00:00"
  OnMonday: boolean
  OnTuesday: boolean
  // ... OnSunday
}
```

### S_ResourceAssignment
Individual booking/appointment.
```typescript
{
  S_ResourceAssignment_ID: number
  S_Resource_ID: number
  Name: string
  AssignDateFrom: string  // ISO datetime
  AssignDateTo: string
  IsConfirmed: boolean
}
```

## API Functions (api.ts)

```typescript
// Fetch resources
getResources(token): Promise<Resource[]>

// Fetch resource type (for business hours)
getResourceType(token, id): Promise<ResourceType>

// Fetch assignments for date range
getAssignments(token, resourceIds, dateFrom, dateTo): Promise<Assignment[]>

// Create assignment
createAssignment(token, data): Promise<Assignment>

// Update assignment
updateAssignment(token, id, data): Promise<void>

// Delete assignment
deleteAssignment(token, id): Promise<void>
```

## Color Storage
Colors stored in AD_SysConfig (not on Assignment itself):
```
Name: EMUI_RESOURCE_ASSIGNMENT_COLOR_{assignmentId}
Value: "#3b82f6"
```

## Calendar Constants (utils.ts)
```typescript
const HOUR_HEIGHT = 60  // pixels per hour
const SLOT_MINUTES = 30 // slot granularity

// Time to position
const top = (minutes / 60) * HOUR_HEIGHT

// Position to time
const minutes = (y / HOUR_HEIGHT) * 60
```

## For AI Agents
- **Business hours**: Filter display by `TimeSlotStart`/`TimeSlotEnd`
- **Business days**: Filter by `OnMonday`...`OnSunday` flags
- **Color management**: Use AD_SysConfig, not Assignment fields
- **Date format**: Always use ISO `yyyy-MM-dd'T'HH:mm:ss'Z'`

## Dependencies
- `shared/api/http.ts` - HTTP client
- `shared/utils/datetime.ts` - Date formatting
