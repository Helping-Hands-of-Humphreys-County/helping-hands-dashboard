export type DashboardSummary = {
  from: string
  to: string
  householdsServed: number
  clientsServed: number
  pantryItemTotals: Record<string, number>
  assistancePaidTotal: number
  assistancePaidByBillType: Record<string, number>
  applicationsByStatus: Record<string, number>
}