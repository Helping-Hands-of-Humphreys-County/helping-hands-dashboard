export type ReportSummary = {
  program: string
  from: string
  to: string
  totalEvents: number
  uniqueHouseholds: number
  uniqueClients: number
  pantryItemTotals: Record<string, number>
  assistancePaidTotal: number
  assistancePaidByBillType: Record<string, number>
}

export type ReportDetailRow = {
  id: string
  programType: string
  occurredAt: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  clientName?: string | null
  clientNames?: string[]
  billType?: string | null
  amountPaid?: number | null
  checkNumber?: string | null
  notes?: string | null
  items: Array<{ itemType: string; quantity: number }>
}

export type ReportResponse = {
  summary: ReportSummary
  generatedAt: string
  details: ReportDetailRow[]
}