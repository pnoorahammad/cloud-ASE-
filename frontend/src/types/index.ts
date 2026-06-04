export interface UserProfile {
  username: string
  fullName: string
  email?: string
  userId: string
  organizationId?: string
  instanceUrl?: string
}

export interface ValidationRule {
  id: string
  name: string
  fullName: string
  objectName: string
  description: string
  errorMessage: string
  errorDisplayField: string
  active: boolean
  lastModifiedDate?: string
  isPending?: boolean
  stagedActive?: boolean
}
