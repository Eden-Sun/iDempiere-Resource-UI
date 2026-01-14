import { apiFetch } from '../../shared/api/http'

const API_V1 = '/api/v1'

type SearchParams = Record<string, string | number | boolean | undefined>

export type Payment = {
  id: number
  documentNo: string
  bpartnerId: number
  bpartnerName: string
  dateTrx: string
  payAmt: number
  tenderType: string
  docStatus: string
}

export type TenderType = {
  code: string
  name: string
}

export const TENDER_TYPES: TenderType[] = [
  { code: 'X', name: '現金' },
  { code: 'K', name: '信用卡' },
  { code: 'A', name: '轉帳' },
  { code: 'D', name: '匯款' },
  { code: 'M', name: '線上支付' },
]

export async function listPayments(
  token: string,
  options: { filter?: string; top?: number; skip?: number } = {},
): Promise<{ records: Payment[]; totalCount: number }> {
  const searchParams: Record<string, string | number> = {
    $select: 'C_Payment_ID,DocumentNo,C_BPartner_ID,DateTrx,PayAmt,TenderType,DocStatus',
    $orderby: 'DateTrx desc,DocumentNo desc',
    $filter: 'IsReceipt eq true',
  }

  if (options.top) searchParams.$top = options.top
  if (options.skip) searchParams.$skip = options.skip
  if (options.filter) searchParams.$filter += ` and (${options.filter})`

  const res = await apiFetch<{ records: any[]; 'row-count'?: number }>(`${API_V1}/models/C_Payment`, {
    token,
    searchParams,
  })

  const records = (res.records ?? []).map((r) => ({
    id: Number(r.id),
    documentNo: String(r.DocumentNo ?? ''),
    bpartnerId: Number(r.C_BPartner_ID?.id ?? r.C_BPartner_ID ?? 0),
    bpartnerName: String(r.C_BPartner_ID?.identifier ?? r.C_BPartner_ID?.name ?? ''),
    dateTrx: String(r.DateTrx ?? ''),
    payAmt: Number(r.PayAmt ?? 0),
    tenderType: String(r.TenderType?.id ?? r.TenderType ?? ''),
    docStatus: String(r.DocStatus?.id ?? r.DocStatus ?? ''),
  }))

  return {
    records,
    totalCount: res['row-count'] ?? res.records?.length ?? 0,
  }
}

export async function getPayment(token: string, id: number): Promise<Payment> {
  const res = await apiFetch<any>(`${API_V1}/models/C_Payment/${id}`, { token })
  return {
    id: Number(res.id),
    documentNo: String(res.DocumentNo ?? ''),
    bpartnerId: Number(res.C_BPartner_ID?.id ?? res.C_BPartner_ID ?? 0),
    bpartnerName: String(res.C_BPartner_ID?.identifier ?? res.C_BPartner_ID?.name ?? ''),
    dateTrx: String(res.DateTrx ?? ''),
    payAmt: Number(res.PayAmt ?? 0),
    tenderType: String(res.TenderType?.id ?? res.TenderType ?? ''),
    docStatus: String(res.DocStatus?.id ?? res.DocStatus ?? ''),
  }
}

export async function createPayment(
  token: string,
  payment: {
    bpartnerId: number
    dateTrx: string
    payAmt: number
    tenderType: string
    description?: string
  },
): Promise<any> {
  return await apiFetch<any>(`${API_V1}/models/C_Payment`, {
    method: 'POST',
    token,
    json: {
      C_BPartner_ID: payment.bpartnerId,
      DateTrx: payment.dateTrx,
      PayAmt: payment.payAmt,
      TenderType: payment.tenderType,
      Description: payment.description || null,
      IsReceipt: true,
      DocStatus: 'DR',
      DocAction: 'CO',
    },
  })
}
