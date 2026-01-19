import type { ClientNote, HouseholdNote } from './notes'
import type { HouseholdApplicationSummary, ClientSummary } from './households'
import type { PagedResponse } from './paging'
import type { AssistanceEventListItem } from './assistance'

export type ClientDetails = {
  id: string
  firstName: string
  lastName: string
  dob?: string | null
  phone?: string | null
  isArchived: boolean
  household?: HouseholdSummary | null
  householdMembers: ClientSummary[]
  notes: ClientNote[]
  householdNotes: HouseholdNote[]
  applications: HouseholdApplicationSummary[]
  assistance: AssistanceEventListItem[]
  householdAssistance: AssistanceEventListItem[]
  latestIncomeSnapshot?: ClientIncomeSnapshot | null
}

export type ClientListItem = {
  id: string
  firstName: string
  lastName: string
  dob?: string | null
  phone?: string | null
  street1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

export type ClientListResponse = PagedResponse<ClientListItem>

export type HouseholdSummary = {
  id: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
}

export type ClientIncomeSnapshot = {
  applicationId: string
  incomeAmount: number
  incomeSource?: string | null
  reportedAt: string
}
