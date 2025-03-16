import { HttpError } from '@lib/utils/middlewares/http-error'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { authorizationHeaderCheck, tokenCheck } from '../checks.js'

type MiddlewareRes = (req: Request, _: Response, next: NextFunction) => void

const verify = (req: Request, next: NextFunction, callback?: () => void) => {
  const authHeader = authorizationHeaderCheck(req)
  const token = tokenCheck(authHeader)
  jwt.verify(token, process.env.JWT_SECRET || "", (err, decode) => {
    if (err || typeof decode === 'string') throw new HttpError(401, 'Invalid token')
    if (callback) callback()
    next()
  })
}

const authMiddleware = (): MiddlewareRes => (req, _, next) => verify(req, next)


export { authMiddleware }

