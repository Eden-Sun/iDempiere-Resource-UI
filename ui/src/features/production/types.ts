/**
 * Production Type Definitions
 * Based on iDempiere M_Production and M_ProductionLine API responses
 */

export interface Production {
  id: number
  documentNo: string
  bpartnerName: string
  productName: string
  productionQty: number
  datePromised: string
  processed: boolean
}

export interface ProductionLine {
  id: number
  productName: string
  movementQty: number
  isEndProduct: boolean
  productId?: number
  M_Product_ID?: { id: number, identifier: string }
}

export interface ProductionFormData {
  orderId: number
  orderLineId: number
  bpartnerId: number
  productId: number
  productionQty: number
  datePromised: string
}
