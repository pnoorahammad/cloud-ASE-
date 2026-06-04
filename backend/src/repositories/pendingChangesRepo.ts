import { redis } from '../services/redisClient'

const pendingKey = (userId: string) => `pending:${userId}`

export const getPendingChanges = async (userId: string) => {
  const raw = await redis.hgetall(pendingKey(userId))
  // values stored as JSON
  return Object.values(raw).map(v => JSON.parse(v))
}

export const setPendingChange = async (userId: string, fullName: string, change: any) => {
  await redis.hset(pendingKey(userId), fullName, JSON.stringify(change))
}

export const removePendingChange = async (userId: string, fullName: string) => {
  await redis.hdel(pendingKey(userId), fullName)
}

export const clearPending = async (userId: string) => {
  await redis.del(pendingKey(userId))
}
