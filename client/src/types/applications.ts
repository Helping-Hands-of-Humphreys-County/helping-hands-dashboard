import type { AssistanceEventListItem } from './assistance'
import type { HouseholdNote } from './notes'
import type { ApplicationHouseholdMember } from './households'
import type { PagedResponse } from './paging'

export type ApplicationDetails = {
  id: string
  programType: string
  status: string
  submittedAt?: string | null
  isArchived: boolean

  applicantClientId: string
  applicantName: string
  householdId: string
  street1: string
  street2?: string | null
  city: string
  state: string
  zip?: string | null
  applicantHouseholdId: string

  emergencySummary: string
  totalHouseholdMonthlyIncome?: number | null

  receivedUtilityAssistancePastYear?: boolean | null
  utilityAssistanceFrom?: string | null
  preventionPlan?: string | null

  receivesFoodStamps?: boolean | null
  foodStampsAmount?: number | null
  foodStampsDateAvailable?: string | null

  landlordName?: string | null
  landlordPhone?: string | null
  landlordAddress?: string | null

  verifiedByUserId?: string | null

  decision: string
  decisionDate?: string | null
  boardNotes?: string | null

  householdMembers: ApplicationHouseholdMember[]
  billRequests: ApplicationBillRequest[]
  assistance: AssistanceEventListItem[]
  householdNotes: HouseholdNote[]
  householdAssistance: AssistanceEventListItem[]
}

export type ApplicationListItem = {
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

export type ApplicationListResponse = PagedResponse<ApplicationListItem>

export type ApplicationBillRequest = {
  id: string
  applicationId: string
  billType: string
  amountRequested: number
  accountNumber?: string | null
}

export type ApplicationHouseholdMemberInput = {
  clientId?: string | null
  fullName: string
  dob?: string | null
  relationshipToApplicant?: string | null
  incomeAmount?: number | null
  incomeSource?: string | null
}

export type ApplicationBillRequestInput = {
  billType: string
  amountRequested: number
  accountNumber?: string | null
}

export type ProgramType = 'FoodPantry' | 'HelpingHands' | 'Both'

export type ApplicationCreatePayload = {
  programType: ProgramType | string
  status: string
  submittedAt?: string | null

  applicantClientId: string
  householdId: string

  emergencySummary: string
  totalHouseholdMonthlyIncome?: number | null

  receivedUtilityAssistancePastYear?: boolean | null
  utilityAssistanceFrom?: string | null
  preventionPlan?: string | null

  receivesFoodStamps?: boolean | null
  foodStampsAmount?: number | null
  foodStampsDateAvailable?: string | null

  landlordName?: string | null
  landlordPhone?: string | null
  landlordAddress?: string | null

  verifiedByUserId?: string | null

  decision: string
  decisionDate?: string | null
  boardNotes?: string | null

  householdMembers: ApplicationHouseholdMemberInput[]
  billRequests: ApplicationBillRequestInput[]
}

export type ApplicationBothCreatePayload = {
  applicantClientId: string
  householdId: string

  emergencySummary: string
  totalHouseholdMonthlyIncome?: number | null

  receivedUtilityAssistancePastYear?: boolean | null
  utilityAssistanceFrom?: string | null
  preventionPlan?: string | null

  receivesFoodStamps?: boolean | null
  foodStampsAmount?: number | null
  foodStampsDateAvailable?: string | null

  landlordName?: string | null
  landlordPhone?: string | null
  landlordAddress?: string | null

  verifiedByUserId?: string | null

  householdMembers: ApplicationHouseholdMemberInput[]
  billRequests: ApplicationBillRequestInput[]
}

export type CreateBothApplicationsResponse = {
  foodPantryApplicationId: string
  helpingHandsApplicationId: string
}

export type ApplicationUpdatePayload = {
  status: string
  submittedAt?: string | null

  householdId: string

  emergencySummary: string
  totalHouseholdMonthlyIncome?: number | null

  receivedUtilityAssistancePastYear?: boolean | null
  utilityAssistanceFrom?: string | null
  preventionPlan?: string | null

  receivesFoodStamps?: boolean | null
  foodStampsAmount?: number | null
  foodStampsDateAvailable?: string | null

  landlordName?: string | null
  landlordPhone?: string | null
  landlordAddress?: string | null

  verifiedByUserId?: string | null

  decision: string
  decisionDate?: string | null
  boardNotes?: string | null

  householdMembers: ApplicationHouseholdMemberInput[]
  billRequests: ApplicationBillRequestInput[]
}
