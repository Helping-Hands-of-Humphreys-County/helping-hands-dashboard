import type { PagedResponse } from './paging'

export type AssistanceItem = {
  itemType: string
  quantity: number
}

export type AssistanceEventListItem = {
  id: string
  programType: string
  occurredAt: string
  householdId: string
  applicationId?: string | null
  householdMemberCount?: number
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  clientId?: string | null
  clientName?: string | null
  billType?: string | null
  amountPaid?: number | null
  checkNumber?: string | null
  notes?: string | null

  recordedByUserDisplayName?: string | null
  items?: AssistanceItem[]
}

export type AssistanceEventListResponse = PagedResponse<AssistanceEventListItem>

export type AssistanceEventDetails = {
  id: string
  programType: string
  occurredAt: string
  isArchived: boolean
  householdId: string
  householdMemberCount?: number
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  clientId?: string | null
  clientName?: string | null
  applicationId?: string | null
  billType?: string | null
  amountPaid?: number | null
  checkNumber?: string | null
  notes?: string | null
  recordedByUserDisplayName?: string | null
  items: AssistanceItem[]
}

export type AssistanceEventCreatePayload = {
  programType: string
  occurredAt: string
  householdId: string
  householdMemberCount?: number
  clientId?: string | null
  applicationId?: string | null
  billType?: string | null
  amountPaid?: number | null
  checkNumber?: string | null
  notes?: string | null
  items: AssistanceItem[]
}

export type AssistanceEventUpdatePayload = {
  occurredAt: string
  householdId: string
  householdMemberCount?: number
  clientId?: string | null
  applicationId?: string | null
  billType?: string | null
  amountPaid?: number | null
  checkNumber?: string | null
  notes?: string | null
  items: AssistanceItem[]
}
