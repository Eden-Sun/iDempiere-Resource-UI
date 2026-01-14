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
      $select: 'C_Order_ID,DocumentNo,C_BPartner_ID,DateOrdered,GrandTotal,DocStatus,M_Warehouse_ID',
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
      $select: 'C_OrderLine_ID,C_Order_ID,M_Product_ID,QtyEntered,PriceEntered,LineNetAmt,C_Tax_ID',
      $filter: `C_Order_ID eq ${orderId}`,
      $orderby: 'Line',
    },
  })
  return res.records ?? []
}

export async function createInOut(
  token: string,
  orderId: number,
  movementDate: string,
): Promise<any> {
  const res = await apiFetch<any>(`${API_V1}/windows/C_Order/${orderId}/createInOut`, {
    method: 'POST',
    token,
    json: {
      MovementDate: movementDate,
      DocAction: 'CO',
    },
  })
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
  return await apiFetch<any>(`${API_V1}/models/M_InOut/${id}/complete`, {
    method: 'POST',
    token,
  })
}
