export type AuthParameters = {
  clientId?: string | number
  roleId?: string | number
  organizationId?: string | number
  warehouseId?: string | number
  language?: string
}

export type AuthRequest = {
  userName: string
  password: string
  parameters?: AuthParameters
}

export type ClientOption = { id: number; name: string }
export type NamedId = { id: number; name: string }

export type AuthResponse = {
  clients?: ClientOption[]
  userId?: number
  language?: string
  menuTreeId?: number
  token?: string
  refresh_token?: string
}

export type Session = {
  token: string
  refreshToken?: string
  userId: number
  userName?: string  // Decoded from JWT token
  clientId: number
  organizationId: number
  roleId?: number
  warehouseId?: number
  language?: string
}

