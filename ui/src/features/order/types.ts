/**
 * Order Type Definitions
 * Based on iDempiere C_Order, C_OrderLine, M_Product, M_Warehouse API responses
 */

export interface Order {
  id: number
  documentNo: string
  bpartnerId: number
  bpartnerName: string
  dateOrdered: string
  grandTotal: number
  docStatus: string
  warehouseId?: number
  C_BPartner_ID?: { id: number, identifier: string }
  M_Warehouse_ID?: { id: number }
  DocumentNo?: string
  DateOrdered?: string
  GrandTotal?: number
  DocStatus?: string | { id: string }
  AD_Org_ID?: { id: number } | number
}

export interface OrderLine {
  id: number
  productId: number
  productName: string
  qtyEntered: number
  qtyDelivered?: number
  priceEntered: number
  taxId?: number
  M_Product_ID?: { id: number, identifier: string, name: string }
  QtyEntered?: number
  QtyDelivered?: number
  PriceEntered?: number
}

export interface Product {
  id: number
  name: string
  value?: string
}

export interface Warehouse {
  id: number
  name: string
  orgId?: number
}
