export type Me = {
  id: string
  displayName: string
  email: string
  isActive: boolean
  mustChangePassword?: boolean
}

export type LoginRequest = {
  email: string
  password: string
}
