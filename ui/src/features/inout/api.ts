import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

export type InOut = {
  id: number
  documentNo: string
  orderId: number
  orderNo: string
  bpartnerId: number
  bpartnerName: string
  isSOTrx: boolean
  movementDate: string
  docStatus: string
}

export type InOutLine = {
  id: number
  inOutId: number
  orderLineId: number
  productId: number
  productName: string
  qtyOrdered: number
  movementQty: number
}

export async function getPendingPurchaseOrders(token: string): Promise<any[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/C_Order`, {
    token,
    searchParams: {
      $select: 'C_Order_ID,DocumentNo,C_BPartner_ID,C_BPartner_Location_ID,DateOrdered,GrandTotal,DocStatus,M_Warehouse_ID,AD_Org_ID,C_DocType_ID,C_DocTypeTarget_ID',
      $filter: `IsSOTrx eq 'N' and (DocStatus eq 'IP' or DocStatus eq 'CO')`,
      $orderby: 'DateOrdered desc,DocumentNo desc',
    },
  })
  return res.records ?? []
}

export async function getOrderLines(token: string, orderId: number): Promise<any[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/C_OrderLine`, {
    token,
    searchParams: {
      $select: 'C_OrderLine_ID,C_Order_ID,M_Product_ID,QtyEntered,PriceEntered,LineNetAmt,C_Tax_ID,C_UOM_ID',
      $filter: `C_Order_ID eq ${orderId}`,
      $orderby: 'Line',
    },
  })
  return res.records ?? []
}

export async function getReceiptDocType(token: string): Promise<number> {
  // Fetch all DocTypes without filter to debug
  const res = await apiFetch<any>(`${API_V1}/models/C_DocType`, {
    token,
    searchParams: {
      $select: 'C_DocType_ID,Name,DocBaseType',
    },
  })

  // Handle different response formats
  const records = res.records ?? res ?? []

  if (!Array.isArray(records) || records.length === 0) {
    // Return a common default - iDempiere standard MM Receipt is usually 122 or 143
    // Try without DocType first (let iDempiere auto-assign)
    return 0
  }

  // Look for Material Receipt (MMR) first
  let doc = records.find((r: any) => r.DocBaseType === 'MMR')
  if (doc) return doc.id

  // Look for Material Shipment (MMS) as fallback
  doc = records.find((r: any) => r.DocBaseType === 'MMS')
  if (doc) return doc.id

  // Look by name
  doc = records.find((r: any) =>
    r.Name?.includes('Receipt') ||
    r.Name?.includes('收貨') ||
    r.Name?.includes('Vendor')
  )
  if (doc) return doc.id

  // Return 0 to let iDempiere auto-assign
  return 0
}

export async function createInOut(
  token: string,
  order: any,
  movementDate: string,
  _docTypeId: number,
): Promise<any> {
  // Get the Purchase Order's DocType to find the Receipt DocType
  const orderDocTypeId = order.C_DocType_ID?.id ?? order.C_DocType_ID ?? order.C_DocTypeTarget_ID?.id ?? order.C_DocTypeTarget_ID

  // Find the target receipt DocType from the order's DocType
  let receiptDocTypeId = 0
  if (orderDocTypeId) {
    try {
      const docTypeRes = await apiFetch<any>(`${API_V1}/models/C_DocType/${orderDocTypeId}`, { token })
      receiptDocTypeId = docTypeRes?.C_DocTypeShipment_ID?.id ?? docTypeRes?.C_DocTypeShipment_ID ?? 0
    } catch {
      // Ignore - will try without DocType
    }
  }

  // Build the body with required fields
  const body: Record<string, any> = {
    'AD_Org_ID': order.AD_Org_ID?.id ?? order.AD_Org_ID,
    'C_BPartner_ID': order.C_BPartner_ID?.id ?? order.C_BPartner_ID,
    'C_BPartner_Location_ID': order.C_BPartner_Location_ID?.id ?? order.C_BPartner_Location_ID,
    'M_Warehouse_ID': order.M_Warehouse_ID?.id ?? order.M_Warehouse_ID,
    'MovementDate': movementDate,
    'DateAcct': movementDate,
    'IsSOTrx': 'N',
  }

  // Set DocType if found - this should auto-set MovementType
  if (receiptDocTypeId > 0) {
    body['C_DocType_ID'] = receiptDocTypeId
  }

  // Create M_InOut first without C_Order_ID
  const res = await apiFetch<any>(`${API_V1}/models/M_InOut`, {
    method: 'POST',
    token,
    json: body,
  })

  // If successful and we have an ID, update with the order reference
  if (res?.id) {
    try {
      await apiFetch<any>(`${API_V1}/models/M_InOut/${res.id}`, {
        method: 'PUT',
        token,
        json: { 'C_Order_ID': order.id },
      })
    } catch {
      // Continue even if update fails
    }
  }

  return res
}

export async function getInOut(token: string, id: number): Promise<InOut> {
  const res = await apiFetch<any>(`${API_V1}/models/M_InOut/${id}`, { token })
  return {
    id: Number(res.id),
    documentNo: String(res.DocumentNo ?? ''),
    orderId: Number(res.C_Order_ID?.id ?? res.C_Order_ID ?? 0),
    orderNo: String(res.C_Order_ID?.identifier ?? res.C_Order_ID?.documentNo ?? ''),
    bpartnerId: Number(res.C_BPartner_ID?.id ?? res.C_BPartner_ID ?? 0),
    bpartnerName: String(res.C_BPartner_ID?.identifier ?? res.C_BPartner_ID?.name ?? ''),
    isSOTrx: res.IsSOTrx === true || res.IsSOTrx === 'Y',
    movementDate: String(res.MovementDate ?? ''),
    docStatus: String(res.DocStatus ?? ''),
  }
}

export async function getInOutLines(token: string, inOutId: number): Promise<InOutLine[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/M_InOutLine`, {
    token,
    searchParams: {
      $select: 'M_InOutLine_ID,M_InOut_ID,C_OrderLine_ID,M_Product_ID,MovementQty,QtyEntered',
      $filter: `M_InOut_ID eq ${inOutId}`,
      $orderby: 'Line',
    },
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    inOutId: Number(r.M_InOut_ID?.id ?? r.M_InOut_ID ?? 0),
    orderLineId: Number(r.C_OrderLine_ID?.id ?? r.C_OrderLine_ID ?? 0),
    productId: Number(r.M_Product_ID?.id ?? r.M_Product_ID ?? 0),
    productName: String(r.M_Product_ID?.identifier ?? r.M_Product_ID?.name ?? ''),
    qtyOrdered: Number(r.QtyEntered ?? 0),
    movementQty: Number(r.MovementQty ?? 0),
  }))
}

export async function createInOutLine(
  token: string,
  inOutId: number,
  orderLine: any,
  movementQty: number,
  locatorId?: number,
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/models/M_InOutLine`, {
    method: 'POST',
    token,
    json: {
      'M_InOut_ID': inOutId,
      'C_OrderLine_ID': orderLine.id,
      'M_Product_ID': orderLine.M_Product_ID?.id ?? orderLine.M_Product_ID,
      'M_Locator_ID': locatorId ?? 101, // Default locator - will be auto-assigned by iDempiere if not provided
      'MovementQty': movementQty,
      'C_UOM_ID': orderLine.C_UOM_ID?.id ?? orderLine.C_UOM_ID ?? 100, // Default UOM (Each)
    },
  })
}

export async function getDefaultLocator(token: string, warehouseId: number): Promise<number> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/M_Locator`, {
    token,
    searchParams: {
      $select: 'M_Locator_ID',
      $filter: `M_Warehouse_ID eq ${warehouseId} and IsDefault eq 'Y'`,
      $top: 1,
    },
  })
  if (res.records && res.records.length > 0) {
    return res.records[0].id
  }
  // Fallback: get any locator from warehouse
  const fallback = await apiFetch<{ records: any[] }>(`${API_V1}/models/M_Locator`, {
    token,
    searchParams: {
      $select: 'M_Locator_ID',
      $filter: `M_Warehouse_ID eq ${warehouseId}`,
      $top: 1,
    },
  })
  return fallback.records?.[0]?.id ?? 101
}

export async function updateInOutLine(
  token: string,
  id: number,
  movementQty: number,
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/models/M_InOutLine/${id}`, {
    method: 'PUT',
    token,
    json: {
      MovementQty: movementQty,
    },
  })
}

export async function completeInOut(token: string, id: number): Promise<any> {
  // Try POST first (some iDempiere versions require POST)
  try {
    return await apiFetch<any>(`${API_V1}/models/M_InOut/${id}/docaction`, {
      method: 'POST',
      token,
      json: {
        docAction: 'CO', // Complete
      },
    })
  } catch {
    // Fallback to PUT
    return await apiFetch<any>(`${API_V1}/models/M_InOut/${id}/docaction`, {
      method: 'PUT',
      token,
      json: {
        docAction: 'CO', // Complete
      },
    })
  }
}
