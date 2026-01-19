import type { PagedResponse } from './paging'

export type UserListItem = {
  id: string
  displayName: string
  email: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserDetails = UserListItem

export type UserListResponse = PagedResponse<UserListItem>

export type CreateUserPayload = {
  displayName: string
  email: string
  password?: string
}

export type UpdateUserPayload = {
  displayName: string
  email: string
}
