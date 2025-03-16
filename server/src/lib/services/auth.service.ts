import { getRedisClient } from '@lib/redis/redis.client.js'
import { v4 as uuid } from 'uuid'
import jwt from 'jsonwebtoken'


async function generateRefreshToken(userId: number) {
  const redis = getRedisClient()
  const key = uuid()
  await redis.hset(`user_keys:${key}`, 'userId', userId)
  await redis.expire(`user_keys:${key}`, 3600 * 24 * 12)
  return key
}

async function generateAccessToken(refreshToken: string, user: any) {
  const redis = getRedisClient()

  const userKey = await redis.hget(`user_keys:${refreshToken}`, 'userId')


  if (!userKey) {
    throw new Error('Invalid refresh token')
  }

  return `Bearer ${jwt.sign({ id: userKey, ...user }, process.env.JWT_SECRET!, { expiresIn: '1h' })}`
}



export const AuthService = {
  generateRefreshToken,
  generateAccessToken,

}
