/**
 * Payment and Banking Type Definitions
 * Based on iDempiere C_Payment and C_BankAccount API responses
 */

export interface Payment {
  id: number
  documentNo: string
  bpartnerId: number
  bankAccountId?: number
  bpartnerName: string
  dateTrx: string
  payAmt: number
  tenderType: string
  docStatus: string
  description?: string
  C_BPartner_ID?: { id: number, identifier: string }
  C_BankAccount_ID?: { id: number }
  DateTrx?: string
  PayAmt?: number
  TenderType?: string
  Description?: string
}

export interface BPartner {
  id: number
  name: string
  isCustomer?: boolean
  isVendor?: boolean
}

export interface CustomerBalance {
  totalOutstanding: number
  creditLimit: number
  availableCredit: number
}
