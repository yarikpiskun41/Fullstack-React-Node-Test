import {Router} from "express";
import {login, logout, refresh, register} from "@app/routes/auth/auth.controller";

export function authRouter(): Router {
  const router = Router({ mergeParams: true })
  router.post('/sign-up', register)
  router.post('/sign-in', login)
  router.post('/sign-out', logout)
  router.post('/refresh-token', refresh)
  return router
}