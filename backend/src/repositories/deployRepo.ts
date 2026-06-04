import { redis } from '../services/redisClient'

const statusKey = (userId: string) => `deploy:status:${userId}`
const queueKey = 'deploy:queue'

export const setDeployStatus = async (userId: string, status: any) => {
  await redis.set(statusKey(userId), JSON.stringify(status))
}

export const getDeployStatus = async (userId: string) => {
  const raw = await redis.get(statusKey(userId))
  return raw ? JSON.parse(raw) : null
}

export const clearDeployStatus = async (userId: string) => {
  await redis.del(statusKey(userId))
}

export const enqueueDeployment = async (payload: any) => {
  await redis.lpush(queueKey, JSON.stringify(payload))
}

export const dequeueDeployment = async () => {
  const raw = await redis.rpop(queueKey)
  return raw ? JSON.parse(raw) : null
}

export const getQueueLength = async () => {
  return redis.llen(queueKey)
}
