import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

type SearchParams = Record<string, string | number | boolean | undefined>

export type Resource = {
  id: number
  name: string
  resourceTypeId: number
}

export type ResourceType = {
  id: number
  name: string
  isTimeSlot: boolean
  isDateSlot: boolean
  timeSlotStart?: string
  timeSlotEnd?: string
  onMonday?: boolean
  onTuesday?: boolean
  onWednesday?: boolean
  onThursday?: boolean
  onFriday?: boolean
  onSaturday?: boolean
  onSunday?: boolean
}

export type ResourceAssignment = {
  id: number
  name: string
  from: string
  to?: string
}

export async function listResources(token: string): Promise<Resource[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/S_Resource`,
    {
      token,
      searchParams: {
        $select: 'S_Resource_ID,Name,S_ResourceType_ID',
        $orderby: 'Name',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
    resourceTypeId: Number(r.S_ResourceType_ID?.id ?? r.S_ResourceType_ID ?? 0),
  }))
}

export async function getResourceType(token: string, id: number): Promise<ResourceType> {
  const r = await apiFetch<any>(`${API_V1}/models/S_ResourceType/${id}`, {
    token,
    searchParams: {
      $select:
        'S_ResourceType_ID,Name,IsTimeSlot,IsDateSlot,TimeSlotStart,TimeSlotEnd,OnMonday,OnTuesday,OnWednesday,OnThursday,OnFriday,OnSaturday,OnSunday',
    } satisfies SearchParams,
  })
  return {
    id: Number(r.S_ResourceType_ID),
    name: String(r.Name ?? ''),
    isTimeSlot: r.IsTimeSlot === true || r.IsTimeSlot === 'Y',
    isDateSlot: r.IsDateSlot === true || r.IsDateSlot === 'Y',
    timeSlotStart: r.TimeSlotStart ? String(r.TimeSlotStart) : undefined,
    timeSlotEnd: r.TimeSlotEnd ? String(r.TimeSlotEnd) : undefined,
    onMonday: r.OnMonday === true || r.OnMonday === 'Y',
    onTuesday: r.OnTuesday === true || r.OnTuesday === 'Y',
    onWednesday: r.OnWednesday === true || r.OnWednesday === 'Y',
    onThursday: r.OnThursday === true || r.OnThursday === 'Y',
    onFriday: r.OnFriday === true || r.OnFriday === 'Y',
    onSaturday: r.OnSaturday === true || r.OnSaturday === 'Y',
    onSunday: r.OnSunday === true || r.OnSunday === 'Y',
  }
}

export function formatTimestampForFilter(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  // Local timestamp in JDBC-ish format (server parses)
  const s = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  return `'${s}'`
}

export async function listAssignmentsForRange(
  token: string,
  resourceId: number,
  start: Date,
  end: Date,
): Promise<ResourceAssignment[]> {
  const filter = `S_Resource_ID eq ${resourceId} and AssignDateFrom ge ${formatTimestampForFilter(start)} and AssignDateFrom lt ${formatTimestampForFilter(end)}`
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/S_ResourceAssignment`,
    {
      token,
      searchParams: {
        $select: 'S_ResourceAssignment_ID,Name,AssignDateFrom,AssignDateTo',
        $orderby: 'AssignDateFrom',
        $filter: filter,
      } satisfies SearchParams,
    },
  )
  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
    from: String(r.AssignDateFrom),
    to: r.AssignDateTo ? String(r.AssignDateTo) : undefined,
  }))
}

export async function createAssignment(
  token: string,
  input: { resourceId: number; name: string; from: Date; to: Date; qty?: number; description?: string },
): Promise<any> {
  // API requires ISO format: yyyy-MM-dd'T'HH:mm:ss'Z'
  const toISO = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

  return await apiFetch<any>(`${API_V1}/models/S_ResourceAssignment`, {
    method: 'POST',
    token,
    json: {
      S_Resource_ID: input.resourceId,
      Name: input.name,
      AssignDateFrom: toISO(input.from),
      AssignDateTo: toISO(input.to),
      Qty: input.qty ?? 1,
      IsConfirmed: false,
    },
  })
}

export async function deleteAssignment(token: string, id: number): Promise<void> {
  await apiFetch<any>(`${API_V1}/models/S_ResourceAssignment/${id}`, {
    method: 'DELETE',
    token,
  })
}

/**
 * Get color label configuration for a resource assignment
 * @param token - Auth token
 * @param assignmentId - Resource assignment ID
 * @returns Color hex string or null if not configured
 */
export async function getAssignmentColor(token: string, assignmentId: number): Promise<string | null> {
  try {
    const configName = `EMUI_RESOURCE_ASSIGNMENT_COLOR_${assignmentId}`
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig?$filter=Name eq '${configName}'&$select=Value&$top=1`,
      { token },
    )
    if (res.records && res.records.length > 0) {
      return res.records[0].Value || null
    }
    return null
  } catch (error) {
    console.error(`Failed to get assignment color for ${assignmentId}:`, error)
    return null
  }
}

/**
 * Set color label for a resource assignment
 * @param token - Auth token
 * @param assignmentId - Resource assignment ID
 * @param color - Color hex string (e.g., '#3b82f6')
 * @returns true if successful
 */
export async function setAssignmentColor(
  token: string,
  assignmentId: number,
  color: string,
): Promise<boolean> {
  try {
    const configName = `EMUI_RESOURCE_ASSIGNMENT_COLOR_${assignmentId}`
    
    // Check if config already exists
    const existing = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig?$filter=Name eq '${configName}'&$top=1`,
      { token },
    )

    const body = {
      Name: configName,
      Value: color,
      ConfigurationLevel: 'S', // System level
      Description: `Color label for resource assignment ${assignmentId}`,
    }

    if (existing.records && existing.records.length > 0) {
      // Update existing
      const record = existing.records[0]
      const id = record.id

      if (!id) {
        console.error('Cannot update sysconfig: id not found in record', record)
        return false
      }

      const response = await fetch(`${API_V1}/models/AD_SysConfig/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ Value: color }),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error(`PUT AD_SysConfig failed: ${response.status} ${errText}`)
        throw new Error(`PUT failed: ${response.status} ${errText}`)
      }

      console.log(`✓ Updated assignment color: ${assignmentId} = ${color}`)
    } else {
      // Create new
      const response = await fetch(`${API_V1}/models/AD_SysConfig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error(`POST AD_SysConfig failed: ${response.status} ${errText}`)
        throw new Error(`POST failed: ${response.status} ${errText}`)
      }

      console.log(`✓ Created assignment color: ${assignmentId} = ${color}`)
    }
    return true
  } catch (error) {
    console.error(`Failed to set assignment color for ${assignmentId}:`, error)
    return false
  }
}

/**
 * Batch get color labels for multiple assignments
 * @param token - Auth token
 * @param assignmentIds - Array of assignment IDs
 * @returns Map of assignmentId -> color
 */
export async function getAssignmentColors(
  token: string,
  assignmentIds: number[],
): Promise<Map<number, string>> {
  const colorMap = new Map<number, string>()
  
  if (assignmentIds.length === 0) return colorMap

  try {
    // Build filter for all assignment IDs
    const configNames = assignmentIds.map(id => `EMUI_RESOURCE_ASSIGNMENT_COLOR_${id}`)
    const filter = configNames.map(name => `Name eq '${name}'`).join(' or ')
    
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig?$filter=${filter}&$select=Name,Value`,
      { token },
    )

    for (const record of res.records ?? []) {
      const name = record.Name
      if (name && name.startsWith('EMUI_RESOURCE_ASSIGNMENT_COLOR_')) {
        const assignmentId = Number(name.replace('EMUI_RESOURCE_ASSIGNMENT_COLOR_', ''))
        if (!isNaN(assignmentId) && record.Value) {
          colorMap.set(assignmentId, String(record.Value))
        }
      }
    }
  } catch (error) {
    console.error('Failed to batch get assignment colors:', error)
  }

  return colorMap
}

