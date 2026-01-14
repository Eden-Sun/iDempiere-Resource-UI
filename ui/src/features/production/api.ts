import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

type SearchParams = Record<string, string | number | boolean | undefined>

export type Production = {
  id: number
  documentNo: string
  orderId: number
  orderLineId: number
  bpartnerId: number
  bpartnerName: string
  productId: number
  productName: string
  productionQty: number
  datePromised: string
  processed: boolean
  docStatus: string
}

export type ProductionLine = {
  id: number
  productionId: number
  productId: number
  productName: string
  movementQty: number
  isEndProduct: boolean
}

export async function listProductions(
  token: string,
  options: { filter?: string; top?: number; skip?: number } = {},
): Promise<{ records: Production[]; totalCount: number }> {
  const searchParams: Record<string, string | number> = {
    $select: 'M_Production_ID,DocumentNo,C_Order_ID,C_OrderLine_ID,C_BPartner_ID,M_Product_ID,MovementQty,DatePromised,Processed,DocStatus',
    $orderby: 'DatePromised desc,DocumentNo desc',
  }

  if (options.top) searchParams.$top = options.top
  if (options.skip) searchParams.$skip = options.skip
  if (options.filter) searchParams.$filter = options.filter

  const res = await apiFetch<{ records: any[]; 'row-count'?: number }>(`${API_V1}/models/M_Production`, {
    token,
    searchParams,
  })

  const records = (res.records ?? []).map((r) => ({
    id: Number(r.id),
    documentNo: String(r.DocumentNo ?? ''),
    orderId: Number(r.C_Order_ID?.id ?? r.C_Order_ID ?? 0),
    orderLineId: Number(r.C_OrderLine_ID?.id ?? r.C_OrderLine_ID ?? 0),
    bpartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    bpartnerName: String(r.C_BPartner_ID?.identifier ?? r.C_BPartner_ID?.name ?? ''),
    productId: Number(r.M_Product_ID?.id ?? r.M_Product_ID ?? 0),
    productName: String(r.M_Product_ID?.identifier ?? r.M_Product_ID?.name ?? ''),
    productionQty: Number(r.MovementQty ?? 0),
    datePromised: String(r.DatePromised ?? ''),
    processed: r.Processed === true || r.Processed === 'Y',
    docStatus: String(r.DocStatus ?? ''),
  }))

  return {
    records,
    totalCount: res['row-count'] ?? res.records?.length ?? 0,
  }
}

export async function getProduction(token: string, id: number): Promise<Production> {
  const res = await apiFetch<any>(`${API_V1}/models/M_Production/${id}`, { token })
  return {
    id: Number(res.id),
    documentNo: String(res.DocumentNo ?? ''),
    orderId: Number(res.C_Order_ID?.id ?? res.C_Order_ID ?? 0),
    orderLineId: Number(res.C_OrderLine_ID?.id ?? res.C_OrderLine_ID ?? 0),
    bpartnerId: Number(res.C_BPartner_ID?.id ?? res.C_BPartner_ID ?? 0),
    bpartnerName: String(res.C_BPartner_ID?.identifier ?? res.C_BPartner_ID?.name ?? ''),
    productId: Number(res.M_Product_ID?.id ?? res.M_Product_ID ?? 0),
    productName: String(res.M_Product_ID?.identifier ?? res.M_Product_ID?.name ?? ''),
    productionQty: Number(res.MovementQty ?? 0),
    datePromised: String(res.DatePromised ?? ''),
    processed: res.Processed === true || res.Processed === 'Y',
    docStatus: String(res.DocStatus ?? ''),
  }
}

export async function getProductionLines(token: string, productionId: number): Promise<ProductionLine[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/M_ProductionLine`, {
    token,
    searchParams: {
      $select: 'M_ProductionLine_ID,M_Production_ID,M_Product_ID,MovementQty,IsEndProduct',
      $filter: `M_Production_ID eq ${productionId}`,
      $orderby: 'Line',
    },
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    productionId: Number(r.M_Production_ID?.id ?? r.M_Production_ID ?? 0),
    productId: Number(r.M_Product_ID?.id ?? r.M_Product_ID ?? 0),
    productName: String(r.M_Product_ID?.identifier ?? r.M_Product_ID?.name ?? ''),
    movementQty: Number(r.MovementQty ?? 0),
    isEndProduct: r.IsEndProduct === true || r.IsEndProduct === 'Y',
  }))
}

export async function getOrdersForProduction(token: string, options?: { filter?: string; top?: number; skip?: number }): Promise<any[]> {
  const searchParams: Record<string, string | number> = {
    $select: 'C_Order_ID,DocumentNo,C_BPartner_ID,DateOrdered,GrandTotal,DocStatus',
    $orderby: 'DateOrdered desc,DocumentNo desc',
    $filter: "IsSOTrx eq true and DocStatus eq 'CO'",
  }

  if (options?.filter) searchParams.$filter += ` and (${options.filter})`
  if (options?.top) searchParams.$top = options.top
  if (options?.skip) searchParams.$skip = options.skip

  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/C_Order`, {
    token,
    searchParams,
  })

  return res.records ?? []
}

export async function createProduction(
  token: string,
  order: {
    orderId: number
    orderLineId: number
    bpartnerId: number
    productId: number
    productionQty: number
    datePromised: string
  },
  lines: Array<{ productId: number; movementQty: number; isEndProduct: boolean }>,
): Promise<any> {
  const orderRes = await apiFetch<any>(`${API_V1}/models/M_Production`, {
    method: 'POST',
    token,
    json: {
      C_Order_ID: order.orderId,
      C_OrderLine_ID: order.orderLineId,
      C_BPartner_ID: order.bpartnerId,
      M_Product_ID: order.productId,
      MovementQty: order.productionQty,
      DatePromised: order.datePromised,
      Processed: false,
      DocStatus: 'DR',
      DocAction: 'CO',
    },
  })

  const productionId = orderRes.id || orderRes.M_Production_ID

  if (!productionId) {
    throw new Error('Failed to create production: no ID returned')
  }

  for (const line of lines) {
    await apiFetch<any>(`${API_V1}/models/M_ProductionLine`, {
      method: 'POST',
      token,
      json: {
        M_Production_ID: productionId,
        M_Product_ID: line.productId,
        MovementQty: line.movementQty,
        IsEndProduct: line.isEndProduct,
      },
    })
  }

  return orderRes
}

export async function updateProduction(
  token: string,
  id: number,
  data: { processed?: boolean },
): Promise<any> {
  const json: Record<string, any> = {}
  if (data.processed !== undefined) json.Processed = data.processed

  return await apiFetch<any>(`${API_V1}/models/M_Production/${id}`, {
    method: 'PUT',
    token,
    json,
  })
}
