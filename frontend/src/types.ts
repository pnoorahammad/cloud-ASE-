export interface ValidationRule {
  id: string
  name: string
  fullName: string
  objectName: string
  description: string
  errorMessage: string
  errorDisplayField: string
  active: boolean
  stagedActive?: boolean
  isPending?: boolean
  lastModifiedDate?: string
}

export interface UserProfile {
  userId: string
  username: string
  fullName: string
  email?: string
}
