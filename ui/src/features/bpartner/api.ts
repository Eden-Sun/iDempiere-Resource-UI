import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

type SearchParams = Record<string, string | number | boolean | undefined>

export interface BPartner {
  id: number
  name: string
  value?: string
  bpGroupId?: number
  bpGroupName?: string
  isCustomer?: boolean
  isVendor?: boolean
  isEmployee?: boolean
}

export interface BPartnerGroup {
  id: number
  name: string
}

export interface BPartnerContact {
  id: number
  bPartnerId: number
  name?: string
  email?: string
  phone?: string
}

export interface BPartnerLocationFull {
  id: number
  bPartnerId: number
  name?: string
  locationId?: number
  address1?: string
  city?: string
  postalCode?: string
}

export interface BPartnerLocation {
  id: number
  bPartnerId: number
  address1?: string
  city?: string
  postalCode?: string
}

export async function listBPartners(token: string): Promise<BPartner[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/C_BPartner`,
    {
      token,
      searchParams: {
        $select: 'C_BPartner_ID,Name,Value,C_BP_Group_ID,IsCustomer,IsVendor,IsEmployee',
        $orderby: 'Name',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map(r => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
    value: r.Value ? String(r.Value) : undefined,
    bpGroupId: r.C_BP_Group_ID?.id ? Number(r.C_BP_Group_ID.id) : undefined,
    bpGroupName: r.C_BP_Group_ID?.name ? String(r.C_BP_Group_ID.name) : undefined,
    isCustomer: r.IsCustomer === true || r.IsCustomer === 'Y',
    isVendor: r.IsVendor === true || r.IsVendor === 'Y',
    isEmployee: r.IsEmployee === true || r.IsEmployee === 'Y',
  }))
}

export async function getBPartner(token: string, id: number): Promise<BPartner> {
  const res = await apiFetch<any>(`${API_V1}/models/C_BPartner/${id}`, {
    token,
  })
  return {
    id: Number(res.id),
    name: String(res.Name ?? ''),
    value: res.Value ? String(res.Value) : undefined,
    bpGroupId: res.C_BP_Group_ID?.id ? Number(res.C_BP_Group_ID.id) : undefined,
    bpGroupName: res.C_BP_Group_ID?.name ? String(res.C_BP_Group_ID.name) : undefined,
    isCustomer: res.IsCustomer === true || res.IsCustomer === 'Y',
    isVendor: res.IsVendor === true || res.IsVendor === 'Y',
    isEmployee: res.IsEmployee === true || res.IsEmployee === 'Y',
  }
}

export async function createBPartner(
  token: string,
  input: {
    name: string
    value?: string
    bpGroupId?: number
    isCustomer?: boolean
    isVendor?: boolean
    isEmployee?: boolean
  },
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/models/C_BPartner`, {
    method: 'POST',
    token,
    json: {
      Name: input.name,
      Value: input.value || null,
      C_BP_Group_ID: input.bpGroupId || null,
      IsCustomer: input.isCustomer ?? true,
      IsVendor: input.isVendor ?? false,
      IsEmployee: input.isEmployee ?? false,
      IsSummary: false,
    },
  })
}

export async function updateBPartner(
  token: string,
  id: number,
  input: {
    name?: string
    value?: string
    bpGroupId?: number
    isCustomer?: boolean
    isVendor?: boolean
    isEmployee?: boolean
  },
): Promise<any> {
  const json: Record<string, any> = {}
  if (input.name !== undefined)
    json.Name = input.name
  if (input.value !== undefined)
    json.Value = input.value
  if (input.bpGroupId !== undefined)
    json.C_BP_Group_ID = input.bpGroupId
  if (input.isCustomer !== undefined)
    json.IsCustomer = input.isCustomer
  if (input.isVendor !== undefined)
    json.IsVendor = input.isVendor
  if (input.isEmployee !== undefined)
    json.IsEmployee = input.isEmployee

  return await apiFetch<any>(`${API_V1}/models/C_BPartner/${id}`, {
    method: 'PUT',
    token,
    json,
  })
}

export async function deleteBPartner(token: string, id: number): Promise<void> {
  await apiFetch<any>(`${API_V1}/models/C_BPartner/${id}`, {
    method: 'DELETE',
    token,
  })
}

export async function listBPartnerGroups(token: string): Promise<BPartnerGroup[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/C_BP_Group`,
    {
      token,
      searchParams: {
        $select: 'C_BP_Group_ID,Name',
        $orderby: 'Name',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map(r => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
  }))
}

export async function createBPartnerContact(
  token: string,
  input: {
    bPartnerId: number
    name?: string
    email?: string
    phone?: string
  },
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/models/AD_User`, {
    method: 'POST',
    token,
    json: {
      C_BPartner_ID: input.bPartnerId,
      Name: input.name || '',
      EMail: input.email || null,
      Phone: input.phone || null,
      IsActive: true,
    },
  })
}

export async function listBPartnerLocations(token: string, bPartnerId: number): Promise<BPartnerLocation[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/C_BPartner_Location`,
    {
      token,
      searchParams: {
        $select: 'C_BPartner_Location_ID,C_BPartner_ID,C_Location_ID',
        $filter: `C_BPartner_ID eq ${bPartnerId} and IsActive eq true`,
        $expand: 'C_Location_ID($select=C_Location_ID,Address1,City,Postal)',
        $orderby: 'C_BPartner_Location_ID',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map(r => ({
    id: Number(r.id),
    bPartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    address1: r.C_Location_ID?.Address1 ? String(r.C_Location_ID.Address1) : undefined,
    city: r.C_Location_ID?.City ? String(r.C_Location_ID.City) : undefined,
    postalCode: r.C_Location_ID?.Postal ? String(r.C_Location_ID.Postal) : undefined,
  }))
}

export async function createBPartnerLocation(
  token: string,
  input: {
    bPartnerId: number
    name?: string
    address1?: string
    city?: string
    postalCode?: string
  },
): Promise<any> {
  const locationRes = await apiFetch<any>(`${API_V1}/models/C_Location`, {
    method: 'POST',
    token,
    json: {
      Address1: input.address1 || '',
      City: input.city || '',
      Postal: input.postalCode || null,
    },
  })

  const locationId = locationRes.id || locationRes.C_Location_ID

  return await apiFetch<any>(`${API_V1}/models/C_BPartner_Location`, {
    method: 'POST',
    token,
    json: {
      C_BPartner_ID: input.bPartnerId,
      C_Location_ID: locationId,
      Name: input.name || '',
      IsActive: true,
    },
  })
}

/**
 * Create a BPartner with associated Location and User (Contact) records
 * This is a convenience function that creates all three records in one call:
 * 1. C_BPartner - the main business partner record
 * 2. C_BPartner_Location + C_Location - address/location linked to BPartner
 * 3. AD_User - contact/user record linked to BPartner
 *
 * All three records use the same name for consistency.
 */
export interface CreateBPartnerWithRelationsInput {
  name: string
  value?: string
  bpGroupId?: number
  isCustomer?: boolean
  isVendor?: boolean
  isEmployee?: boolean
  // Location fields (optional)
  address1?: string
  city?: string
  postalCode?: string
  // Contact fields (optional)
  email?: string
  phone?: string
}

export interface CreateBPartnerWithRelationsResult {
  bPartner: any
  location: any
  contact: any
}

export async function createBPartnerWithRelations(
  token: string,
  input: CreateBPartnerWithRelationsInput,
): Promise<CreateBPartnerWithRelationsResult> {
  // Step 1: Create the BPartner
  const bPartner = await apiFetch<any>(`${API_V1}/models/C_BPartner`, {
    method: 'POST',
    token,
    json: {
      Name: input.name,
      Value: input.value || null,
      C_BP_Group_ID: input.bpGroupId || null,
      IsCustomer: input.isCustomer ?? true,
      IsVendor: input.isVendor ?? false,
      IsEmployee: input.isEmployee ?? false,
      IsSummary: false,
    },
  })

  const bPartnerId = bPartner.id || bPartner.C_BPartner_ID

  // Step 2: Create C_Location and C_BPartner_Location with same name
  const location = await createBPartnerLocation(token, {
    bPartnerId,
    name: input.name,
    address1: input.address1,
    city: input.city,
    postalCode: input.postalCode,
  })

  // Step 3: Create AD_User (contact) with same name
  const contact = await apiFetch<any>(`${API_V1}/models/AD_User`, {
    method: 'POST',
    token,
    json: {
      C_BPartner_ID: bPartnerId,
      Name: input.name,
      EMail: input.email || null,
      Phone: input.phone || null,
      IsActive: true,
    },
  })

  return { bPartner, location, contact }
}

/**
 * List contacts (AD_User) for a BPartner
 */
export async function listBPartnerContacts(token: string, bPartnerId: number): Promise<BPartnerContact[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/AD_User`,
    {
      token,
      searchParams: {
        $select: 'AD_User_ID,C_BPartner_ID,Name,EMail,Phone',
        $filter: `C_BPartner_ID eq ${bPartnerId} and IsActive eq true`,
        $orderby: 'Name',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map(r => ({
    id: Number(r.id),
    bPartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    name: r.Name ? String(r.Name) : undefined,
    email: r.EMail ? String(r.EMail) : undefined,
    phone: r.Phone ? String(r.Phone) : undefined,
  }))
}

/**
 * Update a contact (AD_User)
 */
export async function updateBPartnerContact(
  token: string,
  contactId: number,
  input: {
    name?: string
    email?: string
    phone?: string
  },
): Promise<any> {
  const json: Record<string, any> = {}
  if (input.name !== undefined)
    json.Name = input.name
  if (input.email !== undefined)
    json.EMail = input.email
  if (input.phone !== undefined)
    json.Phone = input.phone

  return await apiFetch<any>(`${API_V1}/models/AD_User/${contactId}`, {
    method: 'PUT',
    token,
    json,
  })
}

/**
 * Delete a contact (AD_User) - sets IsActive to false
 */
export async function deleteBPartnerContact(token: string, contactId: number): Promise<void> {
  await apiFetch<any>(`${API_V1}/models/AD_User/${contactId}`, {
    method: 'PUT',
    token,
    json: { IsActive: false },
  })
}

/**
 * List locations for a BPartner with full details
 */
export async function listBPartnerLocationsFull(token: string, bPartnerId: number): Promise<BPartnerLocationFull[]> {
  const res = await apiFetch<{ records: any[] }>(
    `${API_V1}/models/C_BPartner_Location`,
    {
      token,
      searchParams: {
        $select: 'C_BPartner_Location_ID,C_BPartner_ID,C_Location_ID,Name',
        $filter: `C_BPartner_ID eq ${bPartnerId} and IsActive eq true`,
        $expand: 'C_Location_ID($select=C_Location_ID,Address1,City,Postal)',
        $orderby: 'C_BPartner_Location_ID',
      } satisfies SearchParams,
    },
  )

  return (res.records ?? []).map(r => ({
    id: Number(r.id),
    bPartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    name: r.Name ? String(r.Name) : undefined,
    locationId: r.C_Location_ID?.id ? Number(r.C_Location_ID.id) : undefined,
    address1: r.C_Location_ID?.Address1 ? String(r.C_Location_ID.Address1) : undefined,
    city: r.C_Location_ID?.City ? String(r.C_Location_ID.City) : undefined,
    postalCode: r.C_Location_ID?.Postal ? String(r.C_Location_ID.Postal) : undefined,
  }))
}

/**
 * Update a location (C_BPartner_Location and C_Location)
 */
export async function updateBPartnerLocation(
  token: string,
  bpLocationId: number,
  locationId: number,
  input: {
    name?: string
    address1?: string
    city?: string
    postalCode?: string
  },
): Promise<any> {
  // Update C_BPartner_Location name
  if (input.name !== undefined) {
    await apiFetch<any>(`${API_V1}/models/C_BPartner_Location/${bpLocationId}`, {
      method: 'PUT',
      token,
      json: { Name: input.name },
    })
  }

  // Update C_Location address fields
  const locationJson: Record<string, any> = {}
  if (input.address1 !== undefined)
    locationJson.Address1 = input.address1
  if (input.city !== undefined)
    locationJson.City = input.city
  if (input.postalCode !== undefined)
    locationJson.Postal = input.postalCode

  if (Object.keys(locationJson).length > 0) {
    await apiFetch<any>(`${API_V1}/models/C_Location/${locationId}`, {
      method: 'PUT',
      token,
      json: locationJson,
    })
  }

  return { success: true }
}

/**
 * Delete a location (C_BPartner_Location) - sets IsActive to false
 */
export async function deleteBPartnerLocation(token: string, bpLocationId: number): Promise<void> {
  await apiFetch<any>(`${API_V1}/models/C_BPartner_Location/${bpLocationId}`, {
    method: 'PUT',
    token,
    json: { IsActive: false },
  })
}
