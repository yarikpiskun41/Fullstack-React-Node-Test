import {Request, Response} from 'express'
import {UserModel} from "@models/user.model";
import bcrypt from 'bcrypt'
import {AuthService} from "@lib/services/auth.service";
import {getRedisClient} from "@lib/redis/redis.client";

export async function register(req: Request, res: Response) {
  const {username, password} = req.body

  if (!username || !password) {
    res.status(400).json({status: 'Error', message: 'Username and password are required'})
    return
  }
  if (username.length < 4 || password.length < 4) {
    res.status(400).json({status: 'Error', message: 'Username and password must be at least 4 characters long'})
    return
  }
  if (username.length > 128 || password.length > 128) {
    res.status(400).json({status: 'Error', message: 'Username and password must be less than 128 characters long'})
    return
  }


  const isUserExists = await UserModel.query().where('username', username).first()


  if (isUserExists) {
    res.status(400).json({status: 'Error', message: 'User already exists'})
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await UserModel.query().insert({
    username,
    password: hashedPassword,
  })

  const refreshToken = await AuthService.generateRefreshToken(user.id as number)
  const accessToken = await AuthService.generateAccessToken(refreshToken, {...user})

  res.status(200).json({status: 'OK', data: {accessToken, refreshToken}})
  return
}

export async function login(req: Request, res: Response) {
  const {username, password} = req.body

  if (!username || !password) {
    res.status(400).json({status: 'Error', message: 'Username and password are required'})
    return
  }

  const user = await UserModel.query().where('username', username).first()

  if (!user) {
    res.status(404).json({status: 'Error', message: 'User not found'})
    return
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    res.status(400).json({status: 'Error', message: 'Invalid password'})
    return
  }

  const refreshToken = await AuthService.generateRefreshToken(user.id as number)
  const accessToken = await AuthService.generateAccessToken(refreshToken, {...user})

  res.status(200).json({status: 'OK', data: {accessToken, refreshToken}})
  return
}

export async function logout(req: Request, res: Response) {
  const {refreshToken} = req.body

  if (!refreshToken) {
    res.status(400).json({status: 'Error', message: 'Refresh token is required'})
    return
  }

  const redis = getRedisClient()
  await redis.del(`user_keys:${refreshToken}`)

  res.status(200).json({status: 'OK'})
  return
}

export async function refresh(req: Request, res: Response) {
  const {refreshToken} = req.body

  if (!refreshToken) {
    res.status(400).json({status: 'Error', message: 'Refresh token is required'})
    return
  }

  const redis = getRedisClient()
  const userId = await redis.hget(`user_keys:${refreshToken}`, 'userId')

  if (!userId) {
    res.status(400).json({status: 'Error', message: 'Invalid refresh token'})
    return
  }

  const user = await UserModel.query().findById(userId)

  if (!user) {
    res.status(404).json({status: 'Error', message: 'User not found'})
    return
  }

  const newAccessToken = await AuthService.generateAccessToken(refreshToken, {...user})

  res.status(200).json({status: 'OK', data: {accessToken: newAccessToken}})
  return
}