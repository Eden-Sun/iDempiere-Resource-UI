import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

type SearchParams = Record<string, string | number | boolean | undefined>

export type Order = {
  id: number
  documentNo: string
  bpartnerId: number
  bpartnerName: string
  isSOTrx: boolean
  dateOrdered: string
  grandTotal: number
  docStatus: string
  warehouseId?: number
}

export type OrderLine = {
  id: number
  orderId: number
  productId: number
  productName: string
  qtyEntered: number
  priceEntered: number
  lineNetAmt: number
  taxId?: number
}

export type Product = {
  id: number
  name: string
  value?: string
  uom?: string
}

export type Warehouse = {
  id: number
  name: string
}

export type Tax = {
  id: number
  name: string
  rate: number
}

export async function listOrders(
  token: string,
  options: { isSOTrx: boolean; filter?: string; top?: number; skip?: number } = { isSOTrx: false },
): Promise<{ records: Order[]; totalCount: number }> {
  const searchParams: Record<string, string | number> = {
    $select: 'C_Order_ID,DocumentNo,C_BPartner_ID,DateOrdered,GrandTotal,DocStatus,M_Warehouse_ID',
    $orderby: 'DateOrdered desc,DocumentNo desc',
    $filter: `IsSOTrx eq ${options.isSOTrx}`,
  }

  if (options.top) searchParams.$top = options.top
  if (options.skip) searchParams.$skip = options.skip
  if (options.filter) searchParams.$filter += ` and (${options.filter})`

  const res = await apiFetch<{ records: any[]; 'row-count'?: number }>(`${API_V1}/models/C_Order`, {
    token,
    searchParams,
  })

  const records = (res.records ?? []).map((r) => ({
    id: Number(r.id),
    documentNo: String(r.DocumentNo ?? ''),
    bpartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    bpartnerName: String(r.C_BPartner_ID?.identifier ?? r.C_BPartner_ID?.name ?? ''),
    isSOTrx: r.IsSOTrx === true || r.IsSOTrx === 'Y',
    dateOrdered: String(r.DateOrdered ?? ''),
    grandTotal: Number(r.GrandTotal ?? 0),
    docStatus: String(r.DocStatus ?? ''),
    warehouseId: r.M_Warehouse_ID?.id ? Number(r.M_Warehouse_ID.id) : undefined,
  }))

  return {
    records,
    totalCount: res['row-count'] ?? res.records?.length ?? 0,
  }
}

export async function getOrder(token: string, id: number): Promise<Order> {
  const res = await apiFetch<any>(`${API_V1}/models/C_Order/${id}`, { token })
  return {
    id: Number(res.id),
    documentNo: String(res.DocumentNo ?? ''),
    bpartnerId: Number(res.C_BPartner_ID?.id ?? res.C_BPartner_ID ?? 0),
    bpartnerName: String(res.C_BPartner_ID?.identifier ?? res.C_BPartner_ID?.name ?? ''),
    isSOTrx: res.IsSOTrx === true || res.IsSOTrx === 'Y',
    dateOrdered: String(res.DateOrdered ?? ''),
    grandTotal: Number(res.GrandTotal ?? 0),
    docStatus: String(res.DocStatus ?? ''),
    warehouseId: res.M_Warehouse_ID?.id ? Number(res.M_Warehouse_ID.id) : undefined,
  }
}

export async function getOrderLines(token: string, orderId: number): Promise<OrderLine[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/C_OrderLine`, {
    token,
    searchParams: {
      $select: 'C_OrderLine_ID,C_Order_ID,M_Product_ID,QtyEntered,PriceEntered,LineNetAmt,C_Tax_ID',
      $filter: `C_Order_ID eq ${orderId}`,
      $orderby: 'Line',
    },
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    orderId: Number(r.C_Order_ID?.id ?? r.C_Order_ID ?? 0),
    productId: Number(r.M_Product_ID?.id ?? r.M_Product_ID ?? 0),
    productName: String(r.M_Product_ID?.identifier ?? r.M_Product_ID?.name ?? ''),
    qtyEntered: Number(r.QtyEntered ?? 0),
    priceEntered: Number(r.PriceEntered ?? 0),
    lineNetAmt: Number(r.LineNetAmt ?? 0),
    taxId: r.C_Tax_ID?.id ? Number(r.C_Tax_ID.id) : undefined,
  }))
}

export async function listProducts(token: string, options?: { filter?: string; top?: number }): Promise<Product[]> {
  const searchParams: Record<string, string | number> = {
    $select: 'M_Product_ID,Name,Value,C_UOM_ID',
    $orderby: 'Name',
  }

  if (options?.filter) searchParams.$filter = options.filter
  if (options?.top) searchParams.$top = options.top

  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/M_Product`, {
    token,
    searchParams,
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
    value: r.Value ? String(r.Value) : undefined,
    uom: r.C_UOM_ID?.name ? String(r.C_UOM_ID.name) : undefined,
  }))
}

export async function listWarehouses(token: string): Promise<Warehouse[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/M_Warehouse`, {
    token,
    searchParams: {
      $select: 'M_Warehouse_ID,Name',
      $orderby: 'Name',
    },
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
  }))
}

export async function listTaxes(token: string): Promise<Tax[]> {
  const res = await apiFetch<{ records: any[] }>(`${API_V1}/models/C_Tax`, {
    token,
    searchParams: {
      $select: 'C_Tax_ID,Name,Rate',
      $orderby: 'Name',
    },
  })

  return (res.records ?? []).map((r) => ({
    id: Number(r.id),
    name: String(r.Name ?? ''),
    rate: Number(r.Rate ?? 0),
  }))
}

export async function createOrder(
  token: string,
  order: {
    bpartnerId: number
    isSOTrx: boolean
    dateOrdered: string
    warehouseId?: number
    description?: string
  },
  lines: Array<{ productId: number; qtyEntered: number; priceEntered: number; taxId?: number }>,
): Promise<any> {
  const orderRes = await apiFetch<any>(`${API_V1}/models/C_Order`, {
    method: 'POST',
    token,
    json: {
      C_BPartner_ID: order.bpartnerId,
      IsSOTrx: order.isSOTrx,
      DateOrdered: order.dateOrdered,
      M_Warehouse_ID: order.warehouseId || null,
      Description: order.description || null,
      DocStatus: 'DR',
      DocAction: 'CO',
    },
  })

  const orderId = orderRes.id || orderRes.C_Order_ID

  if (!orderId) {
    throw new Error('Failed to create order: no ID returned')
  }

  for (const line of lines) {
    await apiFetch<any>(`${API_V1}/models/C_OrderLine`, {
      method: 'POST',
      token,
      json: {
        C_Order_ID: orderId,
        M_Product_ID: line.productId,
        QtyEntered: line.qtyEntered,
        PriceEntered: line.priceEntered,
        C_Tax_ID: line.taxId || null,
      },
    })
  }

  return orderRes
}
