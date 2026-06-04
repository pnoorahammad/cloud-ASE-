import Redis from 'ioredis'
import { logger } from '../utils/logger'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

type RedisLike = {
	get(key:string): Promise<string | null>
	set(key:string, value:string): Promise<any>
	del(key:string): Promise<number>
	hgetall(key:string): Promise<Record<string,string>>
	hset(key:string, field:string, value:string): Promise<number>
	hdel(key:string, field:string): Promise<number>
	lpush(key:string, value:string): Promise<number>
	rpop(key:string): Promise<string | null>
	llen(key:string): Promise<number>
	on(event:string, cb: (...args:any[])=>void): void
}

let redis: RedisLike

const useInMemoryRedis =
  process.env.SF_SIMULATION_MODE === 'true' ||
  process.env.REDIS_EMULATE === 'true' ||
  (process.env.NODE_ENV !== 'production' && !process.env.REDIS_URL);

if (useInMemoryRedis) {
	logger.info('Using in-memory Redis emulation for local testing')
	const store = new Map<string, string>()
	const lists = new Map<string, string[]>()

	redis = {
		get: async (k) => store.get(k) ?? null,
		set: async (k, v) => { store.set(k, v); return 'OK' },
		del: async (k) => store.delete(k) ? 1 : 0,
		hgetall: async (k) => {
			const raw = store.get(k)
			return raw ? JSON.parse(raw) : {}
		},
		hset: async (k, field, value) => {
			const existing = store.get(k) ? JSON.parse(store.get(k) as string) : {}
			existing[field] = value
			store.set(k, JSON.stringify(existing))
			return 1
		},
		hdel: async (k, field) => {
			const existing = store.get(k) ? JSON.parse(store.get(k) as string) : {}
			const had = Object.prototype.hasOwnProperty.call(existing, field)
			delete existing[field]
			store.set(k, JSON.stringify(existing))
			return had ? 1 : 0
		},
		lpush: async (k, v) => { const arr = lists.get(k) || []; arr.unshift(v); lists.set(k, arr); return arr.length },
		rpop: async (k) => { const arr = lists.get(k) || []; const val = arr.pop() || null; lists.set(k, arr); return val },
		llen: async (k) => (lists.get(k) || []).length,
		on: (_ev:string, _cb:(...args:any[])=>void) => { /* no-op */ }
	}
} else {
	const client = new Redis(redisUrl)
	client.on('error', (err) => logger.error('Redis error', err))
	client.on('connect', () => logger.info('Connected to Redis'))
	redis = client as unknown as RedisLike
}

export { redis }
export default redis
