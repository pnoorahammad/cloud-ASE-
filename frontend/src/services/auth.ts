import api from './api'

export const signUp = async (data: { email: string; password: string; fullName: string }) => {
  const resp = await api.post('/auth/signup', data)
  return resp.data
}

export const signIn = async (data: { email: string; password: string }) => {
  const resp = await api.post('/auth/signin', data)
  return resp.data
}

export const updateProfile = async (data: { email?: string; fullName?: string }) => {
  const resp = await api.put('/auth/profile', data)
  return resp.data
}

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const resp = await api.put('/auth/password', data)
  return resp.data
}

export const whoami = async () => {
  const resp = await api.get('/user')
  return resp.data
}
