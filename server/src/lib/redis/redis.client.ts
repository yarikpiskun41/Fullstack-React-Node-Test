import { Redis } from 'ioredis'
import { RedisOptions } from 'ioredis'

let __client: Redis

export function getRedisClient(): Redis {
  if (!__client) {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "", 10),
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      db: parseInt(process.env.REDIS_DB || "", 10) || 0,
      password: process.env.REDIS_PASS || undefined,
    }

    __client = new Redis(options);
  }
  return __client
}

export async function writeRedisOwnership() {
  const client = getRedisClient()
  const key = '__application_ownership'
  const serviceName = process.env.SERVICE_NAME
  if (!serviceName) {
    throw new Error('Service name is not specified')
  }
  const value = await client.get(key)

  if (value && value !== serviceName) {
    throw new Error('Redis DB is owner by another app')
  }

  await client.set(key, serviceName)
}
