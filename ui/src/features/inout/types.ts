/**
 * Material Receipt/Shipment Type Definitions
 * Based on iDempiere M_InOut and M_InOutLine API responses
 */

export interface InOut {
  id: number
  DocumentNo?: string
  documentNo?: string
}

export interface InOutLine {
  id: number
  productName: string
  qtyEntered: number
  M_Product_ID?: { id: number, identifier: string }
}

export interface OrderForReceipt {
  id: number
  DocumentNo: string
  DateOrdered: string
  GrandTotal: number
  DocStatus?: string | { id: string }
  C_BPartner_ID?: { id: number, identifier: string }
  M_Warehouse_ID?: number | { id: number }
  AD_Org_ID?: number | { id: number }
}

export interface OrderLineForReceipt {
  id: number
  QtyEntered: number
  QtyDelivered: number
  qtyEntered: number
  qtyDelivered: number
  qtyAvailable: number
  qtyToReceive: number
  qtyError: string
  M_Product_ID?: { id: number, identifier: string, name: string }
}
