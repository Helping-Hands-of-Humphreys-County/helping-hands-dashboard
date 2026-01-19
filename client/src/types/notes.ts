export type ClientNote = {
  id: string
  clientId: string
  authorUserId: string
  authorDisplayName: string
  authorEmail?: string | null
  body: string
  createdAt: string
  editedAt?: string | null
  isDeleted: boolean
}

export type HouseholdNote = {
  id: string
  clientId: string
  clientName: string
  authorUserId: string
  authorDisplayName: string
  authorEmail?: string | null
  body: string
  createdAt: string
  editedAt?: string | null
}
