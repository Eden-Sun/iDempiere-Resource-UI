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
      IsConfirmed: true,
    },
  })
}

export async function deleteAssignment(token: string, id: number): Promise<void> {
  await apiFetch<any>(`${API_V1}/models/S_ResourceAssignment/${id}`, {
    method: 'DELETE',
    token,
  })
}

// === Resource Color ===

export const RESOURCE_COLORS = ['blue', 'red', 'green', 'purple', 'orange', 'cyan', 'pink'] as const
export type ResourceColor = typeof RESOURCE_COLORS[number]

/**
 * Get resource color from AD_SysConfig
 */
export async function getResourceColor(token: string, resourceId: number): Promise<ResourceColor | null> {
  try {
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig`,
      {
        token,
        searchParams: {
          $filter: `Name eq 'EMUI_RESOURCE_COLOR_${resourceId}'`,
          $select: 'Value',
          $top: '1',
        },
      },
    )
    if (res.records?.length > 0) {
      const value = res.records[0].Value as string
      if (RESOURCE_COLORS.includes(value as ResourceColor)) {
        return value as ResourceColor
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Get colors for multiple resources (batch)
 */
export async function getResourceColors(token: string, resourceIds: number[]): Promise<Map<number, ResourceColor>> {
  const colorMap = new Map<number, ResourceColor>()
  if (resourceIds.length === 0) return colorMap

  try {
    const filter = resourceIds.map((id) => `Name eq 'EMUI_RESOURCE_COLOR_${id}'`).join(' or ')
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig`,
      {
        token,
        searchParams: {
          $filter: filter,
          $select: 'Name,Value',
        },
      },
    )
    for (const rec of res.records ?? []) {
      const match = String(rec.Name).match(/^EMUI_RESOURCE_COLOR_(\d+)$/)
      if (match) {
        const id = parseInt(match[1], 10)
        const value = rec.Value as string
        if (RESOURCE_COLORS.includes(value as ResourceColor)) {
          colorMap.set(id, value as ResourceColor)
        }
      }
    }
  } catch {
    // ignore
  }
  return colorMap
}

/**
 * Set resource color in AD_SysConfig
 */
export async function setResourceColor(token: string, resourceId: number, color: ResourceColor): Promise<boolean> {
  const configName = `EMUI_RESOURCE_COLOR_${resourceId}`
  try {
    // Check if exists
    const existing = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig`,
      {
        token,
        searchParams: {
          $filter: `Name eq '${configName}'`,
          $top: '1',
        },
      },
    )

    if (existing.records?.length > 0) {
      // Update
      const id = existing.records[0].id
      await fetch(`${API_V1}/models/AD_SysConfig/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ Value: color }),
      })
    } else {
      // Create
      await fetch(`${API_V1}/models/AD_SysConfig`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          Name: configName,
          Value: color,
          ConfigurationLevel: 'S',
          Description: `EMUI Resource Color for S_Resource_ID=${resourceId}`,
        }),
      })
    }
    return true
  } catch {
    return false
  }
}

