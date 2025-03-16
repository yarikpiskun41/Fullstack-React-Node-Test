import { Request } from 'express'
import { HttpError } from '@lib/utils/middlewares/http-error.js'


const authorizationHeaderCheck = (req: Request): string | never => {
  const authHeader = req.headers.authorization
  if (!authHeader) throw new HttpError(400, 'No auth header provided')
  return authHeader
}

const tokenCheck = (authHeader: string): string | never => {
  const token = authHeader.split(' ').at(1)
  if (!token) throw new HttpError(400, 'Invalid token format')
  return token
}

export { authorizationHeaderCheck, tokenCheck }