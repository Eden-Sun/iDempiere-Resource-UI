import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

type SearchParams = Record<string, string | number | boolean | undefined>

export type Request = {
  id: number
  name?: string
  description?: string
  bPartnerId: number
  bPartnerName?: string
  salesRepId?: number
  salesRepName?: string
  requestTypeId?: number
  requestTypeName?: string
  requestStatusId?: number
  requestStatusName?: string
  startDate?: string
  closeDate?: string
  created: string
}

export type RequestType = {
  id: number
  name: string
}

export type RequestStatus = {
  id: number
  name: string
}

export async function listRequests(
  token: string,
  filter?: {
    bPartnerId?: number
    salesRepId?: number
    requestTypeId?: number
    requestStatusId?: number
    hasStartDate?: boolean
    hasCloseDate?: boolean
    createdAfter?: Date
  },
  pagination?: { top?: number; skip?: number },
): Promise<{ records: Request[]; totalCount?: number }> {
  const searchParams: SearchParams = {
    $select: 'R_Request_ID,Summary,Result,C_BPartner_ID,SalesRep_ID,R_RequestType_ID,R_Status_ID,StartDate,CloseDate,Created',
    $orderby: 'Created desc',
  }

  if (pagination?.top) searchParams.$top = pagination.top
  if (pagination?.skip) searchParams.$skip = pagination.skip

  const filters: string[] = []

  if (filter?.bPartnerId) filters.push(`C_BPartner_ID eq ${filter.bPartnerId}`)
  if (filter?.salesRepId) filters.push(`SalesRep_ID eq ${filter.salesRepId}`)
  if (filter?.requestTypeId) filters.push(`R_RequestType_ID eq ${filter.requestTypeId}`)
  if (filter?.requestStatusId) filters.push(`R_Status_ID eq ${filter.requestStatusId}`)
  // Note: API doesn't support 'ne' operator, so we filter null checks client-side
  // For 'eq null' checks, we can still use server-side filtering
  if (filter?.hasStartDate === false) {
    filters.push('StartDate eq null')
  }
  if (filter?.hasCloseDate === false) {
    filters.push('CloseDate eq null')
  }
  
  // Store filter flags for client-side filtering (ne null cases)
  const needsClientFiltering = {
    hasStartDate: filter?.hasStartDate === true,
    hasCloseDate: filter?.hasCloseDate === true,
  }
  if (filter?.createdAfter) {
    const pad = (n: number) => String(n).padStart(2, '0')
    const s = `${filter.createdAfter.getFullYear()}-${pad(filter.createdAfter.getMonth() + 1)}-${pad(filter.createdAfter.getDate())} ${pad(filter.createdAfter.getHours())}:${pad(filter.createdAfter.getMinutes())}:${pad(filter.createdAfter.getSeconds())}`
    filters.push(`Created ge '${s}'`)
  }

  if (filters.length > 0) {
    searchParams.$filter = filters.join(' and ')
  }

  const res = await apiFetch<{ records: any[]; 'row-count'?: number }>(
    `${API_V1}/models/R_Request`,
    { token, searchParams },
  )

  let requests: Request[] = (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: r.Summary ? String(r.Summary) : undefined,
    description: r.Result ? String(r.Result) : undefined,
    bPartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    bPartnerName: r.C_BPartner_ID?.name ? String(r.C_BPartner_ID.name) : undefined,
    salesRepId: r.SalesRep_ID?.id ? Number(r.SalesRep_ID.id) : undefined,
    salesRepName: r.SalesRep_ID?.name ? String(r.SalesRep_ID.name) : undefined,
    requestTypeId: r.R_RequestType_ID?.id ? Number(r.R_RequestType_ID.id) : undefined,
    requestTypeName: r.R_RequestType_ID?.name ? String(r.R_RequestType_ID.name) : undefined,
    requestStatusId: r.R_Status_ID?.id ? Number(r.R_Status_ID.id) : undefined,
    requestStatusName: r.R_Status_ID?.name ? String(r.R_Status_ID.name) : undefined,
    startDate: r.StartDate ? String(r.StartDate) : undefined,
    closeDate: r.CloseDate ? String(r.CloseDate) : undefined,
    created: String(r.Created),
  }))

  // Client-side filtering for 'ne null' cases (API doesn't support 'ne' operator)
  if (needsClientFiltering.hasStartDate) {
    requests = requests.filter((r) => r.startDate != null)
  }
  if (needsClientFiltering.hasCloseDate) {
    requests = requests.filter((r) => r.closeDate != null)
  }

  return {
    records: requests,
    totalCount: res['row-count'] ?? requests.length,
  }
}

export async function getRequest(token: string, id: number): Promise<Request> {
  const r = await apiFetch<any>(`${API_V1}/models/R_Request/${id}`, {
    token,
    searchParams: {
      $select: 'R_Request_ID,Summary,Result,C_BPartner_ID,SalesRep_ID,R_RequestType_ID,R_Status_ID,StartDate,CloseDate,Created',
    },
  })

  return {
    id: Number(r.id),
    name: r.Summary ? String(r.Summary) : undefined,
    description: r.Result ? String(r.Result) : undefined,
    bPartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    bPartnerName: r.C_BPartner_ID?.name ? String(r.C_BPartner_ID.name) : undefined,
    salesRepId: r.SalesRep_ID?.id ? Number(r.SalesRep_ID.id) : undefined,
    salesRepName: r.SalesRep_ID?.name ? String(r.SalesRep_ID.name) : undefined,
    requestTypeId: r.R_RequestType_ID?.id ? Number(r.R_RequestType_ID.id) : undefined,
    requestTypeName: r.R_RequestType_ID?.name ? String(r.R_RequestType_ID.name) : undefined,
    requestStatusId: r.R_Status_ID?.id ? Number(r.R_Status_ID.id) : undefined,
    requestStatusName: r.R_Status_ID?.name ? String(r.R_Status_ID.name) : undefined,
    startDate: r.StartDate ? String(r.StartDate) : undefined,
    closeDate: r.CloseDate ? String(r.CloseDate) : undefined,
    created: String(r.Created),
  }
}

export async function createRequest(
  token: string,
  input: {
    bPartnerId: number
    salesRepId?: number
    name?: string
    description?: string
    requestTypeId?: number
    requestStatusId?: number
    startDate?: Date
    closeDate?: Date
  },
): Promise<any> {
  const toISO = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

  return await apiFetch<any>(`${API_V1}/models/R_Request`, {
    method: 'POST',
    token,
    json: {
      Summary: input.name,
      Result: input.description,
      C_BPartner_ID: input.bPartnerId,
      SalesRep_ID: input.salesRepId || null,
      R_RequestType_ID: input.requestTypeId || null,
      R_Status_ID: input.requestStatusId || null,
      StartDate: input.startDate ? toISO(input.startDate) : null,
      CloseDate: input.closeDate ? toISO(input.closeDate) : null,
      IsSelfService: true,
    },
  })
}

export async function updateRequest(
  token: string,
  id: number,
  input: {
    name?: string
    description?: string
    salesRepId?: number
    requestTypeId?: number
    requestStatusId?: number
    startDate?: Date
    closeDate?: Date
  },
): Promise<any> {
  const toISO = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')

  const json: Record<string, any> = {}
  if (input.name !== undefined) json.Summary = input.name
  if (input.description !== undefined) json.Result = input.description
  if (input.salesRepId !== undefined) json.SalesRep_ID = input.salesRepId
  if (input.requestTypeId !== undefined) json.R_RequestType_ID = input.requestTypeId
  if (input.requestStatusId !== undefined) json.R_Status_ID = input.requestStatusId
  if (input.startDate !== undefined) json.StartDate = input.startDate ? toISO(input.startDate) : null
  if (input.closeDate !== undefined) json.CloseDate = input.closeDate ? toISO(input.closeDate) : null

  return await apiFetch<any>(`${API_V1}/models/R_Request/${id}`, {
    method: 'PUT',
    token,
    json,
  })
}

export async function deleteRequest(token: string, id: number): Promise<void> {
  await apiFetch<any>(`${API_V1}/models/R_Request/${id}`, {
    method: 'DELETE',
    token,
  })
}

export async function listRequestTypes(token: string): Promise<RequestType[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/R_RequestType`,
    {
      token,
      searchParams: {
        $select: 'R_RequestType_ID,Name',
        $orderby: 'Name',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
  }))
}

export async function listRequestStatuses(token: string): Promise<RequestStatus[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/R_Status`,
    {
      token,
      searchParams: {
        $select: 'R_Status_ID,Name',
        $orderby: 'Name',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
  }))
}

/**
 * 取得待接應客戶（還沒有開過諮詢單的客戶）
 */
export async function getPendingCustomers(token: string): Promise<{ id: number; name: string }[]> {
  try {
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/C_BPartner`,
      {
        token,
        searchParams: {
          $select: 'C_BPartner_ID,Name',
          $filter: 'IsCustomer eq true and IsActive eq true',
          $orderby: 'Name',
        } satisfies SearchParams,
      },
    )

    const allCustomers = (res.records ?? []).map((r) => ({
      id: Number(r.id),
      name: String(r.Name ?? ''),
    }))

    // 取得已有諮詢單的客戶 ID
    const requestsRes = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/R_Request`,
      {
        token,
        searchParams: {
          $select: 'C_BPartner_ID',
        } satisfies SearchParams,
      },
    )

    const customerIdsWithRequests = new Set(
      (requestsRes.records ?? [])
        .map((r) => Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID))
        .filter((id) => !isNaN(id) && id > 0)
    )

    // 過濾出還沒有諮詢單的客戶
    return allCustomers.filter((c) => !customerIdsWithRequests.has(c.id))
  } catch (error) {
    console.error('Failed to get pending customers:', error)
    return []
  }
}

/**
 * 取得「我的客戶」諮詢單（當前使用者的客戶）
 */
export async function getMyCustomersRequests(
  token: string,
  salesRepId: number,
): Promise<Request[]> {
  const result = await listRequests(token, { salesRepId })
  return result.records
}

/**
 * 取得某客戶的所有諮詢單
 */
export async function getRequestsByCustomer(token: string, bPartnerId: number): Promise<Request[]> {
  const result = await listRequests(token, { bPartnerId })
  return result.records
}

/**
 * 統計所有員工的諮詢單數量
 */
export async function getRequestStatistics(
  token: string,
): Promise<Map<number, { total: number; byType: Map<number, number>; byStatus: Map<number, number> }>> {
  try {
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/R_Request`,
      {
        token,
        searchParams: {
          $select: 'R_Request_ID,SalesRep_ID,R_RequestType_ID,R_Status_ID',
        } satisfies SearchParams,
      },
    )

    const stats = new Map<number, { total: number; byType: Map<number, number>; byStatus: Map<number, number> }>()

    for (const r of res.records ?? []) {
      const salesRepId = r.SalesRep_ID?.id ? Number(r.SalesRep_ID.id) : 0
      const requestTypeId = r.R_RequestType_ID?.id ? Number(r.R_RequestType_ID.id) : 0
      const requestStatusId = r.R_Status_ID?.id ? Number(r.R_Status_ID.id) : 0

      if (!stats.has(salesRepId)) {
        stats.set(salesRepId, {
          total: 0,
          byType: new Map(),
          byStatus: new Map(),
        })
      }

      const stat = stats.get(salesRepId)!
      stat.total++

      if (requestTypeId > 0) {
        stat.byType.set(requestTypeId, (stat.byType.get(requestTypeId) || 0) + 1)
      }

      if (requestStatusId > 0) {
        stat.byStatus.set(requestStatusId, (stat.byStatus.get(requestStatusId) || 0) + 1)
      }
    }

    return stats
  } catch (error) {
    console.error('Failed to get request statistics:', error)
    return new Map()
  }
}
