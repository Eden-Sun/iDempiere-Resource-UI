import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

// === Types ===

export type WindowTab = {
  id: number
  uid: string
  name: string
  slug: string
  seqNo: number
  tabLevel: number
  description?: string
  help?: string
}

export type WindowDef = {
  id: number
  uid: string
  name: string
  slug: string
  description?: string
  help?: string
  tabs: WindowTab[]
}

export type FieldColumn = {
  id: number
  columnName: string
  fieldLength: number
  isMandatory: boolean
  isKey: boolean
  isParent: boolean
  referenceId: number
  referenceValueId?: number // for TableDirect/Table lookups
}

export type TabField = {
  id: number
  uid: string
  name: string
  description?: string
  help?: string
  columnId: number
  columnName: string
  column?: FieldColumn
}

// Reference Type IDs from AD_Reference
export const ReferenceType = {
  String: 10,
  Integer: 11,
  Amount: 12,
  Number: 22,
  Date: 15,
  DateTime: 16,
  List: 17,
  Table: 18,
  TableDirect: 19,
  YesNo: 20,
  Location: 21,
  Search: 30,
  Text: 14,
  Memo: 34,
  ID: 13,
  Image: 32,
  Binary: 23,
  Button: 28,
} as const

// === API Functions ===

/**
 * Get window definition with tabs
 */
export async function getWindow(token: string, windowSlug: string): Promise<WindowDef> {
  const res = await apiFetch<any>(`${API_V1}/windows/${windowSlug}/tabs`, { token })
  return {
    id: res.id,
    uid: res.uid,
    name: res.Name,
    slug: res.slug,
    description: res.Description,
    help: res.Help,
    tabs: (res.tabs ?? []).map((t: any) => ({
      id: t.id,
      uid: t.uid,
      name: t.Name,
      slug: t.slug,
      seqNo: t.SeqNo,
      tabLevel: t.TabLevel,
      description: t.Description,
      help: t.Help,
    })),
  }
}

/**
 * Get fields for a tab
 */
export async function getTabFields(
  token: string,
  windowSlug: string,
  tabSlug: string,
): Promise<TabField[]> {
  const res = await apiFetch<{ fields: any[] }>(
    `${API_V1}/windows/${windowSlug}/tabs/${tabSlug}/fields`,
    { token },
  )
  return (res.fields ?? []).map((f) => ({
    id: f.id,
    uid: f.uid,
    name: f.Name,
    description: f.Description,
    help: f.Help,
    columnId: f.AD_Column_ID?.id ?? 0,
    columnName: extractColumnName(f.AD_Column_ID?.identifier ?? ''),
  }))
}

/**
 * Get column metadata (for field type info)
 */
export async function getColumn(token: string, columnId: number): Promise<FieldColumn> {
  const res = await apiFetch<any>(`${API_V1}/models/AD_Column/${columnId}`, { token })
  return {
    id: res.id,
    columnName: res.ColumnName,
    fieldLength: res.FieldLength ?? 0,
    isMandatory: res.IsMandatory === true,
    isKey: res.IsKey === true,
    isParent: res.IsParent === true,
    referenceId: res.AD_Reference_ID?.id ?? 10,
    referenceValueId: res.AD_Reference_Value_ID?.id,
  }
}

/**
 * Get fields with column metadata for a tab
 */
export async function getTabFieldsWithMeta(
  token: string,
  windowSlug: string,
  tabSlug: string,
): Promise<TabField[]> {
  const fields = await getTabFields(token, windowSlug, tabSlug)

  // Fetch column metadata in parallel
  const columnPromises = fields
    .filter((f) => f.columnId > 0)
    .map((f) => getColumn(token, f.columnId).then((col) => ({ fieldId: f.id, col })))

  const columnResults = await Promise.all(columnPromises)
  const columnMap = new Map(columnResults.map((r) => [r.fieldId, r.col]))

  return fields.map((f) => ({
    ...f,
    column: columnMap.get(f.id),
  }))
}

/**
 * Create a record via window endpoint
 */
export async function createWindowRecord(
  token: string,
  windowSlug: string,
  data: Record<string, unknown>,
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/windows/${windowSlug}`, {
    method: 'POST',
    token,
    json: data,
  })
}

/**
 * Create a child tab record
 */
export async function createChildTabRecord(
  token: string,
  windowSlug: string,
  tabSlug: string,
  parentRecordId: number,
  childTabSlug: string,
  data: Record<string, unknown>,
): Promise<any> {
  return await apiFetch<any>(
    `${API_V1}/windows/${windowSlug}/tabs/${tabSlug}/${parentRecordId}/${childTabSlug}`,
    {
      method: 'POST',
      token,
      json: data,
    },
  )
}

/**
 * Create a record via Model API (direct table access)
 */
export async function createModelRecord(
  token: string,
  tableName: string,
  data: Record<string, unknown>,
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/models/${tableName}`, {
    method: 'POST',
    token,
    json: data,
  })
}

/**
 * Get lookup values for a reference (Table/TableDirect/List)
 */
export async function getLookupValues(
  token: string,
  tableName: string,
  options?: { filter?: string; select?: string; orderby?: string; top?: number },
): Promise<{ id: number; identifier: string }[]> {
  const searchParams: Record<string, string | number> = {}
  if (options?.filter) searchParams['$filter'] = options.filter
  if (options?.select) searchParams['$select'] = options.select
  if (options?.orderby) searchParams['$orderby'] = options.orderby
  if (options?.top) searchParams['$top'] = options.top

  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/${tableName}`, {
    token,
    searchParams,
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    identifier: String(r.identifier ?? r.Name ?? r.id),
  }))
}

// === Helpers ===

/**
 * Extract column name from identifier like "TaxID_Tax ID"
 */
function extractColumnName(identifier: string): string {
  const idx = identifier.indexOf('_')
  return idx > 0 ? identifier.substring(0, idx) : identifier
}

/**
 * Determine input type based on reference ID
 */
export function getInputType(referenceId: number): 'text' | 'number' | 'checkbox' | 'date' | 'datetime' | 'textarea' | 'select' {
  switch (referenceId) {
    case ReferenceType.YesNo:
      return 'checkbox'
    case ReferenceType.Integer:
    case ReferenceType.ID:
      return 'number'
    case ReferenceType.Amount:
    case ReferenceType.Number:
      return 'number'
    case ReferenceType.Date:
      return 'date'
    case ReferenceType.DateTime:
      return 'datetime'
    case ReferenceType.Text:
    case ReferenceType.Memo:
      return 'textarea'
    case ReferenceType.List:
    case ReferenceType.Table:
    case ReferenceType.TableDirect:
    case ReferenceType.Search:
      return 'select'
    default:
      return 'text'
  }
}

/**
 * Check if field is a lookup (requires dropdown)
 */
export function isLookupField(referenceId: number): boolean {
  return [
    ReferenceType.List,
    ReferenceType.Table,
    ReferenceType.TableDirect,
    ReferenceType.Search,
  ].includes(referenceId)
}
