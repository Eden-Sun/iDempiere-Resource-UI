import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

// === Types ===

export type LookupOption = {
  value: string | number
  label: string
}

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
  seqNo: number
  isDisplayed: boolean
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
 * Note: Window API doesn't return SeqNo, so we need to fetch from AD_Field model
 * @param language - Language code (e.g. 'zh_TW') for translated field names
 */
export async function getTabFields(
  token: string,
  windowSlug: string,
  tabSlug: string,
  language?: string,
): Promise<TabField[]> {
  // First get basic field info from Window API
  const res = await apiFetch<{ fields: any[], tabId?: number }>(
    `${API_V1}/windows/${windowSlug}/tabs/${tabSlug}/fields`,
    { token },
  )
  
  const fields = res.fields ?? []
  if (fields.length === 0) return []
  
  // Get field IDs to fetch SeqNo from AD_Field
  const fieldIds = fields.map((f) => f.id).filter((id) => id > 0)
  
  // Fetch SeqNo, IsDisplayed and optionally translations from AD_Field
  let fieldMetaMap = new Map<number, { seqNo: number; isDisplayed: boolean; trlName?: string }>()
  if (fieldIds.length > 0) {
    try {
      // Fetch in batches if needed (use filter with IN-like syntax)
      const fieldFilter = fieldIds.map((id) => `AD_Field_ID eq ${id}`).join(' or ')
      const adFields = await apiFetch<{ records: any[] }>(
        `${API_V1}/models/AD_Field`,
        { 
          token,
          searchParams: {
            $filter: fieldFilter,
            $select: 'AD_Field_ID,SeqNo,IsDisplayed',
          },
        },
      )
      for (const af of adFields.records ?? []) {
        fieldMetaMap.set(af.id, {
          seqNo: af.SeqNo ?? 9999,
          isDisplayed: af.IsDisplayed !== false,
        })
      }
      
      // Fetch translations if language is specified and not English
      if (language && language !== 'en_US') {
        try {
          const trlFilter = `(${fieldIds.map((id) => `AD_Field_ID eq ${id}`).join(' or ')}) and AD_Language eq '${language}'`
          const trlFields = await apiFetch<{ records: any[] }>(
            `${API_V1}/models/AD_Field_Trl`,
            {
              token,
              searchParams: {
                $filter: trlFilter,
                $select: 'AD_Field_ID,Name',
              },
            },
          )
          for (const trl of trlFields.records ?? []) {
            const fieldId = trl.AD_Field_ID?.id ?? trl.id
            const meta = fieldMetaMap.get(fieldId)
            if (meta && trl.Name) {
              meta.trlName = trl.Name
            }
          }
        } catch (e) {
          console.warn('[getTabFields] Failed to fetch translations:', e)
        }
      }
    } catch (e) {
      console.warn('[getTabFields] Failed to fetch SeqNo from AD_Field:', e)
    }
  }
  
  return fields.map((f) => {
    const meta = fieldMetaMap.get(f.id)
    return {
      id: f.id,
      uid: f.uid,
      name: meta?.trlName || f.Name, // Use translation if available
      description: f.Description,
      help: f.Help,
      columnId: f.AD_Column_ID?.id ?? 0,
      columnName: extractColumnName(f.AD_Column_ID?.identifier ?? ''),
      seqNo: meta?.seqNo ?? 9999,
      isDisplayed: meta?.isDisplayed ?? true,
    }
  })
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
 * @param language - Language code (e.g. 'zh_TW') for translated field names
 */
export async function getTabFieldsWithMeta(
  token: string,
  windowSlug: string,
  tabSlug: string,
  language?: string,
): Promise<TabField[]> {
  const fields = await getTabFields(token, windowSlug, tabSlug, language)

  // Fetch column metadata in parallel, but handle individual failures gracefully
  const columnPromises = fields
    .filter((f) => f.columnId > 0)
    .map((f) =>
      getColumn(token, f.columnId)
        .then((col) => ({ fieldId: f.id, col, error: null }))
        .catch((err) => {
          console.warn(`[getTabFieldsWithMeta] Failed to load column ${f.columnId} for field ${f.columnName}:`, err)
          return { fieldId: f.id, col: null, error: err }
        })
    )

  const columnResults = await Promise.all(columnPromises)
  const columnMap = new Map(
    columnResults
      .filter((r) => r.col !== null)
      .map((r) => [r.fieldId, r.col!])
  )

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
 * Get lookup options for a table (Model API).
 *
 * 注意：有些表沒有 Name 欄位，$select/$orderby 可能會失敗，所以這裡會降級重試。
 */
export async function getTableLookupOptions(
  token: string,
  tableName: string,
  options?: { filter?: string; select?: string; orderby?: string; top?: number },
): Promise<LookupOption[]> {
  const searchParams: Record<string, string | number> = {}
  if (options?.filter) searchParams.$filter = options.filter
  if (options?.select) searchParams.$select = options.select
  if (options?.orderby) searchParams.$orderby = options.orderby
  if (options?.top) searchParams.$top = options.top

  const fetchTable = async (sp: Record<string, string | number>) => {
    return await apiFetch<{ records: any[] }>(`${API_V1}/models/${tableName}`, { token, searchParams: sp })
  }

  let res: { records: any[] }
  try {
    res = await fetchTable(searchParams)
  } catch {
    const sp2: Record<string, string | number> = {}
    if (options?.filter) sp2.$filter = options.filter
    if (options?.top) sp2.$top = options.top
    res = await fetchTable(sp2)
  }

  return (res.records ?? []).map((r) => ({
    value: Number(r.id),
    label: String(r.identifier ?? r.Name ?? r.Value ?? r.id),
  }))
}

/**
 * Get lookup options from Reference API (List/Table validation)
 * Endpoint: GET /api/v1/reference/{AD_Reference_ID}
 */
export async function getReferenceLookupOptions(token: string, referenceId: number): Promise<LookupOption[]> {
  const res = await apiFetch<any>(`${API_V1}/reference/${referenceId}`, { token })

  // List validation: { reflist: [{ value, name }, ...] }
  if (Array.isArray(res?.reflist)) {
    return res.reflist
      .map((x: any) => ({
        value: String(x?.value ?? ''),
        label: String(x?.name ?? x?.value ?? ''),
      }))
      .filter((x: LookupOption) => x.value !== '')
  }

  // Table validation: { reftable: [{ <KeyColumn>: 123, <DisplayColumn>: 'xx', ...}, ...] }
  if (Array.isArray(res?.reftable)) {
    return res.reftable
      .map((row: any) => {
        if (!row || typeof row !== 'object') return null

        // best-effort: key = first *_ID numeric, else row.id
        let key: number | string | null = null
        if (row.id != null) key = row.id
        if (key == null) {
          for (const [k, v] of Object.entries(row)) {
            if (!k.endsWith('_ID')) continue
            if (typeof v === 'number') {
              key = v
              break
            }
            if (typeof v === 'string' && v.trim() !== '') {
              const n = Number(v)
              if (!Number.isNaN(n)) {
                key = n
                break
              }
            }
          }
        }
        if (key == null) return null

        const label = String(row.Name ?? row.Value ?? row.identifier ?? key)
        return { value: typeof key === 'number' ? key : String(key), label } satisfies LookupOption
      })
      .filter(Boolean) as LookupOption[]
  }

  return []
}

/**
 * Backward-compat (舊版): return {id, identifier}
 */
export async function getLookupValues(
  token: string,
  tableName: string,
  options?: { filter?: string; select?: string; orderby?: string; top?: number },
): Promise<{ id: number; identifier: string }[]> {
  const opts = await getTableLookupOptions(token, tableName, options)
  return opts.map((o) => ({ id: Number(o.value), identifier: String(o.label) }))
}

// === Helpers ===

/**
 * Extract column name from identifier like "C_BP_Group_ID_Business Partner Group"
 * The column name ends with _ID, so we find the last _ID and include it
 */
function extractColumnName(identifier: string): string {
  // Find the position of "_ID_" which separates column name from label
  // e.g. "C_BP_Group_ID_Business Partner Group" -> "C_BP_Group_ID"
  const idSeparator = identifier.indexOf('_ID_')
  if (idSeparator > 0) {
    return identifier.substring(0, idSeparator + 3) // +3 to include "_ID"
  }
  // Fallback: find first underscore followed by space or uppercase (label start)
  // e.g. "TaxID_Tax ID" -> "TaxID"
  const match = identifier.match(/^([A-Za-z0-9_]+?)_[A-Z\s]/)
  if (match) {
    return match[1]
  }
  // Last resort: return as-is or up to first underscore
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

/**
 * Get system configuration value by name
 * @param token - Auth token
 * @param configName - System config name (e.g., 'EMUI_SHOW_ONLY_MANDATORY')
 * @returns Configuration value or null if not found
 */
export async function getSysConfig(token: string, configName: string): Promise<string | null> {
  try {
    const res = await apiFetch<{ records: any[] }>(
      `${API_V1}/models/AD_SysConfig?$filter=Name eq '${configName}'&$select=Value&$top=1`,
      { token },
    )
    if (res.records && res.records.length > 0) {
      return res.records[0].Value || null
    }
    return null
  } catch (error) {
    console.error(`Failed to get sysconfig ${configName}:`, error)
    return null
  }
}
