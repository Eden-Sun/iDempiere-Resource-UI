/**
 * Business Partner Type Definitions
 * Based on iDempiere C_BPartner and C_BPartner_Location API responses
 */

export interface BPartner {
  id: number
  Name: string
  Value: string
  IsCustomer: boolean
  IsVendor: boolean
  C_BP_Group_ID?: { id: number } | number
}

export interface BPartnerLocation {
  id: number
  address1?: string
  city?: string
  postalCode?: string
  isShipTo?: boolean
  isBillTo?: boolean
}

export interface Contact {
  id: number
  name: string
  email?: string
  phone?: string
}
