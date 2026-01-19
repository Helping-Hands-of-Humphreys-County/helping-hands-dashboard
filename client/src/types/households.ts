import type { AssistanceEventListItem } from './assistance'
import type { PagedResponse } from './paging'

export type HouseholdListItem = {
  id: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  memberCount: number
  lastActivityAt?: string | null
}

export type HouseholdListResponse = PagedResponse<HouseholdListItem>

export type HouseholdDetails = {
  id: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  isArchived: boolean
  members: ClientSummary[]
  recentApplications: HouseholdApplicationSummary[]
  recentAssistance: AssistanceEventListItem[]
}

export type ApplicationHouseholdMember = {
  id: string
  applicationId: string
  clientId?: string | null
  fullName: string
  dob?: string | null
  relationshipToApplicant?: string | null
  incomeAmount?: number | null
  incomeSource?: string | null
}

export type HouseholdApplicationSummary = {
  id: string
  programType: string
  status: string
  submittedAt?: string | null
  applicantClientId: string
  applicantName: string
  householdId: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  decision: string
  decisionDate?: string | null
}

export type ClientSummary = {
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
